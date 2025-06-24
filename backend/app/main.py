# app/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import SQLAlchemyError
import logging
import os

from .config import settings
from .database import init_database, check_and_migrate_schema
from .api import auth_router, posts_router, comments_router, upload_router

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI 앱 생성
app = FastAPI(
    title=settings.APP_TITLE,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION
)

# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 업로드 디렉터리 생성 및 정적 파일 서빙
if not os.path.exists(settings.UPLOAD_DIR):
    os.makedirs(settings.UPLOAD_DIR)

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# API 라우터 등록
app.include_router(auth_router, prefix="/api")
app.include_router(posts_router, prefix="/api")  
app.include_router(comments_router, prefix="/api")
app.include_router(upload_router, prefix="/api")

# 시작 이벤트
@app.on_event("startup")
async def startup_event():
    """앱 시작 시 데이터베이스 초기화"""
    logger.info("Starting application...")
    try:
        init_database()
        check_and_migrate_schema()
        logger.info("Application started successfully")
    except Exception as e:
        logger.error(f"Failed to start application: {e}")
        raise

# 에러 핸들러
@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request, exc):
    logger.error(f"Database error: {exc}")
    return HTTPException(status_code=500, detail="Database error occurred")

@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    logger.error(f"Value error: {exc}")
    return HTTPException(status_code=400, detail=str(exc))

# 헬스체크 엔드포인트
@app.get("/health")
async def health_check():
    """헬스체크 엔드포인트"""
    try:
        from .database import engine
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unavailable")

# 루트 엔드포인트
@app.get("/")
async def root():
    return {
        "message": "Simple Board API",
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }
