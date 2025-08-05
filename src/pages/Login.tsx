import { useEffect } from 'react';
import { LoginForm } from '@/components/LoginForm';
import { authService } from '@/services/authService';
import { Link } from 'react-router-dom';

const Login = () => {
  useEffect(() => {
    // Redirect if already authenticated
    if (authService.isAuthenticated()) {
      window.location.href = '/dashboard';
    }
  }, []);

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