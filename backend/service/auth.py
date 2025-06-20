import bcrypt
import uuid
import json
import os
from datetime import datetime, timedelta
from fastapi import HTTPException

from dto import SignUpRequest, SignInRequest
from db.base import save_user, find_user_by_id

# 세션 파일 경로
SESSION_FILE = "sessions.json"

class AuthService:
    @staticmethod
    def _load_sessions():
        """세션 파일에서 데이터 로드"""
        if not os.path.exists(SESSION_FILE):
            return {}

        try:
            with open(SESSION_FILE, 'r') as f:
                data = json.load(f)
                # 문자열로 저장된 datetime을 다시 변환
                for session_id, session_data in data.items():
                    session_data['created_at'] = datetime.fromisoformat(session_data['created_at'])
                    session_data['expires_at'] = datetime.fromisoformat(session_data['expires_at'])
                return data
        except:
            return {}

    @staticmethod
    def _save_sessions(sessions):
        """세션 데이터를 파일에 저장"""
        # datetime을 문자열로 변환해서 저장
        data_to_save = {}
        for session_id, session_data in sessions.items():
            data_to_save[session_id] = {
                'user_id': session_data['user_id'],
                'created_at': session_data['created_at'].isoformat(),
                'expires_at': session_data['expires_at'].isoformat()
            }

        with open(SESSION_FILE, 'w') as f:
            json.dump(data_to_save, f, indent=2)

    @staticmethod
    def _cleanup_expired_sessions():
        """만료된 세션들 정리"""
        sessions = AuthService._load_sessions()
        now = datetime.now()

        # 만료된 세션 제거
        expired_sessions = [sid for sid, data in sessions.items() if now > data['expires_at']]
        for sid in expired_sessions:
            del sessions[sid]

        if expired_sessions:
            AuthService._save_sessions(sessions)

        return sessions

    @staticmethod
    async def signup(request: SignUpRequest):
        await save_user(request.id, request.name, bcrypt.hashpw(request.password.encode("utf-8"), bcrypt.gensalt()),
                        request.balance)

    @staticmethod
    async def login(request: SignInRequest) -> str:
        user = await find_user_by_id(request.id)

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if not bcrypt.checkpw(request.password.encode('utf-8'), user.password.encode('utf-8')):
            raise HTTPException(status_code=401, detail="Incorrect password")

        # 만료된 세션들 먼저 정리
        sessions = AuthService._cleanup_expired_sessions()

        # 새 세션 ID 생성
        session_id = str(uuid.uuid4())

        # 세션 정보 추가
        sessions[session_id] = {
            "user_id": user.id,
            "created_at": datetime.now(),
            "expires_at": datetime.now() + timedelta(minutes=30)
        }

        # 파일에 저장
        AuthService._save_sessions(sessions)

        return session_id

    @staticmethod
    async def validate_session(session_id: str):
        """세션 유효성 검증"""
        sessions = AuthService._cleanup_expired_sessions()

        if session_id not in sessions:
            raise HTTPException(status_code=401, detail="Invalid session")

        session = sessions[session_id]

        # 한번 더 만료 확인 (cleanup에서 놓친 것들)
        if datetime.now() > session["expires_at"]:
            del sessions[session_id]
            AuthService._save_sessions(sessions)
            raise HTTPException(status_code=401, detail="Session expired")

        return session["user_id"]

    @staticmethod
    async def logout(session_id: str) -> dict[str, str]:
        """로그아웃 - 세션 삭제"""
        sessions = AuthService._load_sessions()

        if session_id in sessions:
            del sessions[session_id]
            AuthService._save_sessions(sessions)

        return {"message": "Logged out successfully"}

    @staticmethod
    async def extend_session(session_id: str):
        """세션 연장"""
        sessions = AuthService._load_sessions()

        if session_id in sessions:
            sessions[session_id]["expires_at"] = datetime.now() + timedelta(minutes=30)
            AuthService._save_sessions(sessions)