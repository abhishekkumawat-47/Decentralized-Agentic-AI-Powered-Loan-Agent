# Flask WebSocket Chat Server (Gemini 2.5 Flash)

This server exposes a native WebSocket endpoint that streams responses from Google Gemini 2.5 Flash. The Next.js frontend connects via browser WebSocket (no Socket.IO required).

## Setup

1) Create and activate a virtual environment (recommended)

Windows (PowerShell):

```
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2) Install dependencies

```
pip install -r server_flask/requirements.txt
```

3) Configure environment variables

Create `server_flask/.env` with:

```
GOOGLE_API_KEY=your_google_api_key
MODEL_NAME=gemini-2.5-flash
APP_API_KEY=dev-local-key          # optional, if set the client must pass ?api_key=...
PORT=5001
ALLOWED_ORIGINS=http://localhost:3000
```

4) Run the server

```
python server_flask/run.py
uvicorn app:app --host 0.0.0.0 --port 5001 --reload
```

You should see the server listening on `0.0.0.0:5001`.

## WebSocket Protocol

Connect:

```
ws://localhost:5001/ws?api_key=dev-local-key
```

Client -> Server message:

```
{
  "event": "chat_message",
  "data": {
    "message_id": "uuid-or-timestamp",
    "message": "user text",
    "history": [ {"role": "user"|"assistant", "content": "..."} ]
  }
}
```

Server -> Client events:
- `{"type":"chat_start","message_id":"..."}`
- `{"type":"chat_delta","message_id":"...","delta":"partial text"}`
- `{"type":"chat_complete","message_id":"..."}`
- `{"type":"chat_error","message_id":"...","error":"..."}`

## Notes
- Uses eventlet WSGI if available for better WebSocket support.
- In production, run behind a reverse proxy (nginx) with TLS termination.
- You can scale horizontally; the server is stateless (history is provided by the client each turn).
