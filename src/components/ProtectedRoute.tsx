
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        navigate('/login');
      } else {
        setIsChecking(false);
      }
    };

    // Small delay to allow token to be set from URL parameter
    const timer = setTimeout(checkAuth, 100);
    
    return () => clearTimeout(timer);
  }, [navigate]);

  // Check if user is authenticated
  const token = localStorage.getItem('auth_token');
  if (!token || isChecking) {
    return null; // Don't render anything while checking/redirecting
  }

  return <>{children}</>;
};

export default ProtectedRoute;
