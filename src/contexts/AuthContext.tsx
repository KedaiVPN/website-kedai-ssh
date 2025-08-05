
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/services/authService';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const parseTokenUser = (token: string): User | null => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Enhanced validation
      if (!payload.id || !payload.email || !payload.username) {
        console.error('AuthContext: Invalid token payload structure');
        return null;
      }

      // Check expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        console.error('AuthContext: Token expired');
        return null;
      }

      return {
        id: payload.id,
        username: payload.username,
        email: payload.email
      };
    } catch (error) {
      console.error('AuthContext: Error parsing token:', error);
      return null;
    }
  };

  const refreshUser = async () => {
    console.log('AuthContext: Refreshing user data');
    
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.log('AuthContext: No token found');
        setUser(null);
        setIsLoading(false);
        return;
      }

      const userData = parseTokenUser(token);
      if (!userData) {
        console.log('AuthContext: Invalid token, removing');
        localStorage.removeItem('auth_token');
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Optionally validate with server
      try {
        const isValid = await authService.validateTokenWithServer();
        if (!isValid) {
          console.log('AuthContext: Server validation failed');
          localStorage.removeItem('auth_token');
          setUser(null);
          setIsLoading(false);
          return;
        }
      } catch (serverError) {
        console.warn('AuthContext: Server validation unavailable, using client validation');
      }

      console.log('AuthContext: User data refreshed successfully');
      setUser(userData);
      authService.logAuthEvent('auth_context_refresh_success', { userId: userData.id });
    } catch (error) {
      console.error('AuthContext: Error refreshing user:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
      authService.logAuthEvent('auth_context_refresh_error', { error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log('AuthContext: Logging out user');
    authService.logout();
    setUser(null);
    
    // Force a small delay to ensure state is updated
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
  };

  useEffect(() => {
    refreshUser();

    // Listen for storage changes (logout from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        console.log('AuthContext: Auth token storage changed');
        authService.logAuthEvent('storage_change_detected', { hasNewValue: !!e.newValue });
        
        if (!e.newValue) {
          console.log('AuthContext: Token removed, logging out');
          setUser(null);
        } else {
          console.log('AuthContext: Token updated, refreshing user');
          const userData = parseTokenUser(e.newValue);
          setUser(userData);
        }
      }
    };

    // Listen for focus events to check token validity
    const handleWindowFocus = () => {
      console.log('AuthContext: Window focused, checking auth status');
      if (localStorage.getItem('auth_token') && !authService.isAuthenticated()) {
        console.log('AuthContext: Token invalid on focus, logging out');
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
