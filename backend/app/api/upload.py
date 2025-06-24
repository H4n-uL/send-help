# api/upload.py
from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from typing import List
import logging

from ..schemas import UploadResponse
from ..core.deps import get_current_user
from ..utils.file_utils import save_upload_file, validate_file_size
from ..config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/upload", tags=["upload"])

@router.post("", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    """단일 파일 업로드"""
    try:
        # 파일 크기 검증
        if not validate_file_size(file):
            raise HTTPException(status_code=413, detail="File too large")
        
        # 파일 저장
        result = save_upload_file(file)
        logger.info(f"File uploaded: {file.filename} by {current_user}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File upload error: {e}")
        raise HTTPException(status_code=500, detail="File upload failed")

@router.post("/multiple")
async def upload_multiple_files(
    files: List[UploadFile] = File(...),
    current_user: str = Depends(get_current_user)
):
    """다중 파일 업로드"""
    try:
        if len(files) > settings.MAX_FILES_PER_UPLOAD:
            raise HTTPException(status_code=400, detail="Too many files")
        
        results = []
        for file in files:
            try:
                # 파일 크기 검증
                if not validate_file_size(file):
                    results.append({"error": f"File too large: {file.filename}"})
                    continue
                
                result = save_upload_file(file)
                results.append(result)
                logger.info(f"File uploaded: {file.filename} by {current_user}")
                
            except Exception as e:
                logger.error(f"File upload failed: {file.filename}, error: {e}")
                results.append({"error": f"Failed to upload {file.filename}: {str(e)}"})
        
        return {"files": results}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Multiple file upload error: {e}")
        raise HTTPException(status_code=500, detail="Multiple file upload failed")
