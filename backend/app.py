from fastapi import FastAPI, HTTPException, Cookie, Response, Query
from typing import Optional, List

from service.auth import AuthService
from service.post import PostService
from service.comment import CommentService
from dto import (
    SignUpRequest, SignInRequest,
    CreatePostRequest, UpdatePostRequest, PostResponse, PostListResponse,
    CreateCommentRequest, UpdateCommentRequest, CommentResponse
)

app = FastAPI()

# 현재 사용자 정보 가져오기 (세션 기반)
async def get_current_user(session_id: Optional[str] = Cookie(None)):
    if not session_id:
        raise HTTPException(status_code=401, detail="No session")

    return await AuthService.validate_session(session_id)

# =============================================================================
# 인증 관련 API
# =============================================================================

@app.post("/auth/signup")
async def signup(request: SignUpRequest):
    """회원가입"""
    await AuthService.signup(request)
    return {"message": "User created successfully"}

@app.post("/auth/login")
async def login(request: SignInRequest, response: Response):
    """로그인"""
    session_id = await AuthService.login(request)

    # 쿠키에 세션 ID 설정
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,  # XSS 방지
        secure=False,   # 개발환경에서는 False, 운영에서는 True
        samesite="lax", # CSRF 방지
        max_age=1800    # 30분 (초 단위)
    )

    return {"message": "Login successful"}

@app.post("/auth/logout")
async def logout(response: Response, session_id: Optional[str] = Cookie(None)):
    """로그아웃"""
    if session_id:
        await AuthService.logout(session_id)

    # 쿠키 삭제
    response.delete_cookie(key="session_id")
    return {"message": "Logout successful"}

@app.get("/auth/me")
async def get_current_user_info(session_id: Optional[str] = Cookie(None)):
    """현재 로그인된 사용자 정보"""
    user_id = await get_current_user(session_id)
    return {"user_id": user_id, "message": "User authenticated"}

# =============================================================================
# 게시글 관련 API
# =============================================================================

@app.post("/posts", response_model=dict)
async def create_post(
    request: CreatePostRequest,
    session_id: Optional[str] = Cookie(None)
):
    """게시글 작성"""
    user_id = await get_current_user(session_id)
    return await PostService.create_post(request, user_id)

@app.get("/posts/{post_id}", response_model=PostResponse)
async def get_post(post_id: int):
    """게시글 상세 조회"""
    return await PostService.get_post(post_id)

@app.get("/posts", response_model=PostListResponse)
async def get_posts(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100)
):
    """게시글 목록 조회"""
    return await PostService.get_posts(page, limit)

@app.get("/posts/user/{user_id}", response_model=List[PostResponse])
async def get_user_posts(user_id: str):
    """특정 사용자의 게시글 목록"""
    return await PostService.get_user_posts(user_id)

@app.get("/posts/search", response_model=List[PostResponse])
async def search_posts(q: str = Query(..., min_length=1)):
    """게시글 검색"""
    return await PostService.search_posts(q)

@app.get("/posts/recent", response_model=List[PostResponse])
async def get_recent_posts(limit: int = Query(5, ge=1, le=20)):
    """최신 게시글"""
    return await PostService.get_recent_posts(limit)

@app.get("/posts/popular", response_model=List[PostResponse])
async def get_popular_posts(limit: int = Query(5, ge=1, le=20)):
    """인기 게시글"""
    return await PostService.get_popular_posts(limit)

@app.put("/posts/{post_id}", response_model=dict)
async def update_post(
    post_id: int,
    request: UpdatePostRequest,
    session_id: Optional[str] = Cookie(None)
):
    """게시글 수정"""
    user_id = await get_current_user(session_id)
    return await PostService.update_post(post_id, request, user_id)

@app.delete("/posts/{post_id}", response_model=dict)
async def delete_post(
    post_id: int,
    session_id: Optional[str] = Cookie(None)
):
    """게시글 삭제"""
    user_id = await get_current_user(session_id)
    return await PostService.delete_post(post_id, user_id)

# =============================================================================
# 댓글 관련 API
# =============================================================================

@app.post("/comments", response_model=dict)
async def create_comment(
    request: CreateCommentRequest,
    session_id: Optional[str] = Cookie(None)
):
    """댓글 작성"""
    user_id = await get_current_user(session_id)
    return await CommentService.create_comment(request, user_id)

@app.get("/comments/{comment_id}", response_model=CommentResponse)
async def get_comment(comment_id: int):
    """댓글 상세 조회"""
    return await CommentService.get_comment(comment_id)

@app.get("/comments/post/{post_id}", response_model=List[CommentResponse])
async def get_comments_by_post(post_id: int):
    """특정 게시글의 댓글 목록"""
    return await CommentService.get_comments_by_post(post_id)

@app.get("/comments/user/{user_id}", response_model=List[CommentResponse])
async def get_comments_by_user(user_id: str):
    """특정 사용자의 댓글 목록"""
    return await CommentService.get_comments_by_user(user_id)

@app.put("/comments/{comment_id}", response_model=dict)
async def update_comment(
    comment_id: int,
    request: UpdateCommentRequest,
    session_id: Optional[str] = Cookie(None)
):
    """댓글 수정"""
    user_id = await get_current_user(session_id)
    return await CommentService.update_comment(comment_id, request, user_id)

@app.delete("/comments/{comment_id}", response_model=dict)
async def delete_comment(
    comment_id: int,
    session_id: Optional[str] = Cookie(None)
):
    """댓글 삭제"""
    user_id = await get_current_user(session_id)
    return await CommentService.delete_comment(comment_id, user_id)

# =============================================================================
# 통계 및 기타 API
# =============================================================================

@app.get("/stats/dashboard")
async def get_dashboard_stats():
    """대시보드 통계"""
    recent_posts = await PostService.get_recent_posts(5)
    popular_posts = await PostService.get_popular_posts(5)

    return {
        "recent_posts": recent_posts,
        "popular_posts": popular_posts
    }

@app.get("/stats/user/{user_id}")
async def get_user_stats(user_id: str):
    """사용자 통계"""
    user_posts = await PostService.get_user_posts(user_id)
    user_comments = await CommentService.get_comments_by_user(user_id)

    return {
        "post_count": len(user_posts),
        "comment_count": len(user_comments),
        "recent_posts": user_posts[:5],
        "recent_comments": user_comments[:5]
    }