import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

// Base URL for the marchesdirect-backend Express API. Configure via
// VITE_API_URL in .env (see .env.example) — falls back to local dev.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ACCESS_TOKEN_KEY = 'md_access_token';
const REFRESH_TOKEN_KEY = 'md_refresh_token';

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Single-flight refresh so parallel 401s don't each trigger their own refresh call.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
    tokenStorage.setTokens(data.accessToken, data.refreshToken);
    return data.accessToken as string;
  } catch {
    tokenStorage.clear();
    return null;
  }
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (error.response?.status === 401 && original && !original._retry && !original.url?.includes('/auth/')) {
      original._retry = true;
      refreshPromise = refreshPromise ?? refreshAccessToken();
      const newToken = await refreshPromise;
      refreshPromise = null;

      if (newToken) {
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      }

      // Refresh failed - force a clean logout so the UI doesn't sit in a stuck state.
      tokenStorage.clear();
      window.dispatchEvent(new Event('md:session-expired'));
    }

    return Promise.reject(error);
  }
);

export interface ApiError {
  error: string;
  details?: unknown;
}

export function getApiErrorMessage(err: unknown, fallback = 'Une erreur est survenue.'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiError | undefined;
    if (data?.error) return data.error;
  }
  return fallback;
}

// ============================================================================
// Business data endpoints (opportunities, dashboard, trades, alerts, chatbot,
// subscriptions, CRM) - everything beyond auth. `apiClient` above already
// carries the Bearer token + refresh-on-401 handling, so these just call
// through it.
// ============================================================================

export type ApiOpportunity = {
  id: string;
  title: string;
  description?: string;
  deadline: string | null;
  publication_date: string | null;
  estimated_value: number | null;
  currency: string | null;
  location_city: string | null;
  location_region: string | null;
  location_department?: string | null;
  ai_classification_status: string;
  ai_summary: string | null;
  status: string;
  journey: 'tender' | 'public_procurement' | 'subcontracting';
  trade_name: string | null;
  match_score?: number;
};

export type ApiPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type OpportunitySearchParams = {
  journey?: 'tender' | 'public_procurement' | 'subcontracting';
  q?: string;
  trade_id?: string;
  region?: string;
  city?: string;
  department?: string;
  min_value?: number;
  max_value?: number;
  page?: number;
  limit?: number;
};

export const opportunitiesApi = {
  search: async (params: OpportunitySearchParams) => {
    const { data } = await apiClient.get<{ results: ApiOpportunity[]; pagination: ApiPagination }>(
      '/opportunities',
      { params }
    );
    return data;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiOpportunity>(`/opportunities/${id}`);
    return data;
  },
};

export const tradesApi = {
  list: async () => {
    const { data } = await apiClient.get('/trades');
    return data;
  },
};

export const dashboardApi = {
  today: async () => {
    const { data } = await apiClient.get('/dashboard/today');
    return data;
  },
  overview: async () => {
    const { data } = await apiClient.get('/dashboard');
    return data;
  },
};

export const alertsApi = {
  list: async () => {
    const { data } = await apiClient.get('/alerts');
    return data;
  },
  markRead: async (id: string) => {
    const { data } = await apiClient.put(`/alerts/${id}/read`);
    return data;
  },
};

export const chatbotApi = {
  createConversation: async (payload: { topic?: string; opportunityId?: string; journey?: string }) => {
    const { data } = await apiClient.post('/chatbot/conversations', payload);
    return data;
  },
  sendMessage: async (conversationId: string, message: string) => {
    const { data } = await apiClient.post(`/chatbot/conversations/${conversationId}/messages`, { message });
    return data;
  },
};

export const subscriptionsApi = {
  plans: async () => {
    const { data } = await apiClient.get('/subscriptions/plans');
    return data;
  },
  me: async () => {
    const { data } = await apiClient.get('/subscriptions/me');
    return data;
  },
  checkout: async (planId: string) => {
    const { data } = await apiClient.post('/subscriptions/checkout', { planId });
    return data;
  },
};

// CRM lead capture is a public endpoint (no auth) - uses a plain axios call
// rather than `apiClient` so it never attaches a stale/absent Bearer token or
// gets caught by the 401-refresh interceptor for a route that isn't
// authenticated in the first place.
export const crmApi = {
  submitLead: async (payload: {
    first_name?: string;
    last_name?: string;
    email: string;
    phone?: string;
    company_name?: string;
    industry_trade?: string;
    location_city?: string;
    message?: string;
  }) => {
    const { data } = await axios.post(`${API_URL}/api/crm/leads`, payload);
    return data;
  },
};
