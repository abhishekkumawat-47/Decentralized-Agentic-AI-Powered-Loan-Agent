"""
Flask WebSocket Chat Server (Gemini 2.5 Flash)
=============================================
- WebSocket endpoint with proper upgrade handling
- Streams Gemini responses token-by-token to the client
- Simple API key authentication via connection query param ?api_key=...

Requirements (install once):
  pip install flask flask-sock python-dotenv flask-cors google-generativeai

Environment variables (.env file next to this script or set in shell):
  GOOGLE_API_KEY=your_google_api_key
  MODEL_NAME=gemini-2.5-flash             # default
  APP_API_KEY=dev-local-key               # optional, if set client must pass ?api_key=...
  PORT=5001                                # default
  ALLOWED_ORIGINS=http://localhost:3000    # comma-separated list, default "*"

Run:
  python run.py
"""

import os
import json
import logging
from urllib.parse import parse_qs

from dotenv import load_dotenv
from flask import Flask, request
from flask_cors import CORS
from flask_sock import Sock

try:
    import google.generativeai as genai
except Exception as e:
    raise SystemExit("google-generativeai is required: pip install google-generativeai")

load_dotenv()

# Configuration
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "").strip()
MODEL_NAME = os.environ.get("MODEL_NAME", "gemini-2.5-flash").strip()
APP_API_KEY = os.environ.get("APP_API_KEY", "").strip()
PORT = int(os.environ.get("PORT", "5001"))
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "*")

if not GOOGLE_API_KEY:
    raise SystemExit("GOOGLE_API_KEY is not set. Create a .env with GOOGLE_API_KEY=...")

# Configure Gemini
genai.configure(api_key=GOOGLE_API_KEY)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("chat-ws")

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ALLOWED_ORIGINS.split(",") if ALLOWED_ORIGINS != "*" else "*"}})
sock = Sock(app)

# System prompt for loan assistant
SYSTEM_PROMPT = """You are a professional loan assistant helping users apply for personal loans. 

Your role:
- Guide users through a 5-step loan application process
- Ask clear, concise questions one at a time
- Be friendly, professional, and encouraging
- Provide helpful context when needed
- Keep responses brief (2-3 sentences max unless explaining something complex)

Application stages:
1. Application Details - Collect: name, monthly income, employment type, email, phone, loan amount, purpose
2. Loan Offers - Present customized offers based on profile
3. Verification - KYC and credit check
4. Underwriting - Risk assessment
5. Sanction - Loan approval

Guidelines:
- Ask ONE question at a time
- Validate responses (e.g., income > ₹15,000, valid PAN format)
- Be empathetic if user doesn't qualify
- Celebrate milestones (application complete, loan approved)
- Use Indian formatting (₹ for currency, lakhs/crores)
"""


def make_model():
    """Create Gemini model with system instructions"""
    return genai.GenerativeModel(
        model_name=MODEL_NAME,
        system_instruction=SYSTEM_PROMPT
    )


def map_history_to_gemini(history):
    """Map [{role, content}] to Gemini content list.
    Roles: user -> user, assistant/model -> model
    """
    contents = []
    if not history:
        return contents
    
    for msg in history:
        role = msg.get("role", "user")
        text = msg.get("content", "")
        
        # Skip empty messages and system messages
        if not text or role == "system":
            continue
            
        # Map roles: user stays user, assistant/model becomes model
        g_role = "user" if role == "user" else "model"
        contents.append({
            "role": g_role,
            "parts": [{"text": text}],
        })
    
    return contents


def generate_stream(message: str, history=None):
    """Yield text deltas from Gemini as they arrive."""
    history = history or []
    model = make_model()

    # Prepare contents with history + current user message
    contents = map_history_to_gemini(history)
    contents.append({
        "role": "user",
        "parts": [{"text": message}],
    })

    # Streaming generation with safety settings
    try:
        response = model.generate_content(
            contents, 
            stream=True,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                top_p=0.95,
                top_k=40,
                max_output_tokens=1024,
            )
        )
        
        for chunk in response:
            # chunk.text is usually available for streamed text
            delta = getattr(chunk, "text", None)
            if not delta:
                # Sometimes text is nested in candidates/parts
                try:
                    cands = getattr(chunk, "candidates", [])
                    if cands and cands[0].content.parts:
                        for p in cands[0].content.parts:
                            if hasattr(p, "text") and p.text:
                                delta = p.text
                                break
                except Exception:
                    delta = None
            if delta:
                yield delta
                
    except Exception as e:
        logger.exception("Gemini streaming error: %s", e)
        raise


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return {"status": "ok", "model": MODEL_NAME}, 200


@sock.route('/ws')
def ws_handler(ws):
    """WebSocket handler using flask-sock"""
    
    # Authentication via query param
    args = request.args
    client_key = args.get("api_key", "").strip()
    
    if APP_API_KEY and client_key != APP_API_KEY:
        logger.warning(f"Unauthorized connection attempt with key: {client_key}")
        ws.send(json.dumps({"type": "chat_error", "error": "unauthorized"}))
        ws.close()
        return

    logger.info("WebSocket client connected")

    try:
        while True:
            # Receive message from client
            raw = ws.receive()
            if raw is None:
                break

            try:
                payload = json.loads(raw)
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON received: {e}")
                ws.send(json.dumps({"type": "chat_error", "error": "invalid_json"}))
                continue

            event = payload.get("event")
            data = payload.get("data", {})

            if event == "chat_message":
                message = (data.get("message") or "").strip()
                history = data.get("history") or []
                msg_id = data.get("message_id") or None

                if not message:
                    ws.send(json.dumps({
                        "type": "chat_error", 
                        "error": "empty_message", 
                        "message_id": msg_id
                    }))
                    continue

                logger.info(f"Processing message: {message[:50]}...")

                # Acknowledge start
                ws.send(json.dumps({"type": "chat_start", "message_id": msg_id}))

                # Stream deltas
                try:
                    token_count = 0
                    for delta in generate_stream(message, history):
                        ws.send(json.dumps({
                            "type": "chat_delta", 
                            "message_id": msg_id, 
                            "delta": delta
                        }))
                        token_count += 1
                    
                    logger.info(f"Streamed {token_count} tokens for message {msg_id}")
                    ws.send(json.dumps({"type": "chat_complete", "message_id": msg_id}))
                    
                except Exception as e:
                    logger.exception(f"Error generating response: {e}")
                    ws.send(json.dumps({
                        "type": "chat_error", 
                        "message_id": msg_id, 
                        "error": str(e)
                    }))
            else:
                logger.warning(f"Unknown event type: {event}")
                ws.send(json.dumps({"type": "chat_error", "error": f"unknown_event:{event}"}))
                
    except Exception as e:
        logger.exception(f"WebSocket error: {e}")
    finally:
        logger.info("WebSocket client disconnected")


if __name__ == "__main__":
    logger.info(f"Starting Gemini WebSocket server on 0.0.0.0:{PORT}")
    logger.info(f"Model: {MODEL_NAME}")
    logger.info(f"CORS Origins: {ALLOWED_ORIGINS}")
    
    # Run with Flask's built-in server (flask-sock handles WebSocket upgrade)
    app.run(host="0.0.0.0", port=PORT, debug=False)