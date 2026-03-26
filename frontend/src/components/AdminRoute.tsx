import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading, token } = useAuth();

  if (loading) {
    return (
      <div className="gradum-page gradum-loading">
        <p>Cargando sesión…</p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (user?.rol !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
