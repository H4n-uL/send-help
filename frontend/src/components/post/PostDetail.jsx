// components/post/PostDetail.jsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Calendar, Edit, Trash2, Eye } from 'lucide-react';
import { postAPI } from '../../services/api';
import { formatFullDateTime, formatRelativeTime } from '../../utils/dateUtils';
import CommentSection from './CommentSection';
import DOMPurify from 'dompurify';

const PostDetail = ({ postId, onBack, currentUser, onEdit }) => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadPostDetail();
  }, [postId]);

  const loadPostDetail = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await postAPI.getPost(postId);
      setPost(response);
    } catch (error) {
      console.error('게시글 로드 실패:', error);
      setError('게시글을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('정말 이 게시글을 삭제하시겠습니까?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await postAPI.deletePost(postId);
      alert('게시글이 삭제되었습니다.');
      onBack();
    } catch (error) {
      console.error('게시글 삭제 실패:', error);
      alert('게시글 삭제에 실패했습니다.');
    }
    setIsDeleting(false);
  };

  const handleEditPost = () => {
    if (onEdit) {
      onEdit(post);
    } else {
      alert('수정 기능은 준비 중입니다.');
    }
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={onBack}
            className="flex items-center space-x-1 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>목록으로</span>
          </button>
        </div>

        <div className="bg-white border border-gray-300 rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">게시글을 불러오는 중...</div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error || !post) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={onBack}
            className="flex items-center space-x-1 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>목록으로</span>
          </button>
        </div>

        <div className="bg-white border border-gray-300 rounded-lg p-8 text-center">
          <div className="text-red-600 mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            {error || '게시글을 찾을 수 없습니다'}
          </h3>
          <p className="text-gray-600 mb-4">
            게시글이 삭제되었거나 존재하지 않을 수 있습니다.
          </p>
          <button 
            onClick={onBack}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 상단 네비게이션 */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>목록으로</span>
        </button>
        
        <div className="text-sm text-gray-500">
          게시글 #{post.id}
        </div>
      </div>

      {/* 게시글 상세 내용 */}
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
        {/* 게시글 헤더 */}
        <div className="border-b border-gray-200 px-6 py-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold text-gray-800 leading-tight flex-1 pr-4">
              {post.title}
            </h1>
            
            {/* 작성자 액션 버튼 */}
            {post.author_id === currentUser && (
              <div className="flex space-x-2">
                <button
                  onClick={handleEditPost}
                  className="text-gray-500 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
                  title="수정"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={handleDeletePost}
                  disabled={isDeleting}
                  className="text-gray-500 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                  title="삭제"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* 게시글 메타 정보 */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span className="font-medium">{post.author_username}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span title={formatFullDateTime(post.created_at)}>
                {formatRelativeTime(post.created_at)}
              </span>
            </div>
            
            {post.view_count !== undefined && (
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>조회 {post.view_count}</span>
              </div>
            )}
          </div>
        </div>

        {/* 게시글 본문 */}
        <div className="px-6 py-8">
          <div 
            className="prose prose-lg max-w-none text-gray-800 leading-relaxed"
            dangerouslySetInnerHTML={{ 
              __html: DOMPurify.sanitize(post.content, {
                ADD_TAGS: ['video', 'audio', 'source'],
                ADD_ATTR: ['controls', 'style', 'src', 'type', 'download', 'href', 'class']
              })
            }}
            style={{
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }}
          />
        </div>
      </div>

      {/* 댓글 섹션 */}
      <CommentSection 
        postId={postId} 
        currentUser={currentUser}
      />
    </div>
  );
};

export default PostDetail;