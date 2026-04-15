import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getApiUrl } from '../lib/config';

/**
 * Redirige estudiantes pendientes o con registro denegado a sus pantallas dedicadas.
 * Verifica si los estudiantes aprobados ya tienen un Perfil. Si no lo tienen,
 * los redirige a la pantalla de onboarding.
 * Los administradores pasan directo.
 */
export function ApprovedAccountGate({ children }: { children: ReactNode }) {
  const { user, token, loading: authLoading } = useAuth();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Si la autenticación aún está cargando o no hay usuario, no hacemos el check
    if (authLoading || !user || !token) {
      if (!authLoading) {
        setCheckingProfile(false);
      }
      return;
    }

    // Si es admin, no requiere perfil
    if (user.rol === 'admin') {
      setHasProfile(true);
      setCheckingProfile(false);
      return;
    }

    // Si está pendiente o rechazado, tampoco requiere perfil para esa verificación (se filtrará debajo)
    if (user.estado === 'pendiente_aprobacion' || user.estado === 'rechazado') {
      setCheckingProfile(false);
      return;
    }

    let isMounted = true;
    const api = getApiUrl();

    // Estudiante aprobado: comprobamos si tiene perfil
    fetch(`${api}/perfiles/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!isMounted) return;
        if (res.ok) {
          setHasProfile(true);
        } else if (res.status === 404) {
          setHasProfile(false);
        } else {
          // Otro error, por precaución permitimos ver y que las otras vistas fallen con gracia
          setHasProfile(true); 
        }
      })
      .catch(() => {
        if (isMounted) setHasProfile(true);
      })
      .finally(() => {
        if (isMounted) setCheckingProfile(false);
      });

    return () => {
      isMounted = false;
    };
  }, [authLoading, user, token]);

  if (authLoading || checkingProfile) {
    return (
      <div className="gradum-page gradum-loading">
        <p>Verificando cuenta…</p>
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

  // Si llegamos aquí, el usuario es un estudiante aprobado.
  // Si NO tiene perfil y NO está ya en onboarding, redirigir a onboarding.
  if (hasProfile === false && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Si YA tiene perfil y está en onboarding, redirigir a dashboard.
  if (hasProfile === true && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
