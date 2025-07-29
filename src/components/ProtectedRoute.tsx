
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '@/services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authService.getSession();
        if (!session) {
          setIsAuthenticated(false);
          return;
        }

        // Try to get user profile to verify session is still valid
        const user = await authService.getCurrentUser();
        if (!user) {
          setIsAuthenticated(false);
          return;
        }

        setIsAuthenticated(true);
        setIsAdmin(user.role === 'admin');
      } catch (error) {
        // Session is invalid or expired
        await authService.logout();
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // Still loading
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Memverifikasi autentikasi...</span>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Admin route but user is not admin
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
