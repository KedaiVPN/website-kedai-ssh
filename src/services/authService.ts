import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
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

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirm: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: UserProfile;
}

class AuthService {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      if (data.password !== data.confirm) {
        return { success: false, message: 'Password tidak cocok' };
      }

      // Check if username already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', data.username)
        .single();

      if (existingUser) {
        return { success: false, message: 'Username sudah digunakan' };
      }

      // Register with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) {
        return { success: false, message: authError.message };
      }

      if (authData.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            username: data.username,
            email: data.email,
            password_hash: '', // Handled by Supabase Auth
            role: 'user',
            auth_provider: 'local'
          });

        if (profileError) {
          return { success: false, message: 'Gagal membuat profile pengguna' };
        }

        return { 
          success: true, 
          message: 'Registrasi berhasil! Silakan login.' 
        };
      }

      return { success: false, message: 'Registrasi gagal' };
    } catch (error) {
      return { success: false, message: 'Terjadi kesalahan sistem' };
    }
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (error) {
        return { success: false, message: 'Email atau password salah' };
      }

      if (authData.user) {
        const userProfile = await this.getProfile(authData.user.id);
        return { 
          success: true, 
          message: 'Login berhasil', 
          user: userProfile 
        };
      }

      return { success: false, message: 'Login gagal' };
    } catch (error) {
      return { success: false, message: 'Terjadi kesalahan sistem' };
    }
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  async getProfile(userId?: string): Promise<UserProfile | null> {
    try {
      const currentUser = await supabase.auth.getUser();
      const targetUserId = userId || currentUser.data.user?.id;

      if (!targetUserId) return null;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        username: data.username,
        email: data.email,
        role: data.role as 'user' | 'admin',
        auth_provider: data.auth_provider as 'local' | 'google',
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      return null;
    }
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<AuthResponse> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, message: 'User tidak ditemukan' };
      }

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.user.id);

      if (error) {
        return { success: false, message: 'Gagal memperbarui profile' };
      }

      return { success: true, message: 'Profile berhasil diperbarui' };
    } catch (error) {
      return { success: false, message: 'Terjadi kesalahan sistem' };
    }
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return this.getProfile(user.id);
  }

  async getSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  isAuthenticated(): boolean {
    return localStorage.getItem('sb-jnschatsdyparlzsxqhd-auth-token') !== null;
  }

  getGoogleLoginUrl(): string {
    return '/auth/google'; // This will need to be implemented later if needed
  }

  // Legacy compatibility methods
  getStoredUser(): UserProfile | null {
    // This will be handled by Supabase session management
    return null;
  }

  getToken(): string | null {
    return localStorage.getItem('sb-jnschatsdyparlzsxqhd-auth-token');
  }

  // Legacy compatibility - setUsername method
  async setUsername(data: { username: string; email: string }): Promise<AuthResponse> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, message: 'User tidak ditemukan' };
      }

      const { error } = await supabase
        .from('users')
        .update({ username: data.username })
        .eq('id', user.user.id);

      if (error) {
        return { success: false, message: 'Gagal memperbarui username' };
      }

      const updatedProfile = await this.getProfile(user.user.id);
      return { 
        success: true, 
        message: 'Username berhasil diperbarui',
        user: updatedProfile
      };
    } catch (error) {
      return { success: false, message: 'Terjadi kesalahan sistem' };
    }
  }
}

export const authService = new AuthService();