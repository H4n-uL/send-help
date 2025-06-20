from typing import List, Optional
from fastapi import HTTPException

from dto import CreateCommentRequest, UpdateCommentRequest, CommentResponse
from db.base import (
    save_comment, find_comment_by_id, find_comments_by_post_id,
    find_comments_by_user_id, update_comment, delete_comment,
    find_post_by_id, exist_user_by_id
)

class CommentService:
    @staticmethod
    async def create_comment(request: CreateCommentRequest, user_id: str):
        """댓글 작성"""
        # 사용자 존재 확인
        if not await exist_user_by_id(user_id):
            raise HTTPException(status_code=404, detail="User not found")

        # 게시글 존재 확인
        post = await find_post_by_id(request.post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")

        await save_comment(request.contents, user_id, request.post_id)
        return {"message": "Comment created successfully"}

    @staticmethod
    async def get_comment(comment_id: int) -> CommentResponse:
        """댓글 상세 조회"""
        comment = await find_comment_by_id(comment_id)
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")

        return CommentResponse(
            id=comment.id,
            contents=comment.contents,
            date=comment.date,
            user_id=comment.user_id,
            username=comment.user.userid,
            post_id=comment.post_id
        )

    @staticmethod
    async def get_comments_by_post(post_id: int) -> List[CommentResponse]:
        """특정 게시글의 댓글 목록"""
        # 게시글 존재 확인
        post = await find_post_by_id(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")

        comments = await find_comments_by_post_id(post_id)
        if not comments:
            return []

        comment_responses = []
        for comment in comments:
            comment_responses.append(CommentResponse(
                id=comment.id,
                contents=comment.contents,
                date=comment.date,
                user_id=comment.user_id,
                username=comment.user.userid,
                post_id=comment.post_id
            ))

        return comment_responses

    @staticmethod
    async def get_comments_by_user(user_id: str) -> List[CommentResponse]:
        """특정 사용자의 댓글 목록"""
        # 사용자 존재 확인
        if not await exist_user_by_id(user_id):
            raise HTTPException(status_code=404, detail="User not found")

        comments = await find_comments_by_user_id(user_id)
        if not comments:
            return []

        comment_responses = []
        for comment in comments:
            comment_responses.append(CommentResponse(
                id=comment.id,
                contents=comment.contents,
                date=comment.date,
                user_id=comment.user_id,
                username=comment.user.userid,
                post_id=comment.post_id,
                post_title=comment.post.title if comment.post else None
            ))

        return comment_responses

    @staticmethod
    async def update_comment(comment_id: int, request: UpdateCommentRequest, user_id: str):
        """댓글 수정"""
        # 댓글 존재 및 권한 확인
        comment = await find_comment_by_id(comment_id)
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")

        if comment.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to update this comment")

        await update_comment(comment_id, request.contents)
        return {"message": "Comment updated successfully"}

    @staticmethod
    async def delete_comment(comment_id: int, user_id: str):
        """댓글 삭제"""
        # 댓글 존재 및 권한 확인
        comment = await find_comment_by_id(comment_id)
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")

        if comment.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this comment")

        await delete_comment(comment_id)
        return {"message": "Comment deleted successfully"}

    @staticmethod
    async def delete_comment_by_admin(comment_id: int, admin_user_id: str):
        """관리자 댓글 삭제"""
        # 여기서는 간단하게 admin 체크를 생략하고, 실제로는 사용자 권한 체크가 필요
        comment = await find_comment_by_id(comment_id)
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")

        await delete_comment(comment_id)
        return {"message": "Comment deleted by admin"}