import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getApiUrl } from '../lib/config';

const TOKEN_KEY = 'gradum_access_token';

export type SessionUser = {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  estado?: string;
};

type AuthContextValue = {
  token: string | null;
  user: SessionUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, nombre: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const api = getApiUrl();

  const refreshUser = useCallback(async () => {
    const t = getStoredToken();
    if (!t) {
      setUser(null);
      setLoading(false);
      return;
    }
    const res = await fetch(`${api}/auth/me`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (!res.ok) {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
      setLoading(false);
      return;
    }
    const data = (await res.json()) as SessionUser;
    setUser(data);
    setToken(t);
    setLoading(false);
  }, [api]);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch(`${api}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        message?: string | string[];
        accessToken?: string;
        user?: SessionUser;
      };
      if (!res.ok) {
        const msg = Array.isArray(body.message)
          ? body.message.join(', ')
          : body.message ?? 'No se pudo iniciar sesión';
        throw new Error(msg);
      }
      if (!body.accessToken) {
        throw new Error('Respuesta inválida del servidor');
      }
      localStorage.setItem(TOKEN_KEY, body.accessToken);
      setToken(body.accessToken);
      if (body.user) {
        setUser(body.user);
      } else {
        await refreshUser();
      }
    },
    [api, refreshUser],
  );

  const register = useCallback(
    async (email: string, nombre: string, password: string) => {
      const res = await fetch(`${api}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, nombre, password }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        message?: string | string[];
      };
      if (!res.ok) {
        const msg = Array.isArray(body.message)
          ? body.message.join(', ')
          : body.message ?? 'No se pudo registrar';
        throw new Error(msg);
      }
    },
    [api],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [token, user, loading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return ctx;
}
