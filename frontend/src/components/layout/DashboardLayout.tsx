import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Sidebar } from './Sidebar';
import '../../pages/pages.css';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Cerrar el sidebar automáticamente al cambiar de ruta
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="gradum-dash-layout">
      {/* ── Overlay para móvil ────────────────────────────────────────── */}
      <div 
        className={`gradum-sidebar-overlay ${sidebarOpen ? 'gradum-sidebar-overlay--visible' : ''}`}
        onClick={closeSidebar}
      />

      {/* ── Topbar ─────────────────────────────────────────────────────── */}
      <header className="gradum-dash-topbar">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button 
            className="gradum-menu-toggle" 
            onClick={toggleSidebar}
            aria-label="Toggle menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <Link to="/" className="gradum-logo gradum-logo--link">GRADUM</Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {user && (
            <span style={{ fontSize: '0.875rem', color: 'var(--gradum-muted)', display: 'inline-block', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.nombre ?? user.email}
            </span>
          )}
          <button
            type="button"
            className="gradum-btn gradum-btn--outline gradum-btn--sm"
            onClick={handleLogout}
          >
            {/* Texto más corto en móvil */}
            <span style={{ display: 'inline-block' }}>Salir</span>
          </button>
        </div>
      </header>

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <Sidebar isOpen={sidebarOpen} />

      {/* ── Contenido principal ────────────────────────────────────────── */}
      <main className="gradum-dash-content" style={{ display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </div>
  );
}
