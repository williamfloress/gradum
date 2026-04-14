/**
 * Sprint 3 — Pantalla para `rechazado` con sesión; sin acceso al resto de API (ApprovedUserGuard en backend).
 */
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './pages.css';

export function CuentaDenegadaPage() {
  const { user, token, loading, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      void refreshUser();
    }
  }, [token, refreshUser]);

  useEffect(() => {
    if (loading || !user) return;
    if (user.rol === 'admin' || user.estado === 'aprobado') {
      navigate('/dashboard', { replace: true });
    }
    if (user.estado === 'pendiente_aprobacion') {
      navigate('/pendiente-aprobacion', { replace: true });
    }
  }, [user, loading, navigate]);

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  async function handleRefresh() {
    await refreshUser();
  }

  if (loading || !user) {
    return (
      <div className="gradum-page gradum-loading">
        <p>Cargando…</p>
      </div>
    );
  }

  if (user.estado !== 'rechazado') {
    return null;
  }

  return (
    <div className="gradum-page gradum-auth">
      <div className="gradum-auth-card gradum-auth-card--wide">
        <Link to="/" className="gradum-back">
          ← Volver al inicio
        </Link>
        <h1>Registro no aprobado</h1>
        <p className="gradum-auth-sub">
          Tu solicitud de acceso a GRADUM fue denegada por un administrador. No podés usar el panel de la plataforma
          con esta cuenta.
        </p>
        <p className="gradum-muted-text">
          Si creés que se trata de un error, contactá a la institución por los canales oficiales. Podés cerrar sesión o
          comprobar si el estado cambió.
        </p>
        <div className="gradum-pending-actions">
          <button
            type="button"
            className="gradum-btn gradum-btn--secondary gradum-btn--block"
            onClick={() => void handleRefresh()}
          >
            Comprobar estado
          </button>
          <button type="button" className="gradum-btn gradum-btn--outline gradum-btn--block" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
