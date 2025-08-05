
import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isProcessingToken, setIsProcessingToken] = useState(false);

  useEffect(() => {
    const processTokenAndCheckAuth = async () => {
      console.log('ProtectedRoute: Starting authentication check');
      
      // First check if there's a token in URL (from Google OAuth callback)
      const tokenFromUrl = searchParams.get('token');
      
      if (tokenFromUrl && !isProcessingToken) {
        console.log('ProtectedRoute: Processing token from URL');
        setIsProcessingToken(true);
        
        try {
          // Validate token format (basic check)
          if (tokenFromUrl.length > 10) {
            localStorage.setItem('auth_token', tokenFromUrl);
            console.log('ProtectedRoute: Token saved to localStorage');
            
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
            
            console.log('ProtectedRoute: Cleaning URL and setting authenticated');
            // Replace URL without token
            navigate(newUrl, { replace: true });
            
            // Set authenticated state
            setIsAuthenticated(true);
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
          return;
        }
      }
      
      // If no token in URL or token processing is done, check localStorage
      console.log('ProtectedRoute: Checking authentication from localStorage');
      
      const token = localStorage.getItem('auth_token');
      console.log('ProtectedRoute: Token found in localStorage:', !!token);
      
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
      setIsProcessingToken(false);
    };

    processTokenAndCheckAuth();

    // Also listen for storage changes (logout from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        console.log('ProtectedRoute: Auth token changed in storage');
        if (!e.newValue) {
          // Token was removed
          setIsAuthenticated(false);
          navigate('/login', { replace: true });
        } else {
          // Token was added/updated
          setIsAuthenticated(true);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate, location.pathname, searchParams, toast, isProcessingToken]);

  // Show loading while checking or processing token
  if (isChecking || isProcessingToken) {
    const loadingMessage = isProcessingToken ? 'Memproses login...' : 'Checking authentication...';
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

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    console.log('ProtectedRoute: Not authenticated, not rendering children');
    return null;
  }

  console.log('ProtectedRoute: Authenticated, rendering children');
  return <>{children}</>;
};

export default ProtectedRoute;
