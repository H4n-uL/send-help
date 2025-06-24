# core/deps.py
from fastapi import HTTPException, Cookie, Depends
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from .security import get_user_from_session

def get_current_user(session_id: Optional[str] = Cookie(None)):
    """현재 사용자 인증 의존성"""
    if not session_id:
        raise HTTPException(status_code=401, detail="Not logged in")
    
    user_id = get_user_from_session(session_id)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    return user_id
