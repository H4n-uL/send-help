// services/api.js
const API_BASE = '/api';

// 공통 fetch 함수
const fetchAPI = async (url, options = {}) => {
  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // FormData인 경우 Content-Type 제거 (브라우저가 자동 설정)
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  const response = await fetch(`${API_BASE}${url}`, config);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

// 인증 API
export const authAPI = {
  login: async (data) => {
    return fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  signup: async (data) => {
    return fetchAPI('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  logout: async () => {
    return fetchAPI('/auth/logout', {
      method: 'POST',
    });
  },
  
  getMe: async () => {
    return fetchAPI('/auth/me');
  },
};

// 게시글 API
export const postAPI = {
  getPosts: async (page = 1, limit = 10) => {
    return fetchAPI(`/posts?page=${page}&limit=${limit}`);
  },
  
  getPost: async (id) => {
    return fetchAPI(`/posts/${id}`);
  },
  
  createPost: async (data) => {
    return fetchAPI('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  deletePost: async (id) => {
    return fetchAPI(`/posts/${id}`, {
      method: 'DELETE',
    });
  },
  
  searchPosts: async (query) => {
    return fetchAPI(`/posts/search?q=${encodeURIComponent(query)}`);
  },
};

// 댓글 API
export const commentAPI = {
  getComments: async (postId) => {
    return fetchAPI(`/comments/post/${postId}`);
  },

  createComment: async (postId, data) => {
    return fetchAPI('/comments', {
      method: 'POST',
      body: JSON.stringify({ ...data, post_id: postId }),
    });
  },

  deleteComment: async (commentId) => {
    return fetchAPI(`/comments/${commentId}`, {
      method: 'DELETE',
    });
  },
};

// 파일 업로드 API
export const uploadAPI = {
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return fetchAPI('/upload', {
      method: 'POST',
      body: formData,
    });
  },
  
  uploadMultipleFiles: async (files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    
    return fetchAPI('/upload/multiple', {
      method: 'POST',
      body: formData,
    });
  },
};