import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setAuth, setToken } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: () => authApi.login(email, password),
    onSuccess: async (data) => {
      // Set the token first so it's available for the next API call
      setToken(data.access_token);
      
      // Now get user info with the token in place
      try {
        const userResponse = await authApi.getMe();
        setAuth(userResponse, data.access_token);
        
        // Redirect admin to admin panel, regular users to dashboard
        if (userResponse.is_admin) {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } catch (err) {
        setError('Failed to fetch user information');
      }
    },
    onError: (error: any) => {
      console.error("Login error:", error);
      const errorDetails = JSON.stringify(error.response?.data || error.message);
      setError(`Error: ${errorDetails}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">☕ مدير المقهى</h1>
        <h2 className="text-xl text-center mb-6">تسجيل الدخول</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loginMutation.isPending ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  );
}
