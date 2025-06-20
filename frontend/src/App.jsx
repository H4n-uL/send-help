import React, { useState, useEffect } from 'react';
import { Search, MessageCircle, User, LogOut, Plus, Calendar, Trash2 } from 'lucide-react';

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
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">게시판</h1>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={onCreatePost}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>글쓰기</span>
          </button>
          
          <span className="text-gray-700 text-sm">{currentUser}님</span>
          
          <button
            onClick={onLogout}
            className="text-gray-600 hover:text-red-600 text-sm"
          >
            로그아웃
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
      <div className="flex space-x-2">
        <input
          type="text"
          placeholder="검색어를 입력하세요"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onSearch()}
          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={onSearch}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
        >
          검색
        </button>
        <button
          onClick={onClear}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm"
        >
          전체
        </button>
      </div>
    </div>
  );
}

// 게시글 테이블 헤더
function PostTableHeader() {
  return (
    <div className="bg-gray-100 border border-gray-300 rounded-t">
      <div className="grid grid-cols-12 gap-4 px-4 py-3 text-sm font-medium text-gray-700">
        <div className="col-span-1 text-center">번호</div>
        <div className="col-span-6">제목</div>
        <div className="col-span-2 text-center">작성자</div>
        <div className="col-span-2 text-center">작성일</div>
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
      <div className="grid grid-cols-12 gap-4 px-4 py-3 text-sm">
        <div className="col-span-1 text-center text-gray-600">
          {postNumber}
        </div>
        <div className="col-span-6">
          <span
            onClick={() => onSelect(post.id)}
            className="text-gray-800 hover:text-blue-600 cursor-pointer hover:underline"
          >
            {post.title}
          </span>
          <span className="text-blue-600 ml-2 text-xs">[3]</span>
        </div>
        <div className="col-span-2 text-center text-gray-600">
          {post.author_username}
        </div>
        <div className="col-span-2 text-center text-gray-500 text-xs">
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
    alert('게시글 상세 페이지는 구현 예정입니다!');
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
      
      <main className="max-w-5xl mx-auto p-4 space-y-4">
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