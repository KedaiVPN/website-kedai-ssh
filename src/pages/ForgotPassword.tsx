
import { useEffect } from 'react';
import ForgotPasswordForm from '@/components/ForgotPasswordForm';
import { authService } from '@/services/authService';

const ForgotPassword = () => {
  useEffect(() => {
    // Redirect if already authenticated
    if (authService.isAuthenticated()) {
      window.location.href = '/dashboard';
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Kedai SSH
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Platform VPN Terpercaya
          </p>
        </div>
        
        <ForgotPasswordForm />
      </div>
    </div>
  );
};

export default ForgotPassword;
