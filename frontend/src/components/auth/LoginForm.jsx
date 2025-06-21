// components/auth/LoginForm.jsx
import React, { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';

const LoginForm = ({ onLogin, onSignup, loading, error }) => {
  const [formData, setFormData] = useState({
    id: '',
    password: '',
    username: ''
  });
  const [isSignup, setIsSignup] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSignup) {
      if (!formData.id || !formData.username || !formData.password) {
        alert('모든 필드를 입력해주세요.');
        return;
      }
      const success = await onSignup(formData);
      if (success) {
        alert('회원가입 성공! 로그인해주세요.');
        setIsSignup(false);
        setFormData({ id: formData.id, password: '', username: '' });
      }
    } else {
      if (!formData.id || !formData.password) {
        alert('아이디와 비밀번호를 입력해주세요.');
        return;
      }
      await onLogin({ id: formData.id, password: formData.password });
    }
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setFormData({ id: '', password: '', username: '' });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-300 rounded-lg shadow-md p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          {isSignup ? '회원가입' : '로그인'}
        </h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="아이디"
            type="text"
            name="id"
            value={formData.id}
            onChange={handleChange}
            placeholder="아이디를 입력하세요"
            required
          />
          
          {isSignup && (
            <Input
              label="닉네임"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="닉네임을 입력하세요"
              required
            />
          )}
          
          <Input
            label="비밀번호"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="비밀번호를 입력하세요"
            required
          />
          
          <Button
            type="submit"
            className="w-full"
            loading={loading}
          >
            {isSignup ? '회원가입' : '로그인'}
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={toggleMode}
          >
            {isSignup ? '로그인으로 돌아가기' : '회원가입'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;