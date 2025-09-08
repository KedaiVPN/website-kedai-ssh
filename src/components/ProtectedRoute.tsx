
import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isLoading: authLoading, updateToken } = useAuth();
  
  const [isChecking, setIsChecking] = useState(true);
  const [isProcessingToken, setIsProcessingToken] = useState(false);

  // Helper function to validate token format
  const isValidToken = (token: string): boolean => {
    try {
      if (token.length < 10) return false;
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      // Try to parse the payload
      const payload = JSON.parse(atob(parts[1]));
      return !!(payload.id && payload.username && payload.email);
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const processTokenAndCheckAuth = async () => {
      console.log('ProtectedRoute: Starting authentication check');
      
      // First check if there's a token in URL (from Google OAuth callback)
      const tokenFromUrl = searchParams.get('token');
      
      if (tokenFromUrl && !isProcessingToken) {
        console.log('ProtectedRoute: Processing token from URL');
        setIsProcessingToken(true);
        
        try {
          // Validate token format properly
          if (isValidToken(tokenFromUrl)) {
            // Use updateToken from AuthContext to properly handle the new token
            updateToken(tokenFromUrl);
            console.log('ProtectedRoute: Token updated via AuthContext');
            
            toast.success("Login berhasil", {
              description: "Selamat datang kembali! Anda telah berhasil login.",
            });

            // Clean URL by removing token parameter
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.delete('token');
            
            // Update URL without token parameter
            const newUrl = newSearchParams.toString() 
              ? `${location.pathname}?${newSearchParams.toString()}` 
              : location.pathname;
            
            console.log('ProtectedRoute: Cleaning URL');
            navigate(newUrl, { replace: true });
            
            setIsChecking(false);
            setIsProcessingToken(false);
            return;
          } else {
            console.error('ProtectedRoute: Invalid token format');
            toast.error("Token tidak valid", {
              description: "Silakan coba login kembali.",
            });
            localStorage.removeItem('auth_token');
            navigate('/login', { replace: true });
            setIsProcessingToken(false);
            return;
          }
        } catch (error) {
          console.error('ProtectedRoute: Error processing token:', error);
          toast.error("Error", {
            description: "Terjadi kesalahan saat memproses login. Silakan coba lagi.",
          });
          localStorage.removeItem('auth_token');
          navigate('/login', { replace: true });
          setIsProcessingToken(false);
          return;
        }
      }
      
      // If no token in URL, wait for AuthContext to finish loading
      if (!authLoading) {
        console.log('ProtectedRoute: AuthContext finished loading, user:', !!user);
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          console.log('ProtectedRoute: No token, redirecting to login');
          navigate('/login', { replace: true });
        } else if (!isValidToken(token)) {
          console.log('ProtectedRoute: Invalid token, clearing and redirecting');
          localStorage.removeItem('auth_token');
          navigate('/login', { replace: true });
        } else if (!user) {
          console.log('ProtectedRoute: Valid token but no user, staying in loading');
          // Let AuthContext handle this
        } else {
          console.log('ProtectedRoute: User authenticated');
        }
        
        setIsChecking(false);
      }
    };

    processTokenAndCheckAuth();

    // Also listen for storage changes (logout from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        console.log('ProtectedRoute: Auth token changed in storage');
        if (!e.newValue) {
          // Token was removed, AuthContext will handle this
          navigate('/login', { replace: true });
        }
        // For token updates, AuthContext will handle the user state update
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate, location.pathname, searchParams, toast, isProcessingToken, authLoading, user, updateToken]);

  // Show loading while checking, processing token, or AuthContext is loading
  if (isChecking || isProcessingToken || authLoading) {
    let loadingMessage = 'Checking authentication...';
    if (isProcessingToken) loadingMessage = 'Memproses login...';
    else if (authLoading) loadingMessage = 'Loading user data...';
    
    console.log('ProtectedRoute: Loading -', loadingMessage);
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  // Don't render if no user (will redirect or still loading)
  if (!user) {
    console.log('ProtectedRoute: No user, not rendering children');
    return null;
  }

  console.log('ProtectedRoute: User authenticated, rendering children');
  return <>{children}</>;
};

export default ProtectedRoute;
