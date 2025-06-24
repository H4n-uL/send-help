// components/post/PostForm.jsx - 개선된 버전
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, X, Upload, AlertTriangle } from 'lucide-react';
import TiptapEditor from '../editor/TiptapEditor';
import { fileManager } from '../../utils/fileManager';
import { uploadAPI } from '../../services/api';

const PostForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [errors, setErrors] = useState({});

  // 컴포넌트 언마운트 시 임시 파일 정리
  useEffect(() => {
    return () => {
      // 저장하지 않고 나가는 경우 임시 파일 정리
      if (!loading) {
        fileManager.cleanup();
      }
    };
  }, [loading]);

  // 유효성 검사
  const validateForm = () => {
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = '제목을 입력해주세요';
    } else if (title.trim().length > 100) {
      newErrors.title = '제목은 100자 이내로 입력해주세요';
    }

    if (!content.trim()) {
      newErrors.content = '내용을 입력해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setUploadProgress('파일 업로드 중...');
    
    try {
      let finalContent = content;
      
      // 임시 파일이 있는 경우 실제 업로드 진행
      if (fileManager.getTempFileCount() > 0) {
        setUploadProgress(`파일 ${fileManager.getTempFileCount()}개 업로드 중...`);
        
        try {
          // 모든 임시 파일을 실제로 업로드
          const urlMapping = await fileManager.uploadAllTempFiles(uploadAPI);
          
          // 컨텐츠의 임시 URL들을 실제 URL로 교체
          finalContent = fileManager.replaceTempUrlsInContent(content, urlMapping);
          
          setUploadProgress('게시글 저장 중...');
        } catch (uploadError) {
          console.error('파일 업로드 실패:', uploadError);
          alert('파일 업로드에 실패했습니다. 다시 시도해주세요.');
          setLoading(false);
          setUploadProgress(null);
          return;
        }
      } else {
        setUploadProgress('게시글 저장 중...');
      }
      
      // 게시글 저장
      await onSubmit({ 
        title: title.trim(), 
        content: finalContent 
      });
      
      // 성공 시 임시 파일 정리
      fileManager.cleanup();
      
    } catch (error) {
      console.error('게시글 저장 실패:', error);
      alert('게시글 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  const handleCancel = () => {
    const hasContent = title.trim() || content.trim();
    const hasFiles = fileManager.getTempFileCount() > 0;
    
    if (hasContent || hasFiles) {
      const message = hasFiles 
        ? `작성 중인 내용과 임시 파일 ${fileManager.getTempFileCount()}개가 삭제됩니다. 정말 취소하시겠습니까?`
        : '작성 중인 내용이 있습니다. 정말 취소하시겠습니까?';
        
      if (confirm(message)) {
        fileManager.cleanup(); // 임시 파일 정리
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  const handleTitleChange = (e) => {
    const value = e.target.value;
    setTitle(value);
    
    // 실시간 유효성 검사
    if (errors.title && value.trim()) {
      setErrors(prev => ({ ...prev, title: null }));
    }
  };

  const handleContentChange = (content) => {
    setContent(content);
    
    // 실시간 유효성 검사
    if (errors.content && content.trim()) {
      setErrors(prev => ({ ...prev, content: null }));
    }
  };

  return (
    <div className="space-y-4">
      {/* 상단 네비게이션 */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleCancel}
          disabled={loading}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>목록으로</span>
        </button>
        
        <div className="text-lg font-semibold text-gray-800">
          {initialData ? '게시글 수정' : '게시글 작성'}
        </div>
        
        <div className="w-20"></div> {/* 균형을 위한 공간 */}
      </div>

      {/* 업로드 진행 상태 */}
      {uploadProgress && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-blue-800 font-medium">{uploadProgress}</span>
          </div>
        </div>
      )}

      {/* 게시글 작성 폼 */}
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm">
        {/* 헤더 */}
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-800">
            {initialData ? '게시글 수정' : '새 게시글 작성'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            이미지나 파일을 드래그하여 본문에 직접 삽입할 수 있습니다.
          </p>
        </div>

        {/* 폼 내용 */}
        <div className="p-6 space-y-6">
          {/* 제목 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              disabled={loading}
              placeholder="제목을 입력하세요"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              maxLength={100}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
            <div className="mt-1 text-xs text-gray-500 text-right">
              {title.length}/100
            </div>
          </div>
          
          {/* 내용 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              내용 <span className="text-red-500">*</span>
            </label>
            <div className={`${errors.content ? 'border-red-500 border rounded-lg' : ''}`}>
              <TiptapEditor
                content={content}
                onChange={handleContentChange}
                placeholder="내용을 입력하세요. 이미지나 파일을 드래그해서 첨부할 수 있습니다."
                minHeight={400}
              />
            </div>
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content}</p>
            )}
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-lg">
          <div className="flex justify-between items-center">
            <div/>
            
            {/* 버튼들 */}
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center space-x-2">
                  <X className="w-4 h-4" />
                  <span>취소</span>
                </div>
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={loading || !title.trim() || !content.trim()}
                className="flex items-center space-x-2 px-6 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>
                  {loading ? '저장중...' : '업로드'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 작성 가이드 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center space-x-2">
          <span>💡</span>
          <span>작성 팁</span>
        </h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 이미지나 파일을 드래그하여 본문에 직접 삽입할 수 있습니다</li>
          <li>• <strong>파일은 글 저장 버튼을 누를 때 실제로 업로드됩니다</strong></li>
          <li>• 작성을 취소하면 임시 파일들은 자동으로 삭제됩니다</li>
          <li>• 툴바를 사용하여 텍스트 서식을 지정할 수 있습니다</li>
          <li>• Ctrl+B (굵게), Ctrl+I (기울임) 등의 단축키를 지원합니다</li>
        </ul>
      </div>
    </div>
  );
};

export default PostForm;