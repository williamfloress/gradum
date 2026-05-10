import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { api } from '../services/api';
import './pages.css';

/* ─── Tipos ─────────────────────────────────────────────────── */

type PlanResumen = {
  id: string;
  nombre: string;
  porcentaje: number;
  evaluaciones: number;
  evaluacionesCalificadas: number;
};

type InscripcionSemestre = {
  id: string;
  materia: {
    id: string;
    nombre: string;
    codigo: string | null;
    creditos: number | null;
    semestreNumero: number;
  };
  estado: 'en_curso' | 'aprobada' | 'reprobada';
  notaDefinitiva: number | null;
  totalPorcentajePlanes: number;
  porcentajeEvaluado: number;
  notaParcial: number;
  totalEvaluaciones: number;
  evaluacionesCalificadas: number;
  proximaFecha: string | null;
  planes: PlanResumen[];
};

type SemestreData = {
  semestre: string;
  totalMaterias: number;
  materiasAprobadas: number;
  materiasEnCurso: number;
  inscripciones: InscripcionSemestre[];
};

/* ─── Helpers ────────────────────────────────────────────────── */

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  en_curso:  { label: 'En curso',  color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.35)' },
  aprobada:  { label: 'Aprobada',  color: '#22c55e', bg: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.35)' },
  reprobada: { label: 'Reprobada', color: '#ef4444', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.35)' },
};

function formatFecha(fecha: string): string {
  const d = new Date(fecha);
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
}

/* ─── Componente: Card de materia ───────────────────────────── */

function MateriaCard({ insc }: { insc: InscripcionSemestre }) {
  const cfg = ESTADO_CONFIG[insc.estado] ?? ESTADO_CONFIG.en_curso;
  const progreso = insc.totalPorcentajePlanes > 0
    ? Math.min(100, Math.round((insc.porcentajeEvaluado / insc.totalPorcentajePlanes) * 100))
    : 0;

  return (
    <article
      className="gradum-dash-action-card gradum-semester-card"
      id={`semester-card-${insc.id}`}
    >
      {/* Header */}
      <div className="gradum-semester-card__header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="gradum-semester-card__title">{insc.materia.nombre}</h3>
          <div className="gradum-semester-card__meta">
            {insc.materia.codigo && (
              <span className="gradum-semester-card__code">{insc.materia.codigo}</span>
            )}
            {insc.materia.creditos != null && (
              <span>{insc.materia.creditos} UC</span>
            )}
          </div>
        </div>

        {/* Badge estado */}
        <span
          className="gradum-badge"
          style={{
            background: cfg.bg,
            color: cfg.color,
            border: `1px solid ${cfg.border}`,
            flexShrink: 0,
          }}
        >
          {cfg.label}
        </span>
      </div>

      {/* Stats row */}
      <div className="gradum-semester-card__stats">
        {/* Nota */}
        <div className="gradum-semester-card__stat">
          <span className="gradum-semester-card__stat-label">Nota</span>
          <span
            className="gradum-semester-card__stat-value"
            style={{
              color: insc.notaDefinitiva != null
                ? (insc.notaDefinitiva >= 10 ? '#22c55e' : '#ef4444')
                : 'var(--gradum-muted)',
            }}
          >
            {insc.notaDefinitiva != null
              ? insc.notaDefinitiva.toFixed(2)
              : '—'}
          </span>
        </div>

        {/* Nota parcial */}
        <div className="gradum-semester-card__stat">
          <span className="gradum-semester-card__stat-label">Parcial</span>
          <span className="gradum-semester-card__stat-value" style={{ color: 'var(--gradum-primary)' }}>
            {insc.porcentajeEvaluado > 0 ? insc.notaParcial.toFixed(2) : '—'}
          </span>
        </div>

        {/* Evaluaciones */}
        <div className="gradum-semester-card__stat">
          <span className="gradum-semester-card__stat-label">Evaluaciones</span>
          <span className="gradum-semester-card__stat-value">
            {insc.evaluacionesCalificadas}/{insc.totalEvaluaciones}
          </span>
        </div>

        {/* Plan */}
        <div className="gradum-semester-card__stat">
          <span className="gradum-semester-card__stat-label">Plan</span>
          <span className="gradum-semester-card__stat-value">
            {insc.totalPorcentajePlanes}%
          </span>
        </div>
      </div>

      {/* Barra de progreso */}
      {insc.totalEvaluaciones > 0 && (
        <div className="gradum-semester-card__progress-wrap">
          <div className="gradum-semester-card__progress-header">
            <span className="gradum-semester-card__progress-label">Progreso evaluado</span>
            <span className="gradum-semester-card__progress-pct">{progreso}%</span>
          </div>
          <div className="gradum-semester-card__progress-bar">
            <div
              className="gradum-semester-card__progress-fill"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>
      )}

      {/* Planes de evaluación */}
      {insc.planes.length > 0 && (
        <div className="gradum-semester-card__planes">
          {insc.planes.map((plan) => (
            <div key={plan.id} className="gradum-semester-card__plan-chip">
              <span className="gradum-semester-card__plan-name">{plan.nombre}</span>
              <span className="gradum-semester-card__plan-pct">{plan.porcentaje}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Próxima fecha */}
      {insc.proximaFecha && (
        <div className="gradum-semester-card__next-date">
          <span>📅</span>
          <span>Próxima evaluación: <strong>{formatFecha(insc.proximaFecha)}</strong></span>
        </div>
      )}

      {/* Footer: link al plan */}
      <div className="gradum-semester-card__footer">
        <Link
          to={`/inscripciones/${insc.id}/plan`}
          className="gradum-btn gradum-btn--primary gradum-btn--sm"
          style={{ flex: 1, justifyContent: 'center' }}
        >
          Ver Plan de Evaluación →
        </Link>
      </div>
    </article>
  );
}

/* ─── Página principal ───────────────────────────────────────── */

export function SemestrePage() {
  useAuth();
  const [data, setData] = useState<SemestreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.get<SemestreData>('/perfiles/mi-semestre');
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos del semestre');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
          <p className="gradum-muted-text">Cargando tu semestre…</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ flex: 1, padding: '1rem 0' }}>
        {/* Header */}
        <header className="gradum-semester-header">
          <div>
            <h1>Mi Semestre</h1>
            {data && (
              <p className="gradum-lead" style={{ marginBottom: 0 }}>
                Semestre <strong style={{ color: 'var(--gradum-primary)' }}>{data.semestre}</strong>
              </p>
            )}
          </div>
        </header>

        {error && <p className="gradum-error gradum-error--block" role="alert">{error}</p>}

        {data && (
          <>
            {/* Resumen stats */}
            <div className="gradum-semester-summary">
              <div className="gradum-semester-summary__card">
                <span className="gradum-semester-summary__number">{data.totalMaterias}</span>
                <span className="gradum-semester-summary__label">Materias</span>
              </div>
              <div className="gradum-semester-summary__card">
                <span className="gradum-semester-summary__number" style={{ color: '#f59e0b' }}>
                  {data.materiasEnCurso}
                </span>
                <span className="gradum-semester-summary__label">En curso</span>
              </div>
              <div className="gradum-semester-summary__card">
                <span className="gradum-semester-summary__number" style={{ color: '#22c55e' }}>
                  {data.materiasAprobadas}
                </span>
                <span className="gradum-semester-summary__label">Aprobadas</span>
              </div>
            </div>

            {/* Grid de materias */}
            {data.inscripciones.length === 0 ? (
              <div className="gradum-dash-card" style={{ marginTop: '2rem', textAlign: 'center', padding: '3rem' }}>
                <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>📚</p>
                <p className="gradum-muted-text">
                  No tienes materias inscritas este semestre.
                </p>
                <Link
                  to="/inscripciones"
                  className="gradum-btn gradum-btn--primary"
                  style={{ marginTop: '1.5rem' }}
                >
                  Inscribir materias
                </Link>
              </div>
            ) : (
              <div className="gradum-semester-grid">
                {data.inscripciones.map((insc) => (
                  <MateriaCard key={insc.id} insc={insc} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
