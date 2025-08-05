
import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(false);

  useEffect(() => {
    const processAuthenticationAndOAuth = async () => {
      console.log('ProtectedRoute: Starting authentication check');
      console.log('ProtectedRoute: Current URL:', window.location.href);
      console.log('ProtectedRoute: Search params:', Object.fromEntries(searchParams));
      
      // Check for OAuth callback parameters
      const tokenFromUrl = searchParams.get('token');
      const stateFromUrl = searchParams.get('state');
      const errorFromUrl = searchParams.get('error');

      // Handle OAuth errors first
      if (errorFromUrl) {
        console.log('ProtectedRoute: OAuth error detected:', errorFromUrl);
        toast({
          title: "Authentication Error",
          description: "OAuth authentication failed. Please try logging in again.",
          variant: "destructive"
        });
        navigate('/login', { replace: true });
        return;
      }

      // Process OAuth token if present
      if (tokenFromUrl && !isProcessingOAuth) {
        console.log('ProtectedRoute: Processing OAuth token from URL');
        setIsProcessingOAuth(true);
        
        try {
          // Validate OAuth state parameter
          if (stateFromUrl && !authService.validateOAuthState(stateFromUrl)) {
            console.error('ProtectedRoute: Invalid OAuth state parameter');
            toast({
              title: "Security Error",
              description: "Invalid authentication state. Please try logging in again.",
              variant: "destructive"
            });
            navigate('/login', { replace: true });
            return;
          }

          // Validate token format
          if (tokenFromUrl.length < 10 || !tokenFromUrl.includes('.')) {
            console.error('ProtectedRoute: Invalid token format');
            toast({
              title: "Token Error",
              description: "Invalid authentication token format.",
              variant: "destructive"
            });
            navigate('/login', { replace: true });
            return;
          }

          // Save token and log the event
          localStorage.setItem('auth_token', tokenFromUrl);
          authService.logAuthEvent('oauth_token_processed', {
            tokenLength: tokenFromUrl.length,
            hasState: !!stateFromUrl
          });
          
          console.log('ProtectedRoute: OAuth token processed successfully');
          
          toast({
            title: "Login berhasil",
            description: "Selamat datang! Anda telah berhasil login dengan Google.",
          });

          // Clean URL by removing OAuth parameters
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.delete('token');
          newSearchParams.delete('state');
          newSearchParams.delete('error');
          
          const newUrl = newSearchParams.toString() 
            ? `${location.pathname}?${newSearchParams.toString()}` 
            : location.pathname;
          
          // Navigate to clean URL
          navigate(newUrl, { replace: true });
          
          // Set authenticated state
          setIsAuthenticated(true);
          setIsChecking(false);
          setIsProcessingOAuth(false);
          return;

        } catch (error) {
          console.error('ProtectedRoute: Error processing OAuth token:', error);
          authService.logAuthEvent('oauth_token_error', { error: error instanceof Error ? error.message : 'Unknown error' });
          
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
      
      // Standard authentication check (no OAuth processing)
      console.log('ProtectedRoute: Performing standard authentication check');
      
      const isAuth = authService.isAuthenticated();
      console.log('ProtectedRoute: Authentication result:', isAuth);
      
      if (!isAuth) {
        console.log('ProtectedRoute: Not authenticated, redirecting to login');
        authService.logAuthEvent('protected_route_unauthorized', { 
          attemptedPath: location.pathname 
        });
        setIsAuthenticated(false);
        setIsChecking(false);
        navigate('/login', { replace: true });
        return;
      }

      // Optionally validate with server for extra security
      try {
        const isServerValid = await authService.validateTokenWithServer();
        if (!isServerValid) {
          console.log('ProtectedRoute: Server validation failed');
          authService.logout();
          navigate('/login', { replace: true });
          return;
        }
      } catch (error) {
        console.warn('ProtectedRoute: Server validation unavailable, continuing with client validation');
      }

      // User is authenticated
      console.log('ProtectedRoute: Authentication successful');
      authService.logAuthEvent('protected_route_authorized', { 
        path: location.pathname 
      });
      setIsAuthenticated(true);
      setIsChecking(false);
      setIsProcessingOAuth(false);
    };

    processAuthenticationAndOAuth();

    // Listen for storage changes (logout from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        console.log('ProtectedRoute: Auth token changed in storage');
        authService.logAuthEvent('storage_token_change', { 
          hasNewValue: !!e.newValue 
        });
        
        if (!e.newValue) {
          // Token was removed
          setIsAuthenticated(false);
          navigate('/login', { replace: true });
        } else {
          // Token was added/updated - revalidate
          const isValid = authService.isAuthenticated();
          setIsAuthenticated(isValid);
          if (!isValid) {
            navigate('/login', { replace: true });
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate, location.pathname, searchParams, toast, isProcessingOAuth]);

  // Show loading while checking or processing OAuth
  if (isChecking || isProcessingOAuth) {
    const loadingMessage = isProcessingOAuth 
      ? 'Memproses login dengan Google...' 
      : 'Memeriksa status authentication...';
    
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

  // Don't render if not authenticated
  if (!isAuthenticated) {
    console.log('ProtectedRoute: Not authenticated, not rendering children');
    return null;
  }

  console.log('ProtectedRoute: Authenticated, rendering protected content');
  return <>{children}</>;
};

export default ProtectedRoute;
