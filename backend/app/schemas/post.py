# schemas/post.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

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
