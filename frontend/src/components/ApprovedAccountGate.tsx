import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

/**
 * Redirige estudiantes pendientes o con registro denegado a sus pantallas dedicadas.
 * Los administradores y cuentas aprobadas pasan sin cambios.
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
