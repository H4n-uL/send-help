from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app import app

main_app = FastAPI(
    title="게시판 API",
    description="세션 기반 인증을 사용하는 게시판 시스템",
    version="1.0.0"
)

# CORS 설정
main_app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5009", "http://127.0.0.1:5009"],  # 프론트엔드 주소
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# app.py의 라우터들을 메인 앱에 포함
main_app.mount("/api", app)

@main_app.get("/")
async def root():
    return {"message": "게시판 API 서버가 정상적으로 실행 중입니다!"}

@main_app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(
        "main:main_app",
        host="0.0.0.0",
        port=15009,
        reload=True,
        log_level="info"
    )