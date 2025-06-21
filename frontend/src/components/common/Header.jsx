// components/common/Header.jsx
import React from 'react';
import { Plus, LogOut, User, Home } from 'lucide-react';

const Header = ({ currentUser, onLogout, onCreatePost, onGoHome, currentView }) => {
  return (
    <header className="bg-white border-b border-gray-300 sticky top-0 z-50 shadow-sm">
      <div className="w-full max-w-none px-4 py-3 flex items-center justify-between">
        {/* 로고 및 네비게이션 */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onGoHome}
            className="flex items-center space-x-2 text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors"
          >
            <Home className="w-6 h-6" />
            <span className="hidden sm:inline">게시판</span>
          </button>
          
          {/* 현재 페이지 표시 */}
          {currentView !== 'list' && (
            <div className="text-sm text-gray-500">
              {currentView === 'detail' && '• 게시글 보기'}
              {currentView === 'create' && '• 글쓰기'}
            </div>
          )}
        </div>
        
        {/* 사용자 메뉴 */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={onCreatePost}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm flex items-center space-x-1 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">글쓰기</span>
          </button>
          
          {/* 사용자 정보 */}
          <div className="flex items-center space-x-2 text-sm">
            <div className="flex items-center space-x-1 text-gray-700">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{currentUser}님</span>
            </div>
            
            <button
              onClick={onLogout}
              className="text-gray-600 hover:text-red-600 transition-colors"
              title="로그아웃"
            >
              <span className="hidden sm:inline text-sm">로그아웃</span>
              <LogOut className="w-4 h-4 sm:hidden" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;