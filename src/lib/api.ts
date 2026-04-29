// In dev, use Vite proxy (/api -> PHP on :8000) so requests are same-origin and Bearer tokens work reliably.
// In production, require an explicit API URL so we do not silently call localhost.
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? '/api' : '');

// Store token in localStorage
export const setAuthToken = (token: string) => {
  localStorage.setItem('authToken', token);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const clearAuthToken = () => {
  localStorage.removeItem('authToken');
};

/** Remove cached user profile when the session token is missing to avoid stale signed-in UI state. */
export const syncAuthStorage = () => {
  try {
    if (localStorage.getItem('user') && !localStorage.getItem('authToken')) {
      localStorage.removeItem('user');
    }
  } catch {
    /* ignore */
  }
};

// API Request Helper
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  requiresAuth?: boolean;
  customHeaders?: Record<string, string>;
}

export const apiCall = async (
  endpoint: string,
  options: RequestOptions = {}
) => {
  if (!API_BASE_URL) {
    throw new Error(
      'API is not configured for production. Set VITE_API_URL or VITE_API_BASE_URL to your hosted PHP API.'
    );
  }

  const {
    method = 'GET',
    body = null,
    requiresAuth = true,
    customHeaders = {},
  } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  if (requiresAuth) {
    const token = getAuthToken();
    if (!token) {
      throw new Error(
        'Please sign in to continue. If you were logged in, your session may have expired-sign in again.'
      );
    }
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, config);
    const raw = await response.text();
    let data: { message?: string; success?: boolean } = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { message: raw?.slice(0, 200) || 'Invalid server response' };
    }

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthToken();
        syncAuthStorage();
      }
      throw new Error(
        (data as { message?: string }).message ||
          `Request failed (${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(
        import.meta.env.DEV
          ? 'Cannot reach the API server. Is the PHP backend running on port 8000?'
          : 'Cannot reach the API server. Check that VITE_API_URL points to your deployed PHP API.'
      );
    }
    throw error;
  }
};

export default API_BASE_URL;
