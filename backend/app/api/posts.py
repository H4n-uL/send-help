# api/posts.py
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime
import logging

from ..database import get_db
from ..models import Post
from ..schemas import PostCreate, PostUpdate
from ..core.deps import get_current_user
from ..config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/posts", tags=["posts"])

@router.get("")
async def get_posts(page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    """게시글 목록 조회"""
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

@router.get("/{post_id}")
async def get_post(post_id: int, db: Session = Depends(get_db)):
    """게시글 상세 조회 (조회수 증가)"""
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

@router.post("")
async def create_post(
    post_data: PostCreate,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """게시글 작성"""
    try:
        # 입력 검증
        if len(post_data.title) > settings.MAX_TITLE_LENGTH:
            raise HTTPException(status_code=400, detail="Title too long")
        
        if len(post_data.content) > settings.MAX_CONTENT_LENGTH:
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

@router.put("/{post_id}")
async def update_post(
    post_id: int,
    post_data: PostUpdate,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """게시글 수정"""
    try:
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        if post.author_id != current_user:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # 업데이트
        if post_data.title is not None:
            if len(post_data.title) > settings.MAX_TITLE_LENGTH:
                raise HTTPException(status_code=400, detail="Title too long")
            post.title = post_data.title
        
        if post_data.content is not None:
            if len(post_data.content) > settings.MAX_CONTENT_LENGTH:
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

@router.delete("/{post_id}")
async def delete_post(
    post_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """게시글 삭제"""
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

@router.get("/search")
async def search_posts(q: str = Query(..., min_length=2), db: Session = Depends(get_db)):
    """게시글 검색"""
    try:
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
        
    except Exception as e:
        logger.error(f"Search posts error: {e}")
        raise HTTPException(status_code=500, detail="Search failed")
