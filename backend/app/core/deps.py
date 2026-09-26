from typing import Optional
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.core.db import get_db
from app.core.security import decode_access_token
from app.ai.factory import get_ai_provider
from app.ai.base import AIProvider

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    user_id = decode_access_token(token)
    if not user_id:
        raise credentials_exception
    
    user_doc = await db.users.find_one({"_id": user_id})
    if not user_doc:
        user_doc = await db.users.find_one({"id": user_id})
    if not user_doc:
        raise credentials_exception
        
    return user_doc

def get_request_ai_provider(
    x_ai_provider: Optional[str] = Header(None, alias="X-AI-Provider"),
    x_ai_key: Optional[str] = Header(None, alias="X-AI-Key")
) -> AIProvider:
    return get_ai_provider(provider_name=x_ai_provider, api_key=x_ai_key)

