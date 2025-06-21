// components/post/PostList.jsx
import React, { useState } from 'react';
import { Search, Trash2, MessageCircle, Eye } from 'lucide-react';
import { formatRelativeTime } from '../../utils/dateUtils';

// 검색바 컴포넌트
const SearchBar = ({ searchQuery, setSearchQuery, onSearch, onClear }) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4 mb-4">
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="제목이나 내용으로 검색하세요"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm whitespace-nowrap transition-colors"
          >
            검색
          </button>
          <button
            onClick={onClear}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm whitespace-nowrap transition-colors"
          >
            전체
          </button>
        </div>
      </div>
    </div>
  );
};

// 게시글 테이블 헤더
const PostTableHeader = () => {
  return (
    <div className="bg-gray-100 border border-gray-300 rounded-t-lg">
      <div className="grid grid-cols-12 gap-2 lg:gap-4 px-3 lg:px-4 py-3 text-sm font-medium text-gray-700">
        <div className="col-span-1 text-center">번호</div>
        <div className="col-span-5 lg:col-span-6">제목</div>
        <div className="col-span-2 text-center hidden sm:block">작성자</div>
        <div className="col-span-2 lg:col-span-2 text-center">작성일</div>
        <div className="col-span-1 text-center">관리</div>
        <div className="col-span-1 text-center hidden lg:block">조회</div>
      </div>
    </div>
  );
};

// 게시글 행 컴포넌트
const PostRow = ({ 
  post, 
  index, 
  onSelect, 
  onDelete, 
  currentUser, 
  totalPosts, 
  currentPage = 1, 
  postsPerPage = 10 
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  // 게시글 번호 계산 (최신순으로 번호 매기기)
  const postNumber = totalPosts - ((currentPage - 1) * postsPerPage + index);

  const handleDelete = async () => {
    if (!confirm('정말 이 게시글을 삭제하시겠습니까?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(post.id);
    } catch (error) {
      alert('삭제 실패');
    }
    setIsDeleting(false);
  };

  // 제목 길이 제한
  const truncateTitle = (title, maxLength = 30) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  return (
    <div className="bg-white border-l border-r border-b border-gray-300 hover:bg-gray-50 transition-colors">
      <div className="grid grid-cols-12 gap-2 lg:gap-4 px-3 lg:px-4 py-3 text-sm">
        {/* 게시글 번호 */}
        <div className="col-span-1 text-center text-gray-600 self-center">
          {postNumber}
        </div>
        
        {/* 제목 */}
        <div className="col-span-5 lg:col-span-6 self-center">
          <div className="flex items-center space-x-2">
            <span
              onClick={() => onSelect(post.id)}
              className="text-gray-800 hover:text-blue-600 cursor-pointer hover:underline transition-colors"
              title={post.title}
            >
              {truncateTitle(post.title)}
            </span>
            {post.comment_count > 0 && (
              <span className="flex items-center space-x-1 text-blue-600 text-xs">
                <MessageCircle className="w-3 h-3" />
                <span>{post.comment_count}</span>
              </span>
            )}
          </div>
        </div>
        
        {/* 작성자 (모바일에서 숨김) */}
        <div className="col-span-2 text-center text-gray-600 self-center truncate hidden sm:block">
          {post.author_username}
        </div>
        
        {/* 작성일 */}
        <div className="col-span-2 lg:col-span-2 text-center text-gray-500 text-xs self-center">
          <div className="hidden sm:block">
            {formatRelativeTime(post.created_at)}
          </div>
          <div className="sm:hidden">
            <div>{formatRelativeTime(post.created_at)}</div>
            <div className="text-gray-400">{post.author_username}</div>
          </div>
        </div>
        
        {/* 관리 (삭제 버튼) */}
        <div className="col-span-1 text-center self-center">
          {post.author_id === currentUser && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
              title="삭제"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* 조회수 (큰 화면에서만 표시) */}
        <div className="col-span-1 text-center text-gray-500 text-xs self-center hidden lg:block">
          <div className="flex items-center justify-center space-x-1">
            <Eye className="w-3 h-3" />
            <span>{post.view_count || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// 빈 상태 컴포넌트
const EmptyState = ({ isSearchResult }) => {
  return (
    <div className="bg-white border-l border-r border-b border-gray-300 py-16 text-center">
      <div className="text-gray-400 mb-4">
        <MessageCircle className="w-12 h-12 mx-auto mb-2" />
      </div>
      <h3 className="text-lg font-medium text-gray-600 mb-2">
        {isSearchResult ? '검색 결과가 없습니다' : '게시글이 없습니다'}
      </h3>
      <p className="text-gray-500 text-sm">
        {isSearchResult 
          ? '다른 검색어로 시도해보세요' 
          : '첫 번째 게시글을 작성해보세요'
        }
      </p>
    </div>
  );
};

// 로딩 상태 컴포넌트
const LoadingState = () => {
  return (
    <div className="bg-white border border-gray-300 rounded-lg py-16 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <div className="text-gray-600">게시글을 불러오는 중...</div>
    </div>
  );
};

// 메인 PostList 컴포넌트
const PostList = ({ 
  posts, 
  onSelectPost, 
  onDeletePost, 
  currentUser,
  searchQuery,
  setSearchQuery,
  onSearch,
  onClearSearch,
  loading = false,
  totalPosts = 0,
  currentPage = 1,
  postsPerPage = 10
}) => {
  const isSearchResult = Boolean(searchQuery);

  if (loading) {
    return (
      <div className="space-y-4">
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearch={onSearch}
          onClear={onClearSearch}
        />
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 검색바 */}
      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={onSearch}
        onClear={onClearSearch}
      />

      {/* 게시글 목록 */}
      <div className="bg-white rounded-lg shadow-sm">
        <PostTableHeader />
        
        {posts.length === 0 ? (
          <EmptyState isSearchResult={isSearchResult} />
        ) : (
          posts.map((post, index) => (
            <PostRow
              key={post.id}
              post={post}
              index={index}
              onSelect={onSelectPost}
              onDelete={onDeletePost}
              currentUser={currentUser}
              totalPosts={totalPosts}
              currentPage={currentPage}
              postsPerPage={postsPerPage}
            />
          ))
        )}
      </div>

      {/* 게시글 개수 정보 */}
      {posts.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          {isSearchResult ? (
            `"${searchQuery}" 검색 결과: ${posts.length}개의 게시글`
          ) : (
            `총 ${totalPosts}개의 게시글`
          )}
        </div>
      )}
    </div>
  );
};

export default PostList;