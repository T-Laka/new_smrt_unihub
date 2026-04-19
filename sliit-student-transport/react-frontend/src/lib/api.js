const API_BASE_URL = (
  import.meta.env.VITE_NODE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5000'
).replace(/\/$/, '');

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMessage =
      typeof payload === 'string'
        ? payload
        : payload.message || payload.error || `Request failed (${response.status})`;
    throw new Error(errorMessage);
  }

  return payload;
}

export { API_BASE_URL };