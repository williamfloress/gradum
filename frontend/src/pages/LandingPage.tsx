import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './pages.css';

export function LandingPage() {
  const { token } = useAuth();

  return (
    <div className="gradum-page gradum-landing">
      <header className="gradum-header">
        <span className="gradum-logo">GRADUM</span>
        <nav className="gradum-nav">
          {token ? (
            <Link to="/dashboard" className="gradum-btn gradum-btn--primary gradum-btn--sm">
              Ir al panel
            </Link>
          ) : (
            <>
              <Link to="/login" className="gradum-link">
                Iniciar sesión
              </Link>
              <Link to="/register" className="gradum-btn gradum-btn--outline gradum-btn--sm">
                Registrarse
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="gradum-hero">
        <p className="gradum-eyebrow">Planifica tu carrera universitaria</p>
        <h1>Tu progreso académico, en un solo lugar</h1>
        <p className="gradum-lead">
          Consulta pensums, organiza semestres y da seguimiento a tu trayectoria con una
          experiencia pensada para estudiantes y equipos académicos.
        </p>
        <div className="gradum-cta-row">
          <Link to="/login" className="gradum-btn gradum-btn--primary">
            Entrar
          </Link>
          <Link to="/register" className="gradum-btn gradum-btn--secondary">
            Crear cuenta
          </Link>
        </div>
      </main>

      <footer className="gradum-footer">
        <span>© {new Date().getFullYear()} GRADUM</span>
      </footer>
    </div>
  );
}
