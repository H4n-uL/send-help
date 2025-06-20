from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class SignUpRequest(BaseModel):
    id: str
    name: str
    password: str
    balance: int

class SignInRequest(BaseModel):
    id: str
    password: str

# =============================================================================
# Post DTO
# =============================================================================

class CreatePostRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="게시글 제목")
    contents: str = Field(..., min_length=1, description="게시글 내용")

class UpdatePostRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="게시글 제목")
    contents: str = Field(..., min_length=1, description="게시글 내용")

class PostResponse(BaseModel):
    id: int
    title: str
    contents: str
    date: datetime
    user_id: str
    username: str
    comment_count: int = 0

    class Config:
        from_attributes = True

class PostListResponse(BaseModel):
    posts: List[PostResponse]
    total: int
    page: int
    limit: int

    @property
    def total_pages(self) -> int:
        return (self.total + self.limit - 1) // self.limit

# =============================================================================
# Comment DTO
# =============================================================================

class CreateCommentRequest(BaseModel):
    contents: str = Field(..., min_length=1, description="댓글 내용")
    post_id: int = Field(..., description="게시글 ID")

class UpdateCommentRequest(BaseModel):
    contents: str = Field(..., min_length=1, description="댓글 내용")

class CommentResponse(BaseModel):
    id: int
    contents: str
    date: datetime
    user_id: str
    username: str
    post_id: int
    post_title: Optional[str] = None  # 사용자 댓글 목록에서 사용

    class Config:
        from_attributes = True