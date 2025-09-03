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
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async login(username: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> {
    const allowTest = (process.env.REACT_APP_ALLOW_TEST_LOGIN === 'true') && process.env.NODE_ENV !== 'production';
    const path = allowTest ? '/auth/test-login' : '/auth/login';

    const response: AxiosResponse<ApiResponse<{ token: string; user: User }>> = await this.api.post(path, {
      username,
      password,
    });
    return response.data;
  }

  async logout(): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.api.post('/auth/logout');
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
  async applyAuthorizedKeys(username: string): Promise<ApiResponse<{ applied: any[]; checksum: string }>> {
    const response: AxiosResponse<ApiResponse<{ applied: any[]; checksum: string }>> = await this.api.post(`/admin/apply`, null, {
      params: { username },
    });
    return response.data;
  }
}

export default new ApiService(); 