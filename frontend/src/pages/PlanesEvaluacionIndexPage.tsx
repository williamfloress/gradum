import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { inscripcionesService, type Inscripcion } from '../services/inscripciones.service';
import { api } from '../services/api';
import './pages.css';

export function PlanesEvaluacionIndexPage() {
  useAuth();
  const [inscritas, setInscritas] = useState<Inscripcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [semestreEtiqueta, setSemestreEtiqueta] = useState<string>('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const perfil = await api.get<any>('/perfiles/me');
      setSemestreEtiqueta(perfil.semestreActual);

      const inscData = await inscripcionesService.getInscripciones(perfil.semestreActual);
      setInscritas(inscData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <div className="gradum-page gradum-loading"><p>Cargando...</p></div>;

  return (
    <DashboardLayout>
      <div style={{ flex: 1, padding: '1rem 0' }}>
        <h1 style={{ marginBottom: '1.5rem' }}>Planes de Evaluación</h1>
        {semestreEtiqueta && (
          <h2 style={{ fontSize: '1.25rem', color: 'var(--gradum-muted)', fontWeight: 500, marginBottom: '2rem' }}>
            SEMESTRE ACTUAL ({semestreEtiqueta})
          </h2>
        )}

        {error && <p className="gradum-error">{error}</p>}

        <section aria-labelledby="materias-inscritas">
          <h3 id="materias-inscritas" style={{ fontSize: '1rem', marginBottom: '1rem' }}>
            Materias Inscritas Actualmente
          </h3>

          {inscritas.length === 0 ? (
            <div className="gradum-dash-card">
              <p className="gradum-muted-text">No tienes materias inscritas este semestre.</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
              gap: '1.5rem' 
            }}>
              {inscritas.map((insc) => (
                <div key={insc.id} className="gradum-dash-action-card" style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{insc.materia.nombre}</h4>
                    {insc.notaDefinitiva != null && (
                      <div style={{ 
                        background: 'var(--gradum-surface-elevated)', 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '0.5rem',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        border: '1px solid var(--gradum-border)',
                        color: 'var(--gradum-primary)'
                      }}>
                        {parseFloat(insc.notaDefinitiva).toFixed(2)}
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex' }}>
                    <Link
                      to={`/inscripciones/${insc.id}/plan`}
                      className="gradum-btn gradum-btn--primary"
                      style={{ flex: 1, justifyContent: 'center', boxSizing: 'border-box' }}
                    >
                      Ver Plan de Evaluación →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
