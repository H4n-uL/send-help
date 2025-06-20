from typing import List
from fastapi import HTTPException

from dto import CreatePostRequest, UpdatePostRequest, PostResponse, PostListResponse
from db.base import (
    save_post, find_post_by_id, find_all_posts, find_posts_by_user_id,
    update_post, delete_post, search_posts, get_post_count,
    get_recent_posts, get_popular_posts, get_posts_with_comment_count,
    get_comment_count_by_post_id, exist_user_by_id
)

class PostService:
    @staticmethod
    async def create_post(request: CreatePostRequest, user_id: str):
        """게시글 작성"""
        # 사용자 존재 확인
        if not await exist_user_by_id(user_id):
            raise HTTPException(status_code=404, detail="User not found")

        await save_post(request.title, request.contents, user_id)
        return {"message": "Post created successfully"}

    @staticmethod
    async def get_post(post_id: int) -> PostResponse:
        """게시글 상세 조회"""
        post = await find_post_by_id(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")

        # 댓글 수 조회
        comment_count = await get_comment_count_by_post_id(post_id)

        return PostResponse(
            id=post.id,
            title=post.title,
            contents=post.contents,
            date=post.date,
            user_id=post.user_id,
            username=post.user.userid,
            comment_count=comment_count
        )

    @staticmethod
    async def get_posts(page: int = 1, limit: int = 10) -> PostListResponse:
        """게시글 목록 조회 (페이징)"""
        if page < 1 or limit < 1:
            raise HTTPException(status_code=400, detail="Invalid page or limit")

        posts_with_count = await get_posts_with_comment_count(page, limit)
        if not posts_with_count:
            return PostListResponse(posts=[], total=0, page=page, limit=limit)

        # 전체 게시글 수
        total = await get_post_count()

        post_responses = []
        for item in posts_with_count:
            post = item['post']
            comment_count = item['comment_count']

            post_responses.append(PostResponse(
                id=post.id,
                title=post.title,
                contents=post.contents,
                date=post.date,
                user_id=post.user_id,
                username=post.user.userid,
                comment_count=comment_count
            ))

        return PostListResponse(
            posts=post_responses,
            total=total,
            page=page,
            limit=limit
        )

    @staticmethod
    async def get_user_posts(user_id: str) -> List[PostResponse]:
        """특정 사용자의 게시글 목록"""
        posts = await find_posts_by_user_id(user_id)
        if not posts:
            return []

        post_responses = []
        for post in posts:
            comment_count = await get_comment_count_by_post_id(post.id)
            post_responses.append(PostResponse(
                id=post.id,
                title=post.title,
                contents=post.contents,
                date=post.date,
                user_id=post.user_id,
                username=post.user.userid,
                comment_count=comment_count
            ))

        return post_responses

    @staticmethod
    async def update_post(post_id: int, request: UpdatePostRequest, user_id: str):
        """게시글 수정"""
        # 게시글 존재 및 권한 확인
        post = await find_post_by_id(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")

        if post.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to update this post")

        await update_post(post_id, request.title, request.contents)
        return {"message": "Post updated successfully"}

    @staticmethod
    async def delete_post(post_id: int, user_id: str):
        """게시글 삭제"""
        # 게시글 존재 및 권한 확인
        post = await find_post_by_id(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")

        if post.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this post")

        await delete_post(post_id)
        return {"message": "Post deleted successfully"}

    @staticmethod
    async def search_posts(keyword: str) -> List[PostResponse]:
        """게시글 검색"""
        if not keyword.strip():
            raise HTTPException(status_code=400, detail="Search keyword cannot be empty")

        posts = await search_posts(keyword)
        if not posts:
            return []

        post_responses = []
        for post in posts:
            comment_count = await get_comment_count_by_post_id(post.id)
            post_responses.append(PostResponse(
                id=post.id,
                title=post.title,
                contents=post.contents,
                date=post.date,
                user_id=post.user_id,
                username=post.user.userid,
                comment_count=comment_count
            ))

        return post_responses

    @staticmethod
    async def get_recent_posts(limit: int = 5) -> List[PostResponse]:
        """최신 게시글"""
        posts = await get_recent_posts(limit)
        if not posts:
            return []

        post_responses = []
        for post in posts:
            comment_count = await get_comment_count_by_post_id(post.id)
            post_responses.append(PostResponse(
                id=post.id,
                title=post.title,
                contents=post.contents,
                date=post.date,
                user_id=post.user_id,
                username=post.user.userid,
                comment_count=comment_count
            ))

        return post_responses

    @staticmethod
    async def get_popular_posts(limit: int = 5) -> List[PostResponse]:
        """인기 게시글"""
        posts = await get_popular_posts(limit)
        if not posts:
            return []

        post_responses = []
        for post in posts:
            comment_count = await get_comment_count_by_post_id(post.id)
            post_responses.append(PostResponse(
                id=post.id,
                title=post.title,
                contents=post.contents,
                date=post.date,
                user_id=post.user_id,
                username=post.user.userid,
                comment_count=comment_count
            ))

        return post_responses