const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('talentfit_token');
  const provider = localStorage.getItem('talentfit_ai_provider');
  const apiKey = localStorage.getItem('talentfit_ai_key');

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (provider) headers['X-AI-Provider'] = provider;
  if (apiKey) headers['X-AI-Key'] = apiKey;

  return headers;
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = `Error ${response.status}: ${response.statusText}`;
    try {
      const errData = await response.json();
      if (errData.detail) {
        errorDetail = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
      }
    } catch (_) {}
    throw new Error(errorDetail);
  }

  return response.json();
}

