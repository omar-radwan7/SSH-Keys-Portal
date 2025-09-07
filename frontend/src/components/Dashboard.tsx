import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Key, Trash2, Plus, Download, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SSHKey } from '../types';
import apiService from '../services/api';
import ImportKeyModal from './ImportKeyModal';
import GenerateKeyModal from './GenerateKeyModal';
import ClientGenerateKeyModal from './ClientGenerateKeyModal';
import LanguageSelector from './LanguageSelector';
import i18n from '../services/i18n';

const Dashboard: React.FC = () => {
  const { state: authState, logout } = useAuth();
  const [keys, setKeys] = useState<SSHKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showClientGenerateModal, setShowClientGenerateModal] = useState(false);
  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    loadKeys();
  }, []);

  // Listen for language changes and force re-render
  useEffect(() => {
    const handleLanguageChange = (language: any, direction: any) => {
      setRenderKey(prev => prev + 1); // Force re-render when language changes
    };

    i18n.addLanguageChangeListener(handleLanguageChange);
    
    return () => {
      i18n.removeLanguageChangeListener(handleLanguageChange);
    };
  }, []);

  const loadKeys = async () => {
    try {
      const response = await apiService.getMyKeys();
      console.log('Keys API response:', response); // Debug log
      if (response.success && response.data) {
        // Handle new API response structure
        const keysData = (response.data as any).keys || response.data;
        console.log('Keys data:', keysData); // Debug log
        setKeys(Array.isArray(keysData) ? keysData : []);
      }
    } catch (error) {
      console.error('Failed to load keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!window.confirm(i18n.t('dashboard.confirmRevoke'))) {
      return;
    }

    try {
      const response = await apiService.revokeKey(keyId);
      if (response.success) {
        setKeys(keys.filter(key => key.id !== keyId));
        alert(i18n.t('dashboard.keyRevoked'));
      } else {
        alert(`Error: ${response.message}`);
      }
    } catch (error) {
      alert('Failed to revoke key');
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
    <div className="min-h-screen bg-gray-50" key={renderKey}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Key className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">{i18n.t('app.title')}</h1>
            </div>
            <div className="flex items-center space-x-4">
              {authState.user?.role === 'admin' && (
                <Link to="/admin" className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium">
                  {i18n.t('nav.admin')}
                </Link>
              )}
              <span className="text-sm text-gray-600">
                {i18n.t('auth.welcome').replace('{name}', authState.user?.display_name || authState.user?.username || '')}
              </span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {authState.user?.role}
              </span>
              <button
                onClick={logout}
                className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-md text-sm font-medium"
              >
                {i18n.t('auth.logout')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">{i18n.t('dashboard.mySSHKeys')}</h2>
          <LanguageSelector />
        </div>

        {/* SSH Keys List */}
        {keys.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Key className="mx-auto w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{i18n.t('dashboard.noSSHKeys')}</h3>
            <p className="text-gray-600 mb-6">{i18n.t('dashboard.getStarted')}</p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setShowImportModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                {i18n.t('dashboard.importKey')}
              </button>
              <button
                onClick={() => setShowClientGenerateModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                {i18n.t('dashboard.generateClientKey')}
              </button>
              <button
                onClick={() => setShowGenerateModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                {i18n.t('dashboard.generateServerKey')}
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
                      {i18n.t('dashboard.algorithm')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {i18n.t('dashboard.status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {i18n.t('dashboard.expires')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {i18n.t('dashboard.created')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {i18n.t('dashboard.actions')}
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
                        {key.expires_at ? formatDate(key.expires_at) : i18n.t('dashboard.never')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatDate(key.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRevokeKey(key.id)}
                          className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50"
                          title={i18n.t('dashboard.revokeKey')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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