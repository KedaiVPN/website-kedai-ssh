
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
      console.log('ProtectedRoute: Starting enhanced authentication check');
      console.log('ProtectedRoute: Current URL:', window.location.href);
      console.log('ProtectedRoute: Search params:', Object.fromEntries(searchParams));
      
      // Extract OAuth callback parameters
      const tokenFromUrl = searchParams.get('token');
      const stateFromUrl = searchParams.get('state');
      const errorFromUrl = searchParams.get('error');
      const browserFromUrl = searchParams.get('browser');
      const oauthSuccess = searchParams.get('oauth_success');

      // Handle OAuth errors with enhanced error messages
      if (errorFromUrl) {
        console.log('ProtectedRoute: OAuth error detected:', errorFromUrl);
        
        const errorMessages: Record<string, string> = {
          'oauth_failed': 'Google OAuth authentication failed. Please try logging in again.',
          'verification_failed': 'Email verification failed. Please try logging in again.',
          'email_failed': 'Failed to send verification email. Please try again.',
          'invalid_state': 'Security validation failed. Please try logging in again.',
          'no_state': 'Security parameter missing. Please try logging in again.',
          'server_error': 'Server error occurred during authentication. Please try again.',
          'invalid_user': 'Invalid user data received. Please try logging in again.'
        };
        
        const reason = searchParams.get('reason') || errorFromUrl;
        const browserInfo = browserFromUrl ? ` (Browser: ${browserFromUrl})` : '';
        
        toast({
          title: "Authentication Error",
          description: errorMessages[reason] || "An authentication error occurred. Please try again." + browserInfo,
          variant: "destructive"
        });
        
        // Clean URL and redirect
        navigate('/login', { replace: true });
        setIsChecking(false);
        return;
      }

      // Process OAuth token if present
      if (tokenFromUrl && oauthSuccess === 'true' && !isProcessingOAuth) {
        console.log('ProtectedRoute: Processing enhanced OAuth token from URL');
        console.log('ProtectedRoute: Browser info from OAuth:', browserFromUrl);
        setIsProcessingOAuth(true);
        
        try {
          // Enhanced OAuth state validation
          if (stateFromUrl) {
            const isValidState = authService.validateOAuthState(stateFromUrl);
            if (!isValidState) {
              console.error('ProtectedRoute: Enhanced OAuth state validation failed');
              toast({
                title: "Security Error",
                description: "Invalid authentication state. Please try logging in again.",
                variant: "destructive"
              });
              navigate('/login', { replace: true });
              return;
            }
          }

          // Enhanced token format validation
          if (!tokenFromUrl || tokenFromUrl.length < 10 || !tokenFromUrl.includes('.')) {
            console.error('ProtectedRoute: Invalid token format');
            toast({
              title: "Token Error",
              description: "Invalid authentication token format.",
              variant: "destructive"
            });
            navigate('/login', { replace: true });
            return;
          }

          // Validate token payload before storing
          try {
            const payload = JSON.parse(atob(tokenFromUrl.split('.')[1]));
            if (!payload.id || !payload.email || !payload.exp) {
              throw new Error('Invalid token payload structure');
            }
            
            // Check if token is not expired
            if (payload.exp < Math.floor(Date.now() / 1000)) {
              throw new Error('Token is expired');
            }
          } catch (tokenError) {
            console.error('ProtectedRoute: Token payload validation failed:', tokenError);
            toast({
              title: "Token Error",
              description: "Invalid or expired authentication token.",
              variant: "destructive"
            });
            navigate('/login', { replace: true });
            return;
          }

          // Save token and log the event
          localStorage.setItem('auth_token', tokenFromUrl);
          authService.logAuthEvent('oauth_token_processed', {
            tokenLength: tokenFromUrl.length,
            hasState: !!stateFromUrl,
            browser: browserFromUrl,
            oauthSuccess: true
          });
          
          console.log('ProtectedRoute: Enhanced OAuth token processed successfully');
          
          // Enhanced success message with browser info
          const browserInfo = browserFromUrl ? ` (${browserFromUrl})` : '';
          toast({
            title: "Login berhasil",
            description: `Selamat datang! Anda telah berhasil login dengan Google${browserInfo}.`,
          });

          // Clean URL by removing all OAuth parameters
          const newSearchParams = new URLSearchParams(searchParams);
          ['token', 'state', 'error', 'browser', 'oauth_success', 'reason'].forEach(param => {
            newSearchParams.delete(param);
          });
          
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
          console.error('ProtectedRoute: Error processing enhanced OAuth token:', error);
          authService.logAuthEvent('oauth_token_error', { 
            error: error instanceof Error ? error.message : 'Unknown error',
            browser: browserFromUrl 
          });
          
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

      // Enhanced server validation with browser info
      try {
        const isServerValid = await authService.validateTokenWithServer();
        if (!isServerValid) {
          console.log('ProtectedRoute: Enhanced server validation failed');
          authService.logout();
          navigate('/login', { replace: true });
          return;
        }
      } catch (error) {
        console.warn('ProtectedRoute: Enhanced server validation unavailable, continuing with client validation');
      }

      // User is authenticated
      console.log('ProtectedRoute: Enhanced authentication successful');
      authService.logAuthEvent('protected_route_authorized', { 
        path: location.pathname 
      });
      setIsAuthenticated(true);
      setIsChecking(false);
      setIsProcessingOAuth(false);
    };

    processAuthenticationAndOAuth();

    // Enhanced storage change handler
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

  console.log('ProtectedRoute: Enhanced authentication successful, rendering protected content');
  return <>{children}</>;
};

export default ProtectedRoute;
