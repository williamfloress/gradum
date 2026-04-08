import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getApiUrl } from '../lib/config';
import './pages.css';

type MateriaRow = {
  id: string;
  pensumId: string;
  nombre: string;
  codigo?: string | null;
  semestreNumero: number;
  creditos?: number | null;
  orden?: number | null;
};

type PrerrequisitoRow = {
  id: string;
  materiaId: string;
  materiaPrerrequisitoId: string;
  materiaPrerrequisito?: MateriaRow;
};

type CreateMateriaForm = {
  nombre: string;
  codigo: string;
  semestreNumero: string;
  creditos: string;
  orden: string;
};

type PensumInfo = {
  id: string;
  name: string;
  degreeId: string;
};

function parseErrorMessage(body: unknown, fallback: string) {
  if (!body || typeof body !== 'object') return fallback;
  const msg = (body as { message?: string | string[] }).message;
  if (Array.isArray(msg)) return msg.join(', ');
  if (typeof msg === 'string' && msg.length > 0) return msg;
  return fallback;
}

function toOptionalNumber(value: string): number | undefined {
  const v = value.trim();
  if (!v.length) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function AdminPensumMateriasPage() {
  const { id: pensumId } = useParams();
  const { token, logout } = useAuth();
  const api = getApiUrl();

  const [pensum, setPensum] = useState<PensumInfo | null>(null);
  const [rows, setRows] = useState<MateriaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState<CreateMateriaForm>({
    nombre: '',
    codigo: '',
    semestreNumero: '1',
    creditos: '',
    orden: '',
  });

  const [expandedMateriaId, setExpandedMateriaId] = useState<string | null>(null);
  const [prerreqByMateria, setPrerreqByMateria] = useState<Record<string, PrerrequisitoRow[]>>({});
  const [prerreqErrorByMateria, setPrerreqErrorByMateria] = useState<Record<string, string | null>>({});
  const [addPrerreqSelection, setAddPrerreqSelection] = useState<Record<string, string>>({});

  const canSubmit = useMemo(() => {
    return createForm.nombre.trim().length > 0 && toOptionalNumber(createForm.semestreNumero) !== undefined;
  }, [createForm.nombre, createForm.semestreNumero]);

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      if (a.semestreNumero !== b.semestreNumero) return a.semestreNumero - b.semestreNumero;
      const ao = a.orden ?? 999999;
      const bo = b.orden ?? 999999;
      if (ao !== bo) return ao - bo;
      return a.nombre.localeCompare(b.nombre, 'es');
    });
    return copy;
  }, [rows]);

  const loadPensum = useCallback(async () => {
    if (!token || !pensumId) return;
    const res = await fetch(`${api}/pensum/${pensumId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      logout();
      return;
    }
    if (!res.ok) {
      // No bloqueamos toda la pantalla; solo dejamos el breadcrumb sin degreeId.
      setPensum(null);
      return;
    }
    const data = (await res.json()) as { id: string; name: string; degreeId: string };
    setPensum({ id: data.id, name: data.name, degreeId: data.degreeId });
  }, [api, token, logout, pensumId]);

  const load = useCallback(async () => {
    if (!token || !pensumId) return;
    setLoading(true);
    setError(null);
    const res = await fetch(`${api}/pensum/${pensumId}/materia`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      logout();
      return;
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as unknown;
      setError(parseErrorMessage(body, 'No se pudo cargar la lista de materias'));
      setLoading(false);
      return;
    }
    const data = (await res.json()) as MateriaRow[];
    setRows(data);
    setLoading(false);
  }, [api, token, logout, pensumId]);

  useEffect(() => {
    void loadPensum();
    void load();
  }, [load, loadPensum]);

  async function createMateria() {
    if (!token || !pensumId || !canSubmit) return;
    setError(null);
    setPendingId('create');
    const semestreNumero = toOptionalNumber(createForm.semestreNumero);
    const creditos = toOptionalNumber(createForm.creditos);
    const orden = toOptionalNumber(createForm.orden);
    const res = await fetch(`${api}/pensum/${pensumId}/materia`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nombre: createForm.nombre.trim(),
        codigo: createForm.codigo.trim().length ? createForm.codigo.trim() : undefined,
        semestreNumero,
        creditos,
        orden,
      }),
    });
    setPendingId(null);
    if (res.status === 401) {
      logout();
      return;
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as unknown;
      setError(parseErrorMessage(body, 'No se pudo crear la materia'));
      return;
    }
    const created = (await res.json()) as MateriaRow;
    setRows((prev) => [...prev, created]);
    setCreateForm({ nombre: '', codigo: '', semestreNumero: '1', creditos: '', orden: '' });
  }

  async function updateMateria(materiaId: string, patch: Partial<MateriaRow>) {
    if (!token || !pensumId) return;
    setError(null);
    setPendingId(materiaId);
    const res = await fetch(`${api}/pensum/${pensumId}/materia/${materiaId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patch),
    });
    setPendingId(null);
    if (res.status === 401) {
      logout();
      return;
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as unknown;
      setError(parseErrorMessage(body, 'No se pudo actualizar la materia'));
      return;
    }
    const updated = (await res.json()) as MateriaRow;
    setRows((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  }

  async function deleteMateria(materiaId: string) {
    if (!token || !pensumId) return;
    const ok = confirm('¿Eliminar esta materia? También se eliminarán relaciones de prerrequisitos asociadas.');
    if (!ok) return;
    setError(null);
    setPendingId(materiaId);
    const res = await fetch(`${api}/pensum/${pensumId}/materia/${materiaId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setPendingId(null);
    if (res.status === 401) {
      logout();
      return;
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as unknown;
      setError(parseErrorMessage(body, 'No se pudo eliminar la materia'));
      return;
    }
    setRows((prev) => prev.filter((m) => m.id !== materiaId));
    setExpandedMateriaId((prev) => (prev === materiaId ? null : prev));
  }

  async function loadPrerrequisitos(materiaId: string) {
    if (!token) return;
    setPrerreqErrorByMateria((prev) => ({ ...prev, [materiaId]: null }));
    const res = await fetch(`${api}/materias/${materiaId}/prerrequisitos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      logout();
      return;
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as unknown;
      setPrerreqErrorByMateria((prev) => ({
        ...prev,
        [materiaId]: parseErrorMessage(body, 'No se pudieron cargar los prerrequisitos'),
      }));
      return;
    }
    const data = (await res.json()) as PrerrequisitoRow[];
    setPrerreqByMateria((prev) => ({ ...prev, [materiaId]: data }));
  }

  async function addPrerrequisito(materiaId: string) {
    const materiaPrerrequisitoId = addPrerreqSelection[materiaId];
    if (!token || !materiaPrerrequisitoId) return;
    setPrerreqErrorByMateria((prev) => ({ ...prev, [materiaId]: null }));
    setPendingId(`prerreq-add-${materiaId}`);
    const res = await fetch(`${api}/materias/${materiaId}/prerrequisitos`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ materiaPrerrequisitoId }),
    });
    setPendingId(null);
    if (res.status === 401) {
      logout();
      return;
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as unknown;
      setPrerreqErrorByMateria((prev) => ({
        ...prev,
        [materiaId]: parseErrorMessage(body, 'No se pudo agregar el prerrequisito'),
      }));
      return;
    }
    await loadPrerrequisitos(materiaId);
    setAddPrerreqSelection((prev) => ({ ...prev, [materiaId]: '' }));
  }

  async function deletePrerrequisito(materiaId: string, materiaPrerrequisitoId: string) {
    if (!token) return;
    setPrerreqErrorByMateria((prev) => ({ ...prev, [materiaId]: null }));
    setPendingId(`prerreq-del-${materiaId}-${materiaPrerrequisitoId}`);
    const res = await fetch(`${api}/materias/${materiaId}/prerrequisitos/${materiaPrerrequisitoId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setPendingId(null);
    if (res.status === 401) {
      logout();
      return;
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as unknown;
      setPrerreqErrorByMateria((prev) => ({
        ...prev,
        [materiaId]: parseErrorMessage(body, 'No se pudo eliminar el prerrequisito'),
      }));
      return;
    }
    await loadPrerrequisitos(materiaId);
  }

  function toggleMateria(materiaId: string) {
    setExpandedMateriaId((prev) => (prev === materiaId ? null : materiaId));
    if (expandedMateriaId !== materiaId) {
      void loadPrerrequisitos(materiaId);
    }
  }

  return (
    <div className="gradum-page gradum-dashboard">
      <header className="gradum-dash-header gradum-dash-header--wide">
        <div className="gradum-dash-header__left">
          <Link to="/" className="gradum-logo gradum-logo--link">
            GRADUM
          </Link>
          <nav className="gradum-dash-nav" aria-label="Administración">
            <Link to="/dashboard" className="gradum-link">
              Mi panel
            </Link>
            <Link to="/admin/carreras" className="gradum-link">
              Carreras
            </Link>
            {pensum?.degreeId ? (
              <Link to={`/admin/carreras/${pensum.degreeId}/pensums`} className="gradum-link">
                Pensums
              </Link>
            ) : (
              <span className="gradum-dash-nav__current">Pensums</span>
            )}
            <span className="gradum-dash-nav__current">Materias</span>
          </nav>
        </div>
        <div className="gradum-admin-actions">
          {pensum?.degreeId && (
            <Link
              to={`/admin/carreras/${pensum.degreeId}/pensums`}
              className="gradum-btn gradum-btn--outline gradum-btn--sm"
            >
              Volver a pensums
            </Link>
          )}
          <Link to="/admin/carreras" className="gradum-btn gradum-btn--outline gradum-btn--sm">
            Volver a carreras
          </Link>
        </div>
      </header>

      <main className="gradum-dash-main gradum-dash-main--wide">
        <h1>Materias</h1>
        <p className="gradum-lead">
          Gestioná materias del pensum{pensum?.name ? ` “${pensum.name}”` : ''} y sus prerrequisitos.
        </p>

        {error && (
          <p className="gradum-error gradum-error--block" role="alert">
            {error}
          </p>
        )}

        <section className="gradum-dash-card gradum-dash-card--compact" aria-labelledby="create-materia-heading">
          <h2 id="create-materia-heading">Crear materia</h2>
          <form
            className="gradum-form"
            onSubmit={(e) => {
              e.preventDefault();
              void createMateria();
            }}
          >
            <label className="gradum-field">
              <span>Nombre</span>
              <input
                value={createForm.nombre}
                onChange={(e) => setCreateForm((p) => ({ ...p, nombre: e.target.value }))}
                placeholder="Programación I"
                autoComplete="off"
              />
            </label>
            <label className="gradum-field">
              <span>Código (opcional)</span>
              <input
                value={createForm.codigo}
                onChange={(e) => setCreateForm((p) => ({ ...p, codigo: e.target.value }))}
                placeholder="PRG101"
                autoComplete="off"
              />
            </label>
            <label className="gradum-field">
              <span>Semestre #</span>
              <input
                value={createForm.semestreNumero}
                onChange={(e) => setCreateForm((p) => ({ ...p, semestreNumero: e.target.value }))}
                inputMode="numeric"
                autoComplete="off"
              />
            </label>
            <label className="gradum-field">
              <span>Créditos (opcional)</span>
              <input
                value={createForm.creditos}
                onChange={(e) => setCreateForm((p) => ({ ...p, creditos: e.target.value }))}
                inputMode="numeric"
                autoComplete="off"
              />
            </label>
            <label className="gradum-field">
              <span>Orden (opcional)</span>
              <input
                value={createForm.orden}
                onChange={(e) => setCreateForm((p) => ({ ...p, orden: e.target.value }))}
                inputMode="numeric"
                autoComplete="off"
              />
            </label>
            <button
              type="submit"
              className="gradum-btn gradum-btn--primary gradum-btn--block"
              disabled={!canSubmit || pendingId !== null}
            >
              {pendingId === 'create' ? 'Creando…' : 'Crear'}
            </button>
          </form>
        </section>

        <section className="gradum-dash-card gradum-admin-table-wrap" aria-labelledby="materias-heading">
          <h2 id="materias-heading" className="gradum-sr-only">
            Materias registradas
          </h2>
          {loading ? (
            <p className="gradum-muted-text">Cargando materias…</p>
          ) : sortedRows.length === 0 ? (
            <p className="gradum-muted-text">Aún no hay materias registradas en este pensum.</p>
          ) : (
            <div className="gradum-table-scroll">
              <table className="gradum-table">
                <thead>
                  <tr>
                    <th scope="col">Sem.</th>
                    <th scope="col">Nombre</th>
                    <th scope="col">Código</th>
                    <th scope="col">Créditos</th>
                    <th scope="col">Orden</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((m) => {
                    const expanded = expandedMateriaId === m.id;
                    const prerreqs = prerreqByMateria[m.id] ?? [];
                    const prerreqErr = prerreqErrorByMateria[m.id] ?? null;
                    const candidates = sortedRows.filter((c) => c.id !== m.id);
                    const selection = addPrerreqSelection[m.id] ?? '';

                    return (
                      <>
                        <tr key={m.id}>
                          <td>
                            <input
                              value={String(m.semestreNumero)}
                              className="gradum-inline-input gradum-inline-input--num"
                              onChange={(e) => {
                                const n = Number(e.target.value);
                                setRows((prev) =>
                                  prev.map((row) => (row.id === m.id ? { ...row, semestreNumero: n } : row)),
                                );
                              }}
                              onBlur={() => void updateMateria(m.id, { semestreNumero: m.semestreNumero })}
                              disabled={pendingId !== null}
                            />
                          </td>
                          <td>
                            <input
                              value={m.nombre}
                              className="gradum-inline-input"
                              onChange={(e) =>
                                setRows((prev) =>
                                  prev.map((row) => (row.id === m.id ? { ...row, nombre: e.target.value } : row)),
                                )
                              }
                              onBlur={() => void updateMateria(m.id, { nombre: m.nombre.trim() })}
                              disabled={pendingId !== null}
                            />
                          </td>
                          <td>
                            <input
                              value={m.codigo ?? ''}
                              className="gradum-inline-input"
                              onChange={(e) =>
                                setRows((prev) =>
                                  prev.map((row) => (row.id === m.id ? { ...row, codigo: e.target.value } : row)),
                                )
                              }
                              onBlur={() =>
                                void updateMateria(m.id, { codigo: (m.codigo ?? '').trim().length ? (m.codigo ?? '').trim() : null })
                              }
                              disabled={pendingId !== null}
                              placeholder="—"
                            />
                          </td>
                          <td>
                            <input
                              value={m.creditos ?? ''}
                              className="gradum-inline-input gradum-inline-input--num"
                              onChange={(e) => {
                                const v = e.target.value.trim();
                                const n = v.length ? Number(v) : null;
                                setRows((prev) =>
                                  prev.map((row) => (row.id === m.id ? { ...row, creditos: n } : row)),
                                );
                              }}
                              onBlur={() => void updateMateria(m.id, { creditos: m.creditos ?? null })}
                              disabled={pendingId !== null}
                              placeholder="—"
                            />
                          </td>
                          <td>
                            <input
                              value={m.orden ?? ''}
                              className="gradum-inline-input gradum-inline-input--num"
                              onChange={(e) => {
                                const v = e.target.value.trim();
                                const n = v.length ? Number(v) : null;
                                setRows((prev) => prev.map((row) => (row.id === m.id ? { ...row, orden: n } : row)));
                              }}
                              onBlur={() => void updateMateria(m.id, { orden: m.orden ?? null })}
                              disabled={pendingId !== null}
                              placeholder="—"
                            />
                          </td>
                          <td>
                            <div className="gradum-admin-actions">
                              <button
                                type="button"
                                className="gradum-btn gradum-btn--secondary gradum-btn--sm"
                                onClick={() => toggleMateria(m.id)}
                                disabled={pendingId !== null}
                              >
                                {expanded ? 'Ocultar' : 'Prerrequisitos'}
                              </button>
                              <button
                                type="button"
                                className="gradum-btn gradum-btn--danger gradum-btn--sm"
                                disabled={pendingId !== null}
                                onClick={() => void deleteMateria(m.id)}
                              >
                                {pendingId === m.id ? '…' : 'Eliminar'}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expanded && (
                          <tr key={`${m.id}-expanded`}>
                            <td colSpan={6}>
                              <div className="gradum-prerreq-panel">
                                <h3 className="gradum-prerreq-title">Prerrequisitos de: {m.nombre}</h3>
                                {prerreqErr && (
                                  <p className="gradum-error gradum-error--block" role="alert">
                                    {prerreqErr}
                                  </p>
                                )}
                                <div className="gradum-prerreq-actions">
                                  <select
                                    className="gradum-select"
                                    value={selection}
                                    onChange={(e) =>
                                      setAddPrerreqSelection((prev) => ({ ...prev, [m.id]: e.target.value }))
                                    }
                                    disabled={pendingId !== null}
                                  >
                                    <option value="">Seleccionar materia prerrequisito…</option>
                                    {candidates.map((c) => (
                                      <option key={c.id} value={c.id}>
                                        Sem {c.semestreNumero} — {c.nombre}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    className="gradum-btn gradum-btn--primary gradum-btn--sm"
                                    disabled={!selection || pendingId !== null}
                                    onClick={() => void addPrerrequisito(m.id)}
                                  >
                                    {pendingId === `prerreq-add-${m.id}` ? '…' : 'Agregar'}
                                  </button>
                                  <button
                                    type="button"
                                    className="gradum-btn gradum-btn--outline gradum-btn--sm"
                                    disabled={pendingId !== null}
                                    onClick={() => void loadPrerrequisitos(m.id)}
                                  >
                                    Recargar
                                  </button>
                                </div>

                                {prerreqs.length === 0 ? (
                                  <p className="gradum-muted-text">No hay prerrequisitos configurados.</p>
                                ) : (
                                  <ul className="gradum-prerreq-list">
                                    {prerreqs.map((p) => {
                                      const label =
                                        p.materiaPrerrequisito?.nombre ??
                                        sortedRows.find((x) => x.id === p.materiaPrerrequisitoId)?.nombre ??
                                        p.materiaPrerrequisitoId;
                                      return (
                                        <li key={p.id} className="gradum-prerreq-item">
                                          <span>{label}</span>
                                          <button
                                            type="button"
                                            className="gradum-btn gradum-btn--danger gradum-btn--sm"
                                            disabled={pendingId !== null}
                                            onClick={() => void deletePrerrequisito(m.id, p.materiaPrerrequisitoId)}
                                          >
                                            {pendingId === `prerreq-del-${m.id}-${p.materiaPrerrequisitoId}` ? '…' : 'Quitar'}
                                          </button>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

