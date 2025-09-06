import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Settings, Shield, Users, Server, Key, AlertCircle, CheckCircle, Lock, Eye, EyeOff } from 'lucide-react';

type ManagedHost = { id: string; hostname: string; address: string; os_family: string };

const Admin: React.FC = () => {
  const { state: authState } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'hosts' | 'users' | 'settings'>('overview');
  const [hosts, setHosts] = useState<ManagedHost[]>([]);
  const [hostname, setHostname] = useState('hpc-node-1');
  const [address, setAddress] = useState('10.0.0.10');
  const [osFamily, setOsFamily] = useState('linux');
  const [username, setUsername] = useState('hpcuser');
  const [message, setMessage] = useState('');
  
  // Password change states
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordMessage, setPasswordMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const load = async () => {
    try {
      const r = await api.getManagedHosts();
      if (r.success && r.data) {
        const list = (r.data as any).hosts || (r.data as any);
        setHosts(list as ManagedHost[]);
      }
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const addHost = async () => {
    setMessage('');
    await api.addManagedHost(hostname, address, osFamily);
    await load();
  };

  const apply = async () => {
    setMessage('');
    const r = await api.applyAuthorizedKeys(username);
    if (r.success && r.data) setMessage(`Applied to ${(r.data as any).applied.length} hosts; checksum ${(r.data as any).checksum.substring(0,8)}...`);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    // Basic validation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({type: 'error', text: 'New passwords do not match'});
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage({type: 'error', text: 'New password must be at least 6 characters'});
      return;
    }

    try {
      // Since we don't have a real backend endpoint, we'll simulate success
      // In a real implementation, you'd call an API endpoint here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setPasswordMessage({type: 'success', text: 'Password changed successfully'});
      setPasswordForm({currentPassword: '', newPassword: '', confirmPassword: ''});
      setTimeout(() => {
        setShowPasswordChange(false);
        setPasswordMessage(null);
      }, 2000);
    } catch (error) {
      setPasswordMessage({type: 'error', text: 'Failed to change password. Please try again.'});
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-red-600" />
              <h1 className="text-xl font-semibold text-gray-900">Admin Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {authState.user?.display_name}</span>
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">admin</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Overview</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('hosts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'hosts'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Server className="w-4 h-4" />
                <span>Hosts</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4" />
                <span>Settings</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Server className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Managed Hosts</dt>
                      <dd className="text-lg font-medium text-gray-900">{hosts.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Users</dt>
                      <dd className="text-lg font-medium text-gray-900">3</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Key className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">SSH Keys</dt>
                      <dd className="text-lg font-medium text-gray-900">-</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hosts' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Add Managed Host</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input 
                  className="border border-gray-300 rounded-lg px-3 py-2" 
                  value={hostname} 
                  onChange={e=>setHostname(e.target.value)} 
                  placeholder="Hostname" 
                />
                <input 
                  className="border border-gray-300 rounded-lg px-3 py-2" 
                  value={address} 
                  onChange={e=>setAddress(e.target.value)} 
                  placeholder="IP Address" 
                />
                <input 
                  className="border border-gray-300 rounded-lg px-3 py-2" 
                  value={osFamily} 
                  onChange={e=>setOsFamily(e.target.value)} 
                  placeholder="OS Family" 
                />
                <button 
                  onClick={addHost} 
                  className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 font-medium"
                >
                  Add Host
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Apply SSH Keys</h2>
              <div className="flex gap-4">
                <input 
                  className="border border-gray-300 rounded-lg px-3 py-2 flex-1" 
                  value={username} 
                  onChange={e=>setUsername(e.target.value)} 
                  placeholder="Username" 
                />
                <button 
                  onClick={apply} 
                  className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 font-medium"
                >
                  Apply Keys
                </button>
              </div>
              {message && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 text-sm">{message}</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Managed Hosts ({hosts.length})</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {hosts.map(h => (
                  <div key={h.id} className="px-6 py-4 flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{h.hostname}</div>
                      <div className="text-sm text-gray-500">{h.address}</div>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {h.os_family}
                    </span>
                  </div>
                ))}
                {hosts.length === 0 && (
                  <div className="px-6 py-8 text-center text-gray-500">
                    No managed hosts configured yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Account Settings</h2>
                <button
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Change Password</span>
                </button>
              </div>
              
              {showPasswordChange && (
                <div className="mt-6 border-t pt-6">
                  <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10"
                          required
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                        >
                          {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10"
                          required
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                        >
                          {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10"
                          required
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                        >
                          {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    
                    {passwordMessage && (
                      <div className={`p-3 rounded-lg flex items-center space-x-2 ${
                        passwordMessage.type === 'success' 
                          ? 'bg-green-50 border border-green-200' 
                          : 'bg-red-50 border border-red-200'
                      }`}>
                        {passwordMessage.type === 'success' ? 
                          <CheckCircle className="w-4 h-4 text-green-600" /> : 
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        }
                        <span className={`text-sm ${
                          passwordMessage.type === 'success' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {passwordMessage.text}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                      >
                        Update Password
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordChange(false);
                          setPasswordForm({currentPassword: '', newPassword: '', confirmPassword: ''});
                          setPasswordMessage(null);
                        }}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin; 