import { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer, type Event as RBCEvent, type ToolbarProps, type EventProps } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useAuth } from '../auth/AuthContext';
import { getApiUrl } from '../lib/config';
import './pages.css';

/* ─── Localización española ──────────────────────────────────── */
const locales = { es };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: es }),
  getDay,
  locales,
});

const RBC_MESSAGES = {
  allDay: 'Todo el día',
  previous: '‹',
  next: '›',
  today: 'Hoy',
  month: 'Mes',
  week: 'Semana',
  day: 'Día',
  agenda: 'Agenda',
  date: 'Fecha',
  time: 'Hora',
  event: 'Evento',
  noEventsInRange: 'No hay evaluaciones en este rango.',
  showMore: (total: number) => `+${total} más`,
};

/* ─── Tipos ─────────────────────────────────────────────────── */
type CalEvent = {
  id: string;
  titulo: string;
  fechaLimite: string;
  observacion: string | null;
  notaEsperada: number | null;
  notaReal: number | null;
  planId: string;
  inscripcionId: string;
  materiaNombre: string;
  planNombre: string;
  porcentajePlan: number;
};

type RBCCalEvent = RBCEvent & { resource: CalEvent };

/* ─── Componentes Personalizados del Calendario ─────────────── */

// Barra de herramientas (Toolbar) personalizada
const CustomToolbar = (props: ToolbarProps<RBCCalEvent>) => {
  const { label, onNavigate, onView, view } = props;

  return (
    <div className="rbc-toolbar gradum-calendar-toolbar">
      {/* Navegación */}
      <div className="gradum-calendar-nav">
        <button type="button" className="gradum-btn gradum-btn--outline gradum-btn--sm" onClick={() => onNavigate('PREV')}>
          <span className="nav-text-desktop">Anterior</span>
          <span className="nav-text-mobile">‹</span>
        </button>
        <button type="button" className="gradum-btn gradum-btn--primary gradum-btn--sm" onClick={() => onNavigate('TODAY')}>Hoy</button>
        <button type="button" className="gradum-btn gradum-btn--outline gradum-btn--sm" onClick={() => onNavigate('NEXT')}>
          <span className="nav-text-desktop">Siguiente</span>
          <span className="nav-text-mobile">›</span>
        </button>
      </div>

      {/* Etiqueta Central */}
      <span className="rbc-toolbar-label">{label}</span>

      {/* Selectores de Vista */}
      <div className="gradum-calendar-views">
        {(['month', 'week', 'agenda'] as const).map((v) => (
          <button
            key={v}
            type="button"
            className={`gradum-btn gradum-btn--sm ${view === v ? 'gradum-btn--primary' : 'gradum-btn--ghost'}`}
            onClick={() => onView(v)}
          >
            {RBC_MESSAGES[v]}
          </button>
        ))}
      </div>
    </div>
  );
};

// Evento personalizado
const CustomEvent = ({ event }: EventProps<RBCCalEvent>) => {
  const ev = event.resource;
  const isCalificada = ev.notaReal != null;
  const color = isCalificada ? '#22c55e' : '#6366f1';

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '2px', 
      padding: '2px 0',
      overflow: 'hidden'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '4px',
        fontSize: '0.75rem',
        fontWeight: 700,
        color: '#fff'
      }}>
        <span style={{ 
          width: '6px', 
          height: '6px', 
          borderRadius: '50%', 
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}`
        }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {ev.materiaNombre}
        </span>
      </div>
      <div style={{ 
        fontSize: '0.65rem', 
        opacity: 0.8, 
        overflow: 'hidden', 
        textOverflow: 'ellipsis', 
        whiteSpace: 'nowrap',
        paddingLeft: '10px'
      }}>
        {ev.titulo}
      </div>
    </div>
  );
};

/* ─── Modal de evaluación ────────────────────────────────────── */
type ModalProps = {
  event: CalEvent;
  onClose: () => void;
  onSaved: (updated: Partial<CalEvent>) => void;
};

function EvalModal({ event, onClose, onSaved }: ModalProps) {
  const { token } = useAuth();
  const api = getApiUrl();

  const [notaEsperada, setNotaEsperada] = useState(
    event.notaEsperada != null ? String(event.notaEsperada) : '',
  );
  const [notaReal, setNotaReal] = useState(
    event.notaReal != null ? String(event.notaReal) : '',
  );
  const [observacion, setObservacion] = useState(event.observacion ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!token) return;
    setSaving(true);
    setError(null);

    const body: Record<string, string | number | undefined> = {};
    if (observacion !== (event.observacion ?? '')) body.observacion = observacion;
    if (notaEsperada !== '' && Number(notaEsperada) !== event.notaEsperada) body.notaEsperada = Number(notaEsperada);
    if (notaReal !== '' && Number(notaReal) !== event.notaReal) body.notaReal = Number(notaReal);

    if (Object.keys(body).length === 0) { onClose(); return; }

    const res = await fetch(
      `${api}/inscripciones/${event.inscripcionId}/planes-evaluacion/${event.planId}/evaluaciones/${event.id}`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );

    setSaving(false);

    if (!res.ok) {
      const b = await res.json().catch(() => ({})) as { message?: string };
      setError(b.message ?? 'Error al guardar');
      return;
    }

    onSaved({
      observacion,
      notaEsperada: notaEsperada !== '' ? Number(notaEsperada) : null,
      notaReal: notaReal !== '' ? Number(notaReal) : null,
    });
    onClose();
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.7)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        backdropFilter: 'blur(4px)'
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="gradum-dash-card"
        style={{
          width: '100%', maxWidth: '480px', padding: '2rem',
          borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.25rem',
          animation: 'gradum-fade-in 0.2s ease',
          background: 'var(--gradum-surface)',
          border: '1px solid var(--gradum-border)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.2rem', color: 'var(--gradum-heading)' }}>{event.materiaNombre}</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--gradum-muted)' }}>
              {event.planNombre} · {event.porcentajePlan}%
            </p>
          </div>
          <button
            type="button"
            className="gradum-btn gradum-btn--ghost gradum-btn--sm"
            onClick={onClose}
            style={{ 
              flexShrink: 0, 
              fontSize: '1rem', 
              width: '32px', 
              height: '32px', 
              padding: 0, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--gradum-border)'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '0.75rem 1rem', background: 'var(--gradum-bg)', borderRadius: '12px', border: '1px solid var(--gradum-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.2rem' }}>📅</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--gradum-success-text)', fontWeight: 600, textTransform: 'capitalize' }}>
            {new Date(event.fechaLimite).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>

        {error && <p className="gradum-error gradum-error--block">{error}</p>}

        {/* Campos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <label className="gradum-field">
            <span>Nota esperada</span>
            <input
              type="number" min="0" max="10" step="0.1"
              value={notaEsperada} onChange={(e) => setNotaEsperada(e.target.value)}
              placeholder="0.0"
              style={{ background: 'var(--gradum-input-bg)', border: '1px solid var(--gradum-border)', borderRadius: '10px', padding: '0.75rem' }}
            />
          </label>
          <label className="gradum-field">
            <span>Nota real</span>
            <input
              type="number" min="0" max="10" step="0.1"
              value={notaReal} onChange={(e) => setNotaReal(e.target.value)}
              placeholder="0.0"
              style={{ background: 'var(--gradum-input-bg)', border: '1px solid var(--gradum-border)', borderRadius: '10px', padding: '0.75rem' }}
            />
          </label>
        </div>

        <label className="gradum-field">
          <span>Observación</span>
          <textarea
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            placeholder="Notas adicionales sobre esta evaluación..."
            rows={3}
            style={{ 
              resize: 'none', 
              background: 'var(--gradum-input-bg)', 
              border: '1px solid var(--gradum-border)', 
              borderRadius: '10px', 
              padding: '0.75rem',
              color: 'var(--gradum-text)',
              fontFamily: 'inherit'
            }}
          />
        </label>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
          <button type="button" className="gradum-btn gradum-btn--outline" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
          <button
            type="button"
            className="gradum-btn gradum-btn--primary"
            style={{ flex: 2 }}
            onClick={() => void handleSave()}
            disabled={saving}
          >
            {saving ? 'Guardando…' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Página principal ───────────────────────────────────────── */
export function CalendarPage() {
  const { token, logout } = useAuth();
  const api = getApiUrl();

  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [selected, setSelected]   = useState<CalEvent | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    const res = await fetch(`${api}/perfiles/calendario`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) { logout(); return; }
    if (!res.ok) {
      const b = await res.json().catch(() => ({})) as { message?: string };
      setError(b.message ?? 'No se pudo cargar el calendario');
      setLoading(false);
      return;
    }
    const data = await res.json() as CalEvent[];
    setEvents(data);
    setLoading(false);
  }, [api, token, logout]);

  useEffect(() => { void load(); }, [load]);

  const rbcEvents = useMemo<RBCCalEvent[]>(() =>
    events.map((ev) => {
      const d = new Date(ev.fechaLimite);
      return {
        title: ev.titulo,
        start: d,
        end: d,
        allDay: true,
        resource: ev,
      };
    }),
    [events],
  );

  const eventStyleGetter = (evt: RBCCalEvent) => {
    const ev = evt.resource;
    const isCalificada = ev.notaReal != null;
    const color = isCalificada ? '#22c55e' : '#6366f1';
    
    return { 
      style: { 
        backgroundColor: `${color}22`, 
        borderLeft: `3px solid ${color}`,
        borderRight: 'none',
        borderTop: 'none',
        borderBottom: 'none',
        color: '#fff', 
        borderRadius: '4px',
        margin: '2px 0'
      } 
    };
  };

  function handleSaved(updated: Partial<CalEvent>) {
    if (!selected) return;
    setEvents((prev) =>
      prev.map((ev) => (ev.id === selected.id ? { ...ev, ...updated } : ev)),
    );
  }

  return (
    <DashboardLayout>
      <div style={{ flex: 1, padding: '1rem 0', width: '100%' }}>
        <header style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Calendario de Evaluaciones</h1>
          <p className="gradum-lead">Gestiona tus fechas límite y registra tus resultados académicos.</p>
        </header>

        {error && <p className="gradum-error gradum-error--block" style={{ marginBottom: '1.5rem' }}>{error}</p>}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <p className="gradum-muted-text">Cargando tu calendario personalizado…</p>
          </div>
        ) : (
          <div className="gradum-dash-card" style={{ padding: '1.5rem', background: 'var(--gradum-surface)', borderRadius: '20px' }}>
            <Calendar<RBCCalEvent>
              localizer={localizer}
              events={rbcEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 'calc(100vh - 350px)', minHeight: '600px' }}
              messages={RBC_MESSAGES}
              culture="es"
              eventPropGetter={(evt) => eventStyleGetter(evt as RBCCalEvent)}
              onSelectEvent={(evt) => setSelected((evt as RBCCalEvent).resource)}
              views={['month', 'week', 'agenda']}
              defaultView="month"
              popup
              components={{
                toolbar: CustomToolbar,
                event: CustomEvent,
              }}
            />
            
            {/* Leyenda Inferior */}
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--gradum-border)', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 8px #6366f1' }} />
                <span style={{ fontSize: '0.82rem', color: 'var(--gradum-muted)' }}>Evaluación Pendiente</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
                <span style={{ fontSize: '0.82rem', color: 'var(--gradum-muted)' }}>Evaluación Calificada</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <EvalModal
          event={selected}
          onClose={() => setSelected(null)}
          onSaved={handleSaved}
        />
      )}
    </DashboardLayout>
  );
}
