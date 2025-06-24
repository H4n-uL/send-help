# schemas/upload.py
from pydantic import BaseModel

class UploadResponse(BaseModel):
    url: str
    filename: str
    size: int
    type: str
    mime_type: str
