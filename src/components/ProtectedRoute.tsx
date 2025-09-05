
import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, isLoading: authLoading, updateToken } = useAuth();
  
  const [isChecking, setIsChecking] = useState(true);
  const [isProcessingToken, setIsProcessingToken] = useState(false);

  console.log('ProtectedRoute: Rendering with state:', { 
    hasUser: !!user, 
    isAuthenticated: !!user, 
    authLoading, 
    isChecking,
    isProcessingToken,
    currentPath: window.location.pathname 
  });

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
            
            toast({
              title: "Login berhasil",
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
            toast({
              title: "Token tidak valid",
              description: "Silakan coba login kembali.",
              variant: "destructive"
            });
            localStorage.removeItem('auth_token');
            navigate('/login', { replace: true });
            setIsProcessingToken(false);
            return;
          }
        } catch (error) {
          console.error('ProtectedRoute: Error processing token:', error);
          toast({
            title: "Error",
            description: "Terjadi kesalahan saat memproses login. Silakan coba lagi.",
            variant: "destructive"
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
        const token = localStorage.getItem('token'); // Use 'token' not 'auth_token'
        
        if (!token) {
          console.log('ProtectedRoute: No token, redirecting to login');
          navigate('/login', { replace: true });
        } else if (!isValidToken(token)) {
          console.log('ProtectedRoute: Invalid token, clearing and redirecting');
          localStorage.removeItem('token');
          navigate('/login', { replace: true });
        } else if (!user) {
          console.log('ProtectedRoute: Valid token but no user, waiting for AuthContext...');
          // Wait a bit more for AuthContext to process the token
          setTimeout(() => {
            const stillNoUser = !user;
            console.log('ProtectedRoute: After wait, still no user:', stillNoUser);
            if (stillNoUser) {
              setIsChecking(false);
            }
          }, 1000);
          return; // Don't set isChecking to false yet
        } else {
          console.log('ProtectedRoute: User authenticated');
        }
        
        setIsChecking(false);
      }
    };

    processTokenAndCheckAuth();

    // Also listen for storage changes (logout from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') { // Use 'token' not 'auth_token'
        console.log('ProtectedRoute: Token changed in storage');
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
    console.log('ProtectedRoute: No user, checking token existence...');
    const token = localStorage.getItem('token');
    if (token && isValidToken(token)) {
      console.log('ProtectedRoute: Token exists but user not loaded, showing loading');
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }
    console.log('ProtectedRoute: No valid token and no user, returning null');
    return null;
  }

  console.log('ProtectedRoute: User authenticated, rendering children');
  return <>{children}</>;
};

export default ProtectedRoute;
