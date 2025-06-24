# config.py
import os
from typing import Optional

class Settings:
    # 데이터베이스 설정
    DATABASE_URL: str = "postgresql://{user}:{password}@{host}:{port}/{database}?options=-csearch_path%3D{schema}".format(
        user="not2wing",
        password="skrdla1",
        host="localhost", 
        port="5432",
        database="mydb",
        schema="board"
    )
    
    # 데이터베이스 연결 풀 설정
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_RECYCLE: int = 3600
    DB_POOL_PRE_PING: bool = True
    DB_ECHO: bool = False  # 운영 환경에서는 False
    
    # 파일 업로드 설정
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    MAX_FILES_PER_UPLOAD: int = 10
    
    # 세션 설정
    SESSION_FILE: str = "sessions.json"
    
    # CORS 설정
    CORS_ORIGINS: list = ["http://localhost:5009", "http://dj.kmis.kr:5009"]
    
    # 앱 설정
    APP_TITLE: str = "Simple Board"
    APP_DESCRIPTION: str = "A simple board application with file upload support"
    APP_VERSION: str = "1.0.0"
    
    # 서버 설정
    HOST: str = "0.0.0.0"
    PORT: int = 15009
    
    # 입력 검증 설정
    MIN_USER_ID_LENGTH: int = 3
    MAX_USER_ID_LENGTH: int = 20
    MIN_USERNAME_LENGTH: int = 2
    MAX_USERNAME_LENGTH: int = 50
    MIN_PASSWORD_LENGTH: int = 6
    MAX_TITLE_LENGTH: int = 200
    MAX_CONTENT_LENGTH: int = 50000  # 50KB
    MAX_COMMENT_LENGTH: int = 1000

settings = Settings()
