
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/services/authService';

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
      console.log('AuthContext: Parsing token for user data');
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('AuthContext: Token payload:', payload);
      
      const userData = {
        id: payload.id,
        username: payload.username,
        email: payload.email,
        role: payload.role as 'member' | 'reseller'
      };
      
      console.log('AuthContext: Parsed user data:', userData);
      console.log('AuthContext: User role is:', userData.role);
      
      return userData;
    } catch (error) {
      console.error('AuthContext: Error parsing token:', error);
      return null;
    }
  };

  const refreshUser = async () => {
    console.log('AuthContext: Refreshing user data');
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      console.log('AuthContext: Token found, parsing user data');
      const userData = parseTokenUser(token);
      
      if (userData) {
        console.log('AuthContext: Setting user data:', userData);
        setUser(userData);
      } else {
        console.log('AuthContext: Failed to parse token, trying to refresh token');
        try {
          // Try to refresh the token to get updated user data
          const refreshResponse = await authService.refreshToken();
          if (refreshResponse.success && refreshResponse.token) {
            console.log('AuthContext: Token refreshed successfully');
            const newUserData = parseTokenUser(refreshResponse.token);
            setUser(newUserData);
          } else {
            console.log('AuthContext: Token refresh failed, clearing user');
            setUser(null);
          }
        } catch (error) {
          console.error('AuthContext: Error refreshing token:', error);
          setUser(null);
        }
      }
    } else {
      console.log('AuthContext: No token found');
      setUser(null);
    }
    setIsLoading(false);
  };

  const logout = () => {
    console.log('AuthContext: Logging out user');
    authService.logout();
    setUser(null);
  };

  useEffect(() => {
    refreshUser();

    // Listen for storage changes (logout from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        if (!e.newValue) {
          console.log('AuthContext: Token removed from storage, logging out');
          setUser(null);
        } else {
          console.log('AuthContext: Token updated in storage, parsing new data');
          const userData = parseTokenUser(e.newValue);
          setUser(userData);
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
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
