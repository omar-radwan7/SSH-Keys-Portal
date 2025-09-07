import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse, User, SSHKey, PolicyRules, AuditEvent, ManagedHost, KeyPreview } from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: '/api/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          const url = error.config?.url || '';
          const isAdminApi = url.includes('/admin/');
          // Auto-logout on 401 for non-admin APIs (kicks deleted/expired user sessions immediately)
          if (!isAdminApi) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return Promise.reject(error);
          }
          // For admin APIs, do not auto-logout; allow UI to handle gracefully
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async login(username: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> {
    // Try regular login first for real user accounts
    try {
      const response: AxiosResponse<ApiResponse<{ token: string; user: User }>> = await this.api.post('/auth/login', {
        username,
        password,
      });
      return response.data;
    } catch (error: any) {
      // If regular login fails and it's admin/admin, try test-login as fallback
      if (username === 'admin' && password === 'admin') {
        try {
          const testResponse: AxiosResponse<ApiResponse<{ token: string; user: User }>> = await this.api.post('/auth/test-login', {
            username,
            password,
          });
          return testResponse.data;
        } catch (testError) {
          // If both fail, return the original error
          throw error;
        }
      }
      // For all other cases, throw the original error
      throw error;
    }
  }

  async logout(): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.api.post('/auth/logout');
    return response.data;
  }

  async register(userData: {
    username: string;
    password: string;
    email?: string;
    displayName: string;
  }): Promise<ApiResponse<{ token: string; user: User }>> {
    const response: AxiosResponse<ApiResponse<{ token: string; user: User }>> = await this.api.post('/auth/register', {
      username: userData.username,
      password: userData.password,
      email: userData.email && userData.email.trim() !== '' ? userData.email : undefined,
      displayName: userData.displayName,
    });
    return response.data;
  }

  async updateMyUsername(newUsername: string, currentPassword: string): Promise<ApiResponse<{ token: string; user: User }>> {
    const response: AxiosResponse<ApiResponse<{ token: string; user: User }>> = await this.api.put('/auth/change-username', {
      newUsername,
      currentPassword,
    });
    return response.data;
  }

  async updateMyPassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.api.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  }

  async updateMyEmail(currentPassword: string, newEmail: string): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.api.put('/auth/change-email', {
      currentPassword,
      newEmail,
    });
    return response.data;
  }

  // SSH Keys
  async getMyKeys(): Promise<ApiResponse<SSHKey[]>> {
    const response: AxiosResponse<ApiResponse<SSHKey[]>> = await this.api.get('/me/keys');
    return response.data;
  }

  async previewKey(publicKey: string): Promise<ApiResponse<KeyPreview>> {
    const response: AxiosResponse<ApiResponse<KeyPreview>> = await this.api.post('/me/keys/preview', {
      publicKey,
    });
    return response.data;
  }

  async importKey(
    publicKey: string,
    comment?: string,
    expiresAt?: string,
    authorizedKeysOptions?: string
  ): Promise<ApiResponse<SSHKey>> {
    const response: AxiosResponse<ApiResponse<SSHKey>> = await this.api.post('/me/keys', {
      publicKey,
      comment,
      expiresAt,
      authorizedKeysOptions,
    });
    return response.data;
  }

  async generateKey(algorithm: string, bitLength: number): Promise<ApiResponse<{ requestId: string; downloadUrl: string; expiresIn: string }>> {
    const response: AxiosResponse<ApiResponse<{ requestId: string; downloadUrl: string; expiresIn: string }>> = await this.api.post('/me/keys/generate', {
      algorithm,
      bitLength,
    });
    return response.data;
  }

  async revokeKey(keyId: string): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.api.delete(`/me/keys/${keyId}`);
    return response.data;
  }

  async rotateKey(
    keyId: string,
    publicKey: string,
    comment?: string,
    expiresAt?: string,
    authorizedKeysOptions?: string
  ): Promise<ApiResponse<SSHKey>> {
    const response: AxiosResponse<ApiResponse<SSHKey>> = await this.api.post(`/me/keys/${keyId}/rotate`, {
      publicKey,
      comment,
      expiresAt,
      authorizedKeysOptions,
    });
    return response.data;
  }

  async getKeyStatus(): Promise<ApiResponse<{
    host_accounts: any[];
    keys: any[];
    summary: any;
  }>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/me/keys/status');
    return response.data;
  }

  // Admin - Policies
  async getCurrentPolicy(): Promise<ApiResponse<PolicyRules>> {
    const response: AxiosResponse<ApiResponse<PolicyRules>> = await this.api.get('/admin/policies/current');
    return response.data;
  }

  async updatePolicy(policy: PolicyRules): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.api.put('/admin/policies/ssh', policy);
    return response.data;
  }

  // Admin - Managed Hosts
  async getManagedHosts(): Promise<ApiResponse<ManagedHost[]>> {
    const response: AxiosResponse<ApiResponse<ManagedHost[]>> = await this.api.get('/admin/hosts');
    return response.data;
  }

  async addManagedHost(hostname: string, address: string, osFamily: string): Promise<ApiResponse<ManagedHost>> {
    const response: AxiosResponse<ApiResponse<ManagedHost>> = await this.api.post('/admin/hosts', {
      hostname,
      address,
      os_family: osFamily,
    });
    return response.data;
  }

  // Admin - Audit
  async searchAuditEvents(filters: {
    startDate?: string;
    endDate?: string;
    action?: string;
    entity?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<AuditEvent[]>> {
    const response: AxiosResponse<ApiResponse<AuditEvent[]>> = await this.api.get('/admin/audit', {
      params: filters,
    });
    return response.data;
  }

  async exportAuditEvents(format: 'csv' | 'json', filters: {
    startDate?: string;
    endDate?: string;
  }): Promise<string> {
    const response: AxiosResponse<string> = await this.api.get('/admin/audit/export', {
      params: { format, ...filters },
      responseType: 'text',
    });
    return response.data;
  }

  // Admin - Apply
  async queueApplyAll(): Promise<ApiResponse<{ queued_operations: number }>> {
    const response: AxiosResponse<ApiResponse<{ queued_operations: number }>> = await this.api.post('/admin/apply');
    return response.data;
  }

  async queueApplyForUser(userId: string): Promise<ApiResponse<{ queued_operations: number; user_id: string }>> {
    const response: AxiosResponse<ApiResponse<{ queued_operations: number; user_id: string }>> = await this.api.post(`/admin/apply/user/${userId}`);
    return response.data;
  }

  // Admin - Emergency Controls
  async emergencyRevokeByFingerprint(fingerprint: string): Promise<ApiResponse<{ fingerprint: string; revoked_count: number; affected_users: number }>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/admin/revoke/fingerprint', null, {
      params: { fingerprint },
    });
    return response.data;
  }

  // Admin - Metrics and Monitoring
  async getAdminMetrics(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/admin/metrics');
    return response.data;
  }

  async getDeployments(status?: string, hostId?: string, limit?: number): Promise<ApiResponse<{ deployments: any[] }>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/admin/deployments', {
      params: { status, host_id: hostId, limit },
    });
    return response.data;
  }

  // Admin - User Management
  async getUsers(): Promise<ApiResponse<{ users: any[] }>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/admin/users');
    return response.data;
  }

  async adminUpdateUsername(userId: string, newUsername: string): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.api.put(`/admin/users/${userId}/username`, {
      new_username: newUsername,
    });
    return response.data;
  }

  async adminResetPassword(userId: string, newPassword: string): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.api.put(`/admin/users/${userId}/password`, {
      new_password: newPassword,
    });
    return response.data;
  }

  async updateUserRole(userId: string, role: string): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.api.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  }

  async updateUserStatus(userId: string, status: string): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.api.put(`/admin/users/${userId}/status`, { status });
    return response.data;
  }

  async adminDeleteUser(userId: string): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.api.delete(`/admin/users/${userId}`);
    return response.data;
  }

  // Admin - User-Host Account Mapping
  async getUserHostAccounts(): Promise<ApiResponse<{ accounts: any[] }>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/admin/user-host-accounts');
    return response.data;
  }

  async createUserHostAccount(userId: string, hostId: string, remoteUsername: string, status?: string): Promise<ApiResponse<{ account: any }>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/admin/user-host-accounts', {
      user_id: userId,
      host_id: hostId,
      remote_username: remoteUsername,
      status: status || 'active',
    });
    return response.data;
  }

  // Legacy endpoint for backward compatibility
  async applyAuthorizedKeys(username: string): Promise<ApiResponse<{ applied: any[]; checksum: string }>> {
    const response: AxiosResponse<ApiResponse<{ applied: any[]; checksum: string }>> = await this.api.post(`/admin/apply-legacy`, null, {
      params: { username },
    });
    return response.data;
  }

  // Admin User Management
  async createUser(userData: {
    username: string;
    password: string;
    email?: string;
    displayName: string;
    role: 'user' | 'admin';
  }): Promise<ApiResponse<{ user: User }>> {
    const endpoint = userData.role === 'admin' ? '/admin/create-admin' : '/admin/create-user';
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post(endpoint, {
      username: userData.username,
      password: userData.password,
      email: userData.email,
      display_name: userData.displayName,
    });
    return response.data;
  }
}

export default new ApiService(); 