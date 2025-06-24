# schemas/__init__.py
from .user import UserCreate, UserLogin
from .post import PostCreate, PostUpdate, PostResponse
from .comment import CommentCreate, CommentResponse
from .upload import UploadResponse

__all__ = [
    "UserCreate", "UserLogin",
    "PostCreate", "PostUpdate", "PostResponse", 
    "CommentCreate", "CommentResponse",
    "UploadResponse"
]
