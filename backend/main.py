# run.py
"""
Simple Board Application Runner

새로운 구조화된 앱을 실행하는 파일
"""

import uvicorn
from app.main import app
from app.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,  # 개발 환경에서만 True
        log_level="info"
    )
