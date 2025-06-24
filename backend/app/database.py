# database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError, OperationalError
import logging
from .config import settings

logger = logging.getLogger(__name__)

# SQLAlchemy 엔진 생성
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_recycle=settings.DB_POOL_RECYCLE,
    pool_pre_ping=settings.DB_POOL_PRE_PING,
    echo=settings.DB_ECHO
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def init_database():
    """데이터베이스 초기화 및 테이블 생성"""
    try:
        # 데이터베이스 연결 테스트
        with engine.connect() as conn:
            logger.info("Database connection successful")
        
        # 테이블 생성 (이미 존재하면 무시)
        Base.metadata.create_all(bind=engine, checkfirst=True)
        logger.info("Database tables created successfully")
        
    except OperationalError as e:
        logger.error(f"Database connection failed: {e}")
        raise Exception("Database connection failed")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise Exception("Database initialization failed")

def check_and_migrate_schema():
    """스키마 변경사항 체크 및 마이그레이션"""
    try:
        from sqlalchemy import inspect
        inspector = inspect(engine)
        
        # 기존 테이블 구조 확인
        existing_tables = inspector.get_table_names(schema='board')
        
        # 필요한 컬럼이 있는지 확인하고 없으면 추가
        if 'posts' in existing_tables:
            columns = [col['name'] for col in inspector.get_columns('posts', schema='board')]
            
            with engine.connect() as conn:
                # view_count 컬럼이 없으면 추가
                if 'view_count' not in columns:
                    conn.execute('ALTER TABLE board.posts ADD COLUMN view_count INTEGER DEFAULT 0')
                    logger.info("Added view_count column to posts table")
                
                # updated_at 컬럼이 없으면 추가
                if 'updated_at' not in columns:
                    conn.execute('ALTER TABLE board.posts ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
                    logger.info("Added updated_at column to posts table")
                
                conn.commit()
            
    except Exception as e:
        logger.warning(f"Schema migration warning: {e}")

def get_db():
    """데이터베이스 세션 의존성"""
    db = SessionLocal()
    try:
        yield db
    except SQLAlchemyError as e:
        logger.error(f"Database error: {e}")
        db.rollback()
        raise Exception("Database error occurred")
    finally:
        db.close()
