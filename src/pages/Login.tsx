
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoginForm } from '@/components/LoginForm';
import { authService } from '@/services/authService';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuthenticationStatus = async () => {
      console.log('Login: Checking authentication status');
      
      // Check for OAuth error in URL
      const oauthError = searchParams.get('error');
      if (oauthError) {
        console.log('Login: OAuth error detected:', oauthError);
        toast({
          title: "Login Error",
          description: getErrorMessage(oauthError),
          variant: "destructive"
        });
        // Clean URL
        navigate('/login', { replace: true });
        setIsCheckingAuth(false);
        return;
      }

      // Only redirect if user is authenticated AND this is not an OAuth callback
      const isAuthenticated = authService.isAuthenticated();
      const hasOAuthToken = searchParams.has('token');
      const hasOAuthState = searchParams.has('state');
      
      console.log('Login: Auth check results:', { 
        isAuthenticated, 
        hasOAuthToken, 
        hasOAuthState,
        currentUrl: window.location.href
      });

      if (isAuthenticated && !hasOAuthToken && !hasOAuthState) {
        console.log('Login: User already authenticated, redirecting to dashboard');
        // Validate token with server before redirecting
        const isServerValid = await authService.validateTokenWithServer();
        if (isServerValid) {
          navigate('/dashboard', { replace: true });
        } else {
          console.log('Login: Server validation failed, staying on login page');
          authService.logout();
        }
      }

      setIsCheckingAuth(false);
    };

    checkAuthenticationStatus();
  }, [navigate, searchParams, toast]);

  const getErrorMessage = (error: string): string => {
    switch (error) {
      case 'oauth_failed':
        return 'Google OAuth authentication failed. Please try again.';
      case 'verification_failed':
        return 'Email verification failed. Please try logging in again.';
      case 'email_failed':
        return 'Failed to send verification email. Please try again.';
      default:
        return 'An authentication error occurred. Please try again.';
    }
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            KedaiVPN
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Platform VPN Terpercaya
          </p>
        </div>
        
        <LoginForm />
        
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Belum punya akun?{' '}
            <Link 
              to="/register" 
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium"
            >
              Daftar sekarang
            </Link>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Admin?{' '}
            <Link 
              to="/admin" 
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium"
            >
              Login Admin
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
