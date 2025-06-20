
import { useAuth } from '@/context/SupabaseAuthContext';

export function AuthDebug() {
  const { session, loading, user } = useAuth();
  
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '8px',
      fontSize: '12px',
      borderRadius: '4px',
      zIndex: 9999
    }}>
      <div>Loading: {loading ? 'true' : 'false'}</div>
      <div>Session: {session ? 'exists' : 'null'}</div>
      <div>User: {user?.email || 'none'}</div>
    </div>
  );
}
