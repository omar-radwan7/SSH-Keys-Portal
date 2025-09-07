import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { Lock, User, AlertCircle, Shield, Users, Key, Mail, UserPlus, Eye, EyeOff } from 'lucide-react';
import apiService from '../services/api';

interface LoginForm {
  username: string;
  password: string;
}

interface RegisterForm {
  username: string;
  password: string;
  confirmPassword: string;
  email?: string;
  displayName: string;
}

const Login: React.FC = () => {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [mode, setMode] = useState<'login' | 'register' | 'admin-login'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Login form
  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
    reset: resetLogin
  } = useForm<LoginForm>();

  // Registration form
  const {
    register: registerRegister,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors },
    reset: resetRegister,
    watch
  } = useForm<RegisterForm>();

  const watchPassword = watch('password', '');

  const handleModeChange = (newMode: 'login' | 'register' | 'admin-login') => {
    setMode(newMode);
    setError('');
    resetLogin();
    resetRegister();
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const onLoginSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError('');

    try {
      await login(data.username, data.password);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await apiService.register({
        username: data.username,
        password: data.password,
        email: data.email,
        displayName: data.displayName
      });

      if (response.success && response.data) {
        // Store token and login user
        localStorage.setItem('auth_token', response.data.token);
        await login(data.username, data.password);
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Registration failed. Please try again.';
      setError(typeof errorMessage === 'string' ? errorMessage : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Key className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">HPC SSH Key Portal</h2>
          <p className="mt-2 text-sm text-gray-600">
            {mode === 'login' ? 'Sign in to your account' : 
             mode === 'register' ? 'Create your account' : 'Admin Sign In'}
          </p>
            </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-xl">
          {/* Mode Toggle */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => handleModeChange('login')}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
                mode === 'login'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-3 h-3 inline mr-1" />
              User Login
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('register')}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
                mode === 'register'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <UserPlus className="w-3 h-3 inline mr-1" />
              Register
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('admin-login')}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
                mode === 'admin-login'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Shield className="w-3 h-3 inline mr-1" />
              Admin Login
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {mode === 'login' || mode === 'admin-login' ? (
            // Login Form
            <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-6">
            <div>
                <label htmlFor="login-username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    {...loginRegister('username', { required: 'Username is required' })}
                  type="text"
                    id="login-username"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your username"
                  disabled={isLoading}
                />
              </div>
                {loginErrors.username && (
                  <p className="mt-1 text-sm text-red-600">
                    {typeof loginErrors.username.message === 'string' 
                      ? loginErrors.username.message 
                      : 'Username is required'}
                  </p>
              )}
            </div>

            <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    {...loginRegister('password', { required: 'Password is required' })}
                    type={showPassword ? 'text' : 'password'}
                    id="login-password"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {loginErrors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {typeof loginErrors.password.message === 'string' 
                      ? loginErrors.password.message 
                      : 'Password is required'}
                  </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
                className={`w-full font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 text-white ${
                  mode === 'admin-login' 
                    ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
                    : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400'
                }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                  <>
                    {mode === 'admin-login' ? <Shield className="w-5 h-5" /> : <Key className="w-5 h-5" />}
                    <span>{mode === 'admin-login' ? 'Admin Sign In' : 'Sign In'}</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            // Registration Form
            <form onSubmit={handleRegisterSubmit(onRegisterSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="register-username" className="block text-sm font-medium text-gray-700 mb-2">
                    Username *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      {...registerRegister('username', {
                        required: 'Username is required',
                        minLength: { value: 3, message: 'Username must be at least 3 characters' },
                        pattern: { value: /^[a-zA-Z0-9_-]+$/, message: 'Username can only contain letters, numbers, hyphens, and underscores' }
                      })}
                      type="text"
                      id="register-username"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Choose username"
                      disabled={isLoading}
                    />
                  </div>
                                  {registerErrors.username && (
                  <p className="mt-1 text-sm text-red-600">
                    {typeof registerErrors.username.message === 'string' 
                      ? registerErrors.username.message 
                      : 'Username is invalid'}
                  </p>
                )}
                </div>

                <div>
                  <label htmlFor="register-display-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name *
                  </label>
                  <input
                    {...registerRegister('displayName', { required: 'Display name is required' })}
                    type="text"
                    id="register-display-name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your full name"
                    disabled={isLoading}
                  />
                  {registerErrors.displayName && (
                    <p className="mt-1 text-sm text-red-600">
                      {typeof registerErrors.displayName.message === 'string' 
                        ? registerErrors.displayName.message 
                        : 'Display name is required'}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email (Optional)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...registerRegister('email', {
                      pattern: { value: /^\S+@\S+\.\S+$/, message: 'Please enter a valid email' }
                    })}
                    type="email"
                    id="register-email"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your.email@example.com"
                    disabled={isLoading}
                  />
                </div>
                {registerErrors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {typeof registerErrors.email.message === 'string' 
                      ? registerErrors.email.message 
                      : 'Please enter a valid email'}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...registerRegister('password', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'Password must be at least 8 characters' },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/,
                        message: 'Password must contain uppercase, lowercase, number, and special character'
                      }
                    })}
                    type={showPassword ? 'text' : 'password'}
                    id="register-password"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Create secure password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {registerErrors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {typeof registerErrors.password.message === 'string' 
                      ? registerErrors.password.message 
                      : 'Password does not meet requirements'}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="register-confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...registerRegister('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) => value === watchPassword || 'Passwords do not match'
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="register-confirm-password"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirm your password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {registerErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {typeof registerErrors.confirmPassword.message === 'string' 
                      ? registerErrors.confirmPassword.message 
                      : 'Passwords do not match'}
                  </p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  <Users className="w-4 h-4 inline mr-1" />
                  New accounts are created as <strong>Users</strong>. Admin accounts must be created by existing administrators.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    <span>Create Account</span>
                  </>
              )}
            </button>
          </form>
          )}

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              {mode === 'login' ? "Don't have an account? " : 
               mode === 'register' ? "Already have an account? " : 
               "Need user access? "}
              <button
                type="button"
                onClick={() => handleModeChange(
                  mode === 'login' ? 'register' : 
                  mode === 'register' ? 'login' : 'login'
                )}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                {mode === 'login' ? 'Register here' : 
                 mode === 'register' ? 'Sign in here' : 'User login'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 