export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  auth_provider: 'local' | 'google';
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirm: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

export interface SetUsernameRequest {
  username: string;
  email: string;
}

export interface SetUsernameResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

export interface AuthError {
  success: false;
  message: string;
}