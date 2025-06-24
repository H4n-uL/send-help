# utils/file_utils.py
import os
import shutil
import uuid
from fastapi import HTTPException, UploadFile
from ..config import settings

def get_file_type(filename: str) -> str:
    """파일 확장자를 기반으로 파일 타입 결정"""
    extension = filename.lower().split('.')[-1] if '.' in filename else ''
    
    image_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg']
    video_extensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv']
    audio_extensions = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a']
    
    if extension in image_extensions:
        return 'image'
    elif extension in video_extensions:
        return 'video'
    elif extension in audio_extensions:
        return 'audio'
    else:
        return 'file'

def save_upload_file(file: UploadFile) -> dict:
    """업로드된 파일을 저장하고 정보 반환"""
    try:
        # 업로드 디렉터리 생성
        if not os.path.exists(settings.UPLOAD_DIR):
            os.makedirs(settings.UPLOAD_DIR)
        
        # 파일명 생성 (중복 방지)
        file_ext = file.filename.split('.')[-1] if '.' in file.filename else ''
        unique_filename = f"{uuid.uuid4()}.{file_ext}" if file_ext else str(uuid.uuid4())
        file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
        
        # 파일 저장
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 파일 크기 계산
        file_size = os.path.getsize(file_path)
        
        return {
            "url": f"/uploads/{unique_filename}",
            "filename": file.filename,
            "size": file_size,
            "type": get_file_type(file.filename),
            "mime_type": file.content_type or "application/octet-stream"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

def validate_file_size(file: UploadFile) -> bool:
    """파일 크기 검증"""
    file.file.seek(0, 2)  # 파일 끝으로 이동
    file_size = file.file.tell()  # 현재 위치 = 파일 크기
    file.file.seek(0)  # 파일 시작으로 돌아가기
    
    return file_size <= settings.MAX_FILE_SIZE
