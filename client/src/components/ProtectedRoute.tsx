
import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuthContext } from '@/context/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuthContext();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Hard redirect to break SPA behavior and clear state
      window.location.href = '/login';
    }
  }, [loading, isAuthenticated]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated || !user) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
}
