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

// Extra fields only returned by GET /opportunities/:id (SELECT o.*, ...), not
// by the list endpoint's narrower SELECT - kept separate so list-page code
// doesn't have to deal with fields it never receives.
export type ApiOpportunityDetail = ApiOpportunity & {
  raw_data?: Record<string, any> | null;
  ai_matched_trades?: { trade_id: string; trade_name?: string; confidence: number; reasoning?: string }[] | null;
  contract_type?: string | null;
  complexity_level?: string | null;
  estimated_start_date?: string | null;
  estimated_end_date?: string | null;
  journey_name?: string | null;
  cpv_display?: string | null;
  source_reference?: string | null;
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
    const { data } = await apiClient.get<ApiOpportunityDetail>(`/opportunities/${id}`);
    return data;
  },
};

// Favorites ("Ma selection") - requires auth, hence the auth-attaching apiClient
// rather than a plain axios call.
export const favoritesApi = {
  list: async () => {
    const { data } = await apiClient.get<{ results: ApiOpportunity[] }>('/favorites');
    return data.results;
  },
  ids: async () => {
    const { data } = await apiClient.get<{ ids: string[] }>('/favorites/ids');
    return data.ids;
  },
  save: async (opportunityId: string) => {
    await apiClient.put(`/favorites/${opportunityId}`);
  },
  remove: async (opportunityId: string) => {
    await apiClient.delete(`/favorites/${opportunityId}`);
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

export type ApiChatbotConversation = { id: string; topic: string; context: unknown; created_at: string; updated_at: string };
export type ApiChatbotMessage = { id: string; conversation_id: string; role: 'user' | 'assistant'; content: string; created_at: string };

export const chatbotApi = {
  createConversation: async (payload: { topic?: string; opportunityId?: string; journey?: string }): Promise<ApiChatbotConversation> => {
    const { data } = await apiClient.post('/chatbot/conversations', payload);
    return data;
  },
  listConversations: async (): Promise<ApiChatbotConversation[]> => {
    const { data } = await apiClient.get('/chatbot/conversations');
    return data;
  },
  getMessages: async (conversationId: string): Promise<ApiChatbotMessage[]> => {
    const { data } = await apiClient.get(`/chatbot/conversations/${conversationId}/messages`);
    return data;
  },
  sendMessage: async (conversationId: string, message: string): Promise<{ response: string }> => {
    const { data } = await apiClient.post(`/chatbot/conversations/${conversationId}/messages`, { message });
    return data;
  },
};

export type ApiSubscriptionPlan = {
  id: number;
  plan_code: string | null;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  billing_period: string;
  features: string[] | null;
  max_opportunities: number | null;
  max_bid_responses: number | null;
};

export const subscriptionsApi = {
  plans: async (): Promise<ApiSubscriptionPlan[]> => {
    const { data } = await apiClient.get<ApiSubscriptionPlan[]>('/subscriptions/plans');
    return data;
  },
  me: async () => {
    const { data } = await apiClient.get('/subscriptions/me');
    return data;
  },
  checkout: async (planId: string): Promise<{ checkoutUrl: string }> => {
    const { data } = await apiClient.post<{ checkoutUrl: string }>('/subscriptions/checkout', { planId });
    return data;
  },
  cancel: async () => {
    const { data } = await apiClient.post('/subscriptions/cancel');
    return data;
  },
};

// Account security: password change and TOTP-based 2FA.
//
// NOTE (flag for client): POST /auth/password-reset/confirm changes the
// password for whatever account the current access token belongs to, with
// no verification of the "current password" at all - it just needs a valid
// JWT. The Sécurité form still collects a current-password field to match
// expected UX, but the backend can't actually check it today, so it isn't
// sent. Worth a real fix (require + verify current password server-side)
// before this ships to real users.
export const accountApi = {
  changePassword: async (newPassword: string) => {
    const { data } = await apiClient.post('/auth/password-reset/confirm', { newPassword });
    return data;
  },
  mfaEnable: async (): Promise<{ secret: string; qrCode: string; manualEntryKey: string }> => {
    const { data } = await apiClient.post('/auth/mfa/enable');
    return data;
  },
  mfaConfirm: async (mfaToken: string) => {
    const { data } = await apiClient.post('/auth/mfa/confirm', { mfaToken });
    return data;
  },
};

// CRM lead capture is a public endpoint (no auth) - uses a plain axios call
// rather than `apiClient` so it never attaches a stale/absent Bearer token or
// gets caught by the 401-refresh interceptor for a route that isn't
// authenticated in the first place.
// Field names are camelCase to match crmPublic.ts's req.body destructuring
// on the backend (brandId, firstName, companyName, etc.) - a prior version of
// this client sent snake_case, which meant every field except brandId/email
// was silently dropped (landed as NULL) since Express never reads a body key
// that doesn't match what the route destructures.
export const crmApi = {
  submitLead: async (payload: {
    brandId: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    companyName?: string;
    industryTrade?: string;
    locationCity?: string;
    locationRegion?: string;
    leadSource?: string;
    message?: string;
  }) => {
    const { data } = await axios.post(`${API_URL}/api/crm/leads`, payload);
    return data;
  },
};

// Public brand resolution - no auth, used by the CRM lead-capture forms to
// get the brandId the backend requires (POST /api/crm/leads validates it).
export type ApiBrand = { id: string; code: string; name: string; language: string };

export const brandsApi = {
  current: async (): Promise<ApiBrand> => {
    const { data } = await axios.get(`${API_URL}/api/brands/current`);
    return data;
  },
};

export type ApiCompany = {
  id: string;
  name: string;
  kbis_number?: string | null;
  legal_form?: string | null;
  siret?: string | null;
  phone?: string | null;
  website_url?: string | null;
  address_street?: string | null;
  address_city?: string | null;
  address_postal_code?: string | null;
  industry_sector?: string | null;
  employee_count?: number | null;
  annual_revenue?: number | null;
  founding_year?: number | null;
  working_radius_km?: number | null;
  verified?: boolean;
  [key: string]: unknown;
};

export const companiesApi = {
  me: async (): Promise<ApiCompany> => {
    const { data } = await apiClient.get('/companies/me');
    return data;
  },
  updateMe: async (payload: Partial<ApiCompany>): Promise<ApiCompany> => {
    const { data } = await apiClient.put('/companies/me', payload);
    return data;
  },
};

export type ApiCompanyDocument = {
  id: string;
  document_type: string;
  document_name: string | null;
  description: string | null;
  file_url: string;
  file_size_bytes: number | null;
  file_mime_type: string | null;
  issued_date: string | null;
  expiry_date: string | null;
  is_expired: boolean;
};

export type ApiCompanyCertification = {
  id: string;
  certification_name: string;
  certification_code: string | null;
  issued_by: string | null;
  issued_date: string | null;
  expiry_date: string | null;
  is_expired: boolean;
  document_url: string | null;
};

export type ApiCompanyReference = {
  id: string;
  project_name: string;
  description: string | null;
  client_name: string | null;
  contract_value: number | null;
  contract_type: string | null;
  completion_date: string | null;
  skills_demonstrated: string[] | null;
};

export type ApiCompanyResource = {
  id: string;
  resource_type: string;
  name: string;
  category: string | null;
  quantity: number | null;
  description: string | null;
};

export type ApiCompanyPolicy = {
  id: string;
  policy_type: string;
  policy_text: string;
  effective_date: string | null;
};

export const uploadsApi = {
  upload: async (file: File): Promise<{ url: string; sizeBytes: number; mimeType: string; originalName: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};

// Milestone 9 "reusable company file" - documents/certifications/references/
// resources/policies entered once, reused on every bid. Backend has had all
// of this since the tender-response data model was built; nothing in the
// frontend ever called it (there was no document vault UI at all).
export const companyVaultApi = {
  documents: {
    list: async (): Promise<ApiCompanyDocument[]> => (await apiClient.get('/companies/me/documents')).data,
    create: async (payload: {
      documentType: string; documentName?: string; description?: string; fileUrl: string;
      fileSizeBytes?: number; fileMimeType?: string; issuedDate?: string; expiryDate?: string;
    }): Promise<ApiCompanyDocument> => (await apiClient.post('/companies/me/documents', payload)).data,
    remove: async (id: string): Promise<void> => { await apiClient.delete(`/companies/me/documents/${id}`); },
  },
  certifications: {
    list: async (): Promise<ApiCompanyCertification[]> => (await apiClient.get('/companies/me/certifications')).data,
    create: async (payload: {
      certificationName: string; certificationCode?: string; issuedBy?: string;
      issuedDate?: string; expiryDate?: string; documentUrl?: string;
    }): Promise<ApiCompanyCertification> => (await apiClient.post('/companies/me/certifications', payload)).data,
  },
  references: {
    list: async (): Promise<ApiCompanyReference[]> => (await apiClient.get('/companies/me/references')).data,
    create: async (payload: {
      projectName: string; description?: string; clientName?: string; contractValue?: number;
      contractType?: string; completionDate?: string; skillsDemonstrated?: string[];
    }): Promise<ApiCompanyReference> => (await apiClient.post('/companies/me/references', payload)).data,
  },
  resources: {
    list: async (): Promise<ApiCompanyResource[]> => (await apiClient.get('/companies/me/resources')).data,
    create: async (payload: {
      resourceType: string; name: string; category?: string; quantity?: number; description?: string;
    }): Promise<ApiCompanyResource> => (await apiClient.post('/companies/me/resources', payload)).data,
  },
  policies: {
    list: async (): Promise<ApiCompanyPolicy[]> => (await apiClient.get('/companies/me/policies')).data,
    create: async (payload: {
      policyType: string; policyText: string; effectiveDate?: string;
    }): Promise<ApiCompanyPolicy> => (await apiClient.post('/companies/me/policies', payload)).data,
  },
};

export type ApiSeoPage = {
  page_slug: string;
  page_title: string | null;
  page_meta_description: string | null;
  page_keywords: string | null;
  page_content: string | null;
  filter_trade_id: number | null;
  filter_region: string | null;
  filter_city: string | null;
  filter_department: string | null;
};

// Public - no auth. Backs the /pages/:slug landing pages generated daily by
// the backend's seoGeneration job (Milestone 11).
export const seoPagesApi = {
  list: async (): Promise<{ pages: { page_slug: string; updated_at: string }[] }> => {
    const { data } = await axios.get(`${API_URL}/api/seo-pages`);
    return data;
  },
  getBySlug: async (slug: string): Promise<ApiSeoPage> => {
    const { data } = await axios.get(`${API_URL}/api/seo-pages/${slug}`);
    return data;
  },
};

export type ApiDataSource = {
  code: string;
  name: string;
  active: boolean;
  last_run: string | null;
  next_run: string | null;
};

// Backend has had these endpoints (requires admin/super_admin role) since the
// connector work landed, but nothing in this frontend ever called them - the
// only way to pull fresh listings was to wait for the every-2-hour cron.
export type ApiAdminStats = {
  activeOpportunities: number;
  totalCompanies: number;
  matchRate: number | null;
  monthlyRecurringRevenue: number;
  recentActivity: { user: string; action: string; target: string; time: string }[];
};

export const adminApi = {
  stats: async (): Promise<ApiAdminStats> => {
    const { data } = await apiClient.get<ApiAdminStats>('/admin/stats');
    return data;
  },
  dataSources: async (): Promise<{ sources: ApiDataSource[] }> => {
    const { data } = await apiClient.get('/admin/data-sources');
    return data;
  },
  runDataSource: async (code: string): Promise<unknown> => {
    const { data } = await apiClient.post(`/admin/data-sources/${code}/run`);
    return data;
  },
  opportunities: async (params: { q?: string; status?: string; page?: number; limit?: number }) => {
    const { data } = await apiClient.get<{ results: ApiAdminOpportunity[]; pagination: ApiPagination }>('/admin/opportunities', { params });
    return data;
  },
  updateOpportunityStatus: async (id: string, status: string) => {
    const { data } = await apiClient.patch(`/admin/opportunities/${id}/status`, { status });
    return data;
  },
  companies: async (params: { q?: string; status?: string; page?: number; limit?: number }) => {
    const { data } = await apiClient.get<{ results: ApiAdminCompany[]; pagination: ApiPagination }>('/admin/companies', { params });
    return data;
  },
  updateCompanyStatus: async (id: string, status: string) => {
    const { data } = await apiClient.patch(`/admin/companies/${id}/status`, { status });
    return data;
  },
};

export type ApiAdminOpportunity = {
  id: string;
  title: string;
  estimated_value: number | null;
  currency: string | null;
  deadline: string | null;
  status: string;
  location_city: string | null;
  opportunity_type: string | null;
};

export type ApiAdminCompany = {
  id: string;
  name: string;
  email: string;
  status: string;
  subscription_status: string | null;
  subscription_tier: string | null;
  first_name: string | null;
  last_name: string | null;
};

export type ApiTender = {
  id: string;
  opportunity_id: string;
  dce_analysis_status: 'not_analyzed' | 'processing' | 'analyzed';
  selection_criteria: unknown;
  required_documents: string[] | null;
  scoring_weights: unknown;
  complexity_assessment: string | null;
  estimated_effort_hours: number | null;
};

export type ApiPricingItem = { label: string; quantity?: number; unit?: string; unit_price?: number };

export type ApiBidResponse = {
  id: string;
  tender_id: string;
  company_id: string;
  status: string;
  technical_memo_text: string | null;
  is_technical_memo_approved: boolean;
  engagement_act_text: string | null;
  is_engagement_act_signed: boolean;
  pricing_schedule_json: ApiPricingItem[] | null;
  total_bid_amount: number | null;
  missing_documents: string[] | null;
  submission_deadline: string | null;
};

export const tendersApi = {
  get: async (opportunityId: string): Promise<ApiTender> => {
    const { data } = await apiClient.get(`/tenders/${opportunityId}`);
    return data;
  },
  analyze: async (tenderId: string): Promise<ApiTender> => {
    const { data } = await apiClient.post(`/tenders/${tenderId}/analyze`);
    return data;
  },
  getBid: async (tenderId: string): Promise<ApiBidResponse> => {
    const { data } = await apiClient.get(`/tenders/${tenderId}/bid`);
    return data;
  },
  generateBidDocuments: async (bidId: string) => {
    const { data } = await apiClient.post(`/tenders/bid/${bidId}/generate`);
    return data;
  },
  updateBid: async (bidId: string, payload: Partial<{
    technical_memo_text: string; is_technical_memo_approved: boolean;
    pricing_schedule_json: ApiPricingItem[]; total_bid_amount: number;
  }>): Promise<ApiBidResponse> => {
    const { data } = await apiClient.put(`/tenders/bid/${bidId}`, payload);
    return data;
  },
  // Package can come back as either JSON { url } (S3 configured) or a raw
  // ZIP stream (local/dev, no S3) - request as a blob and sniff the content
  // type so both cases work without the caller needing to know which one
  // the server picked.
  downloadPackage: async (bidId: string): Promise<{ blob?: Blob; url?: string }> => {
    const { data, headers } = await apiClient.get(`/tenders/bid/${bidId}/package`, { responseType: 'blob' });
    const contentType = String(headers['content-type'] || '');
    if (contentType.includes('application/json')) {
      const text = await (data as Blob).text();
      return { url: JSON.parse(text).url };
    }
    return { blob: data as Blob };
  },
};
