import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { AppShell } from './AppShell';

export function ProtectedShell() {
  const { ready, token } = useAuth();

  if (!ready) {
    return null;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <AppShell />;
}
