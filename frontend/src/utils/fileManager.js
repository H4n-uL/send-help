// utils/fileManager.js

/**
 * 파일 임시 관리 유틸리티
 * - 글 작성 중에는 파일을 임시로만 저장
 * - 글 저장할 때 실제 업로드
 * - 취소하면 임시 파일 정리
 */

class FileManager {
  constructor() {
    this.tempFiles = new Map(); // 임시 파일들 저장
    this.tempUrls = new Map();  // 임시 URL들 저장
  }

  /**
   * 파일을 임시로 추가 (실제 업로드는 하지 않음)
   */
  addTempFile(file) {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 브라우저에서 미리보기용 URL 생성
    const tempUrl = URL.createObjectURL(file);
    
    this.tempFiles.set(tempId, file);
    this.tempUrls.set(tempId, tempUrl);
    
    return {
      tempId,
      tempUrl,
      filename: file.name,
      size: file.size,
      type: this.getFileType(file),
      mime_type: file.type
    };
  }

  /**
   * 임시 파일 가져오기
   */
  getTempFile(tempId) {
    return this.tempFiles.get(tempId);
  }

  /**
   * 임시 URL 가져오기
   */
  getTempUrl(tempId) {
    return this.tempUrls.get(tempId);
  }

  /**
   * 모든 임시 파일들을 실제로 업로드
   */
  async uploadAllTempFiles(uploadAPI) {
    const uploadPromises = [];
    const urlMapping = new Map(); // tempUrl -> realUrl 매핑
    
    for (const [tempId, file] of this.tempFiles) {
      const uploadPromise = uploadAPI.uploadFile(file)
        .then(result => {
          const tempUrl = this.tempUrls.get(tempId);
          urlMapping.set(tempUrl, result.url);
          return { tempId, tempUrl, result };
        })
        .catch(error => {
          console.error(`Failed to upload file ${file.name}:`, error);
          throw error;
        });
      
      uploadPromises.push(uploadPromise);
    }
    
    try {
      await Promise.all(uploadPromises);
      return urlMapping;
    } catch (error) {
      throw new Error('파일 업로드 중 오류가 발생했습니다.');
    }
  }

  /**
   * 컨텐츠의 임시 URL들을 실제 URL로 교체
   */
  replaceTempUrlsInContent(content, urlMapping) {
    let updatedContent = content;
    
    for (const [tempUrl, realUrl] of urlMapping) {
      // 이미지 src 교체
      updatedContent = updatedContent.replace(
        new RegExp(`src="${tempUrl}"`, 'g'),
        `src="${realUrl}"`
      );
      
      // 비디오 source src 교체
      updatedContent = updatedContent.replace(
        new RegExp(`<source src="${tempUrl}"`, 'g'),
        `<source src="${realUrl}"`
      );
      
      // 오디오 source src 교체  
      updatedContent = updatedContent.replace(
        new RegExp(`<source src="${tempUrl}"`, 'g'),
        `<source src="${realUrl}"`
      );
      
      // 다운로드 링크 href 교체
      updatedContent = updatedContent.replace(
        new RegExp(`href="${tempUrl}"`, 'g'),
        `href="${realUrl}"`
      );
    }
    
    return updatedContent;
  }

  /**
   * 모든 임시 파일과 URL 정리
   */
  cleanup() {
    // 브라우저 메모리에서 임시 URL들 해제
    for (const url of this.tempUrls.values()) {
      URL.revokeObjectURL(url);
    }
    
    this.tempFiles.clear();
    this.tempUrls.clear();
  }

  /**
   * 파일 타입 확인
   */
  getFileType(file) {
    const extension = file.name.toLowerCase().split('.').pop();
    
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
    const audioExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'];
    
    if (imageExtensions.includes(extension)) {
      return 'image';
    } else if (videoExtensions.includes(extension)) {
      return 'video';
    } else if (audioExtensions.includes(extension)) {
      return 'audio';
    } else {
      return 'file';
    }
  }

  /**
   * 임시 파일 개수 확인
   */
  getTempFileCount() {
    return this.tempFiles.size;
  }

  /**
   * 임시 파일들의 총 크기 계산
   */
  getTotalSize() {
    let totalSize = 0;
    for (const file of this.tempFiles.values()) {
      totalSize += file.size;
    }
    return totalSize;
  }
}

// 글로벌 인스턴스 (싱글톤)
export const fileManager = new FileManager();

/**
 * 파일 크기 포맷팅
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default FileManager;
