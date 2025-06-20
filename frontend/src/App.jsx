// App.jsx
import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE = '/api';

// API 함수들
const api = {
  // 인증
  signup: async (data) => {
    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include'
    });
    return response.json();
  },
  
  login: async (data) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
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
  
  // 게시글
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
  
  updatePost: async (id, data) => {
    const response = await fetch(`${API_BASE}/posts/${id}`, {
      method: 'PUT',
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
  
  // 댓글
  getCommentsByPost: async (postId) => {
    const response = await fetch(`${API_BASE}/comments/post/${postId}`);
    return response.json();
  },
  
  createComment: async (data) => {
    const response = await fetch(`${API_BASE}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include'
    });
    return response.json();
  },
  
  deleteComment: async (id) => {
    const response = await fetch(`${API_BASE}/comments/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return response.json();
  }
};

// 로그인 컴포넌트
function LoginForm({ onLogin, onToggleMode }) {
  const [formData, setFormData] = useState({ user_id: '', password: '' });
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
      alert(`${isSignup ? '회원가입' : '로그인'} 실패: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>{isSignup ? '회원가입' : '로그인'}</h2>
        <input
          type="text"
          placeholder="사용자 ID"
          value={formData.user_id}
          onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? '처리중...' : (isSignup ? '회원가입' : '로그인')}
        </button>
        <button type="button" onClick={() => setIsSignup(!isSignup)}>
          {isSignup ? '로그인으로 전환' : '회원가입으로 전환'}
        </button>
      </form>
    </div>
  );
}

// 게시글 목록 컴포넌트
function PostList({ posts, onSelectPost, onDeletePost, currentUser }) {
  return (
    <div className="post-list">
      <h3>게시글 목록</h3>
      {posts.length === 0 ? (
        <p>게시글이 없습니다.</p>
      ) : (
        posts.map(post => (
          <div key={post.id} className="post-item">
            <h4 onClick={() => onSelectPost(post.id)} style={{ cursor: 'pointer', color: 'blue' }}>
              {post.title}
            </h4>
            <p>작성자: {post.author_id} | 작성일: {new Date(post.created_at).toLocaleDateString()}</p>
            <p>{post.content.substring(0, 100)}...</p>
            {post.author_id === currentUser && (
              <button onClick={() => onDeletePost(post.id)} className="delete-btn">
                삭제
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// 게시글 상세 컴포넌트
function PostDetail({ post, comments, onBack, onAddComment, onDeleteComment, currentUser }) {
  const [commentContent, setCommentContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    
    setLoading(true);
    try {
      await onAddComment(post.id, commentContent);
      setCommentContent('');
    } catch (error) {
      alert('댓글 작성 실패');
    }
    setLoading(false);
  };

  return (
    <div className="post-detail">
      <button onClick={onBack}>← 목록으로</button>
      <h2>{post.title}</h2>
      <p>작성자: {post.author_id} | 작성일: {new Date(post.created_at).toLocaleDateString()}</p>
      <div className="post-content">
        {post.content.split('\n').map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </div>
      
      <div className="comments-section">
        <h3>댓글 ({comments.length})</h3>
        
        {currentUser && (
          <form onSubmit={handleAddComment} className="comment-form">
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="댓글을 입력하세요..."
              rows="3"
            />
            <button type="submit" disabled={loading}>
              {loading ? '작성중...' : '댓글 작성'}
            </button>
          </form>
        )}
        
        <div className="comments-list">
          {comments.map(comment => (
            <div key={comment.id} className="comment-item">
              <p><strong>{comment.author_id}</strong> | {new Date(comment.created_at).toLocaleDateString()}</p>
              <p>{comment.content}</p>
              {comment.author_id === currentUser && (
                <button onClick={() => onDeleteComment(comment.id)} className="delete-btn">
                  삭제
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 게시글 작성 컴포넌트
function PostForm({ onSubmit, onCancel, initialData = null }) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    content: initialData?.content || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    <div className="post-form">
      <h3>{initialData ? '게시글 수정' : '게시글 작성'}</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="제목을 입력하세요"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
        <textarea
          placeholder="내용을 입력하세요"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          rows="10"
          required
        />
        <div className="form-buttons">
          <button type="submit" disabled={loading}>
            {loading ? '저장중...' : '저장'}
          </button>
          <button type="button" onClick={onCancel}>취소</button>
        </div>
      </form>
    </div>
  );
}

// 메인 앱 컴포넌트
function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [currentView, setCurrentView] = useState('list'); // 'list', 'detail', 'create'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // 초기 로드
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
    try {
      const post = await api.getPost(postId);
      const postComments = await api.getCommentsByPost(postId);
      setSelectedPost(post);
      setComments(postComments);
      setCurrentView('detail');
    } catch (error) {
      alert('게시글 로드 실패');
    }
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
        loadPosts();
        if (selectedPost?.id === postId) {
          setCurrentView('list');
        }
      } catch (error) {
        alert('삭제 실패');
      }
    }
  };

  const handleAddComment = async (postId, content) => {
    await api.createComment({ post_id: postId, content });
    const updatedComments = await api.getCommentsByPost(postId);
    setComments(updatedComments);
  };

  const handleDeleteComment = async (commentId) => {
    if (confirm('댓글을 삭제하시겠습니까?')) {
      try {
        await api.deleteComment(commentId);
        const updatedComments = await api.getCommentsByPost(selectedPost.id);
        setComments(updatedComments);
      } catch (error) {
        alert('댓글 삭제 실패');
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

  if (loading) {
    return <div>로딩중...</div>;
  }

  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>게시판</h1>
        <div className="header-controls">
          <span>환영합니다, {currentUser}님!</span>
          <button onClick={handleLogout}>로그아웃</button>
        </div>
      </header>

      <main className="app-main">
        {currentView === 'list' && (
          <>
            <div className="controls">
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="검색어를 입력하세요"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button onClick={handleSearch}>검색</button>
                <button onClick={loadPosts}>전체보기</button>
              </div>
              <button onClick={() => setCurrentView('create')} className="create-btn">
                게시글 작성
              </button>
            </div>
            <PostList
              posts={posts}
              onSelectPost={handleSelectPost}
              onDeletePost={handleDeletePost}
              currentUser={currentUser}
            />
          </>
        )}

        {currentView === 'detail' && selectedPost && (
          <PostDetail
            post={selectedPost}
            comments={comments}
            onBack={() => setCurrentView('list')}
            onAddComment={handleAddComment}
            onDeleteComment={handleDeleteComment}
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

export default App;