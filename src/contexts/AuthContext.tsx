
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

  const detectUserRoleFromPricing = async (userData: Omit<User, 'role'>): Promise<User> => {
    try {
      console.log('AuthContext: Detecting user role from pricing...');
      // Use the calculate cost endpoint to detect role (2 IP, 1 day as test)
      const response = await balanceService.calculateCost(2, 1);
      
      if (response.success && response.data) {
        const detectedRole = response.data.userRole || 'member';
        console.log('AuthContext: Role detected from pricing:', detectedRole);
        
        return {
          ...userData,
          role: detectedRole
        };
      }
    } catch (error) {
      console.error('AuthContext: Error detecting role from pricing:', error);
    }
    
    // Fallback to member if detection fails
    console.log('AuthContext: Falling back to member role');
    return {
      ...userData,
      role: 'member' as const
    };
  };

  const refreshUser = async () => {
    console.log('AuthContext: Refreshing user data');
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      console.log('AuthContext: Token found, parsing user data');
      const userData = parseTokenUser(token);
      
      if (userData) {
        console.log('AuthContext: Parsed user data:', userData);
        
        // If role is missing from token, detect it from pricing
        if (!userData.role || userData.role === undefined) {
          console.log('AuthContext: Role missing from token, detecting from pricing...');
          const userWithRole = await detectUserRoleFromPricing({
            id: userData.id,
            username: userData.username,
            email: userData.email
          });
          setUser(userWithRole);
        } else {
          setUser(userData);
        }
      } else {
        console.log('AuthContext: Failed to parse token, trying to refresh token');
        try {
          // Try to refresh the token to get updated user data
          const refreshResponse = await authService.refreshToken();
          if (refreshResponse.success && refreshResponse.token) {
            console.log('AuthContext: Token refreshed successfully');
            const newUserData = parseTokenUser(refreshResponse.token);
            if (newUserData) {
              // Still detect role from pricing if missing
              if (!newUserData.role || newUserData.role === undefined) {
                const userWithRole = await detectUserRoleFromPricing({
                  id: newUserData.id,
                  username: newUserData.username,
                  email: newUserData.email
                });
                setUser(userWithRole);
              } else {
                setUser(newUserData);
              }
            } else {
              setUser(null);
            }
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

  const updateToken = async (newToken: string) => {
    console.log('AuthContext: Updating token programmatically');
    localStorage.setItem('auth_token', newToken);
    const userData = parseTokenUser(newToken);
    if (userData) {
      console.log('AuthContext: Setting new user data from updated token:', userData);
      // If role is missing, detect it from pricing
      if (!userData.role || userData.role === undefined) {
        console.log('AuthContext: Role missing from new token, detecting from pricing...');
        const userWithRole = await detectUserRoleFromPricing({
          id: userData.id,
          username: userData.username,
          email: userData.email
        });
        setUser(userWithRole);
      } else {
        setUser(userData);
      }
    } else {
      console.error('AuthContext: Failed to parse new token');
    }
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
          console.log('AuthContext: Token updated in storage, refreshing user data');
          // Force a full refresh to ensure consistency
          refreshUser();
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
    refreshUser,
    updateToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
