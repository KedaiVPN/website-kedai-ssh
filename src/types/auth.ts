
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirm: string;
  phoneNumber: string;
  turnstileToken?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  needsVerification?: boolean;
  token?: string;
  user?: {
    id: string;
    username: string;
    email: string;
    role: 'member' | 'reseller';
  };
}

export interface SetUsernameRequest {
  username: string;
  email: string;
}

export interface SetUsernameResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    username: string;
    email: string;
    role: 'member' | 'reseller';
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    username: string;
    email: string;
    role: 'member' | 'reseller';
  };
}

export interface AuthError {
  success: false;
  message: string;
}
