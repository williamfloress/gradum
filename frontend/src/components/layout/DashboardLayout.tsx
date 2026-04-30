import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Sidebar } from './Sidebar';
import '../../pages/pages.css';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  return (
    <div className="gradum-dash-layout">
      {/* ── Topbar ─────────────────────────────────────────────────────── */}
      <header className="gradum-dash-topbar">
        <Link to="/" className="gradum-logo gradum-logo--link">GRADUM</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {user && (
            <span style={{ fontSize: '0.875rem', color: 'var(--gradum-muted)' }}>
              {user.nombre ?? user.email}
            </span>
          )}
          <button
            type="button"
            className="gradum-btn gradum-btn--outline gradum-btn--sm"
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <Sidebar />

      {/* ── Contenido principal ────────────────────────────────────────── */}
      <main className="gradum-dash-content" style={{ display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </div>
  );
}
