import { getApiUrl } from '../lib/config';

const TOKEN_KEY = 'gradum_access_token';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const api = getApiUrl();
  const token = localStorage.getItem(TOKEN_KEY);

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${api}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.message || 'Error en la petición';
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }

  if (response.status === 204) return {} as T;
  return response.json();
}

export const api = {
  get: <T>(path: string, options?: RequestInit) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: any, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: any, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string, options?: RequestInit) => request<T>(path, { ...options, method: 'DELETE' }),
};
