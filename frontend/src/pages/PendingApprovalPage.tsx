import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './pages.css';

export function PendingApprovalPage() {
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
    if (user.estado === 'rechazado') {
      navigate('/cuenta-denegada', { replace: true });
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

  if (user.estado !== 'pendiente_aprobacion') {
    return null;
  }

  return (
    <div className="gradum-page gradum-auth">
      <div className="gradum-auth-card gradum-auth-card--wide">
        <Link to="/" className="gradum-back">
          ← Volver al inicio
        </Link>
        <h1>Cuenta en revisión</h1>
        <p className="gradum-auth-sub">
          Tu registro fue recibido correctamente. Un administrador debe aprobar tu acceso antes de que puedas usar el
          panel de GRADUM.
        </p>
        <p className="gradum-muted-text">
          Te notificaremos por correo cuando tu cuenta esté activa, o podés comprobar el estado con el botón de abajo.
        </p>
        <div className="gradum-pending-actions">
          <button type="button" className="gradum-btn gradum-btn--secondary gradum-btn--block" onClick={() => void handleRefresh()}>
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
