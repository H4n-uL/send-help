from datetime import datetime
from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy import update, delete, desc, asc, or_, func
from sqlalchemy.orm import joinedload

from .base_class import Base
from .models.post import Post
from .models.comment import Comment
from .models.user import User
from .session import SessionLocal


# =============================================================================
# 사용자 관련 함수
# =============================================================================

async def exist_user_by_id(_id: str) -> bool:
    """사용자 ID 존재 여부 확인"""
    db = SessionLocal()
    try:
        return db.query(User).filter_by(id=_id).first() is not None
    finally:
        db.close()


async def find_user_by_id(_id: str) -> Optional[User]:
    """ID로 사용자 조회"""
    db = SessionLocal()
    try:
        return db.query(User).filter_by(id=_id).first()
    finally:
        db.close()


async def find_all_users() -> Optional[List[User]]:
    """모든 사용자 조회"""
    db = SessionLocal()
    try:
        users = db.query(User).all()
        return users if users else None
    finally:
        db.close()


async def save_user(_id: str, _userid: str, _password: str) -> None:
    """사용자 등록"""
    if await exist_user_by_id(_id=_id):
        raise HTTPException(status_code=409, detail="ID Already Exists")

    db = SessionLocal()
    try:
        user = User(id=_id, userid=_userid, password=_password)
        db.add(user)
        db.commit()
        db.refresh(user)
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


async def update_user(_id: str, _userid: str, _password: str) -> None:
    """사용자 정보 수정"""
    db = SessionLocal()
    try:
        db.execute(
            update(User)
            .where(User.id == _id)
            .values(userid=_userid, password=_password)
        )
        db.commit()
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


async def delete_user(_id: str) -> None:
    """사용자 삭제"""
    db = SessionLocal()
    try:
        db.execute(delete(User).where(User.id == _id))
        db.commit()
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


async def authenticate_user(_userid: str, _password: str) -> Optional[User]:
    """사용자 인증 (로그인)"""
    db = SessionLocal()
    try:
        return db.query(User).filter_by(userid=_userid, password=_password).first()
    finally:
        db.close()


# =============================================================================
# 게시글 관련 함수
# =============================================================================

async def save_post(_title: str, _contents: str, _user_id: str) -> None:
    """게시글 작성"""
    db = SessionLocal()
    try:
        post = Post(
            title=_title,
            contents=_contents,
            date=datetime.now(),
            user_id=_user_id
        )
        db.add(post)
        db.commit()
        db.refresh(post)
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


async def find_post_by_id(_id: int) -> Optional[Post]:
    """ID로 게시글 조회 (작성자 정보 포함)"""
    db = SessionLocal()
    try:
        return db.query(Post).options(joinedload(Post.user)).filter_by(id=_id).first()
    finally:
        db.close()


async def find_all_posts(page: int = 1, limit: int = 10) -> Optional[List[Post]]:
    """게시글 목록 조회 (페이징, 최신순)"""
    db = SessionLocal()
    try:
        offset = (page - 1) * limit
        posts = (
            db.query(Post)
            .options(joinedload(Post.user))
            .order_by(desc(Post.date))
            .offset(offset)
            .limit(limit)
            .all()
        )
        return posts if posts else None
    finally:
        db.close()


async def find_posts_by_user_id(_user_id: str) -> Optional[List[Post]]:
    """특정 사용자의 게시글 목록"""
    db = SessionLocal()
    try:
        posts = (
            db.query(Post)
            .filter_by(user_id=_user_id)
            .order_by(desc(Post.date))
            .all()
        )
        return posts if posts else None
    finally:
        db.close()


async def update_post(_post_id: int, _title: str, _contents: str) -> None:
    """게시글 수정"""
    db = SessionLocal()
    try:
        db.execute(
            update(Post)
            .where(Post.id == _post_id)
            .values(title=_title, contents=_contents)
        )
        db.commit()
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


async def delete_post(_post_id: int) -> None:
    """게시글 삭제"""
    db = SessionLocal()
    try:
        # 게시글에 달린 댓글도 함께 삭제
        db.execute(delete(Comment).where(Comment.post_id == _post_id))
        db.execute(delete(Post).where(Post.id == _post_id))
        db.commit()
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


async def search_posts(_keyword: str) -> Optional[List[Post]]:
    """게시글 검색 (제목, 내용)"""
    db = SessionLocal()
    try:
        posts = (
            db.query(Post)
            .options(joinedload(Post.user))
            .filter(
                or_(
                    Post.title.contains(_keyword),
                    Post.contents.contains(_keyword)
                )
            )
            .order_by(desc(Post.date))
            .all()
        )
        return posts if posts else None
    finally:
        db.close()


async def get_post_count() -> int:
    """전체 게시글 수"""
    db = SessionLocal()
    try:
        return db.query(Post).count()
    finally:
        db.close()


async def get_recent_posts(_limit: int = 5) -> Optional[List[Post]]:
    """최신 게시글"""
    db = SessionLocal()
    try:
        posts = (
            db.query(Post)
            .options(joinedload(Post.user))
            .order_by(desc(Post.date))
            .limit(_limit)
            .all()
        )
        return posts if posts else None
    finally:
        db.close()


async def get_popular_posts(_limit: int = 5) -> Optional[List[Post]]:
    """인기 게시글 (댓글 수 기준)"""
    db = SessionLocal()
    try:
        posts = (
            db.query(Post)
            .options(joinedload(Post.user))
            .outerjoin(Comment)
            .group_by(Post.id)
            .order_by(desc(func.count(Comment.id)), desc(Post.date))
            .limit(_limit)
            .all()
        )
        return posts if posts else None
    finally:
        db.close()


# =============================================================================
# 댓글 관련 함수
# =============================================================================

async def save_comment(_contents: str, _user_id: str, _post_id: int) -> None:
    """댓글 작성"""
    db = SessionLocal()
    try:
        comment = Comment(
            contents=_contents,
            user_id=_user_id,
            post_id=_post_id,
            date=datetime.now()
        )
        db.add(comment)
        db.commit()
        db.refresh(comment)
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


async def find_comment_by_id(_id: int) -> Optional[Comment]:
    """ID로 댓글 조회"""
    db = SessionLocal()
    try:
        return db.query(Comment).options(joinedload(Comment.user)).filter_by(id=_id).first()
    finally:
        db.close()


async def find_comments_by_post_id(_post_id: int) -> Optional[List[Comment]]:
    """특정 게시글의 댓글 목록 (작성 순서대로)"""
    db = SessionLocal()
    try:
        comments = (
            db.query(Comment)
            .options(joinedload(Comment.user))
            .filter_by(post_id=_post_id)
            .order_by(asc(Comment.date))
            .all()
        )
        return comments if comments else None
    finally:
        db.close()


async def find_comments_by_user_id(_user_id: str) -> Optional[List[Comment]]:
    """특정 사용자의 댓글 목록"""
    db = SessionLocal()
    try:
        comments = (
            db.query(Comment)
            .options(joinedload(Comment.post))
            .filter_by(user_id=_user_id)
            .order_by(desc(Comment.date))
            .all()
        )
        return comments if comments else None
    finally:
        db.close()


async def update_comment(_comment_id: int, _contents: str) -> None:
    """댓글 수정"""
    db = SessionLocal()
    try:
        db.execute(
            update(Comment)
            .where(Comment.id == _comment_id)
            .values(contents=_contents)
        )
        db.commit()
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


async def delete_comment(_comment_id: int) -> None:
    """댓글 삭제"""
    db = SessionLocal()
    try:
        db.execute(delete(Comment).where(Comment.id == _comment_id))
        db.commit()
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


async def get_comment_count_by_post_id(_post_id: int) -> int:
    """특정 게시글의 댓글 수"""
    db = SessionLocal()
    try:
        return db.query(Comment).filter_by(post_id=_post_id).count()
    finally:
        db.close()


# =============================================================================
# 통계 및 부가 기능
# =============================================================================

async def get_user_post_count(_user_id: str) -> int:
    """특정 사용자의 게시글 수"""
    db = SessionLocal()
    try:
        return db.query(Post).filter_by(user_id=_user_id).count()
    finally:
        db.close()


async def get_user_comment_count(_user_id: str) -> int:
    """특정 사용자의 댓글 수"""
    db = SessionLocal()
    try:
        return db.query(Comment).filter_by(user_id=_user_id).count()
    finally:
        db.close()


async def get_posts_with_comment_count(page: int = 1, limit: int = 10) -> Optional[List[dict]]:
    """게시글 목록과 댓글 수를 함께 조회"""
    db = SessionLocal()
    try:
        offset = (page - 1) * limit
        result = (
            db.query(
                Post,
                func.count(Comment.id).label('comment_count')
            )
            .options(joinedload(Post.user))
            .outerjoin(Comment)
            .group_by(Post.id)
            .order_by(desc(Post.date))
            .offset(offset)
            .limit(limit)
            .all()
        )

        if not result:
            return None

        posts_with_count = []
        for post, comment_count in result:
            posts_with_count.append({
                'post': post,
                'comment_count': comment_count
            })

        return posts_with_count
    finally:
        db.close()