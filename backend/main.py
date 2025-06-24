from fastapi import FastAPI, HTTPException, Cookie, Response, Query, Depends, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, Column, String, Integer, DateTime, Text, ForeignKey, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from sqlalchemy.exc import SQLAlchemyError, IntegrityError, OperationalError
from pydantic import BaseModel
from datetime import datetime
import bcrypt
import uuid
import json
import os
import shutil
import logging
from typing import Optional, List

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =============================================================================
# 데이터베이스 설정
# =============================================================================

DATABASE_URL = "postgresql://{user}:{password}@{host}:{port}/{database}?options=-csearch_path%3D{schema}".format(
    user = "not2wing",
    password = "skrdla1",
    host = "localhost", 
    port = "5432",
    database = "mydb",
    schema = "board"
)

# 연결 풀 설정으로 안정성 향상
engine = create_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_recycle=3600,
    pool_pre_ping=True,
    echo=False  # 운영 환경에서는 False로 설정
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# =============================================================================
# 데이터베이스 초기화 및 마이그레이션 함수
# =============================================================================

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
        raise HTTPException(status_code=500, detail="Database connection failed")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise HTTPException(status_code=500, detail="Database initialization failed")

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
        # 마이그레이션 실패해도 앱은 계속 실행

# =============================================================================
# 개선된 모델들
# =============================================================================

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)
    username = Column(String, nullable=False)
    password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    
    posts = relationship("Post", back_populates="author", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="author", cascade="all, delete-orphan")

class Post(Base):
    __tablename__ = "posts"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False)  # 길이 제한 추가
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    view_count = Column(Integer, default=0)
    author_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    
    author = relationship("User", back_populates="posts")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")

class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    author_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"))
    
    author = relationship("User", back_populates="comments")
    post = relationship("Post", back_populates="comments")

# =============================================================================
# 업로드 디렉터리 설정
# =============================================================================

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# =============================================================================
# Pydantic 모델들 (개선됨)
# =============================================================================

class UserCreate(BaseModel):
    id: str
    username: str
    password: str
    
    class Config:
        str_strip_whitespace = True

class UserLogin(BaseModel):
    id: str
    password: str
    
    class Config:
        str_strip_whitespace = True

class PostCreate(BaseModel):
    title: str
    content: str
    
    class Config:
        str_strip_whitespace = True

class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    
    class Config:
        str_strip_whitespace = True

class PostResponse(BaseModel):
    id: int
    title: str
    content: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    view_count: int = 0
    author_id: str
    author_username: str

class CommentCreate(BaseModel):
    content: str
    post_id: int
    
    class Config:
        str_strip_whitespace = True

class CommentResponse(BaseModel):
    id: int
    content: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    author_id: str
    author_username: str

class UploadResponse(BaseModel):
    url: str
    filename: str
    size: int
    type: str
    mime_type: str

# =============================================================================
# 세션 관리 (개선됨)
# =============================================================================

SESSION_FILE = "sessions.json"

def load_sessions():
    try:
        if os.path.exists(SESSION_FILE):
            with open(SESSION_FILE, 'r') as f:
                return json.load(f)
    except (json.JSONDecodeError, IOError) as e:
        logger.warning(f"Session file error: {e}")
    return {}

def save_sessions(sessions):
    try:
        with open(SESSION_FILE, 'w') as f:
            json.dump(sessions, f)
    except IOError as e:
        logger.error(f"Failed to save sessions: {e}")

def create_session(user_id: str) -> str:
    sessions = load_sessions()
    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        "user_id": user_id,
        "created_at": datetime.now().isoformat()
    }
    save_sessions(sessions)
    return session_id

def get_user_from_session(session_id: str) -> Optional[str]:
    sessions = load_sessions()
    if session_id in sessions:
        return sessions[session_id]["user_id"]
    return None

def delete_session(session_id: str):
    sessions = load_sessions()
    if session_id in sessions:
        del sessions[session_id]
        save_sessions(sessions)

# =============================================================================
# 의존성 (개선됨)
# =============================================================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    except SQLAlchemyError as e:
        logger.error(f"Database error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error occurred")
    finally:
        db.close()

def get_current_user(session_id: Optional[str] = Cookie(None)):
    if not session_id:
        raise HTTPException(status_code=401, detail="Not logged in")
    
    user_id = get_user_from_session(session_id)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    return user_id

# =============================================================================
# 파일 업로드 유틸리티 (개선됨)
# =============================================================================

def get_file_type(filename: str) -> str:
    """파일 확장자를 기반으로 파일 타입 결정"""
    extension = filename.lower().split('.')[-1] if '.' in filename else ''
    
    image_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg']
    video_extensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv']
    audio_extensions = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a']
    
    if extension in image_extensions:
        return 'image'
    elif extension in video_extensions:
        return 'video'
    elif extension in audio_extensions:
        return 'audio'
    else:
        return 'file'

def save_upload_file(file: UploadFile) -> dict:
    """업로드된 파일을 저장하고 정보 반환"""
    try:
        # 파일명 생성 (중복 방지)
        file_ext = file.filename.split('.')[-1] if '.' in file.filename else ''
        unique_filename = f"{uuid.uuid4()}.{file_ext}" if file_ext else str(uuid.uuid4())
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # 파일 저장
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 파일 크기 계산
        file_size = os.path.getsize(file_path)
        
        return {
            "url": f"/uploads/{unique_filename}",
            "filename": file.filename,
            "size": file_size,
            "type": get_file_type(file.filename),
            "mime_type": file.content_type or "application/octet-stream"
        }
    except Exception as e:
        logger.error(f"File upload error: {e}")
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

# =============================================================================
# FastAPI 앱 및 미들웨어
# =============================================================================

app = FastAPI(
    title="Simple Board",
    description="A simple board application with file upload support",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5009", "http://dj.kmis.kr:5009"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 정적 파일 서빙 (업로드된 파일들)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# =============================================================================
# 시작 이벤트
# =============================================================================

@app.on_event("startup")
async def startup_event():
    """앱 시작 시 데이터베이스 초기화"""
    logger.info("Starting application...")
    init_database()
    check_and_migrate_schema()
    logger.info("Application started successfully")

# =============================================================================
# 에러 핸들러
# =============================================================================

@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request, exc):
    logger.error(f"Database error: {exc}")
    return HTTPException(status_code=500, detail="Database error occurred")

@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    logger.error(f"Value error: {exc}")
    return HTTPException(status_code=400, detail=str(exc))

# =============================================================================
# 헬스체크 엔드포인트
# =============================================================================

@app.get("/health")
async def health_check():
    """헬스체크 엔드포인트"""
    try:
        # 데이터베이스 연결 테스트
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unavailable")

# =============================================================================
# 인증 API (개선됨)
# =============================================================================

@app.post("/api/auth/signup")
async def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    try:
        # 입력 검증
        if len(user_data.id) < 3 or len(user_data.id) > 20:
            raise HTTPException(status_code=400, detail="ID must be 3-20 characters")
        
        if len(user_data.username) < 2 or len(user_data.username) > 50:
            raise HTTPException(status_code=400, detail="Username must be 2-50 characters")
        
        if len(user_data.password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
        # 사용자 존재 확인
        existing_user = db.query(User).filter(User.id == user_data.id).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="User already exists")
        
        # 비밀번호 해싱
        hashed_password = bcrypt.hashpw(user_data.password.encode(), bcrypt.gensalt()).decode()
        
        # 사용자 생성
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
    except Exception as e:
        db.rollback()
        logger.error(f"Signup error: {e}")
        raise HTTPException(status_code=500, detail="Signup failed")

@app.post("/api/auth/login")
async def login(user_data: UserLogin, response: Response, db: Session = Depends(get_db)):
    try:
        # 사용자 찾기
        user = db.query(User).filter(User.id == user_data.id).first()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # 비밀번호 확인
        if not bcrypt.checkpw(user_data.password.encode(), user.password.encode()):
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

@app.post("/api/auth/logout")
async def logout(response: Response, session_id: Optional[str] = Cookie(None)):
    if session_id:
        delete_session(session_id)
    response.delete_cookie("session_id")
    return {"message": "Logout successful"}

@app.get("/api/auth/me")
async def get_me(current_user: str = Depends(get_current_user)):
    return {"user_id": current_user}

# =============================================================================
# 파일 업로드 API (개선됨)
# =============================================================================

@app.post("/api/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    """단일 파일 업로드"""
    # 파일 크기 제한 (10MB)
    max_size = 10 * 1024 * 1024  # 10MB
    file.file.seek(0, 2)  # 파일 끝으로 이동
    file_size = file.file.tell()  # 현재 위치 = 파일 크기
    file.file.seek(0)  # 파일 시작으로 돌아가기
    
    if file_size > max_size:
        raise HTTPException(status_code=413, detail="File too large")
    
    # 파일 저장
    result = save_upload_file(file)
    logger.info(f"File uploaded: {file.filename} by {current_user}")
    return result

@app.post("/api/upload/multiple")
async def upload_multiple_files(
    files: List[UploadFile] = File(...),
    current_user: str = Depends(get_current_user)
):
    """다중 파일 업로드"""
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Too many files")
    
    results = []
    for file in files:
        try:
            result = save_upload_file(file)
            results.append(result)
        except Exception as e:
            logger.error(f"File upload failed: {file.filename}, error: {e}")
            results.append({"error": f"Failed to upload {file.filename}: {str(e)}"})
    
    return {"files": results}

# =============================================================================
# 게시글 API (개선됨)
# =============================================================================

@app.get("/api/posts")
async def get_posts(page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    try:
        if limit > 100:  # 최대 페이지 크기 제한
            limit = 100
        
        offset = (page - 1) * limit
        posts = db.query(Post).order_by(Post.created_at.desc()).offset(offset).limit(limit).all()
        
        post_list = []
        for post in posts:
            post_list.append({
                "id": post.id,
                "title": post.title,
                "created_at": post.created_at,
                "updated_at": post.updated_at,
                "views": post.view_count,
                "author_id": post.author_id,
                "author_username": post.author.username,
                "comment_count": len(post.comments)
            })
        
        total = db.query(Post).count()
        
        return {
            "posts": post_list,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit
        }
        
    except Exception as e:
        logger.error(f"Get posts error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch posts")

@app.get("/api/posts/{post_id}")
async def get_post(post_id: int, db: Session = Depends(get_db)):
    try:
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # 조회수 증가
        post.view_count += 1
        db.commit()
        
        return {
            "id": post.id,
            "title": post.title,
            "content": post.content,
            "created_at": post.created_at,
            "updated_at": post.updated_at,
            "view_count": post.view_count,
            "author_id": post.author_id,
            "author_username": post.author.username
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get post error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch post")

@app.post("/api/posts")
async def create_post(
    post_data: PostCreate,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # 입력 검증
        if len(post_data.title) > 200:
            raise HTTPException(status_code=400, detail="Title too long")
        
        if len(post_data.content) > 50000:  # 50KB 제한
            raise HTTPException(status_code=400, detail="Content too long")
        
        post = Post(
            title=post_data.title,
            content=post_data.content,
            author_id=current_user
        )
        db.add(post)
        db.commit()
        db.refresh(post)
        
        logger.info(f"Post created: {post.id} by {current_user}")
        return {"message": "Post created successfully", "post_id": post.id}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Create post error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create post")

@app.put("/api/posts/{post_id}")
async def update_post(
    post_id: int,
    post_data: PostUpdate,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        if post.author_id != current_user:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # 업데이트
        if post_data.title is not None:
            if len(post_data.title) > 200:
                raise HTTPException(status_code=400, detail="Title too long")
            post.title = post_data.title
        
        if post_data.content is not None:
            if len(post_data.content) > 50000:
                raise HTTPException(status_code=400, detail="Content too long")
            post.content = post_data.content
        
        post.updated_at = datetime.now()
        db.commit()
        
        logger.info(f"Post updated: {post_id} by {current_user}")
        return {"message": "Post updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Update post error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update post")

@app.delete("/api/posts/{post_id}")
async def delete_post(
    post_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        if post.author_id != current_user:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        db.delete(post)
        db.commit()
        
        logger.info(f"Post deleted: {post_id} by {current_user}")
        return {"message": "Post deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Delete post error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete post")

@app.get("/api/posts/search")
async def search_posts(q: str, db: Session = Depends(get_db)):
    try:
        if len(q) < 2:
            raise HTTPException(status_code=400, detail="Search query too short")
        
        posts = db.query(Post).filter(
            (Post.title.ilike(f"%{q}%")) | (Post.content.ilike(f"%{q}%"))
        ).order_by(Post.created_at.desc()).limit(100).all()
        
        post_list = []
        for post in posts:
            post_list.append({
                "id": post.id,
                "title": post.title,
                "content": post.content[:200] + "..." if len(post.content) > 200 else post.content,
                "created_at": post.created_at,
                "author_id": post.author_id,
                "author_username": post.author.username
            })
        
        return post_list
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Search posts error: {e}")
        raise HTTPException(status_code=500, detail="Search failed")

# =============================================================================
# 댓글 API (개선됨)
# =============================================================================

@app.get("/api/comments/post/{post_id}")
async def get_comments(post_id: int, db: Session = Depends(get_db)):
    try:
        # 게시글 존재 확인
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        comments = db.query(Comment).filter(Comment.post_id == post_id).order_by(Comment.created_at.asc()).all()
        
        comment_list = []
        for comment in comments:
            comment_list.append({
                "id": comment.id,
                "content": comment.content,
                "created_at": comment.created_at,
                "updated_at": comment.updated_at,
                "author_id": comment.author_id,
                "author_username": comment.author.username
            })
        
        return comment_list
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get comments error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch comments")

@app.post("/api/comments")
async def create_comment(
    comment_data: CommentCreate,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # 게시글 존재 확인
        post = db.query(Post).filter(Post.id == comment_data.post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # 입력 검증
        if len(comment_data.content) > 1000:
            raise HTTPException(status_code=400, detail="Comment too long")
        
        comment = Comment(
            content=comment_data.content,
            post_id=comment_data.post_id,
            author_id=current_user
        )
        db.add(comment)
        db.commit()
        db.refresh(comment)
        
        logger.info(f"Comment created: {comment.id} by {current_user}")
        return {"message": "Comment created successfully", "comment_id": comment.id}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Create comment error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create comment")

@app.delete("/api/comments/{comment_id}")
async def delete_comment(
    comment_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        comment = db.query(Comment).filter(Comment.id == comment_id).first()
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")
        
        if comment.author_id != current_user:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        db.delete(comment)
        db.commit()
        
        logger.info(f"Comment deleted: {comment_id} by {current_user}")
        return {"message": "Comment deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Delete comment error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete comment")

# =============================================================================
# 메인
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=15009)
