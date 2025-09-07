
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/services/authService';
import { balanceService } from '@/services/balanceService';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'member' | 'reseller';
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

  // Simplified token parsing function
  const parseTokenAndSetUser = (token: string | null) => {
    if (!token) {
      setUser(null);
      return;
    }
    try {
      console.log('AuthContext: Parsing token and setting user');
      const payload = JSON.parse(atob(token.split('.')[1]));
      // The token is the source of truth. If role is missing, it's a backend issue.
      if (!payload.role) {
        console.error('AuthContext: Role is missing in the JWT payload!');
      }
      const userData: User = {
        id: payload.id,
        username: payload.username,
        email: payload.email,
        role: payload.role || 'member', // Fallback to member if role is missing
      };
      setUser(userData);
      console.log('AuthContext: User state updated with role:', userData.role);
    } catch (error) {
      console.error('AuthContext: Failed to parse token, clearing user state.', error);
      setUser(null);
      // Also clear the invalid token from storage
      localStorage.removeItem('auth_token');
    }
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
