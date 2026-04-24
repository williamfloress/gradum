import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api } from '../services/api';
import {
  planesEvaluacionService,
  type PlanEvaluacion,
  type Evaluacion,
} from '../services/planes-evaluacion.service';
import './pages.css';
import './plan-evaluacion.css';

// ——— Utilidades ———

function sumPorcentaje(planes: PlanEvaluacion[]): number {
  return planes.reduce((acc, p) => acc + parseFloat(p.porcentaje || '0'), 0);
}

function estadoBadgeClass(estado: string) {
  if (estado === 'aprobada') return 'gpe-badge gpe-badge--aprobada';
  if (estado === 'reprobada') return 'gpe-badge gpe-badge--reprobada';
  return 'gpe-badge gpe-badge--en_curso';
}

function estadoLabel(estado: string) {
  if (estado === 'aprobada') return 'Aprobada';
  if (estado === 'reprobada') return 'Reprobada';
  return 'En curso';
}

// ——— Sub-componente: fila de evaluación ———

interface EvaluacionRowProps {
  ev: Evaluacion;
  inscripcionId: string;
  planId: string;
  onUpdated: () => void;
}

function EvaluacionRow({ ev, inscripcionId, planId, onUpdated }: EvaluacionRowProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState({
    fechaLimite: ev.fechaLimite ? ev.fechaLimite.slice(0, 10) : '',
    observacion: ev.observacion ?? '',
    notaEsperada: ev.notaEsperada ?? '',
    notaReal: ev.notaReal ?? '',
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await planesEvaluacionService.updateEvaluacion(inscripcionId, planId, ev.id, {
        fechaLimite: fields.fechaLimite || '',
        observacion: fields.observacion || undefined,
        notaEsperada: fields.notaEsperada !== '' ? parseFloat(String(fields.notaEsperada)) : undefined,
        notaReal: fields.notaReal !== '' ? parseFloat(String(fields.notaReal)) : null,
      });
      setEditing(false);
      onUpdated();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta evaluación?')) return;
    try {
      await planesEvaluacionService.deleteEvaluacion(inscripcionId, planId, ev.id);
      onUpdated();
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (editing) {
    return (
      <tr className="gpe-ev-row gpe-ev-row--editing">
        <td>
          <input
            id={`ev-fecha-${ev.id}`}
            type="date"
            className="gradum-inline-input"
            value={fields.fechaLimite}
            onChange={e => setFields(f => ({ ...f, fechaLimite: e.target.value }))}
          />
        </td>
        <td>
          <input
            id={`ev-obs-${ev.id}`}
            type="text"
            className="gradum-inline-input"
            placeholder="Observación"
            value={fields.observacion}
            onChange={e => setFields(f => ({ ...f, observacion: e.target.value }))}
          />
        </td>
        <td>
          <input
            id={`ev-esperada-${ev.id}`}
            type="number"
            min="0" max="5" step="0.1"
            className="gradum-inline-input gradum-inline-input--num"
            placeholder="0.0"
            value={fields.notaEsperada}
            onChange={e => setFields(f => ({ ...f, notaEsperada: e.target.value }))}
          />
        </td>
        <td>
          <input
            id={`ev-real-${ev.id}`}
            type="number"
            min="0" max="5" step="0.1"
            className="gradum-inline-input gradum-inline-input--num"
            placeholder="0.0"
            value={fields.notaReal}
            onChange={e => setFields(f => ({ ...f, notaReal: e.target.value }))}
          />
        </td>
        <td>
          <div className="gradum-admin-actions">
            <button
              id={`ev-save-${ev.id}`}
              className="gradum-btn gradum-btn--primary gradum-btn--sm"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
            <button
              className="gradum-btn gradum-btn--secondary gradum-btn--sm"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Cancelar
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="gpe-ev-row">
      <td>{ev.fechaLimite ? ev.fechaLimite.slice(0, 10) : <span className="gpe-empty">—</span>}</td>
      <td>{ev.observacion || <span className="gpe-empty">—</span>}</td>
      <td className="gpe-nota">{ev.notaEsperada ?? <span className="gpe-empty">—</span>}</td>
      <td className="gpe-nota gpe-nota--real">{ev.notaReal ?? <span className="gpe-empty">—</span>}</td>
      <td>
        <div className="gradum-admin-actions">
          <button
            id={`ev-edit-${ev.id}`}
            className="gradum-btn gradum-btn--secondary gradum-btn--sm"
            onClick={() => setEditing(true)}
          >
            Editar
          </button>
          <button
            id={`ev-del-${ev.id}`}
            className="gradum-btn gradum-btn--danger gradum-btn--sm"
            onClick={handleDelete}
          >
            Eliminar
          </button>
        </div>
      </td>
    </tr>
  );
}

// ——— Sub-componente: tarjeta de plan ———

interface PlanCardProps {
  plan: PlanEvaluacion;
  inscripcionId: string;
  onUpdated: () => void;
}

function PlanCard({ plan, inscripcionId, onUpdated }: PlanCardProps) {
  const [editingPlan, setEditingPlan] = useState(false);
  const [planFields, setPlanFields] = useState({
    nombre: plan.nombre,
    porcentaje: plan.porcentaje,
    orden: String(plan.orden),
  });
  const [savingPlan, setSavingPlan] = useState(false);
  const [addingEv, setAddingEv] = useState(false);
  const [newEv, setNewEv] = useState({ fechaLimite: '', observacion: '', notaEsperada: '', notaReal: '' });
  const [savingEv, setSavingEv] = useState(false);

  const handleSavePlan = async () => {
    setSavingPlan(true);
    try {
      await planesEvaluacionService.updatePlan(inscripcionId, plan.id, {
        nombre: planFields.nombre,
        porcentaje: parseFloat(planFields.porcentaje),
        orden: parseInt(planFields.orden) || 0,
      });
      setEditingPlan(false);
      onUpdated();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSavingPlan(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!confirm(`¿Eliminar plan "${plan.nombre}" y todas sus evaluaciones?`)) return;
    try {
      await planesEvaluacionService.deletePlan(inscripcionId, plan.id);
      onUpdated();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleAddEv = async () => {
    setSavingEv(true);
    try {
      await planesEvaluacionService.createEvaluacion(inscripcionId, plan.id, {
        fechaLimite: newEv.fechaLimite || undefined,
        observacion: newEv.observacion || undefined,
        notaEsperada: newEv.notaEsperada !== '' ? parseFloat(newEv.notaEsperada) : undefined,
        notaReal: newEv.notaReal !== '' ? parseFloat(newEv.notaReal) : undefined,
      });
      setNewEv({ fechaLimite: '', observacion: '', notaEsperada: '', notaReal: '' });
      setAddingEv(false);
      onUpdated();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSavingEv(false);
    }
  };

  return (
    <div className="gpe-plan-card">
      {/* Cabecera del plan */}
      <div className="gpe-plan-header">
        {editingPlan ? (
          <div className="gpe-plan-edit-form">
            <input
              id={`plan-nombre-${plan.id}`}
              className="gradum-inline-input"
              placeholder="Nombre"
              value={planFields.nombre}
              onChange={e => setPlanFields(f => ({ ...f, nombre: e.target.value }))}
            />
            <input
              id={`plan-pct-${plan.id}`}
              type="number" min="0" max="100" step="0.01"
              className="gradum-inline-input gradum-inline-input--num"
              placeholder="%"
              value={planFields.porcentaje}
              onChange={e => setPlanFields(f => ({ ...f, porcentaje: e.target.value }))}
            />
            <input
              id={`plan-orden-${plan.id}`}
              type="number" min="0"
              className="gradum-inline-input gradum-inline-input--num"
              placeholder="Orden"
              value={planFields.orden}
              onChange={e => setPlanFields(f => ({ ...f, orden: e.target.value }))}
            />
            <div className="gradum-admin-actions">
              <button
                id={`plan-save-${plan.id}`}
                className="gradum-btn gradum-btn--primary gradum-btn--sm"
                onClick={handleSavePlan} disabled={savingPlan}
              >
                {savingPlan ? 'Guardando…' : 'Guardar'}
              </button>
              <button
                className="gradum-btn gradum-btn--secondary gradum-btn--sm"
                onClick={() => setEditingPlan(false)} disabled={savingPlan}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="gpe-plan-info">
              <span className="gpe-plan-name">{plan.nombre}</span>
              <span className="gpe-plan-pct">{parseFloat(plan.porcentaje).toFixed(1)} %</span>
              <span className="gpe-plan-orden">Orden {plan.orden}</span>
            </div>
            <div className="gradum-admin-actions">
              <button
                id={`plan-edit-${plan.id}`}
                className="gradum-btn gradum-btn--secondary gradum-btn--sm"
                onClick={() => setEditingPlan(true)}
              >
                Editar
              </button>
              <button
                id={`plan-del-${plan.id}`}
                className="gradum-btn gradum-btn--danger gradum-btn--sm"
                onClick={handleDeletePlan}
              >
                Eliminar
              </button>
            </div>
          </>
        )}
      </div>

      {/* Tabla de evaluaciones */}
      <div className="gpe-ev-section">
        <div className="gradum-table-scroll">
          <table className="gradum-table gpe-ev-table" aria-label={`Evaluaciones del plan ${plan.nombre}`}>
            <thead>
              <tr>
                <th>Fecha límite</th>
                <th>Observación</th>
                <th>Nota esperada</th>
                <th>Nota real</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {plan.evaluaciones.length === 0 ? (
                <tr>
                  <td colSpan={5} className="gpe-ev-empty">Sin evaluaciones</td>
                </tr>
              ) : (
                plan.evaluaciones.map(ev => (
                  <EvaluacionRow
                    key={ev.id}
                    ev={ev}
                    inscripcionId={inscripcionId}
                    planId={plan.id}
                    onUpdated={onUpdated}
                  />
                ))
              )}

              {/* Fila de nueva evaluación */}
              {addingEv && (
                <tr className="gpe-ev-row gpe-ev-row--new">
                  <td>
                    <input
                      id={`new-ev-fecha-${plan.id}`}
                      type="date"
                      className="gradum-inline-input"
                      value={newEv.fechaLimite}
                      onChange={e => setNewEv(f => ({ ...f, fechaLimite: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      id={`new-ev-obs-${plan.id}`}
                      type="text"
                      className="gradum-inline-input"
                      placeholder="Observación"
                      value={newEv.observacion}
                      onChange={e => setNewEv(f => ({ ...f, observacion: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      id={`new-ev-esperada-${plan.id}`}
                      type="number" min="0" max="5" step="0.1"
                      className="gradum-inline-input gradum-inline-input--num"
                      placeholder="0.0"
                      value={newEv.notaEsperada}
                      onChange={e => setNewEv(f => ({ ...f, notaEsperada: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      id={`new-ev-real-${plan.id}`}
                      type="number" min="0" max="5" step="0.1"
                      className="gradum-inline-input gradum-inline-input--num"
                      placeholder="0.0"
                      value={newEv.notaReal}
                      onChange={e => setNewEv(f => ({ ...f, notaReal: e.target.value }))}
                    />
                  </td>
                  <td>
                    <div className="gradum-admin-actions">
                      <button
                        id={`new-ev-save-${plan.id}`}
                        className="gradum-btn gradum-btn--primary gradum-btn--sm"
                        onClick={handleAddEv} disabled={savingEv}
                      >
                        {savingEv ? 'Guardando…' : 'Agregar'}
                      </button>
                      <button
                        className="gradum-btn gradum-btn--secondary gradum-btn--sm"
                        onClick={() => setAddingEv(false)} disabled={savingEv}
                      >
                        Cancelar
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!addingEv && (
          <button
            id={`add-ev-${plan.id}`}
            className="gradum-btn gradum-btn--outline gradum-btn--sm gpe-add-ev-btn"
            onClick={() => setAddingEv(true)}
          >
            + Agregar evaluación
          </button>
        )}
      </div>
    </div>
  );
}

// ——— Página principal ———

interface InscripcionInfo {
  id: string;
  semestreEtiqueta: string;
  estado: string;
  notaDefinitiva: string | null;
  materia: { nombre: string; codigo: string | null };
}

export function PlanEvaluacionPage() {
  useAuth();
  const { inscripcionId } = useParams<{ inscripcionId: string }>();
  const [inscripcion, setInscripcion] = useState<InscripcionInfo | null>(null);
  const [planes, setPlanes] = useState<PlanEvaluacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Formulario de nuevo plan
  const [addingPlan, setAddingPlan] = useState(false);
  const [newPlan, setNewPlan] = useState({ nombre: '', porcentaje: '', orden: '0' });
  const [savingPlan, setSavingPlan] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!inscripcionId) return;
    try {
      setError(null);
      const [inscData, planesData] = await Promise.all([
        api.get<InscripcionInfo>(`/inscripciones/${inscripcionId}`),
        planesEvaluacionService.getPlanes(inscripcionId),
      ]);
      setInscripcion(inscData);
      setPlanes(planesData);
    } catch (e: any) {
      setError(e.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [inscripcionId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreatePlan = async () => {
    if (!inscripcionId) return;
    if (!newPlan.nombre.trim()) { setPlanError('El nombre es obligatorio'); return; }
    const pct = parseFloat(newPlan.porcentaje);
    if (isNaN(pct) || pct <= 0) { setPlanError('El porcentaje debe ser mayor a 0'); return; }

    setSavingPlan(true);
    setPlanError(null);
    try {
      await planesEvaluacionService.createPlan(inscripcionId, {
        nombre: newPlan.nombre.trim(),
        porcentaje: pct,
        orden: parseInt(newPlan.orden) || 0,
      });
      setNewPlan({ nombre: '', porcentaje: '', orden: '0' });
      setAddingPlan(false);
      await loadData();
    } catch (e: any) {
      setPlanError(e.message);
    } finally {
      setSavingPlan(false);
    }
  };

  if (loading) {
    return (
      <div className="gradum-page gradum-loading">
        <p>Cargando plan de evaluación…</p>
      </div>
    );
  }

  const sumaPct = sumPorcentaje(planes);
  const sumaCls = sumaPct > 100 ? 'gpe-pct-bar--over' : sumaPct === 100 ? 'gpe-pct-bar--full' : '';

  return (
    <div className="gradum-page gradum-dashboard">
      <header className="gradum-dash-header gradum-dash-header--wide">
        <Link to="/" className="gradum-logo gradum-logo--link">GRADUM</Link>
        <nav className="gradum-dash-nav">
          <Link to="/dashboard" className="gradum-link">Dashboard</Link>
          <span className="gradum-dash-nav__current">/ Inscripciones</span>
          <span className="gradum-dash-nav__current">/ Plan de evaluación</span>
        </nav>
      </header>

      <main className="gradum-dash-main gradum-dash-main--wide">
        {/* Encabezado de la inscripción */}
        {inscripcion && (
          <div className="gpe-inscripcion-header">
            <div>
              <h1>{inscripcion.materia.nombre}</h1>
              <p className="gradum-muted-text">
                {inscripcion.materia.codigo && <><code>{inscripcion.materia.codigo}</code> · </>}
                {inscripcion.semestreEtiqueta}
              </p>
            </div>
            <div className="gpe-inscripcion-meta">
              <span className={estadoBadgeClass(inscripcion.estado)}>
                {estadoLabel(inscripcion.estado)}
              </span>
              {inscripcion.notaDefinitiva != null && (
                <div className="gpe-nota-definitiva">
                  <span className="gpe-nota-definitiva__label">Nota definitiva</span>
                  <span className="gpe-nota-definitiva__value">
                    {parseFloat(inscripcion.notaDefinitiva).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {error && <p className="gradum-error gradum-error--block">{error}</p>}

        {/* Barra de porcentaje acumulado */}
        <div className="gpe-pct-summary">
          <div className="gpe-pct-summary__label">
            Porcentaje acumulado: <strong>{sumaPct.toFixed(1)} / 100 %</strong>
            {sumaPct > 100 && <span className="gpe-pct-over-msg"> ⚠ Supera el 100%</span>}
          </div>
          <div className="gpe-pct-track">
            <div
              className={`gpe-pct-fill ${sumaCls}`}
              style={{ width: `${Math.min(sumaPct, 100)}%` }}
              role="progressbar"
              aria-valuenow={sumaPct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        {/* Lista de planes */}
        <section aria-labelledby="planes-heading" className="gpe-section">
          <div className="gpe-section-header">
            <h2 id="planes-heading">Planes de evaluación</h2>
            {!addingPlan && (
              <button
                id="btn-add-plan"
                className="gradum-btn gradum-btn--primary gradum-btn--sm"
                onClick={() => { setAddingPlan(true); setPlanError(null); }}
              >
                + Nuevo plan
              </button>
            )}
          </div>

          {/* Formulario nuevo plan */}
          {addingPlan && (
            <div className="gpe-new-plan-form gradum-dash-card">
              <h3 className="gpe-new-plan-title">Nuevo plan</h3>
              {planError && <p className="gradum-error" role="alert">{planError}</p>}
              <div className="gpe-new-plan-fields">
                <div className="gradum-field">
                  <span>Nombre</span>
                  <input
                    id="new-plan-nombre"
                    type="text"
                    className="gradum-inline-input"
                    placeholder="Ej: Parcial 1, Proyecto Final…"
                    value={newPlan.nombre}
                    onChange={e => setNewPlan(f => ({ ...f, nombre: e.target.value }))}
                  />
                </div>
                <div className="gradum-field">
                  <span>Porcentaje (%)</span>
                  <input
                    id="new-plan-porcentaje"
                    type="number" min="0" max="100" step="0.01"
                    className="gradum-inline-input gradum-inline-input--num"
                    placeholder="Ej: 30"
                    value={newPlan.porcentaje}
                    onChange={e => setNewPlan(f => ({ ...f, porcentaje: e.target.value }))}
                  />
                </div>
                <div className="gradum-field">
                  <span>Orden</span>
                  <input
                    id="new-plan-orden"
                    type="number" min="0"
                    className="gradum-inline-input gradum-inline-input--num"
                    value={newPlan.orden}
                    onChange={e => setNewPlan(f => ({ ...f, orden: e.target.value }))}
                  />
                </div>
              </div>
              <div className="gradum-admin-actions" style={{ marginTop: '1rem' }}>
                <button
                  id="new-plan-save"
                  className="gradum-btn gradum-btn--primary"
                  onClick={handleCreatePlan}
                  disabled={savingPlan}
                >
                  {savingPlan ? 'Guardando…' : 'Crear plan'}
                </button>
                <button
                  className="gradum-btn gradum-btn--secondary"
                  onClick={() => { setAddingPlan(false); setPlanError(null); }}
                  disabled={savingPlan}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Planes existentes */}
          {planes.length === 0 && !addingPlan ? (
            <div className="gradum-dash-card gpe-empty-state">
              <p className="gradum-muted-text">Aún no hay planes de evaluación. Crea el primero.</p>
            </div>
          ) : (
            <div className="gpe-planes-list">
              {planes.map(plan => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  inscripcionId={inscripcionId!}
                  onUpdated={loadData}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
