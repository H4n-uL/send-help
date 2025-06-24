// components/auth/LoginForm.jsx
import React, { useState } from 'react';
import { authAPI } from '../../services/api';
import Button from '../ui/Button';
import Input from '../ui/Input';

const LoginForm = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    id: '',
    password: '',
    username: ''
  });
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // 입력 시 에러 메시지 제거
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.id.trim()) {
      setError('아이디를 입력해주세요.');
      return false;
    }
    
    if (!formData.password.trim()) {
      setError('비밀번호를 입력해주세요.');
      return false;
    }
    
    if (isSignup) {
      if (formData.id.length < 3 || formData.id.length > 20) {
        setError('아이디는 3-20자 사이여야 합니다.');
        return false;
      }
      
      if (!formData.username.trim()) {
        setError('닉네임을 입력해주세요.');
        return false;
      }
      
      if (formData.username.length < 2 || formData.username.length > 50) {
        setError('닉네임은 2-50자 사이여야 합니다.');
        return false;
      }
      
      if (formData.password.length < 6) {
        setError('비밀번호는 최소 6자 이상이어야 합니다.');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      if (isSignup) {
        // 회원가입
        await authAPI.signup(formData);
        alert('회원가입이 완료되었습니다! 로그인해주세요.');
        setIsSignup(false);
        setFormData({ id: formData.id, password: '', username: '' });
      } else {
        // 로그인
        await onLogin({ id: formData.id, password: formData.password });
      }
    } catch (error) {
      console.error('인증 에러:', error);
      if (error.message.includes('400')) {
        setError(isSignup ? '이미 존재하는 사용자입니다.' : '잘못된 로그인 정보입니다.');
      } else if (error.message.includes('401')) {
        setError('아이디 또는 비밀번호가 올바르지 않습니다.');
      } else {
        setError(isSignup ? '회원가입에 실패했습니다.' : '로그인에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setFormData({ id: '', password: '', username: '' });
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            게시판
          </h1>
          <h2 className="text-xl font-semibold text-gray-700">
            {isSignup ? '회원가입' : '로그인'}
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            {isSignup 
              ? '새 계정을 만들어 게시판을 이용해보세요' 
              : '계정에 로그인하여 게시판을 이용하세요'
            }
          </p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
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
            className="transition-all duration-200"
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
              className="transition-all duration-200"
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
            className="transition-all duration-200"
          />
          
          <div className="space-y-3 pt-4">
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-medium transition-all duration-200"
              loading={loading}
              disabled={loading}
            >
              {loading 
                ? (isSignup ? '회원가입 중...' : '로그인 중...') 
                : (isSignup ? '회원가입' : '로그인')
              }
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              className="w-full text-gray-600 hover:text-gray-800 py-2 text-sm transition-all duration-200"
              onClick={toggleMode}
              disabled={loading}
            >
              {isSignup 
                ? '이미 계정이 있으신가요? 로그인' 
                : '계정이 없으신가요? 회원가입'
              }
            </Button>
          </div>
        </form>
        
        {isSignup && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">회원가입 안내</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• 아이디: 3-20자 (영문, 숫자 조합 권장)</li>
              <li>• 닉네임: 2-50자 (게시판에서 표시될 이름)</li>
              <li>• 비밀번호: 최소 6자 이상</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginForm;
