export interface User {
  id: string;
  username: string;
  display_name: string;
  role: 'user' | 'admin' | 'auditor';
}

export interface SSHKey {
  id: string;
  user_id: string;
  public_key: string;
  algorithm: string;
  bit_length: number;
  comment: string;
  fingerprint_sha256: string;
  origin: 'import' | 'client_gen' | 'system_gen';
  expires_at?: string;
  status: 'active' | 'deprecated' | 'revoked' | 'expired';
  created_at: string;
  authorized_keys_options?: string;
}

export interface ManagedHost {
  id: string;
  hostname: string;
  address: string;
  os_family: string;
  last_seen_at?: string;
  created_at: string;
}

export interface PolicyRules {
  allowed_algorithms: string[];
  min_key_lengths: Record<string, number>;
  default_ttl_days: number;
  max_keys_per_user: number;
  comment_regex?: string;
  allowed_options: string[];
  expiry_reminder_days: number[];
}

export interface AuditEvent {
  id: string;
  ts: string;
  actor_user_id: string;
  action: string;
  entity: string;
  entity_id: string;
  metadata_json: Record<string, any>;
  source_ip: string;
  user_agent?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface KeyPreview {
  algorithm: string;
  bitLength: number;
  fingerprint: string;
} 