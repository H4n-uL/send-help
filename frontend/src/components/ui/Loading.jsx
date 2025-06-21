// components/ui/Loading.jsx
import React from 'react';

const Loading = ({ text = '로딩중...', size = 'md' }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className={`animate-spin rounded-full border-b-2 border-blue-600 mx-auto ${sizes[size]}`}></div>
        <p className="mt-2 text-gray-600">{text}</p>
      </div>
    </div>
  );
};

export default Loading;