import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import '../../pages/pages.css';

// ——— Iconos SVG inline ———
const IconHome = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className="gradum-dash-sidebar__icon" aria-hidden="true">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconBook = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className="gradum-dash-sidebar__icon" aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const IconClipboard = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className="gradum-dash-sidebar__icon" aria-hidden="true">
    <rect x="9" y="2" width="6" height="4" rx="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M9 12h6M9 16h4" />
  </svg>
);

const IconUsers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className="gradum-dash-sidebar__icon" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconLayers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className="gradum-dash-sidebar__icon" aria-hidden="true">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

const IconTree = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className="gradum-dash-sidebar__icon" aria-hidden="true">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);

const IconCalendar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className="gradum-dash-sidebar__icon" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

export function Sidebar({ isOpen }: { isOpen?: boolean }) {
  const { user } = useAuth();
  const location = useLocation();

  const isCurrent = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`) ? ' gradum-dash-sidebar__item--active' : '';
  };

  return (
    <nav 
      className={`gradum-dash-sidebar ${isOpen ? 'gradum-dash-sidebar--open' : ''}`} 
      aria-label="Navegación principal"
    >
      <Link
        to="/dashboard"
        className={`gradum-dash-sidebar__item${location.pathname === '/dashboard' ? ' gradum-dash-sidebar__item--active' : ''}`}
        id="sidebar-dashboard"
      >
        <IconHome />
        Dashboard General
      </Link>

      {user?.rol === 'estudiante' && (
        <>
          <span className="gradum-dash-sidebar__section-label">Mi espacio</span>
          <Link
            to="/inscripciones"
            className={`gradum-dash-sidebar__item${isCurrent('/inscripciones') && !location.pathname.includes('/plan') ? ' gradum-dash-sidebar__item--active' : ''}`}
            id="sidebar-mis-materias"
          >
            <IconBook />
            Las Materias
          </Link>
          <Link
            to="/planes-evaluacion"
            className={`gradum-dash-sidebar__item${isCurrent('/planes-evaluacion') || location.pathname.includes('/plan') ? ' gradum-dash-sidebar__item--active' : ''}`}
            id="sidebar-planes-evaluacion"
          >
            <IconClipboard />
            Plan de Evaluación
          </Link>
          <Link
            to="/pensum"
            className={`gradum-dash-sidebar__item${isCurrent('/pensum') ? ' gradum-dash-sidebar__item--active' : ''}`}
            id="sidebar-pensum"
          >
            <IconTree />
            Mi Pensum
          </Link>
          <Link
            to="/calendario"
            className={`gradum-dash-sidebar__item${isCurrent('/calendario') ? ' gradum-dash-sidebar__item--active' : ''}`}
            id="sidebar-calendario"
          >
            <IconCalendar />
            Calendario
          </Link>
        </>
      )}

      {user?.rol === 'admin' && (
        <>
          <span className="gradum-dash-sidebar__section-label">Administración</span>
          <Link
            to="/admin/usuarios"
            className={`gradum-dash-sidebar__item${isCurrent('/admin/usuarios') ? ' gradum-dash-sidebar__item--active' : ''}`}
            id="sidebar-admin-usuarios"
          >
            <IconUsers />
            Gestión de Usuarios
          </Link>
          <Link
            to="/admin/carreras"
            className={`gradum-dash-sidebar__item${isCurrent('/admin/carreras') ? ' gradum-dash-sidebar__item--active' : ''}`}
            id="sidebar-admin-carreras"
          >
            <IconLayers />
            Carreras y Pensums
          </Link>
        </>
      )}
    </nav>
  );
}
