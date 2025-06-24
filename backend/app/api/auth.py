# api/auth.py
from fastapi import APIRouter, HTTPException, Response, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional
import logging

from ..database import get_db
from ..models import User
from ..schemas import UserCreate, UserLogin
from ..core.security import hash_password, verify_password, create_session, delete_session
from ..core.deps import get_current_user
from ..config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/signup")
async def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    """사용자 회원가입"""
    try:
        # 입력 검증
        if len(user_data.id) < settings.MIN_USER_ID_LENGTH or len(user_data.id) > settings.MAX_USER_ID_LENGTH:
            raise HTTPException(
                status_code=400, 
                detail=f"ID must be {settings.MIN_USER_ID_LENGTH}-{settings.MAX_USER_ID_LENGTH} characters"
            )
        
        if len(user_data.username) < settings.MIN_USERNAME_LENGTH or len(user_data.username) > settings.MAX_USERNAME_LENGTH:
            raise HTTPException(
                status_code=400, 
                detail=f"Username must be {settings.MIN_USERNAME_LENGTH}-{settings.MAX_USERNAME_LENGTH} characters"
            )
        
        if len(user_data.password) < settings.MIN_PASSWORD_LENGTH:
            raise HTTPException(
                status_code=400, 
                detail=f"Password must be at least {settings.MIN_PASSWORD_LENGTH} characters"
            )
        
        # 사용자 존재 확인
        existing_user = db.query(User).filter(User.id == user_data.id).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="User already exists")
        
        # 비밀번호 해싱 및 사용자 생성
        hashed_password = hash_password(user_data.password)
        user = User(
            id=user_data.id,
            username=user_data.username,
            password=hashed_password
        )
        
        db.add(user)
        db.commit()
        
        logger.info(f"New user created: {user_data.id}")
        return {"message": "User created successfully"}
        
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="User already exists")
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Signup error: {e}")
        raise HTTPException(status_code=500, detail="Signup failed")

@router.post("/login")
async def login(user_data: UserLogin, response: Response, db: Session = Depends(get_db)):
    """사용자 로그인"""
    try:
        # 사용자 찾기
        user = db.query(User).filter(User.id == user_data.id).first()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # 비밀번호 확인
        if not verify_password(user_data.password, user.password):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # 세션 생성
        session_id = create_session(user.id)
        response.set_cookie("session_id", session_id, httponly=True)
        
        logger.info(f"User logged in: {user_data.id}")
        return {"message": "Login successful"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

@router.post("/logout")
async def logout(response: Response, session_id: Optional[str] = None):
    """사용자 로그아웃"""
    if session_id:
        delete_session(session_id)
    response.delete_cookie("session_id")
    return {"message": "Logout successful"}

@router.get("/me")
async def get_me(current_user: str = Depends(get_current_user)):
    """현재 사용자 정보 조회"""
    return {"user_id": current_user}
