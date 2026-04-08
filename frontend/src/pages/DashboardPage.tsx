import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './pages.css';

export function DashboardPage() {
  const { user, logout, refreshUser, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      void refreshUser();
    }
  }, [token, refreshUser]);

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  return (
    <div className="gradum-page gradum-dashboard">
      <header className="gradum-dash-header">
        <Link to="/" className="gradum-logo gradum-logo--link">
          GRADUM
        </Link>
        <button type="button" className="gradum-btn gradum-btn--outline gradum-btn--sm" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </header>

      <main className="gradum-dash-main">
        <h1>
          Hola{user?.nombre ? `, ${user.nombre}` : ''}
        </h1>
        <p className="gradum-lead">Este es tu panel. Aquí verás el progreso de tu carrera en próximas versiones.</p>

        {user?.rol === 'admin' && (
          <section className="gradum-dash-card gradum-dash-card--compact" aria-labelledby="admin-tools-heading">
            <h2 id="admin-tools-heading">Administración</h2>
            <p className="gradum-muted-text gradum-dash-card__lead">
              Gestioná las cuentas registradas: aprobá solicitudes, denegá registros o suspendé cuentas activas.
            </p>
            <div className="gradum-admin-actions">
              <Link to="/admin/usuarios" className="gradum-btn gradum-btn--secondary gradum-btn--sm">
                Gestión de usuarios
              </Link>
              <Link to="/admin/carreras" className="gradum-btn gradum-btn--secondary gradum-btn--sm">
                Carreras y pensums
              </Link>
            </div>
          </section>
        )}

        {user && (
          <section className="gradum-dash-card" aria-labelledby="session-heading">
            <h2 id="session-heading">Tu sesión</h2>
            <dl className="gradum-dl">
              <div>
                <dt>Correo</dt>
                <dd>{user.email}</dd>
              </div>
              <div>
                <dt>Rol</dt>
                <dd>{user.rol}</dd>
              </div>
              {user.estado && (
                <div>
                  <dt>Estado</dt>
                  <dd>{user.estado}</dd>
                </div>
              )}
            </dl>
          </section>
        )}
      </main>
    </div>
  );
}
