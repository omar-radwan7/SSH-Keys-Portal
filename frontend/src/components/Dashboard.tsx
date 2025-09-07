import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { SSHKey } from '../types';
import apiService from '../services/api';
import { Key, Plus, Trash2, Download, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Lock, User as UserIcon } from 'lucide-react';
import ImportKeyModal from './ImportKeyModal';
import GenerateKeyModal from './GenerateKeyModal';
import ClientGenerateKeyModal from './ClientGenerateKeyModal';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { state: authState, logout } = useAuth();
  const [keys, setKeys] = useState<SSHKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showClientGenerateModal, setShowClientGenerateModal] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [accountMsg, setAccountMsg] = useState<string>('');
  const [accountErr, setAccountErr] = useState<string>('');

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    try {
      const response = await apiService.getMyKeys();
      if (response.success && response.data) {
        setKeys(response.data);
      }
    } catch (error) {
      console.error('Failed to load keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!window.confirm('Are you sure you want to revoke this SSH key?')) {
      return;
    }

    try {
      await apiService.revokeKey(keyId);
      await loadKeys(); // Refresh keys list
    } catch (error) {
      console.error('Failed to revoke key:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'expired':
        return <Clock className="w-5 h-5 text-orange-500" />;
      case 'deprecated':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'revoked':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Key className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">SSH Key Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              {authState.user?.role === 'admin' && (
                <button
                  onClick={() => setShowAccountSettings(!showAccountSettings)}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md text-sm font-medium"
                >
                  Account
                </button>
              )}
              {authState.user?.role === 'admin' && (
                <Link to="/admin" className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium">
                  Admin
                </Link>
              )}
              <span className="text-sm text-gray-600">
                Welcome, {authState.user?.display_name}
              </span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {authState.user?.role}
              </span>
              <button
                onClick={logout}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showAccountSettings && (
          <div className="mb-8 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h3>
            {accountErr && (
              <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{accountErr}</div>
            )}
            {accountMsg && (
              <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">{accountMsg}</div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-800 mb-2 flex items-center"><UserIcon className="w-4 h-4 mr-2" /> Change Username</h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="New username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="password"
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={async () => {
                      setAccountErr(''); setAccountMsg('');
                      try {
                        const res = await apiService.updateMyUsername(newUsername, currentPassword);
                        if (res.success && res.data) {
                          const { token, user } = res.data as any;
                          localStorage.setItem('auth_token', token);
                          localStorage.setItem('user', JSON.stringify(user));
                          setAccountMsg('Username updated');
                        } else {
                          setAccountErr(res.message || 'Failed to update username');
                        }
                      } catch (e: any) {
                        setAccountErr(e.response?.data?.detail || 'Failed to update username');
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  >
                    Save Username
                  </button>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2 flex items-center"><Lock className="w-4 h-4 mr-2" /> Change Password</h4>
                <div className="space-y-2">
                  <input
                    type="password"
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={async () => {
                      setAccountErr(''); setAccountMsg('');
                      try {
                        const res = await apiService.updateMyPassword(currentPassword, newPassword);
                        if (res.success) {
                          setAccountMsg('Password updated');
                          setNewPassword('');
                        } else {
                          setAccountErr(res.message || 'Failed to update password');
                        }
                      } catch (e: any) {
                        setAccountErr(e.response?.data?.detail || 'Failed to update password');
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  >
                    Save Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">My SSH Keys</h2>
        </div>

        {/* SSH Keys List */}
        {keys.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Key className="mx-auto w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No SSH Keys</h3>
            <p className="text-gray-600 mb-6">Get started by importing or generating your first SSH key.</p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setShowImportModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Import Key
              </button>
              <button
                onClick={() => setShowClientGenerateModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Generate Key (Client)
              </button>
              <button
                onClick={() => setShowGenerateModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Generate Key (Server)
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Key Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expires
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {keys.map((key) => (
                    <tr key={key.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {key.algorithm} ({key.bit_length} bits)
                          </div>
                          <div className="text-sm text-gray-500 font-mono">
                            {key.fingerprint_sha256.substring(0, 16)}...
                          </div>
                          {key.comment && (
                            <div className="text-sm text-gray-600 mt-1">{key.comment}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(key.status)}
                          <span className="text-sm text-gray-900 capitalize">{key.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {key.expires_at ? formatDate(key.expires_at) : 'Never'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatDate(key.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {key.status === 'active' && (
                          <button
                            onClick={() => handleRevokeKey(key.id)}
                            className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50"
                            title="Revoke Key"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Add Key Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Import Key</span>
                </button>
                <button
                  onClick={() => setShowClientGenerateModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
                >
                  <Key className="w-4 h-4" />
                  <span>Generate Key (Client)</span>
                </button>
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Generate Key (Server)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {showImportModal && (
        <ImportKeyModal
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false);
            loadKeys();
          }}
        />
      )}

      {showGenerateModal && (
        <GenerateKeyModal
          onClose={() => setShowGenerateModal(false)}
          onSuccess={() => {
            setShowGenerateModal(false);
            loadKeys();
          }}
        />
      )}

      {showClientGenerateModal && (
        <ClientGenerateKeyModal
          onClose={() => setShowClientGenerateModal(false)}
          onSuccess={() => {
            setShowClientGenerateModal(false);
            loadKeys();
          }}
        />
      )}
    </div>
  );
  };
  
  export default Dashboard; 