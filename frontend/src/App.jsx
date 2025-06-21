// App.jsx
import React, { useState, useEffect } from 'react';
import { authAPI, postAPI } from './services/api';
import LoginForm from './components/auth/LoginForm';
import Header from './components/common/Header';
import PostList from './components/post/PostList';
import PostDetail from './components/post/PostDetail';
import PostForm from './components/post/PostForm';
import './styles/components.css';

const App = () => {
  // 상태 관리
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('list'); // 'list', 'detail', 'create', 'edit'
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);

  // 초기 로딩
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    setLoading(true);
    try {
      // 인증 상태 확인
      await checkAuth();
      // 게시글 목록 로드
      await loadPosts();
    } catch (error) {
      console.error('앱 초기화 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 인증 상태 확인
  const checkAuth = async () => {
    try {
      const user = await authAPI.getMe();
      setCurrentUser(user.user_id);
    } catch (error) {
      setCurrentUser(null);
    }
  };

  // 게시글 목록 로드
  const loadPosts = async () => {
    setPostsLoading(true);
    try {
      const response = await postAPI.getPosts();
      setPosts(response.posts || []);
    } catch (error) {
      console.error('게시글 로드 실패:', error);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  // 로그인 처리
  const handleLogin = async (data) => {
    await authAPI.login(data);
    await checkAuth();
    await loadPosts();
  };

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await authAPI.logout();
      setCurrentUser(null);
      setCurrentView('list');
      setSelectedPostId(null);
      setEditingPost(null);
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  // 홈으로 이동
  const handleGoHome = () => {
    setCurrentView('list');
    setSelectedPostId(null);
    setEditingPost(null);
    setSearchQuery('');
    loadPosts();
  };

  // 게시글 선택
  const handleSelectPost = (postId) => {
    setSelectedPostId(postId);
    setCurrentView('detail');
  };

  // 게시글 작성 페이지로 이동
  const handleCreatePost = () => {
    setEditingPost(null);
    setCurrentView('create');
  };

  // 게시글 수정 페이지로 이동
  const handleEditPost = (post) => {
    setEditingPost(post);
    setCurrentView('edit');
  };

  // 게시글 저장 (생성/수정)
  const handleSavePost = async (postData) => {
    try {
      if (editingPost) {
        // 수정 (아직 API가 없으므로 알림만)
        alert('게시글 수정 기능은 백엔드 API 구현 후 추가 예정입니다.');
        return;
      } else {
        // 생성
        await postAPI.createPost(postData);
        alert('게시글이 작성되었습니다.');
      }
      
      setCurrentView('list');
      setEditingPost(null);
      await loadPosts();
    } catch (error) {
      throw error;
    }
  };

  // 게시글 삭제
  const handleDeletePost = async (postId) => {
    try {
      await postAPI.deletePost(postId);
      
      // 현재 보고 있는 게시글이 삭제된 경우 목록으로 이동
      if (currentView === 'detail' && selectedPostId === postId) {
        setCurrentView('list');
        setSelectedPostId(null);
      }
      
      await loadPosts();
    } catch (error) {
      throw error;
    }
  };

  // 목록으로 돌아가기
  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedPostId(null);
    setEditingPost(null);
    loadPosts();
  };

  // 검색 처리
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      await loadPosts();
      return;
    }

    setPostsLoading(true);
    try {
      const results = await postAPI.searchPosts(searchQuery);
      setPosts(results);
    } catch (error) {
      console.error('검색 실패:', error);
      alert('검색에 실패했습니다.');
    } finally {
      setPostsLoading(false);
    }
  };

  // 검색 초기화
  const handleClearSearch = () => {
    setSearchQuery('');
    loadPosts();
  };

  // 폼 취소
  const handleCancelForm = () => {
    setCurrentView('list');
    setEditingPost(null);
  };

  // 로딩 중일 때
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600 text-lg">앱을 불러오는 중...</div>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 경우
  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} />;
  }

  // 메인 앱 렌더링
  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <Header 
        currentUser={currentUser}
        onLogout={handleLogout}
        onCreatePost={handleCreatePost}
        onGoHome={handleGoHome}
        currentView={currentView}
      />
      
      {/* 메인 콘텐츠 */}
      <main className="w-full max-w-4xl mx-auto px-4 py-6">
        {/* 게시글 목록 */}
        {currentView === 'list' && (
          <PostList
            posts={posts}
            onSelectPost={handleSelectPost}
            onDeletePost={handleDeletePost}
            currentUser={currentUser}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSearch={handleSearch}
            onClearSearch={handleClearSearch}
            loading={postsLoading}
            totalPosts={posts.length}
          />
        )}

        {/* 게시글 상세보기 */}
        {currentView === 'detail' && selectedPostId && (
          <PostDetail
            postId={selectedPostId}
            onBack={handleBackToList}
            currentUser={currentUser}
            onEdit={handleEditPost}
          />
        )}

        {/* 게시글 작성 */}
        {currentView === 'create' && (
          <PostForm
            onSubmit={handleSavePost}
            onCancel={handleCancelForm}
          />
        )}

        {/* 게시글 수정 */}
        {currentView === 'edit' && editingPost && (
          <PostForm
            onSubmit={handleSavePost}
            onCancel={handleCancelForm}
            initialData={editingPost}
          />
        )}
      </main>
    </div>
  );
};

export default App;