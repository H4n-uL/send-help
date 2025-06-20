import React, { useState, useEffect } from 'react';
import { Search, MessageCircle, User, LogOut, Plus, Calendar, Trash2, ArrowLeft, Edit } from 'lucide-react';

const API_BASE = '/api';

// API 함수들
const api = {
  login: async (data) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include'
    });
    return response.json();
  },
  
  signup: async (data) => {
    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include'
    });
    return response.json();
  },
  
  logout: async () => {
    const response = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    return response.json();
  },
  
  getMe: async () => {
    const response = await fetch(`${API_BASE}/auth/me`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Not authenticated');
    return response.json();
  },
  
  getPosts: async (page = 1, limit = 10) => {
    const response = await fetch(`${API_BASE}/posts?page=${page}&limit=${limit}`);
    return response.json();
  },
  
  getPost: async (id) => {
    const response = await fetch(`${API_BASE}/posts/${id}`);
    return response.json();
  },
  
  createPost: async (data) => {
    const response = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include'
    });
    return response.json();
  },
  
  deletePost: async (id) => {
    const response = await fetch(`${API_BASE}/posts/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return response.json();
  },
  
  searchPosts: async (query) => {
    const response = await fetch(`${API_BASE}/posts/search?q=${encodeURIComponent(query)}`);
    return response.json();
  },

  // 댓글 관련 API
  getComments: async (postId) => {
    const response = await fetch(`${API_BASE}/comments/post/${postId}`);
    return response.json();
  },

  createComment: async (postId, data) => {
    const response = await fetch(`${API_BASE}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, post_id: postId }),
      credentials: 'include'
    });
    return response.json();
  },

  deleteComment: async (commentId) => {
    const response = await fetch(`${API_BASE}/comments/${commentId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return response.json();
  }
};

// 로그인 컴포넌트 (심플하게)
function LoginForm({ onLogin }) {
  const [formData, setFormData] = useState({ id: '', password: '', username: '' });
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignup) {
        await api.signup(formData);
        alert('회원가입 성공! 로그인해주세요.');
        setIsSignup(false);
      } else {
        await api.login(formData);
        onLogin();
      }
    } catch (error) {
      alert(`${isSignup ? '회원가입' : '로그인'} 실패`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-300 rounded p-8 w-full max-w-sm">
        <h2 className="text-xl font-bold text-center mb-6">
          {isSignup ? '회원가입' : '로그인'}
        </h2>
        
        <div className="space-y-4">
          <input
            type="text"
            placeholder="아이디"
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            required
          />
          
          {isSignup && (
            <input
              type="text"
              placeholder="닉네임"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              required
            />
          )}
          
          <input
            type="password"
            placeholder="비밀번호"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            required
          />
          
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition-colors disabled:opacity-50"
          >
            {loading ? '처리중...' : (isSignup ? '회원가입' : '로그인')}
          </button>
          
          <button
            onClick={() => setIsSignup(!isSignup)}
            className="w-full text-blue-600 hover:text-blue-800 text-sm"
          >
            {isSignup ? '로그인으로 돌아가기' : '회원가입'}
          </button>
        </div>
      </div>
    </div>
  );
}

// 헤더 컴포넌트
function Header({ currentUser, onLogout, onCreatePost }) {
  return (
    <header className="bg-white border-b border-gray-300">
      <div className="w-full px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">게시판</h1>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={onCreatePost}
            className="bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-3 py-1 rounded text-sm flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">글쓰기</span>
          </button>
          
          <span className="text-gray-700 text-sm hidden sm:inline">{currentUser}님</span>
          
          <button
            onClick={onLogout}
            className="text-gray-600 hover:text-red-600 text-sm"
          >
            <span className="hidden sm:inline">로그아웃</span>
            <LogOut className="w-4 h-4 sm:hidden" />
          </button>
        </div>
      </div>
    </header>
  );
}

// 검색바 (아카라이브 스타일)
function SearchBar({ searchQuery, setSearchQuery, onSearch, onClear }) {
  return (
    <div className="bg-white border border-gray-300 rounded p-4">
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <input
          type="text"
          placeholder="검색어를 입력하세요"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onSearch()}
          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
        />
        <div className="flex space-x-2">
          <button
            onClick={onSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm whitespace-nowrap"
          >
            검색
          </button>
          <button
            onClick={onClear}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm whitespace-nowrap"
          >
            전체
          </button>
        </div>
      </div>
    </div>
  );
}

// 게시글 테이블 헤더
function PostTableHeader() {
  return (
    <div className="bg-gray-100 border border-gray-300 rounded-t">
      <div className="grid grid-cols-12 gap-2 lg:gap-4 px-2 lg:px-4 py-3 text-sm font-medium text-gray-700">
        <div className="col-span-1 text-center">번호</div>
        <div className="col-span-5 lg:col-span-6">제목</div>
        <div className="col-span-2 text-center">작성자</div>
        <div className="col-span-3 lg:col-span-2 text-center">작성일</div>
        <div className="col-span-1 text-center">삭제</div>
      </div>
    </div>
  );
}

// 게시글 행
function PostRow({ post, index, onSelect, onDelete, currentUser, totalPosts, currentPage, postsPerPage }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }
  };

  // 게시글 번호 계산 (최신순으로 번호 매기기)
  const postNumber = totalPosts - ((currentPage - 1) * postsPerPage + index);

  return (
    <div className="bg-white border-l border-r border-b border-gray-300 hover:bg-gray-50">
      <div className="grid grid-cols-12 gap-2 lg:gap-4 px-2 lg:px-4 py-3 text-sm">
        <div className="col-span-1 text-center text-gray-600">
          {postNumber}
        </div>
        <div className="col-span-5 lg:col-span-6">
          <span
            onClick={() => onSelect(post.id)}
            className="text-gray-800 hover:text-blue-600 cursor-pointer hover:underline break-words"
          >
            {post.title}
          </span>
          <span className="text-blue-600 ml-2 text-xs">[3]</span>
        </div>
        <div className="col-span-2 text-center text-gray-600 truncate">
          {post.author_username}
        </div>
        <div className="col-span-3 lg:col-span-2 text-center text-gray-500 text-xs">
          {formatDate(post.created_at)}
        </div>
        <div className="col-span-1 text-center">
          {post.author_id === currentUser && (
            <button
              onClick={() => onDelete(post.id)}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// 게시글 목록 (테이블 형태)
function PostList({ posts, onSelectPost, onDeletePost, currentUser }) {
  return (
    <div>
      <PostTableHeader />
      {posts.length === 0 ? (
        <div className="bg-white border-l border-r border-b border-gray-300 py-12 text-center text-gray-500">
          게시글이 없습니다.
        </div>
      ) : (
        posts.map((post, index) => (
          <PostRow
            key={post.id}
            post={post}
            index={index}
            onSelect={onSelectPost}
            onDelete={onDeletePost}
            currentUser={currentUser}
            totalPosts={posts.length}
            currentPage={1}
            postsPerPage={10}
          />
        ))
      )}
    </div>
  );
}

// 댓글 컴포넌트
function CommentItem({ comment, onDelete, currentUser }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="border-b border-gray-200 py-3">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-800">{comment.author_username}</span>
          <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
        </div>
        {comment.author_id === currentUser && (
          <button
            onClick={() => onDelete(comment.id)}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="text-gray-700 whitespace-pre-wrap">{comment.content}</div>
    </div>
  );
}

// 댓글 작성 폼
function CommentForm({ onSubmit }) {
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
      await onSubmit({ content });
      setContent('');
    } catch (error) {
      alert('댓글 작성 실패');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="댓글을 입력하세요..."
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 resize-none"
      />
      <div className="flex justify-end mt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
        >
          {loading ? '작성중...' : '댓글 작성'}
        </button>
      </div>
    </form>
  );
}

// 게시글 상세 페이지
function PostDetail({ postId, onBack, currentUser }) {
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPostDetail();
    loadComments();
  }, [postId]);

  const loadPostDetail = async () => {
    try {
      const response = await api.getPost(postId);
      setPost(response);
    } catch (error) {
      console.error('게시글 로드 실패:', error);
      alert('게시글을 불러올 수 없습니다.');
      onBack();
    }
  };

  const loadComments = async () => {
    try {
      const comments = await api.getComments(postId);
      setComments(comments);
    } catch (error) {
      console.error('댓글 로드 실패:', error);
    }
    setLoading(false);
  };

  const handleDeletePost = async () => {
    if (confirm('정말 이 게시글을 삭제하시겠습니까?')) {
      try {
        await api.deletePost(postId);
        alert('게시글이 삭제되었습니다.');
        onBack();
      } catch (error) {
        alert('게시글 삭제 실패');
      }
    }
  };

  const handleCommentSubmit = async (commentData) => {
    try {
      await api.createComment(postId, commentData);
      loadComments(); // 댓글 목록 새로고침
      alert('댓글이 작성되었습니다.');
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (confirm('정말 이 댓글을 삭제하시겠습니까?')) {
      try {
        await api.deleteComment(commentId);
        loadComments(); // 댓글 목록 새로고침
        alert('댓글이 삭제되었습니다.');
      } catch (error) {
        alert('댓글 삭제 실패');
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-300 rounded p-8 text-center">
        <div className="text-gray-600">로딩중...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="bg-white border border-gray-300 rounded p-8 text-center">
        <div className="text-red-600">게시글을 찾을 수 없습니다.</div>
        <button 
          onClick={onBack}
          className="mt-4 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm"
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 뒤로가기 버튼 */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onBack}
          className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>목록으로</span>
        </button>
      </div>

      {/* 게시글 내용 */}
      <div className="bg-white border border-gray-300 rounded">
        {/* 게시글 헤더 */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-800 mb-2">{post.title}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>{post.author_username}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(post.created_at)}</span>
                </span>
              </div>
            </div>
            {post.author_id === currentUser && (
              <div className="flex space-x-2">
                <button
                  onClick={() => alert('수정 기능은 구현 예정입니다!')}
                  className="text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={handleDeletePost}
                  className="text-gray-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 게시글 본문 */}
        <div className="px-6 py-6">
          <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
            {post.content}
          </div>
        </div>
      </div>

      {/* 댓글 섹션 */}
      <div className="bg-white border border-gray-300 rounded">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <span>댓글 ({comments.length})</span>
          </h2>
        </div>

        <div className="px-6 py-4">
          {/* 댓글 목록 */}
          {comments.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              첫 번째 댓글을 남겨보세요!
            </div>
          ) : (
            <div className="space-y-2">
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
          <CommentForm onSubmit={handleCommentSubmit} />
        </div>
      </div>
    </div>
  );
}

// 게시글 작성 폼 (심플하게)
function PostForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }
    
    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      alert('게시글 저장 실패');
    }
    setLoading(false);
  };

  return (
    <div className="bg-white border border-gray-300 rounded p-6">
      <h2 className="text-lg font-bold mb-4">게시글 작성</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            placeholder="제목을 입력하세요"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 resize-none"
            placeholder="내용을 입력하세요"
          />
        </div>
        
        <div className="flex space-x-2 pt-4">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? '저장중...' : '작성완료'}
          </button>
          <button
            onClick={onCancel}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

// 메인 앱
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [currentView, setCurrentView] = useState('list');
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    loadPosts();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await api.getMe();
      setCurrentUser(user.user_id);
    } catch (error) {
      setCurrentUser(null);
    }
    setLoading(false);
  };

  const loadPosts = async () => {
    try {
      const response = await api.getPosts();
      setPosts(response.posts || []);
    } catch (error) {
      console.error('게시글 로드 실패:', error);
    }
  };

  const handleLogin = () => {
    checkAuth();
    loadPosts();
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      setCurrentUser(null);
      setCurrentView('list');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const handleSelectPost = async (postId) => {
    setSelectedPostId(postId);
    setCurrentView('detail');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedPostId(null);
    loadPosts(); // 목록 새로고침
  };

  const handleCreatePost = async (formData) => {
    await api.createPost(formData);
    setCurrentView('list');
    loadPosts();
  };

  const handleDeletePost = async (postId) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      try {
        await api.deletePost(postId);
        if (currentView === 'detail') {
          // 상세 페이지에서 삭제한 경우 목록으로 돌아가기
          handleBackToList();
        } else {
          // 목록에서 삭제한 경우 목록 새로고침
          loadPosts();
        }
      } catch (error) {
        alert('삭제 실패');
      }
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadPosts();
      return;
    }
    try {
      const results = await api.searchPosts(searchQuery);
      setPosts(results);
    } catch (error) {
      alert('검색 실패');
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    loadPosts();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600">로딩중...</div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        currentUser={currentUser} 
        onLogout={handleLogout}
        onCreatePost={() => setCurrentView('create')}
      />
      
      <main className="w-full px-4 py-4 space-y-4">
        {currentView === 'list' && (
          <>
            <SearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSearch={handleSearch}
              onClear={handleClearSearch}
            />
            <PostList
              posts={posts}
              onSelectPost={handleSelectPost}
              onDeletePost={handleDeletePost}
              currentUser={currentUser}
            />
          </>
        )}

        {currentView === 'detail' && selectedPostId && (
          <PostDetail
            postId={selectedPostId}
            onBack={handleBackToList}
            currentUser={currentUser}
          />
        )}

        {currentView === 'create' && (
          <PostForm
            onSubmit={handleCreatePost}
            onCancel={() => setCurrentView('list')}
          />
        )}
      </main>
    </div>
  );
}