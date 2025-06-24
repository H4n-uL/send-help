# api/__init__.py
from .auth import router as auth_router
from .posts import router as posts_router  
from .comments import router as comments_router
from .upload import router as upload_router

__all__ = ["auth_router", "posts_router", "comments_router", "upload_router"]
