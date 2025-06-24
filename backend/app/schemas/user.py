# schemas/user.py
from pydantic import BaseModel

class UserCreate(BaseModel):
    id: str
    username: str
    password: str
    
    class Config:
        str_strip_whitespace = True

class UserLogin(BaseModel):
    id: str
    password: str
    
    class Config:
        str_strip_whitespace = True
