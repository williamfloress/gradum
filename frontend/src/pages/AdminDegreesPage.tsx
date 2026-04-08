import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getApiUrl } from '../lib/config';
import './pages.css';

type DegreeRow = {
  id: string;
  name: string;
  code: string;
  active: boolean;
  createdAt: string;
};

type FormState = {
  name: string;
  code: string;
};

function parseErrorMessage(body: unknown, fallback: string) {
  if (!body || typeof body !== 'object') return fallback;
  const msg = (body as { message?: string | string[] }).message;
  if (Array.isArray(msg)) return msg.join(', ');
  if (typeof msg === 'string' && msg.length > 0) return msg;
  return fallback;
}

export function AdminDegreesPage() {
  const { token, logout } = useAuth();
  const api = getApiUrl();

  const [rows, setRows] = useState<DegreeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState<FormState>({ name: '', code: '' });

  const canSubmit = useMemo(() => {
    return createForm.name.trim().length > 0 && createForm.code.trim().length > 0;
  }, [createForm.name, createForm.code]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    const res = await fetch(`${api}/degree`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      logout();
      return;
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as unknown;
      setError(parseErrorMessage(body, 'No se pudo cargar la lista de carreras'));
      setLoading(false);
      return;
    }
    const data = (await res.json()) as DegreeRow[];
    setRows(data);
    setLoading(false);
  }, [api, token, logout]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createDegree() {
    if (!token || !canSubmit) return;
    setError(null);
    setPendingId('create');
    const res = await fetch(`${api}/degree`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: createForm.name.trim(),
        code: createForm.code.trim(),
      }),
    });
    setPendingId(null);
    if (res.status === 401) {
      logout();
      return;
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as unknown;
      setError(parseErrorMessage(body, 'No se pudo crear la carrera'));
      return;
    }
    const created = (await res.json()) as DegreeRow;
    setRows((prev) => [created, ...prev].sort((a, b) => a.name.localeCompare(b.name, 'es')));
    setCreateForm({ name: '', code: '' });
  }

  async function updateDegree(id: string, patch: Partial<Pick<DegreeRow, 'name' | 'code' | 'active'>>) {
    if (!token) return;
    setError(null);
    setPendingId(id);
    const res = await fetch(`${api}/degree/${id}`, {
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
      setError(parseErrorMessage(body, 'No se pudo actualizar la carrera'));
      return;
    }
    const updated = (await res.json()) as DegreeRow;
    setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  async function deleteDegree(id: string) {
    if (!token) return;
    const ok = confirm('¿Eliminar esta carrera? Esta acción no se puede deshacer.');
    if (!ok) return;
    setError(null);
    setPendingId(id);
    const res = await fetch(`${api}/degree/${id}`, {
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
      setError(parseErrorMessage(body, 'No se pudo eliminar la carrera'));
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
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
            <span className="gradum-dash-nav__current">Carreras</span>
          </nav>
        </div>
        <Link to="/dashboard" className="gradum-btn gradum-btn--outline gradum-btn--sm">
          Volver al panel
        </Link>
      </header>

      <main className="gradum-dash-main gradum-dash-main--wide">
        <h1>Carreras</h1>
        <p className="gradum-lead">Administrá carreras y continuá hacia sus pensums.</p>

        {error && (
          <p className="gradum-error gradum-error--block" role="alert">
            {error}
          </p>
        )}

        <section className="gradum-dash-card gradum-dash-card--compact" aria-labelledby="create-degree-heading">
          <h2 id="create-degree-heading">Crear carrera</h2>
          <form
            className="gradum-form"
            onSubmit={(e) => {
              e.preventDefault();
              void createDegree();
            }}
          >
            <label className="gradum-field">
              <span>Nombre</span>
              <input
                value={createForm.name}
                onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ingeniería de Sistemas"
                autoComplete="off"
              />
            </label>
            <label className="gradum-field">
              <span>Código</span>
              <input
                value={createForm.code}
                onChange={(e) => setCreateForm((p) => ({ ...p, code: e.target.value }))}
                placeholder="SIS"
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

        <section className="gradum-dash-card gradum-admin-table-wrap" aria-labelledby="degrees-heading">
          <h2 id="degrees-heading" className="gradum-sr-only">
            Carreras registradas
          </h2>
          {loading ? (
            <p className="gradum-muted-text">Cargando carreras…</p>
          ) : rows.length === 0 ? (
            <p className="gradum-muted-text">Aún no hay carreras registradas.</p>
          ) : (
            <div className="gradum-table-scroll">
              <table className="gradum-table">
                <thead>
                  <tr>
                    <th scope="col">Nombre</th>
                    <th scope="col">Código</th>
                    <th scope="col">Activa</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <input
                          value={r.name}
                          className="gradum-inline-input"
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((row) => (row.id === r.id ? { ...row, name: e.target.value } : row)),
                            )
                          }
                          onBlur={() => void updateDegree(r.id, { name: r.name.trim() })}
                          disabled={pendingId !== null}
                        />
                      </td>
                      <td>
                        <input
                          value={r.code}
                          className="gradum-inline-input"
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((row) => (row.id === r.id ? { ...row, code: e.target.value } : row)),
                            )
                          }
                          onBlur={() => void updateDegree(r.id, { code: r.code.trim() })}
                          disabled={pendingId !== null}
                        />
                      </td>
                      <td>
                        <label className="gradum-inline-toggle">
                          <input
                            type="checkbox"
                            checked={r.active}
                            disabled={pendingId !== null}
                            onChange={(e) => void updateDegree(r.id, { active: e.target.checked })}
                          />
                          <span className="gradum-muted-text">{r.active ? 'Sí' : 'No'}</span>
                        </label>
                      </td>
                      <td>
                        <div className="gradum-admin-actions">
                          <Link
                            to={`/admin/carreras/${r.id}/pensums`}
                            className="gradum-btn gradum-btn--secondary gradum-btn--sm"
                          >
                            Pensums
                          </Link>
                          <button
                            type="button"
                            className="gradum-btn gradum-btn--danger gradum-btn--sm"
                            disabled={pendingId !== null}
                            onClick={() => void deleteDegree(r.id)}
                          >
                            {pendingId === r.id ? '…' : 'Eliminar'}
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

