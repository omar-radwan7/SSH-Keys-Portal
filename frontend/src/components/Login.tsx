import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { Lock, User, AlertCircle, Shield, Users, Key } from 'lucide-react';

interface LoginForm {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [loginType, setLoginType] = useState<'user' | 'admin'>('user');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<LoginForm>();

  const handleLoginTypeChange = (type: 'user' | 'admin') => {
    setLoginType(type);
    setError('');
    reset();
  };

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError('');
    
    try {
      const success = await login(data.username, data.password);
      if (!success) {
        setError('Invalid credentials or account disabled');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <Key className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">HPC SSH Key Portal</h1>
            <p className="text-gray-600">Sign in to manage your SSH keys</p>
          </div>

          {/* Login Type Selection */}
          <div className="mb-6">
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => handleLoginTypeChange('user')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  loginType === 'user'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>User Login</span>
              </button>
              <button
                type="button"
                onClick={() => handleLoginTypeChange('admin')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  loginType === 'admin'
                    ? 'bg-white text-red-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Admin Login</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              {loginType === 'user' 
                ? 'Sign in to manage your SSH keys and view deployment status' 
                : 'Administrative access to manage users, policies, and system settings'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('username', { required: 'Username is required' })}
                  type="text"
                  id="username"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your username"
                  disabled={isLoading}
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('password', { required: 'Password is required' })}
                  type="password"
                  id="password"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 ${
                loginType === 'admin'
                  ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
                  : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400'
              } text-white`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  {loginType === 'admin' ? <Shield className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                  <span>Sign In as {loginType === 'admin' ? 'Admin' : 'User'}</span>
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-700 mb-2">Demo Credentials:</p>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>User:</span>
                <span className="font-mono">demo / demo</span>
              </div>
              <div className="flex justify-between">
                <span>Admin:</span>
                <span className="font-mono">admin / admin</span>
              </div>
              <div className="flex justify-between">
                <span>Auditor:</span>
                <span className="font-mono">auditor / auditor</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Secure SSH key management for HPC systems</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 