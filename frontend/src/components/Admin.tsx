import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Settings, Shield, Users, Server, Key, AlertCircle, CheckCircle, Lock, Eye, EyeOff, LogOut } from 'lucide-react';
import AdminUserManagement from './AdminUserManagement';
import LanguageSelector from './LanguageSelector';
import i18n from '../services/i18n';

type ManagedHost = { id: string; hostname: string; address: string; os_family: string };

const Admin: React.FC = () => {
  const { state: authState, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'hosts' | 'users' | 'settings'>('users');
  const [hosts, setHosts] = useState<ManagedHost[]>([]);
  const [userStats, setUserStats] = useState({ total: 0, active: 0, inactive: 0, new: 0 });
  const [keyStats, setKeyStats] = useState({ total: 0, active: 0 });
  const [hostStats, setHostStats] = useState({ total: 0, active: 0 });
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

  const [emailForm, setEmailForm] = useState({ currentPassword: '', newEmail: '' });
  const [emailMsg, setEmailMsg] = useState<{type:'success'|'error', text:string}|null>(null);

  const load = async () => {
    try {
      const r = await api.getManagedHosts();
      if (r.success && r.data) {
        const list = (r.data as any).hosts || (r.data as any);
        setHosts(list as ManagedHost[]);
        // Update host stats
        setHostStats({ 
          total: list.length, 
          active: list.length // Assume all hosts are active for now
        });
      }
    } catch {}
  };

  const loadStats = async () => {
    try {
      // Load user stats
      const userResponse = await api.getUsers();
      if (userResponse.success && userResponse.data) {
        const users = userResponse.data.users || [];
        const stats = {
          total: users.length,
          active: users.filter((u: any) => u.status === 'active').length,
          inactive: users.filter((u: any) => u.status === 'inactive').length,
          new: users.filter((u: any) => u.status === 'new').length,
        };
        setUserStats(stats);
      }
      
      // Load real SSH key stats
      try {
        const keyResponse = await api.getAdminMetrics();
        if (keyResponse.success && keyResponse.data) {
          const keyData = keyResponse.data;
          setKeyStats({ 
            total: keyData.total_keys || 0, 
            active: keyData.active_keys || 0 
          });
        }
      } catch (keyError) {
        // If metrics endpoint fails, try to get basic count
        setKeyStats({ total: 0, active: 0 });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  useEffect(() => { 
    load(); 
    loadStats();
  }, []);

  const addHost = async () => {
    setMessage('');
    try {
      await api.addManagedHost(hostname, address, osFamily);
      setMessage(`Host '${hostname}' added successfully!`);
      setHostname('hpc-node-1'); // Reset form
      setAddress('10.0.0.10');
      setOsFamily('linux');
      await load();
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to add host';
      if (errorMsg.includes('already exists')) {
        setMessage(`Error: Hostname '${hostname}' already exists. Please use a different hostname.`);
      } else {
        setMessage(`Error: ${errorMsg}`);
      }
    }
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
      setPasswordMessage({type: 'error', text: i18n.t('a11y.error')});
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage({type: 'error', text: i18n.t('a11y.error')});
      return;
    }

    try {
      const r = await api.updateMyPassword(passwordForm.currentPassword, passwordForm.newPassword);
      if (r.success) {
        setPasswordMessage({type: 'success', text: i18n.t('success')});
        setPasswordForm({currentPassword: '', newPassword: '', confirmPassword: ''});
        setTimeout(() => {
          setShowPasswordChange(false);
          setPasswordMessage(null);
        }, 2000);
      } else {
        setPasswordMessage({type: 'error', text: r.message || i18n.t('error')});
      }
    } catch (error) {
      setPasswordMessage({type: 'error', text: i18n.t('error')});
    }
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMsg(null);
    try {
      const r = await api.updateMyEmail(emailForm.currentPassword, emailForm.newEmail);
      if (r.success) {
        setEmailMsg({type:'success', text:'Email updated successfully'});
        setEmailForm({ currentPassword: '', newEmail: '' });
      } else {
        setEmailMsg({type:'error', text: r.message || 'Failed to update email'});
      }
    } catch (err: any) {
      setEmailMsg({type:'error', text: err.response?.data?.detail || 'Failed to update email'});
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
              <button
                onClick={logout}
                className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
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
                activeTab === 'overview' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>{i18n.t('admin.overview')}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('hosts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'hosts' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Server className="w-4 h-4" />
                <span>{i18n.t('admin.hosts')}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>{i18n.t('admin.users')}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>{i18n.t('nav.settings')}</span>
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
                      <dt className="text-sm font-medium text-gray-500 truncate">{i18n.t('admin.managedHosts')}</dt>
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
                      <dt className="text-sm font-medium text-gray-500 truncate">{i18n.t('admin.activeUsers')}</dt>
                      <dd className="text-lg font-medium text-gray-900">{userStats.active}</dd>
                      <dd className="text-xs text-gray-400">
                        {userStats.total} {i18n.t('admin.total')} • {userStats.new} {i18n.t('admin.new')} • {userStats.inactive} {i18n.t('admin.inactive')}
                      </dd>
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
                      <dt className="text-sm font-medium text-gray-500 truncate">{i18n.t('admin.sshKeys')}</dt>
                      <dd className="text-lg font-medium text-gray-900">{keyStats.active}</dd>
                      <dd className="text-xs text-gray-400">{keyStats.total} {i18n.t('admin.total')}</dd>
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
              <h2 className="text-lg font-medium text-gray-900 mb-4">{i18n.t('admin.addManagedHost')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input 
                  className="border border-gray-300 rounded-lg px-3 py-2" 
                  value={hostname} 
                  onChange={e=>setHostname(e.target.value)} 
                  placeholder={i18n.t('admin.hostname')} 
                />
                <input 
                  className="border border-gray-300 rounded-lg px-3 py-2" 
                  value={address} 
                  onChange={e=>setAddress(e.target.value)} 
                  placeholder={i18n.t('admin.ipAddress')} 
                />
                <input 
                  className="border border-gray-300 rounded-lg px-3 py-2" 
                  value={osFamily} 
                  onChange={e=>setOsFamily(e.target.value)} 
                  placeholder={i18n.t('admin.osFamily')} 
                />
                <button 
                  onClick={addHost} 
                  className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 font-medium"
                >
                  {i18n.t('admin.addHost')}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">{i18n.t('admin.applySshKeys')}</h2>
              <div className="flex gap-4">
                <input 
                  className="border border-gray-300 rounded-lg px-3 py-2 flex-1" 
                  value={username} 
                  onChange={e=>setUsername(e.target.value)} 
                  placeholder={i18n.t('Username')} 
                />
                <button 
                  onClick={apply} 
                  className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 font-medium"
                >
                  {i18n.t('admin.applyKeys')}
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
                <h2 className="text-lg font-medium text-gray-900">{i18n.t('admin.managedHosts')} ({hosts.length})</h2>
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
                    {i18n.t('admin.noManagedHosts')}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <AdminUserManagement />
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">{i18n.t('nav.settings')}</h3>
              <LanguageSelector />
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">{i18n.t('auth.changePassword')}</h2>
                <button
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>{i18n.t('auth.changePassword')}</span>
                </button>
              </div>
              {showPasswordChange && (
                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e)=>setPasswordForm({...passwordForm, currentPassword:e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10"
                        placeholder="Enter current password"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e)=>setPasswordForm({...passwordForm, newPassword:e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10"
                        placeholder="Enter new password"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={(e)=>setPasswordForm({...passwordForm, confirmPassword:e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10"
                        placeholder="Confirm new password"
                        required
                      />
                    </div>
                  </div>
                  {passwordMessage && (
                    <div className={`p-3 rounded-lg text-sm ${passwordMessage.type==='success'?'text-green-700 bg-green-50 border border-green-200':'text-red-700 bg-red-50 border border-red-200'}`}>{passwordMessage.text}</div>
                  )}
                  <div className="flex space-x-3">
                    <button type="submit" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Update Password</button>
                    <button type="button" onClick={()=>{setShowPasswordChange(false); setPasswordForm({currentPassword:'',newPassword:'',confirmPassword:''}); setPasswordMessage(null);}} className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">{i18n.t('Cancel')}</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin; 