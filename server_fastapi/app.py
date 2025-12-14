"""
FastAPI WebSocket Chat Server (Gemini 2.5 Flash)
================================================
- WebSocket endpoint with proper upgrade handling
- Streams Gemini responses token-by-token to the client
- Simple API key authentication via connection query param ?api_key=...

Requirements (install once):
  pip install fastapi uvicorn python-dotenv google-generativeai

Environment variables (.env file next to this script or set in shell):
  GOOGLE_API_KEY=your_google_api_key
  MODEL_NAME=gemini-2.5-flash             # default
  APP_API_KEY=dev-local-key               # optional, if set client must pass ?api_key=...
  PORT=5001                                # default
  ALLOWED_ORIGINS=http://localhost:3000    # comma-separated list, default "*"

Run:
  uvicorn server_fastapi.run:app --host 0.0.0.0 --port 5001
"""

import os
import json
import logging
from typing import List, Dict, Any, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware

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

app = FastAPI(title="Gemini WebSocket Chat Server")

app.add_middleware(
    SessionMiddleware, 
    secret_key=os.getenv("SESSION_SECRET", "supersecretdevkey12345"),
    max_age=3600,  # 1 hour session
    same_site="lax",
    https_only=False  # True ---> production
)

# CORS - must be before routes
origins = [o.strip() for o in ALLOWED_ORIGINS.split(",")] if ALLOWED_ORIGINS != "*" else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include auth routes
from auth import router as auth_router
app.include_router(auth_router)

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


def map_history_to_gemini(history: Optional[List[Dict[str, Any]]]):
    """Map [{role, content}] to Gemini content list.
    Roles: user -> user, assistant/model -> model
    """
    contents: List[Dict[str, Any]] = []
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


@app.get("/health")
async def health():
    """Health check endpoint"""
    return JSONResponse({"status": "ok", "model": MODEL_NAME})


@app.websocket("/ws")
async def ws_handler(websocket: WebSocket):
    # Authentication via query param
    params = dict(websocket.query_params)
    client_key = (params.get("api_key") or "").strip()

    # Accept connection early to send errors over WS in standard protocol
    await websocket.accept()

    if APP_API_KEY and client_key != APP_API_KEY:
        logger.warning(f"Unauthorized connection attempt with key: {client_key}")
        await websocket.send_text(json.dumps({"type": "chat_error", "error": "unauthorized"}))
        await websocket.close()
        return

    logger.info("WebSocket client connected")

    try:
        while True:
            raw = await websocket.receive_text()
            if raw is None:
                break

            try:
                payload = json.loads(raw)
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON received: {e}")
                await websocket.send_text(json.dumps({"type": "chat_error", "error": "invalid_json"}))
                continue

            event = payload.get("event")
            data = payload.get("data", {})

            if event == "chat_message":
                message = (data.get("message") or "").strip()
                history = data.get("history") or []
                msg_id = data.get("message_id") or None

                if not message:
                    await websocket.send_text(json.dumps({
                        "type": "chat_error",
                        "error": "empty_message",
                        "message_id": msg_id
                    }))
                    continue

                logger.info(f"Processing message: {message[:50]}...")

                # Acknowledge start
                await websocket.send_text(json.dumps({"type": "chat_start", "message_id": msg_id}))

                # Stream deltas
                try:
                    token_count = 0
                    for delta in generate_stream(message, history):
                        await websocket.send_text(json.dumps({
                            "type": "chat_delta",
                            "message_id": msg_id,
                            "delta": delta
                        }))
                        token_count += 1

                    logger.info(f"Streamed {token_count} tokens for message {msg_id}")
                    await websocket.send_text(json.dumps({"type": "chat_complete", "message_id": msg_id}))

                except Exception as e:
                    logger.exception(f"Error generating response: {e}")
                    await websocket.send_text(json.dumps({
                        "type": "chat_error",
                        "message_id": msg_id,
                        "error": str(e)
                    }))
            else:
                logger.warning(f"Unknown event type: {event}")
                await websocket.send_text(json.dumps({"type": "chat_error", "error": f"unknown_event:{event}"}))

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.exception(f"WebSocket error: {e}")
    finally:
        try:
            await websocket.close()
        except Exception:
            pass


# Optional: allow running with `python server_fastapi/run.py`
if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting Gemini WebSocket server on 0.0.0.0:{PORT}")
    logger.info(f"Model: {MODEL_NAME}")
    logger.info(f"CORS Origins: {ALLOWED_ORIGINS}")
    uvicorn.run("app:app", host="0.0.0.0", port=PORT, reload=False)
