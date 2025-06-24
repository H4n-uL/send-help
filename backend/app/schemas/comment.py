# schemas/comment.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

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
