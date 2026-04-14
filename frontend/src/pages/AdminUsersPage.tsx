/**
 * Sprint 3 — Pestañas por estado; aprobar/denegar vía PATCH …/aprobar y …/rechazar; suspender vía PATCH con body.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getApiUrl } from '../lib/config';
import './pages.css';

type UsuarioRow = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  estado: string;
  fechaRegistro: string;
  actualizadoEn: string;
};

const ESTADO_LABEL: Record<string, string> = {
  pendiente_aprobacion: 'Pendiente',
  aprobado: 'Aprobado',
  rechazado: 'Denegado',
  baneado: 'Suspendido',
};

type UserFilter = 'todos' | 'pendiente_aprobacion' | 'aprobado' | 'rechazado' | 'baneado';

const FILTER_TABS: { id: UserFilter; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'pendiente_aprobacion', label: 'Pendientes' },
  { id: 'aprobado', label: 'Aprobados' },
  { id: 'rechazado', label: 'Denegados' },
  { id: 'baneado', label: 'Suspendidos' },
];

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('es', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export function AdminUsersPage() {
  const { token, logout } = useAuth();
  const api = getApiUrl();
  const [users, setUsers] = useState<UsuarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<UserFilter>('todos');

  // Filtro local sobre GET /admin/usuarios (misma carga para todas las pestañas)
  const filteredUsers = useMemo(() => {
    if (filter === 'todos') return users;
    return users.filter((u) => u.estado === filter);
  }, [users, filter]);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    const res = await fetch(`${api}/admin/usuarios`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      logout();
      return;
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string | string[] };
      const msg = Array.isArray(body.message) ? body.message.join(', ') : body.message;
      setError(msg ?? 'No se pudo cargar la lista');
      setLoading(false);
      return;
    }
    const data = (await res.json()) as UsuarioRow[];
    setUsers(data);
    setLoading(false);
  }, [api, token, logout]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(userId: string, accion: 'aprobar' | 'denegar' | 'banear') {
    if (!token) return;
    setPendingId(userId);
    setError(null);
    const headers: HeadersInit = { Authorization: `Bearer ${token}` };
    let url = `${api}/admin/usuarios/${userId}`;
    let body: string | undefined;
    if (accion === 'aprobar') {
      url = `${api}/admin/usuarios/${userId}/aprobar`;
    } else if (accion === 'denegar') {
      url = `${api}/admin/usuarios/${userId}/rechazar`;
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify({ accion: 'banear' });
    }
    const res = await fetch(url, {
      method: 'PATCH',
      headers,
      ...(body !== undefined ? { body } : {}),
    });
    setPendingId(null);
    if (res.status === 401) {
      logout();
      return;
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string | string[] };
      const msg = Array.isArray(body.message) ? body.message.join(', ') : body.message;
      setError(msg ?? 'No se pudo completar la acción');
      return;
    }
    const updated = (await res.json()) as UsuarioRow;
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
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
            <span className="gradum-dash-nav__current">Usuarios</span>
          </nav>
        </div>
        <Link
          to="/dashboard"
          className="gradum-btn gradum-btn--outline gradum-btn--sm"
        >
          Volver al panel
        </Link>
      </header>

      <main className="gradum-dash-main gradum-dash-main--wide">
        <h1>Gestión de usuarios</h1>
        <p className="gradum-lead">
          Listado de cuentas registradas. Podés aprobar solicitudes pendientes, denegar el registro o
          suspender una cuenta ya aprobada.
        </p>

        {error && (
          <p className="gradum-error gradum-error--block" role="alert">
            {error}
          </p>
        )}

        <div className="gradum-filter-tabs" role="tablist" aria-label="Filtrar por estado">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={filter === tab.id}
              className={`gradum-filter-tab${filter === tab.id ? ' gradum-filter-tab--active' : ''}`}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <section className="gradum-dash-card gradum-admin-table-wrap" aria-labelledby="users-heading">
          <h2 id="users-heading" className="gradum-sr-only">
            Usuarios registrados
          </h2>
          {loading ? (
            <p className="gradum-muted-text">Cargando usuarios…</p>
          ) : users.length === 0 ? (
            <p className="gradum-muted-text">No hay usuarios registrados.</p>
          ) : filteredUsers.length === 0 ? (
            <p className="gradum-muted-text">No hay usuarios en esta categoría.</p>
          ) : (
            <div className="gradum-table-scroll">
              <table className="gradum-table">
                <thead>
                  <tr>
                    <th scope="col">Nombre</th>
                    <th scope="col">Correo</th>
                    <th scope="col">Rol</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Registro</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td>{u.nombre}</td>
                      <td>{u.email}</td>
                      <td>{u.rol}</td>
                      <td>
                        <span className={`gradum-badge gradum-badge--${u.estado}`}>
                          {ESTADO_LABEL[u.estado] ?? u.estado}
                        </span>
                      </td>
                      <td>{formatDate(u.fechaRegistro)}</td>
                      <td>
                        <div className="gradum-admin-actions">
                          {u.rol === 'estudiante' && u.estado === 'pendiente_aprobacion' && (
                            <>
                              <button
                                type="button"
                                className="gradum-btn gradum-btn--sm gradum-btn--primary"
                                disabled={pendingId !== null}
                                onClick={() => void runAction(u.id, 'aprobar')}
                              >
                                {pendingId === u.id ? '…' : 'Aprobar'}
                              </button>
                              <button
                                type="button"
                                className="gradum-btn gradum-btn--sm gradum-btn--danger"
                                disabled={pendingId !== null}
                                onClick={() => void runAction(u.id, 'denegar')}
                              >
                                Denegar
                              </button>
                            </>
                          )}
                          {u.rol === 'estudiante' && u.estado === 'aprobado' && (
                            <button
                              type="button"
                              className="gradum-btn gradum-btn--sm gradum-btn--danger"
                              disabled={pendingId !== null}
                              onClick={() => void runAction(u.id, 'banear')}
                            >
                              {pendingId === u.id ? '…' : 'Suspender'}
                            </button>
                          )}
                          {u.rol === 'admin' && (
                            <span className="gradum-muted-text gradum-admin-actions__na">—</span>
                          )}
                          {u.rol === 'estudiante' &&
                            !['pendiente_aprobacion', 'aprobado'].includes(u.estado) && (
                              <span className="gradum-muted-text gradum-admin-actions__na">—</span>
                            )}
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
