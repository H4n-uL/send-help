# core/security.py
import bcrypt
import uuid
import json
import os
import logging
from datetime import datetime
from typing import Optional
from fastapi import HTTPException, Cookie
from ..config import settings

logger = logging.getLogger(__name__)

def hash_password(password: str) -> str:
    """비밀번호 해싱"""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed_password: str) -> bool:
    """비밀번호 검증"""
    return bcrypt.checkpw(password.encode(), hashed_password.encode())

# 세션 관리
def load_sessions():
    """세션 파일 로드"""
    try:
        if os.path.exists(settings.SESSION_FILE):
            with open(settings.SESSION_FILE, 'r') as f:
                return json.load(f)
    except (json.JSONDecodeError, IOError) as e:
        logger.warning(f"Session file error: {e}")
    return {}

def save_sessions(sessions):
    """세션 파일 저장"""
    try:
        with open(settings.SESSION_FILE, 'w') as f:
            json.dump(sessions, f)
    except IOError as e:
        logger.error(f"Failed to save sessions: {e}")

def create_session(user_id: str) -> str:
    """세션 생성"""
    sessions = load_sessions()
    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        "user_id": user_id,
        "created_at": datetime.now().isoformat()
    }
    save_sessions(sessions)
    return session_id

def get_user_from_session(session_id: str) -> Optional[str]:
    """세션에서 사용자 ID 가져오기"""
    sessions = load_sessions()
    if session_id in sessions:
        return sessions[session_id]["user_id"]
    return None

def delete_session(session_id: str):
    """세션 삭제"""
    sessions = load_sessions()
    if session_id in sessions:
        del sessions[session_id]
        save_sessions(sessions)
