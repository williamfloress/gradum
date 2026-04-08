import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getApiUrl } from '../lib/config';
import './pages.css';

type PensumRow = {
  id: string;
  name: string;
  version?: string | null;
  degreeId: string;
  isCurrent: boolean;
  createdAt: string;
};

type FormState = {
  name: string;
  version: string;
  isCurrent: boolean;
};

function parseErrorMessage(body: unknown, fallback: string) {
  if (!body || typeof body !== 'object') return fallback;
  const msg = (body as { message?: string | string[] }).message;
  if (Array.isArray(msg)) return msg.join(', ');
  if (typeof msg === 'string' && msg.length > 0) return msg;
  return fallback;
}

export function AdminDegreePensumsPage() {
  const { id: degreeId } = useParams();
  const { token, logout } = useAuth();
  const api = getApiUrl();

  const [rows, setRows] = useState<PensumRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState<FormState>({
    name: '',
    version: '',
    isCurrent: false,
  });

  const canSubmit = useMemo(() => createForm.name.trim().length > 0, [createForm.name]);

  const load = useCallback(async () => {
    if (!token || !degreeId) return;
    setLoading(true);
    setError(null);
    const res = await fetch(`${api}/degree/${degreeId}/pensum`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      logout();
      return;
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as unknown;
      setError(parseErrorMessage(body, 'No se pudo cargar la lista de pensums'));
      setLoading(false);
      return;
    }
    const data = (await res.json()) as PensumRow[];
    setRows(data);
    setLoading(false);
  }, [api, token, logout, degreeId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createPensum() {
    if (!token || !degreeId || !canSubmit) return;
    setError(null);
    setPendingId('create');
    const res = await fetch(`${api}/degree/${degreeId}/pensum`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: createForm.name.trim(),
        version: createForm.version.trim().length ? createForm.version.trim() : undefined,
        isCurrent: createForm.isCurrent,
      }),
    });
    setPendingId(null);
    if (res.status === 401) {
      logout();
      return;
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as unknown;
      setError(parseErrorMessage(body, 'No se pudo crear el pensum'));
      return;
    }
    const created = (await res.json()) as PensumRow;
    setRows((prev) => [created, ...prev]);
    setCreateForm({ name: '', version: '', isCurrent: false });
    if (created.isCurrent) {
      setRows((prev) => prev.map((p) => (p.id === created.id ? p : { ...p, isCurrent: false })));
    }
  }

  async function updatePensum(id: string, patch: Partial<Pick<PensumRow, 'name' | 'version' | 'isCurrent'>>) {
    if (!token) return;
    setError(null);
    setPendingId(id);
    const res = await fetch(`${api}/pensum/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...patch,
        version:
          typeof patch.version === 'string'
            ? patch.version.trim().length
              ? patch.version.trim()
              : null
            : patch.version,
      }),
    });
    setPendingId(null);
    if (res.status === 401) {
      logout();
      return;
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as unknown;
      setError(parseErrorMessage(body, 'No se pudo actualizar el pensum'));
      return;
    }
    const updated = (await res.json()) as PensumRow;
    setRows((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : updated.isCurrent ? { ...p, isCurrent: false } : p)),
    );
  }

  async function deletePensum(id: string) {
    if (!token) return;
    const ok = confirm('¿Eliminar este pensum? Esto eliminará sus materias asociadas.');
    if (!ok) return;
    setError(null);
    setPendingId(id);
    const res = await fetch(`${api}/pensum/${id}`, {
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
      setError(parseErrorMessage(body, 'No se pudo eliminar el pensum'));
      return;
    }
    setRows((prev) => prev.filter((p) => p.id !== id));
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
            <span className="gradum-dash-nav__current">Pensums</span>
          </nav>
        </div>
        <Link to="/admin/carreras" className="gradum-btn gradum-btn--outline gradum-btn--sm">
          Volver a carreras
        </Link>
      </header>

      <main className="gradum-dash-main gradum-dash-main--wide">
        <h1>Pensums</h1>
        <p className="gradum-lead">Gestioná los pensums de la carrera seleccionada y marcá el vigente.</p>

        {error && (
          <p className="gradum-error gradum-error--block" role="alert">
            {error}
          </p>
        )}

        <section className="gradum-dash-card gradum-dash-card--compact" aria-labelledby="create-pensum-heading">
          <h2 id="create-pensum-heading">Crear pensum</h2>
          <form
            className="gradum-form"
            onSubmit={(e) => {
              e.preventDefault();
              void createPensum();
            }}
          >
            <label className="gradum-field">
              <span>Nombre</span>
              <input
                value={createForm.name}
                onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Pensum 2026"
                autoComplete="off"
              />
            </label>
            <label className="gradum-field">
              <span>Versión (opcional)</span>
              <input
                value={createForm.version}
                onChange={(e) => setCreateForm((p) => ({ ...p, version: e.target.value }))}
                placeholder="v1"
                autoComplete="off"
              />
            </label>
            <label className="gradum-inline-toggle">
              <input
                type="checkbox"
                checked={createForm.isCurrent}
                onChange={(e) => setCreateForm((p) => ({ ...p, isCurrent: e.target.checked }))}
                disabled={pendingId !== null}
              />
              <span className="gradum-muted-text">Marcar como vigente</span>
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

        <section className="gradum-dash-card gradum-admin-table-wrap" aria-labelledby="pensums-heading">
          <h2 id="pensums-heading" className="gradum-sr-only">
            Pensums registrados
          </h2>
          {loading ? (
            <p className="gradum-muted-text">Cargando pensums…</p>
          ) : rows.length === 0 ? (
            <p className="gradum-muted-text">Aún no hay pensums para esta carrera.</p>
          ) : (
            <div className="gradum-table-scroll">
              <table className="gradum-table">
                <thead>
                  <tr>
                    <th scope="col">Nombre</th>
                    <th scope="col">Versión</th>
                    <th scope="col">Vigente</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <input
                          value={p.name}
                          className="gradum-inline-input"
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((row) => (row.id === p.id ? { ...row, name: e.target.value } : row)),
                            )
                          }
                          onBlur={() => void updatePensum(p.id, { name: p.name.trim() })}
                          disabled={pendingId !== null}
                        />
                      </td>
                      <td>
                        <input
                          value={p.version ?? ''}
                          className="gradum-inline-input"
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((row) => (row.id === p.id ? { ...row, version: e.target.value } : row)),
                            )
                          }
                          onBlur={() => void updatePensum(p.id, { version: (p.version ?? '').trim() })}
                          disabled={pendingId !== null}
                          placeholder="—"
                        />
                      </td>
                      <td>
                        <label className="gradum-inline-toggle">
                          <input
                            type="checkbox"
                            checked={p.isCurrent}
                            disabled={pendingId !== null}
                            onChange={(e) => void updatePensum(p.id, { isCurrent: e.target.checked })}
                          />
                          <span className="gradum-muted-text">{p.isCurrent ? 'Sí' : 'No'}</span>
                        </label>
                      </td>
                      <td>
                        <div className="gradum-admin-actions">
                          <Link
                            to={`/admin/pensums/${p.id}/materias`}
                            className="gradum-btn gradum-btn--secondary gradum-btn--sm"
                          >
                            Materias
                          </Link>
                          <button
                            type="button"
                            className="gradum-btn gradum-btn--danger gradum-btn--sm"
                            disabled={pendingId !== null}
                            onClick={() => void deletePensum(p.id)}
                          >
                            {pendingId === p.id ? '…' : 'Eliminar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

