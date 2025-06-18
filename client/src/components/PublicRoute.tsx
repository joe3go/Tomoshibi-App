
import { useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

interface PublicRouteProps {
  children: React.ReactNode;
}

export default function PublicRoute({ children }: PublicRouteProps) {
  const { loading, isAuthenticated } = useAuthContext();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      // Hard redirect to dashboard if already authenticated
      window.location.href = '/dashboard';
    }
  }, [loading, isAuthenticated]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
}
