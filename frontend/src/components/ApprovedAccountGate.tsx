import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

/**
 * Sprint 3 — Antes del dashboard: rechazados → /cuenta-denegada, pendientes → /pendiente-aprobacion;
 * admins y aprobados sin redirección.
 */
export function ApprovedAccountGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="gradum-page gradum-loading">
        <p>Cargando sesión…</p>
      </div>
    );
  }

  if (user?.rol === 'admin') {
    return <>{children}</>;
  }

  if (user?.estado === 'rechazado') {
    return <Navigate to="/cuenta-denegada" replace />;
  }

  if (user?.estado === 'pendiente_aprobacion') {
    return <Navigate to="/pendiente-aprobacion" replace />;
  }

  return <>{children}</>;
}
