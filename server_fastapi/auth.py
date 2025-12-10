import os
import secrets
from typing import Optional
from fastapi import APIRouter, Request, Depends, HTTPException
from starlette.responses import RedirectResponse, JSONResponse
from authlib.integrations.starlette_client import OAuth, OAuthError
from dotenv import load_dotenv
import jwt
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database import get_db, User, init_db

load_dotenv()  # loads .env in development

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
JWT_SECRET = os.getenv("JWT_SECRET", secrets.token_urlsafe(32))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
    raise RuntimeError("Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in env")

# Initialize database tables
init_db()

router = APIRouter()

oauth = OAuth()
# register google with authlib
oauth.register(
    name="google",
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

def create_jwt(payload: dict, expires_minutes: int = 60*24*7):
    exp = datetime.utcnow() + timedelta(minutes=expires_minutes)
    token = jwt.encode({**payload, "exp": exp}, JWT_SECRET, algorithm="HS256")
    # jwt.encode returns str in PyJWT >=2.0
    return token

def verify_jwt(token: str) -> Optional[dict]:
    try:
        data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return data
    except Exception:
        return None

@router.get("/auth/login")
async def login(request: Request):
    # redirect user to google consent screen
    # authlib will save 'state' into the session automatically
    redirect_uri = request.url_for("auth_callback")
    return await oauth.google.authorize_redirect(request, str(redirect_uri))

@router.get("/auth/callback")
async def auth_callback(request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
    except OAuthError as e:
        return JSONResponse({"error": "OAuth error", "details": str(e)}, status_code=400)

    # Get userinfo from Google
    userinfo = token.get("userinfo")
    if not userinfo:
        # If userinfo not in token, fetch it from the userinfo endpoint
        resp = await oauth.google.get("https://www.googleapis.com/oauth2/v3/userinfo", token=token)
        userinfo = resp.json()

    # Get or create user in database
    user_id = userinfo.get("sub")
    user_email = userinfo.get("email")
    user_name = userinfo.get("name")
    
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        # Create new user
        user = User(
            id=user_id,
            email=user_email,
            name=user_name,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # User exists, just update info if changed
        ist_offset = timedelta(hours=5, minutes=30)
        user.name = user_name
        user.updated_at = datetime.utcnow() + ist_offset
        db.commit()

    # create your application's session token (JWT)
    payload = {
        "sub": user.id,
        "email": user.email,
        "name": user.name,
    }
    app_jwt = create_jwt(payload)

    # Set httpOnly cookie and redirect to frontend success page
    response = RedirectResponse(url=f"{FRONTEND_URL}/auth/success?token={app_jwt}", status_code=302)
    response.set_cookie(
        key="session",
        value=app_jwt,
        httponly=True,
        secure=False,  # Set True in production with HTTPS
        samesite="none" if os.getenv("ENVIRONMENT") == "production" else "lax",
        max_age=60 * 60 * 24 * 7,  # 7 days
        path="/",
        domain="localhost" if "localhost" in FRONTEND_URL else None,
    )
    return response

# Protected endpoint that returns current user (reads JWT from httpOnly cookie or Authorization header)
@router.get("/user")
async def get_user(request: Request, db: Session = Depends(get_db)):
    # Try to get token from Authorization header first
    auth_header = request.headers.get("authorization")
    token = None
    
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.replace("Bearer ", "")
    else:
        # Fallback to cookie
        token = request.cookies.get("session")
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    data = verify_jwt(token)
    if not data:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Fetch fresh user data from database
    user_id = data.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # return user info
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        }
    }

@router.post("/logout")
async def logout():
    response = JSONResponse({"ok": True})
    response.delete_cookie("session")
    return response
