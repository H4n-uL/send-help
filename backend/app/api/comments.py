# api/comments.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import logging

from ..database import get_db
from ..models import Comment, Post
from ..schemas import CommentCreate
from ..core.deps import get_current_user
from ..config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/comments", tags=["comments"])

@router.get("/post/{post_id}")
async def get_comments(post_id: int, db: Session = Depends(get_db)):
    """게시글의 댓글 목록 조회"""
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

@router.post("")
async def create_comment(
    comment_data: CommentCreate,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """댓글 작성"""
    try:
        # 게시글 존재 확인
        post = db.query(Post).filter(Post.id == comment_data.post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # 입력 검증
        if len(comment_data.content) > settings.MAX_COMMENT_LENGTH:
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

@router.delete("/{comment_id}")
async def delete_comment(
    comment_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """댓글 삭제"""
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
