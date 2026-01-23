
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authService } from '@/services/authService';
import { forceLogoutToLogin, getTokenExpMs, isTokenExpired, parseJwt } from '@/utils/authSession';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'member' | 'reseller';
  phoneNumber?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
  refreshUser: () => void;
  updateToken: (newToken: string) => void;
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
  const logoutTimerRef = useRef<number | null>(null);

  const clearLogoutTimer = () => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  };

  const scheduleLogout = (token: string) => {
    clearLogoutTimer();
    const expMs = getTokenExpMs(token);
    if (!expMs) return;
    const toleranceMs = 5000;
    const remainingMs = expMs - Date.now() - toleranceMs;
    if (remainingMs <= 0) {
      forceLogoutToLogin('token_expired');
      return;
    }
    logoutTimerRef.current = window.setTimeout(() => {
      forceLogoutToLogin('token_expired');
    }, remainingMs);
  };

  // Simplified token parsing function
  const parseTokenAndSetUser = (token: string | null) => {
    if (!token) {
      setUser(null);
      clearLogoutTimer();
      return;
    }
    const payload = parseJwt(token);
    if (!payload || !payload.id || !payload.username || !payload.email) {
      console.error('AuthContext: Failed to parse token, clearing user state.');
      localStorage.removeItem('auth_token');
      setUser(null);
      clearLogoutTimer();
      return;
    }
    if (isTokenExpired(token)) {
      forceLogoutToLogin('token_expired_on_load');
      return;
    }

    // The token is the source of truth. If role is missing, it's a backend issue.
    if (!payload.role) {
      console.error('AuthContext: Role is missing in the JWT payload!');
    }
    const userData: User = {
      id: payload.id,
      username: payload.username,
      email: payload.email,
      role: payload.role || 'member', // Fallback to member if role is missing
      phoneNumber: payload.phoneNumber,
    };
    setUser(userData);
    scheduleLogout(token);
    console.log('AuthContext: User state updated with role:', userData.role);
  };

  // Simplified refreshUser, only for initial load
  const refreshUser = () => {
    console.log('AuthContext: Initializing user state from token');
    setIsLoading(true);
    const token = localStorage.getItem('auth_token');
    parseTokenAndSetUser(token);
    setIsLoading(false);
  };

  // The single, authoritative function to update the token
  const updateToken = (newToken: string) => {
    console.log('AuthContext: Updating token and user state.');
    localStorage.setItem('auth_token', newToken);
    parseTokenAndSetUser(newToken);
  };

  const logout = () => {
    console.log('AuthContext: Logging out user');
    authService.logout(); // This service handles removing the token from storage
    setUser(null);
    clearLogoutTimer();
  };

  useEffect(() => {
    // On initial load, read token from storage
    refreshUser();

    // Listen for storage changes to sync across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        console.log('AuthContext: Storage event detected for auth_token');
        if (e.newValue) {
          // A token was added or updated in another tab
          updateToken(e.newValue);
        } else {
          // The token was removed in another tab (logout)
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearLogoutTimer();
    };
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    logout,
    // Expose a generic refresh function that just re-reads from storage
    // This is less error-prone than the previous complex refresh
    refreshUser: () => parseTokenAndSetUser(localStorage.getItem('auth_token')),
    updateToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
