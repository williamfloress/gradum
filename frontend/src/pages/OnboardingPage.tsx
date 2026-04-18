import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getApiUrl } from '../lib/config';
import { SemesterEnrollmentDnd } from '../components/SemesterEnrollmentDnd';
import './pages.css';

/* ─── Tipos ─────────────────────────────────────────── */
interface Carrera {
  id: string;
  name: string;
  code?: string;
}

interface Pensum {
  id: string;
  name: string;
  version?: string;
  isCurrent?: boolean;
}

type TipoIngreso = 'primer_semestre' | 'avanzado';

/* ─── Funciones Auxiliares ────────────────────────────────────────── */
function pensumLabel(p: Pensum): string {
  return `${p.name}${p.version ? ` v${p.version}` : ''}${p.isCurrent ? ' (vigente)' : ''}`;
}

/* ─── Componente Principal ──────────────────────────────────────── */
export function OnboardingPage() {
  const { token } = useAuth();
  const api = getApiUrl();

  /* ── Estado de Carreras ── */
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [loadingCareers, setLoadingCareers] = useState(true);
  const [carrerasError, setCarrerasError] = useState('');

  /* ── Estado del Formulario ── */
  const [carreraId, setCarreraId] = useState('');
  const [pensums, setPensums] = useState<Pensum[]>([]);
  const [pensumId, setPensumId] = useState('');
  const [loadingPensums, setLoadingPensums] = useState(false);
  const [tipoIngreso, setTipoIngreso] = useState<TipoIngreso>('primer_semestre');
  const [semestreActual, setSemestreActual] = useState('');

  /* ── Estado de Materias (Solo para Avanzado) ── */
  const [materiasDelPensum, setMateriasDelPensum] = useState<any[]>([]);
  const [selectedMateriaIds, setSelectedMateriaIds] = useState<string[]>([]);
  const [loadingMaterias, setLoadingMaterias] = useState(false);

  /* ── Estado de Envío ── */
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  /* ── Cargar carreras al montar ── */
  useEffect(() => {
    setLoadingCareers(true);
    fetch(`${api}/degree`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('No se pudo cargar la lista de carreras');
        return r.json() as Promise<Carrera[]>;
      })
      .then(setCarreras)
      .catch((e: unknown) =>
        setCarrerasError(e instanceof Error ? e.message : 'Error desconocido'),
      )
      .finally(() => setLoadingCareers(false));
  }, [api, token]);

  /* ── Cargar pensums al cambiar de carrera ── */
  useEffect(() => {
    if (!carreraId) {
      setPensums([]);
      setPensumId('');
      return;
    }
    setLoadingPensums(true);
    setPensums([]);
    setPensumId('');
    fetch(`${api}/degree/${carreraId}/pensum`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('No se pudieron cargar los pensums');
        return r.json() as Promise<Pensum[]>;
      })
      .then((data) => {
        setPensums(data);
        // Preselecciona el pensum vigente, o el primero disponible si no hay vigente
        const vigente = data.find((p) => p.isCurrent) ?? data[0];
        setPensumId(vigente?.id ?? '');
      })
      .catch(() => {
        setPensums([]);
        setPensumId('');
      })
      .finally(() => setLoadingPensums(false));
  }, [carreraId, api, token]);

  /* ── Cargar materias si es Avanzado ── */
  useEffect(() => {
    if (tipoIngreso === 'avanzado' && pensumId) {
      setLoadingMaterias(true);
      fetch(`${api}/pensum/${pensumId}/materia`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(async (r) => {
          if (!r.ok) {
            const err = await r.json().catch(() => ({}));
            throw new Error(err.message || 'Error al cargar las materias');
          }
          return r.json();
        })
        .then((data) => {
          if (Array.isArray(data)) {
            setMateriasDelPensum(data);
          } else {
            setMateriasDelPensum([]);
          }
          setSelectedMateriaIds([]); // Reiniciar seleccionados al cambiar pensum/tipo
        })
        .catch(err => {
          console.error(err);
          setMateriasDelPensum([]);
          setSelectedMateriaIds([]);
        })
        .finally(() => setLoadingMaterias(false));
    } else {
      setMateriasDelPensum([]);
      setSelectedMateriaIds([]);
    }
  }, [tipoIngreso, pensumId, api, token]);

  /* ── Manejador de envío ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');

    if (!carreraId) { setSubmitError('Selecciona una carrera.'); return; }
    if (!pensumId) { setSubmitError('Selecciona un pensum.'); return; }
    if (!semestreActual.trim()) { setSubmitError('Ingresa el semestre actual (ej: 2025-1).'); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`${api}/perfiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          carreraId,
          pensumId,
          tipoIngreso,
          semestreActual: semestreActual.trim(),
          materiaIds: selectedMateriaIds,
        }),
      });

      const body = (await res.json().catch(() => ({}))) as { message?: string | string[] };

      if (!res.ok) {
        const msg = Array.isArray(body.message)
          ? body.message.join(', ')
          : body.message ?? 'No se pudo crear el perfil';
        throw new Error(msg);
      }

      window.location.href = '/dashboard';
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Error al guardar el perfil');
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Renderizado ── */
  if (loadingCareers) {
    return (
      <div className="gradum-page gradum-auth gradum-loading">
        <p>Cargando información…</p>
      </div>
    );
  }

  if (carrerasError) {
    return (
      <div className="gradum-page gradum-auth">
        <div className="gradum-onboarding-card">
          <p className="gradum-error">{carrerasError}</p>
          <button
            className="gradum-btn gradum-btn--secondary gradum-btn--block"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gradum-page gradum-auth gradum-onboarding">
      <div className="gradum-onboarding-card">
        {/* Cabecera */}
        <div className="gradum-onboarding-header">
          <span className="gradum-eyebrow">Bienvenido a Gradum</span>
          <h1>Completa tu perfil</h1>
          <p className="gradum-auth-sub">
            Cuéntanos sobre tu carrera para configurar tu experiencia académica.
          </p>
        </div>

        <form className="gradum-form" id="onboarding-form" onSubmit={handleSubmit} noValidate>
          {/* ── Carrera ── */}
          <div className="gradum-field">
            <span id="label-carrera">Carrera</span>
            <select
              id="onboarding-carrera"
              aria-labelledby="label-carrera"
              className="gradum-select gradum-select--full"
              value={carreraId}
              onChange={(e) => setCarreraId(e.target.value)}
              required
            >
              <option value="">— Selecciona tu carrera —</option>
              {carreras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.code ? ` (${c.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* ── Pensum ── */}
          <div className={`gradum-field${!carreraId ? ' gradum-field--disabled' : ''}`}>
            <span id="label-pensum">
              Pensum
              {loadingPensums && (
                <span className="gradum-onboarding-loading-hint"> — cargando…</span>
              )}
            </span>
            <select
              id="onboarding-pensum"
              aria-labelledby="label-pensum"
              className="gradum-select gradum-select--full"
              value={pensumId}
              onChange={(e) => setPensumId(e.target.value)}
              disabled={!carreraId || loadingPensums || pensums.length === 0}
              required
            >
              {!carreraId && <option value="">Primero selecciona una carrera</option>}
              {carreraId && pensums.length === 0 && !loadingPensums && (
                <option value="">Sin pensums disponibles</option>
              )}
              {pensums.map((p) => (
                <option key={p.id} value={p.id}>
                  {pensumLabel(p)}
                </option>
              ))}
            </select>
          </div>

          {/* ── Tipo de ingreso ── */}
          <div className="gradum-field">
            <span id="label-tipo">Tipo de ingreso</span>
            <select
              id="onboarding-tipo-ingreso"
              aria-labelledby="label-tipo"
              className="gradum-select gradum-select--full"
              value={tipoIngreso}
              onChange={(e) => setTipoIngreso(e.target.value as TipoIngreso)}
              required
            >
              <option value="primer_semestre">Primer semestre</option>
              <option value="avanzado">Avanzado (ya cursé materias)</option>
            </select>
          </div>

          {/* ── Semestre actual ── */}
          <div className="gradum-field">
            <span id="label-semestre">Semestre actual</span>
            <input
              id="onboarding-semestre"
              aria-labelledby="label-semestre"
              type="text"
              placeholder="ej: 2025-1"
              value={semestreActual}
              onChange={(e) => setSemestreActual(e.target.value)}
              required
            />
            <small className="gradum-onboarding-hint">
              Usa el formato año-número (ejemplo: 2025-1, 2025-2)
            </small>
          </div>

          {/* ── Drag & Drop de Materias (Solo si es Avanzado) ── */}
          {tipoIngreso === 'avanzado' && pensumId && (
            <div className="gradum-field" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--gradum-border)', paddingTop: '1.5rem' }}>
              <span id="label-materias">Inscripción Inicial</span>
              <p className="gradum-muted-text" style={{ fontSize: '0.85rem' }}>
                Como estudiante avanzado, selecciona las materias que estarás cursando en este semestre ({semestreActual || '...'}):
              </p>

              {loadingMaterias ? (
                <p className="gradum-loading">Cargando materias del pensum...</p>
              ) : (
                <SemesterEnrollmentDnd
                  disponibles={materiasDelPensum.filter(m => !selectedMateriaIds.includes(m.id))}
                  inscritas={materiasDelPensum
                    .filter(m => selectedMateriaIds.includes(m.id))
                    .map(m => ({
                      id: m.id,
                      materiaId: m.id,
                      usuarioId: '',
                      semestreEtiqueta: semestreActual,
                      estado: 'en_curso',
                      materia: m
                    }))
                  }
                  onEnroll={async (id: string) => setSelectedMateriaIds(prev => [...prev, id])}
                  onUnenroll={async (id: string) => setSelectedMateriaIds(prev => prev.filter(mid => mid !== id))}
                />
              )}
            </div>
          )}

          {/* ── Error ── */}
          {submitError && <p className="gradum-error">{submitError}</p>}

          {/* ── Submit ── */}
          <button
            id="onboarding-submit"
            type="submit"
            className="gradum-btn gradum-btn--primary gradum-btn--block"
            disabled={submitting || !carreraId || !pensumId}
          >
            {submitting ? 'Guardando…' : 'Continuar con mi experiencia'}
          </button>
        </form>
      </div>
    </div>
  );
}
