import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User, UserPlus, Shield, Users, Eye, EyeOff, AlertCircle, CheckCircle, Edit2, Trash2, Search, X, Save, Key, AtSign } from 'lucide-react';
import apiService from '../services/api';
import { User as UserType } from '../types';

interface CreateUserForm {
  username: string;
  password: string;
  confirmPassword: string;
  email?: string;
  displayName: string;
  role: 'user' | 'admin';
}

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'admin'>('all');
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<CreateUserForm>({
    defaultValues: {
      role: 'user'
    }
  });

  const watchPassword = watch('password', '');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getUsers();
      if (response.success && response.data) {
        setUsers(response.data.users || []);
      }
    } catch (err: any) {
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (user: UserType) => {
    setEditingUser(user);
    setEditUsername(user.username);
    setEditNewPassword('');
    setShowEditPassword(false);
    setError('');
    setSuccess('');
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');
      // Update username if changed
      if (editUsername.trim() && editUsername.trim() !== editingUser.username) {
        const res = await apiService.adminUpdateUsername(editingUser.id, editUsername.trim());
        if (!res.success) {
          setIsLoading(false);
          setError(res.message || 'Failed to update username');
          return;
        }
      }
      // Reset password if provided
      if (editNewPassword.trim()) {
        const res2 = await apiService.adminResetPassword(editingUser.id, editNewPassword.trim());
        if (!res2.success) {
          setIsLoading(false);
          setError(res2.message || 'Failed to reset password');
          return;
        }
      }
      setSuccess('User updated successfully');
      setEditingUser(null);
      await loadUsers();
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to update user');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: CreateUserForm) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiService.createUser({
        username: data.username,
        password: data.password,
        email: data.email,
        displayName: data.displayName,
        role: data.role
      });

      if (response.success) {
        setSuccess(`${data.role === 'admin' ? 'Admin' : 'User'} account '${data.username}' created successfully!`);
        reset();
        setShowCreateForm(false);
        loadUsers(); // Reload the user list
      } else {
        setError(response.message || 'Failed to create account');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      const response = await apiService.updateUserRole(userId, newRole);
      if (response.success) {
        setSuccess(`User role updated to ${newRole}`);
        loadUsers();
      } else {
        setError('Failed to update user role');
      }
    } catch (err: any) {
      setError('Failed to update user role');
    }
  };

  const handleStatusChange = async (userId: string, newStatus: 'active' | 'disabled') => {
    try {
      const response = await apiService.updateUserStatus(userId, newStatus);
      if (response.success) {
        setSuccess(`User ${newStatus === 'active' ? 'activated' : 'disabled'}`);
        loadUsers();
      } else {
        setError('Failed to update user status');
      }
    } catch (err: any) {
      setError('Failed to update user status');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl ring-1 ring-black/5 overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-100 px-6 py-5 bg-gradient-to-r from-white to-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                <Users className="w-6 h-6 mr-2 text-indigo-600" />
                Admin · Users
              </h2>
              <p className="text-sm text-gray-500 mt-1">Create, search, and manage users and admins</p>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2 shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-700 text-sm">{success}</span>
          </div>
        )}

        {/* Create User Form */}
        {showCreateForm && (
          <div className="border-b border-gray-100 px-6 py-6 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Account</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username *
                  </label>
                  <input
                    {...register('username', {
                      required: 'Username is required',
                      minLength: { value: 3, message: 'Username must be at least 3 characters' },
                      pattern: { value: /^[a-zA-Z0-9_-]+$/, message: 'Username can only contain letters, numbers, hyphens, and underscores' }
                    })}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter username"
                    disabled={isLoading}
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600">
                      {typeof errors.username.message === 'string' 
                        ? errors.username.message 
                        : 'Username is invalid'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name *
                  </label>
                  <input
                    {...register('displayName', { required: 'Display name is required' })}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Full name"
                    disabled={isLoading}
                  />
                  {errors.displayName && (
                    <p className="mt-1 text-sm text-red-600">
                      {typeof errors.displayName.message === 'string' 
                        ? errors.displayName.message 
                        : 'Display name is required'}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (Optional)
                </label>
                <input
                  {...register('email', {
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Please enter a valid email' }
                  })}
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="email@example.com"
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {typeof errors.email.message === 'string' 
                      ? errors.email.message 
                      : 'Please enter a valid email'}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      {...register('password', {
                        required: 'Password is required',
                        minLength: { value: 8, message: 'Password must be at least 8 characters' },
                        pattern: {
                          value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/,
                          message: 'Password must contain uppercase, lowercase, number, and special character'
                        }
                      })}
                      type={showPassword ? 'text' : 'password'}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Create secure password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">
                      {typeof errors.password.message === 'string' 
                        ? errors.password.message 
                        : 'Password does not meet requirements'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      {...register('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: (value) => value === watchPassword || 'Passwords do not match'
                      })}
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Confirm password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {typeof errors.confirmPassword.message === 'string' 
                        ? errors.confirmPassword.message 
                        : 'Passwords do not match'}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      {...register('role')}
                      type="radio"
                      value="user"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      disabled={isLoading}
                    />
                    <span className="ml-2 text-sm text-gray-700 flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      User
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      {...register('role')}
                      type="radio"
                      value="admin"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      disabled={isLoading}
                    />
                    <span className="ml-2 text-sm text-gray-700 flex items-center">
                      <Shield className="w-4 h-4 mr-1" />
                      Admin
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-4 rounded-xl transition-colors flex items-center space-x-2 shadow-sm"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create Account</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    reset();
                    setError('');
                    setSuccess('');
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* User List */}
        <div className="px-6 py-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as 'all' | 'user' | 'admin')}
                className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="user">Users</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                            {user.role === 'admin' ? (
                              <Shield className="h-4 w-4 text-red-600" />
                            ) : (
                              <User className="h-4 w-4 text-indigo-600" />
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.display_name}</div>
                          <div className="text-sm text-gray-500 flex items-center"><AtSign className="w-3 h-3 mr-1" />{user.username}</div>
                          {user.email && (
                            <div className="text-xs text-gray-400">{user.email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as 'user' | 'admin')}
                        className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.status}
                        onChange={(e) => handleStatusChange(user.id, e.target.value as 'active' | 'disabled')}
                        className={`text-sm border rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                          user.status === 'active' 
                            ? 'border-green-300 text-green-700 bg-green-50' 
                            : 'border-red-300 text-red-700 bg-red-50'
                        }`}
                      >
                        <option value="active">Active</option>
                        <option value="disabled">Disabled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-indigo-600 hover:text-indigo-900" onClick={() => openEditModal(user)}>
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filterRole !== 'all' 
                  ? 'Try adjusting your search or filters.' 
                  : 'Get started by creating a new user account.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
              <button onClick={() => setEditingUser(null)} className="p-2 rounded-full hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reset Password</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    value={editNewPassword}
                    onChange={(e) => setEditNewPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Leave blank to keep current"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {error && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{error}</div>
              )}
              {success && (
                <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">{success}</div>
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
              <button onClick={() => setEditingUser(null)} className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800">Cancel</button>
              <button onClick={handleSaveEdit} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center space-x-2">
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement; 