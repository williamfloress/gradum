import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="gradum-page gradum-loading">
        <p>Cargando sesión…</p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
