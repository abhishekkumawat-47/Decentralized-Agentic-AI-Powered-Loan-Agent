# orchestrator.py
# The "brain" of the system.
# Decides WHAT to do next, never HOW to do it.

import os
import json
import re
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM

# =====================================================
# 1. FORCE HUGGINGFACE CACHE TO D DRIVE (CRITICAL)
# =====================================================
# Base folder MUST exist: D:/hf_cache
os.environ["HF_HOME"] = "D:/hf_cache"
os.environ["TRANSFORMERS_CACHE"] = "D:/hf_cache"
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

# =====================================================
# 2. GPU CONFIGURATION & VERIFICATION
# =====================================================
def setup_gpu():
    """Verify GPU availability and configure PyTorch."""
    if not torch.cuda.is_available():
        raise RuntimeError(
            "❌ CUDA not available! Install CUDA-enabled PyTorch:\n"
            "pip install torch torchvision torchaudio --index-url "
            "https://download.pytorch.org/whl/cu118"
        )
    
    gpu_name = torch.cuda.get_device_name(0)
    gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1e9
    
    print(f"[GPU] Detected: {gpu_name}")
    print(f"[GPU] Total Memory: {gpu_memory:.2f} GB")
    print(f"[GPU] CUDA Version: {torch.version.cuda}")
    
    # Enable optimizations
    torch.backends.cudnn.benchmark = True
    torch.backends.cuda.matmul.allow_tf32 = True
    
    return True

# Run GPU setup
setup_gpu()

# =====================================================
# 3. LOAD PHI-4 MODEL (GPU-OPTIMIZED)
# =====================================================
MODEL_NAME = "microsoft/phi-4"

print("[Orchestrator] Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

print("[Orchestrator] Loading Phi-4 model to GPU...")
model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    torch_dtype=torch.float16,      # 🔥 float16 for GPU (2x faster, 50% less VRAM)
    device_map="cuda:0",            # 🔥 Force GPU 0
    low_cpu_mem_usage=True          # 🔥 Minimize CPU RAM during load
)

model.eval()  # VERY IMPORTANT: inference-only mode

# Verify model is on GPU
device = next(model.parameters()).device
print(f"[Orchestrator] Phi-4 loaded on: {device}  ")
print(f"[GPU] Memory Allocated: {torch.cuda.memory_allocated(0) / 1e9:.2f} GB")

# =====================================================
# 4. JSON EXTRACTION (STRICT)
# =====================================================
def extract_json(text: str) -> dict:
    """
    Extracts the first valid JSON object from model output.
    Raises error if JSON is missing or invalid.
    """
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        raise ValueError("❌ No JSON found in model output")
    try:
        return json.loads(match.group())
    except json.JSONDecodeError as e:
        raise ValueError(f"❌ Invalid JSON format: {e}")

# =====================================================
# 5. ORCHESTRATOR CORE FUNCTION (GPU-OPTIMIZED)
# =====================================================
def orchestrator_decide(state: dict, user_message: str) -> dict:
    """
    INPUT:
      - state: current system state (dict)
      - user_message: raw user input (str)
    
    OUTPUT:
      - dict with: { "next_service": "...", "reason": "..." }
    """
    prompt = f"""
You are a FINANCIAL ORCHESTRATION AGENT.

Your job:
- Decide the NEXT SERVICE to call.
- You NEVER execute actions.
- You NEVER calculate values.

CURRENT STATE:
{json.dumps(state, indent=2)}

USER MESSAGE:
{user_message}

AVAILABLE SERVICES (CHOOSE EXACTLY ONE):
- sales_service       -> show EMI / loan options
- kyc_service         -> verify user identity
- underwriting_service -> risk evaluation
- sanction_service    -> finalize loan
- ask_user            -> ask missing information
- end                 -> process complete

STRICT RULES:
- Output ONLY valid JSON
- No explanations outside JSON
- No markdown
- No extra text

JSON FORMAT:
{{
  "next_service": "",
  "reason": ""
}}
"""

    # 🔥 Move inputs to GPU
    inputs = tokenizer(prompt, return_tensors="pt").to("cuda:0")
    
    # Disable gradients (saves VRAM, faster)
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=40,
            do_sample=False,
            pad_token_id=tokenizer.eos_token_id
        )
    
    raw_output = tokenizer.decode(outputs[0], skip_special_tokens=True)
    decision = extract_json(raw_output)
    
    # -------------------------------------------------
    # 6. HARD GUARDRAILS (VERY IMPORTANT)
    # -------------------------------------------------
    allowed_services = {
        "sales_service",
        "kyc_service", 
        "underwriting_service",
        "sanction_service",
        "ask_user",
        "end"
    }
    
    if decision.get("next_service") not in allowed_services:
        raise ValueError(
            f"❌ Invalid service chosen by model: {decision.get('next_service')}"
        )
    
    return decision

# =====================================================
# 7. LOCAL TEST HARNESS
# =====================================================
if __name__ == "__main__":
    state = {
        "loan_stage": "INIT",
        "loan_amount": None,
        "kyc_verified": False,
        "approved": False
    }
    
    print("\n[Orchestrator] Ready for input. Type 'exit' to quit.")
    
    while True:
        user_input = input("\nUser: ")
        if user_input.lower() in {"exit", "quit"}:
            break
        
        try:
            decision = orchestrator_decide(state, user_input)
            print("\n--- ORCHESTRATOR DECISION ---")
            print(json.dumps(decision, indent=2))
            
            if decision["next_service"] == "end":
                print("\n[Orchestrator] Flow complete.")
                break
                
        except Exception as e:
            print("\n[ERROR]", str(e))
    
    # Cleanup
    print(f"\n[GPU] Final Memory Used: {torch.cuda.memory_allocated(0) / 1e9:.2f} GB")
    torch.cuda.empty_cache()