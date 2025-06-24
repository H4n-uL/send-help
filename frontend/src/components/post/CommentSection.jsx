// components/post/CommentSection.jsx
import React, { useState, useEffect } from 'react';
import { MessageCircle, Trash2, Send, User, Calendar } from 'lucide-react';
import { commentAPI } from '../../services/api';
import { formatRelativeTime, formatFullDateTime } from '../../utils/dateUtils';

// 댓글 아이템 컴포넌트
const CommentItem = ({ comment, onDelete, currentUser }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('정말 이 댓글을 삭제하시겠습니까?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(comment.id);
    } catch (error) {
      alert('댓글 삭제에 실패했습니다.');
    }
    setIsDeleting(false);
  };

  return (
    <div className="border-b border-gray-200 py-4 last:border-b-0">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm">
            <User className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-gray-800">{comment.author_username}</span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            <span title={formatFullDateTime(comment.created_at)}>
              {formatRelativeTime(comment.created_at)}
            </span>
          </div>
        </div>
        
        {comment.author_id === currentUser && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 p-1 rounded"
            title="댓글 삭제"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <div className="text-gray-700 whitespace-pre-wrap leading-relaxed pl-6">
        {comment.content}
      </div>
    </div>
  );
};

// 댓글 작성 폼 컴포넌트
const CommentForm = ({ onSubmit, currentUser }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ content: content.trim() });
      setContent('');
    } catch (error) {
      alert('댓글 작성에 실패했습니다.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 p-4 bg-gray-50 rounded-lg">
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          댓글 작성
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="댓글을 입력하세요..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          maxLength={1000}
        />
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-500">{content.length}/1000</span>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="flex items-center space-x-2 text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors"
        >
          <Send className="w-4 h-4" />
          <span>{loading ? '작성중...' : '댓글 작성'}</span>
        </button>
      </div>
    </form>
  );
};

// 메인 댓글 섹션 컴포넌트
const CommentSection = ({ postId, currentUser }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const commentsData = await commentAPI.getComments(postId);
      setComments(commentsData);
    } catch (error) {
      console.error('댓글 로드 실패:', error);
      setError('댓글을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async (commentData) => {
    try {
      await commentAPI.createComment(postId, commentData);
      await loadComments(); // 댓글 목록 새로고침
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await commentAPI.deleteComment(commentId);
      await loadComments(); // 댓글 목록 새로고침
    } catch (error) {
      throw error;
    }
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-sm">
      {/* 댓글 섹션 헤더 */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
          <MessageCircle className="w-5 h-5" />
          <span>댓글 ({comments.length})</span>
        </h2>
      </div>

      <div className="px-6 py-4">
        {/* 댓글 목록 */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <div className="text-gray-600 text-sm">댓글을 불러오는 중...</div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-600 mb-2">⚠️</div>
            <div className="text-gray-600 text-sm">{error}</div>
            <button 
              onClick={loadComments}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
            >
              다시 시도
            </button>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-600 mb-1">
              아직 댓글이 없습니다
            </h3>
            <p className="text-gray-500 text-sm">
              첫 번째 댓글을 남겨보세요!
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {comments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onDelete={handleDeleteComment}
                currentUser={currentUser}
              />
            ))}
          </div>
        )}

        {/* 댓글 작성 폼 */}
        <CommentForm 
          onSubmit={handleCommentSubmit} 
          currentUser={currentUser}
        />
      </div>
    </div>
  );
};

export default CommentSection;