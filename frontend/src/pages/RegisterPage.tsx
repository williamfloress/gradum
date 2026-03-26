import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './pages.css';

export function RegisterPage() {
  const { register, token, loading } = useAuth();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState('');
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
      await register(email, nombre, password);
      navigate('/login', { replace: true, state: { registered: true } });
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
        <h1>Crear cuenta</h1>
        <p className="gradum-auth-sub">
          Completa tus datos. Un administrador puede aprobar tu acceso antes de iniciar sesión.
        </p>

        <form className="gradum-form" onSubmit={onSubmit}>
          <label className="gradum-field">
            <span>Nombre completo</span>
            <input
              type="text"
              autoComplete="name"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              placeholder="Tu nombre"
            />
          </label>
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
            />
          </label>
          {error && <p className="gradum-error">{error}</p>}
          <button type="submit" className="gradum-btn gradum-btn--primary gradum-btn--block" disabled={submitting}>
            {submitting ? 'Enviando…' : 'Registrarse'}
          </button>
        </form>

        <p className="gradum-auth-footer">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="gradum-link-inline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
