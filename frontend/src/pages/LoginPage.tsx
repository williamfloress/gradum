import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './pages.css';

export function LoginPage() {
  const { login, token, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';
  const justRegistered = Boolean((location.state as { registered?: boolean })?.registered);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && token) {
      navigate('/dashboard', { replace: true });
    }
  }, [loading, token, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="gradum-page gradum-auth">
      <div className="gradum-auth-card">
        <Link to="/" className="gradum-back">
          ← Volver al inicio
        </Link>
        <h1>Iniciar sesión</h1>
        <p className="gradum-auth-sub">Accede con tu correo institucional o personal.</p>
        {justRegistered && (
          <p className="gradum-success" role="status">
            Registro exitoso. Inicia sesión cuando tu cuenta esté aprobada.
          </p>
        )}

        <form className="gradum-form" onSubmit={onSubmit}>
          <label className="gradum-field">
            <span>Correo electrónico</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@correo.com"
            />
          </label>
          <label className="gradum-field">
            <span>Contraseña</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </label>
          {error && <p className="gradum-error">{error}</p>}
          <button type="submit" className="gradum-btn gradum-btn--primary gradum-btn--block" disabled={submitting}>
            {submitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="gradum-auth-footer">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="gradum-link-inline">
            Registrarse
          </Link>
        </p>
      </div>
    </div>
  );
}
