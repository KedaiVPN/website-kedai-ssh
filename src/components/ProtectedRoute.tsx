
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      console.log('ProtectedRoute: Checking authentication');
      
      // Check for token in localStorage
      const token = localStorage.getItem('auth_token');
      console.log('ProtectedRoute: Token found:', !!token);
      
      if (!token) {
        console.log('ProtectedRoute: No token, redirecting to login');
        setIsAuthenticated(false);
        setIsChecking(false);
        navigate('/login', { replace: true });
        return;
      }

      // Token exists, user is authenticated
      console.log('ProtectedRoute: Token exists, user authenticated');
      setIsAuthenticated(true);
      setIsChecking(false);
    };

    // Check immediately
    checkAuth();

    // Also listen for storage changes (logout from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        console.log('ProtectedRoute: Auth token changed in storage');
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate]);

  // Show loading while checking
  if (isChecking) {
    console.log('ProtectedRoute: Still checking authentication');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    console.log('ProtectedRoute: Not authenticated, not rendering children');
    return null;
  }

  console.log('ProtectedRoute: Authenticated, rendering children');
  return <>{children}</>;
};

export default ProtectedRoute;
