export function getApiUrl(): string {
  const url = import.meta.env.VITE_API_URL;
  if (typeof url === 'string' && url.length > 0) {
    return url.replace(/\/$/, '');
  }
  return 'http://localhost:3000';
}
