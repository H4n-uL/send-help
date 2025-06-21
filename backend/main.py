from fastapi import FastAPI, HTTPException, Cookie, Response, Query, Depends, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, Column, String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel
from datetime import datetime
import bcrypt
import uuid
import json
import os
import shutil
from typing import Optional, List

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

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# =============================================================================
# 모델들
# =============================================================================

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)
    username = Column(String, nullable=False)
    password = Column(String, nullable=False)
    
    posts = relationship("Post", back_populates="author")
    comments = relationship("Comment", back_populates="author")

class Post(Base):
    __tablename__ = "posts"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    author_id = Column(String, ForeignKey("users.id"))
    
    author = relationship("User", back_populates="posts")
    comments = relationship("Comment", back_populates="post")

class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    author_id = Column(String, ForeignKey("users.id"))
    post_id = Column(Integer, ForeignKey("posts.id"))
    
    author = relationship("User", back_populates="comments")
    post = relationship("Post", back_populates="comments")

# 테이블 생성
Base.metadata.create_all(bind=engine)

# =============================================================================
# 업로드 디렉터리 설정
# =============================================================================

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# =============================================================================
# Pydantic 모델들
# =============================================================================

class UserCreate(BaseModel):
    id: str
    username: str
    password: str

class UserLogin(BaseModel):
    id: str
    password: str

class PostCreate(BaseModel):
    title: str
    content: str

class PostResponse(BaseModel):
    id: int
    title: str
    content: str
    created_at: datetime
    author_id: str
    author_username: str

class CommentCreate(BaseModel):
    content: str
    post_id: int

class CommentResponse(BaseModel):
    id: int
    content: str
    created_at: datetime
    author_id: str
    author_username: str

class UploadResponse(BaseModel):
    url: str
    filename: str
    size: int
    type: str
    mime_type: str

# =============================================================================
# 세션 관리 (파일 기반)
# =============================================================================

SESSION_FILE = "sessions.json"

def load_sessions():
    if os.path.exists(SESSION_FILE):
        with open(SESSION_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_sessions(sessions):
    with open(SESSION_FILE, 'w') as f:
        json.dump(sessions, f)

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
# 의존성
# =============================================================================

def get_db():
    db = SessionLocal()
    try:
        yield db
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
# 파일 업로드 유틸리티
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

# =============================================================================
# FastAPI 앱
# =============================================================================

app = FastAPI(title="Simple Board")

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
# 인증 API
# =============================================================================

@app.post("/api/auth/signup")
async def signup(user_data: UserCreate, db: Session = Depends(get_db)):
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
    
    return {"message": "User created successfully"}

@app.post("/api/auth/login")
async def login(user_data: UserLogin, response: Response, db: Session = Depends(get_db)):
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
    
    return {"message": "Login successful"}

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
# 파일 업로드 API
# =============================================================================

@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    """단일 파일 업로드"""
    try:
        # 파일 크기 제한 (10MB)
        max_size = 10 * 1024 * 1024  # 10MB
        file.file.seek(0, 2)  # 파일 끝으로 이동
        file_size = file.file.tell()  # 현재 위치 = 파일 크기
        file.file.seek(0)  # 파일 시작으로 돌아가기
        
        if file_size > max_size:
            raise HTTPException(status_code=413, detail="File too large")
        
        # 파일 저장
        result = save_upload_file(file)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

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
            results.append({"error": f"Failed to upload {file.filename}: {str(e)}"})
    
    return {"files": results}

# =============================================================================
# 게시글 API
# =============================================================================

@app.get("/api/posts")
async def get_posts(page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    offset = (page - 1) * limit
    posts = db.query(Post).order_by(Post.created_at.desc()).offset(offset).limit(limit).all()
    
    post_list = []
    for post in posts:
        post_list.append({
            "id": post.id,
            "title": post.title,
            "content": post.content,
            "created_at": post.created_at,
            "author_id": post.author_id,
            "author_username": post.author.username
        })
    
    total = db.query(Post).count()
    
    return {
        "posts": post_list,
        "total": total,
        "page": page,
        "limit": limit
    }

@app.get("/api/posts/{post_id}")
async def get_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return {
        "id": post.id,
        "title": post.title,
        "content": post.content,
        "created_at": post.created_at,
        "author_id": post.author_id,
        "author_username": post.author.username
    }

@app.post("/api/posts")
async def create_post(
    post_data: PostCreate,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = Post(
        title=post_data.title,
        content=post_data.content,
        author_id=current_user
    )
    db.add(post)
    db.commit()
    
    return {"message": "Post created successfully"}

@app.delete("/api/posts/{post_id}")
async def delete_post(
    post_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post.author_id != current_user:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(post)
    db.commit()
    
    return {"message": "Post deleted successfully"}

@app.get("/api/posts/search")
async def search_posts(q: str, db: Session = Depends(get_db)):
    posts = db.query(Post).filter(
        Post.title.contains(q) | Post.content.contains(q)
    ).order_by(Post.created_at.desc()).all()
    
    post_list = []
    for post in posts:
        post_list.append({
            "id": post.id,
            "title": post.title,
            "content": post.content,
            "created_at": post.created_at,
            "author_id": post.author_id,
            "author_username": post.author.username
        })
    
    return post_list

# =============================================================================
# 댓글 API
# =============================================================================

@app.get("/api/comments/post/{post_id}")
async def get_comments(post_id: int, db: Session = Depends(get_db)):
    comments = db.query(Comment).filter(Comment.post_id == post_id).order_by(Comment.created_at.asc()).all()
    
    comment_list = []
    for comment in comments:
        comment_list.append({
            "id": comment.id,
            "content": comment.content,
            "created_at": comment.created_at,
            "author_id": comment.author_id,
            "author_username": comment.author.username
        })
    
    return comment_list

@app.post("/api/comments")
async def create_comment(
    comment_data: CommentCreate,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    comment = Comment(
        content=comment_data.content,
        post_id=comment_data.post_id,
        author_id=current_user
    )
    db.add(comment)
    db.commit()
    
    return {"message": "Comment created successfully"}

@app.delete("/api/comments/{comment_id}")
async def delete_comment(
    comment_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if comment.author_id != current_user:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(comment)
    db.commit()
    
    return {"message": "Comment deleted successfully"}

# =============================================================================
# 메인
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=15009)