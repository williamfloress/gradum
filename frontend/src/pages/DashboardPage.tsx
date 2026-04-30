import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { api } from '../services/api';
import './pages.css';

interface PerfilMe {
  semestreActual: string;
}

export function DashboardPage() {
  const { user, refreshUser, token } = useAuth();
  const [semestre, setSemestre] = useState<string | null>(null);

  useEffect(() => {
    if (token) void refreshUser();
  }, [token, refreshUser]);

  const loadEstudianteData = useCallback(async () => {
    try {
      const perfil = await api.get<PerfilMe>('/perfiles/me');
      setSemestre(perfil.semestreActual);
    } catch {
      // Degraded gracefully
    }
  }, []);

  useEffect(() => {
    if (user?.rol === 'estudiante') void loadEstudianteData();
  }, [user?.rol, loadEstudianteData]);

  return (
    <DashboardLayout>
      <div style={{ flex: 1, padding: '1rem 0' }}>
        <h1 style={{ marginBottom: '1rem' }}>
          Hola{user?.nombre ? `, ${user.nombre}` : ''}
        </h1>

        {semestre && (
          <div className="gradum-dash-semester-badge" style={{ marginBottom: '2rem' }}>
            ◉ Semestre {semestre}
          </div>
        )}

        <div className="gradum-dash-cards" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '30rem' }}>
          <article className="gradum-dash-action-card" aria-labelledby="card-info-title">
            <h2 id="card-info-title" style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Dashboard General</h2>
            <p style={{ color: 'var(--gradum-muted)', marginBottom: '1.5rem' }}>
              Información de tu sesión actual.
            </p>
            <dl className="gradum-dl" style={{ margin: 0 }}>
              <div style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--gradum-border)' }}>
                <dt style={{ color: 'var(--gradum-muted)', fontSize: '0.875rem' }}>Correo</dt>
                <dd style={{ fontWeight: 500, marginTop: '0.25rem' }}>{user?.email}</dd>
              </div>
              <div style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--gradum-border)' }}>
                <dt style={{ color: 'var(--gradum-muted)', fontSize: '0.875rem' }}>Rol</dt>
                <dd style={{ fontWeight: 500, marginTop: '0.25rem', textTransform: 'capitalize' }}>{user?.rol}</dd>
              </div>
              {user?.estado && (
                <div style={{ padding: '0.75rem 0' }}>
                  <dt style={{ color: 'var(--gradum-muted)', fontSize: '0.875rem' }}>Estado</dt>
                  <dd style={{ fontWeight: 500, marginTop: '0.25rem', textTransform: 'capitalize' }}>
                    <span style={{ 
                      color: user.estado === 'aprobado' ? 'var(--gradum-primary)' : 'var(--gradum-muted)',
                      background: user.estado === 'aprobado' ? 'var(--gradum-primary-alpha)' : 'transparent',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.875rem'
                    }}>
                      {user.estado.replace('_', ' ')}
                    </span>
                  </dd>
                </div>
              )}
            </dl>
          </article>
        </div>
      </div>
    </DashboardLayout>
  );
}
