
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/register');
    }
  }, [navigate]);

  // Check if user is authenticated
  const token = localStorage.getItem('auth_token');
  if (!token) {
    return null; // Don't render anything while redirecting
  }

  return <>{children}</>;
};

export default ProtectedRoute;
