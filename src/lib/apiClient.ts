import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

// Base URL for the marchesdirect-backend Express API. Configure via
// VITE_API_URL in .env (see .env.example) — falls back to local dev.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
  message?: string;
  details?: unknown;
}

export function getApiErrorMessage(err: unknown, fallback = 'Une erreur est survenue.'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiError | undefined;
    // Some backend error responses (e.g. requireActiveSubscription) send a
    // machine-readable `error` code alongside a human-readable `message` -
    // prefer the message so the person sees "Cette action nécessite un
    // abonnement actif." instead of the literal code
    // "active_subscription_required".
    if (data?.message) return data.message;
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
  buyer_name?: string | null;
  match_score?: number;
  identity_unlocked?: boolean;
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
  identity_unlocked?: boolean;
  // Aggregated buyer stat, computed server-side from the real (unredacted)
  // buyer_name - safe to show even on a locked private tender/sous-
  // traitance fiche per spec (name-free), so it's a plain top-level field,
  // not inside ai_extracted_facts.
  buyer_history_count?: number | null;
  // Structured extraction pass (see backend aiService.extractOpportunityFacts).
  // Each field is either present or explicitly {available:false} - never a
  // guessed value - so the UI must check `.available` before rendering.
  // buyer_name/contact_email come back redacted server-side on a locked
  // private tender, same as the top-level buyer_name field.
  ai_extracted_facts?: {
    buyer_name?: { value: string; available: boolean };
    contract_object?: { value: string; available: boolean };
    procedure_type?: { value: string; available: boolean };
    submission_deadline?: { value: string; available: boolean };
    estimated_value?: { value: string; available: boolean };
    contact_email?: { value: string; available: boolean };
    required_qualifications?: { value: string; available: boolean };
    team_size_estimate?: { value: string; available: boolean };
    contract_duration?: { value: string; available: boolean };
    submission_method?: { value: string; available: boolean };
    allotment?: { value: string; available: boolean };
    technical_visit?: { value: string; available: boolean };
    // Newer opportunities: structured {label, severity}. Older ones not yet
    // re-extracted after the severity upgrade may still be a plain string -
    // the component rendering this checks the shape defensively.
    key_risks?: { value: (string | { label: string; severity: 'obligatoire' | 'recommandee' })[]; available: boolean };
    // Client's "Critères de notation" card - mirrors the paid tender DCE
    // analysis' selection_criteria shape, but populated free-tier for every
    // opportunity (see backend aiService.extractOpportunityFacts).
    selection_criteria?: { value: { label: string; weight_percent: number | null; not_specified: boolean }[]; available: boolean };
  } | null;
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

export type ApiOpportunityAccess = {
  identityUnlocked: boolean;
};

export type ApiMatchScore = {
  score: number;
  scoreTitle: string;
  scoreNote: string;
  scoreDisclaimer: string;
  matchLabel: string;
  positiveFactors: { label: string; points: number }[];
  warning: string | null;
  criteria: { label: string; weight: number }[];
  eligibility: { label: string; note: string; required: boolean; met: boolean | null }[];
  whyRespond: string;
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
  // Graduated access for private tender / sous-traitance fiches: level1
  // (anonymous/no lead yet) -> teaser only, level2 (coordinates left via
  // requestAccess) -> full read, level3 (staff-reviewed) -> documents too.
  // Public-market listings always come back 'full'. Unauthenticated callers
  // are matched by the `email` query param (no account needed yet); logged-in
  // callers are matched by their token automatically.
  // Prototype V17 rule: a public-market fiche is always unlocked. A private
  // tender / sous-traitance fiche unlocks its buyer's identity only once a
  // specific callback slot is booked for it (see requestAccess). Matched by
  // sessionId before an account exists, or by email once one does.
  getAccess: async (id: string, sessionId?: string, email?: string): Promise<ApiOpportunityAccess> => {
    const { data } = await apiClient.get(`/opportunities/${id}/access`, { params: { sessionId, email } });
    return data;
  },
  requestAccess: async (id: string, payload: {
    email: string; phone?: string; firstName?: string; lastName?: string; companyName?: string; sessionId?: string;
    mode: 'slot' | 'callback'; slotLabel?: string; slotAt?: string;
  }): Promise<{ identityUnlocked: boolean; leadId: string }> => {
    const { data } = await apiClient.post(`/opportunities/${id}/request-access`, payload);
    return data;
  },
  getMatchScore: async (id: string, sessionId?: string): Promise<ApiMatchScore> => {
    const { data } = await apiClient.get(`/opportunities/${id}/match-score`, { params: sessionId ? { sessionId } : undefined });
    return data;
  },
  // Bulk scores for a results list (prototype V17 section 3.1) - 403s if
  // the caller isn't identified yet, same gate as the single-fiche version.
  matchScores: async (ids: string[], sessionId: string): Promise<Record<string, { score: number; scoreTitle: string }>> => {
    const { data } = await apiClient.post('/opportunities/match-scores', { ids, sessionId });
    return data.scores;
  },
  statsByRegion: async (): Promise<{ regions: { region: string; count: number }[] }> => {
    const { data } = await axios.get(`${API_URL}/api/opportunities/stats/regions`);
    return data;
  },
  statsByDepartment: async (): Promise<{ departments: { department: string; count: number }[] }> => {
    const { data } = await axios.get(`${API_URL}/api/opportunities/stats/departments`);
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

// Self-published subcontracting needs ("Je cherche un sous-traitant" buyer
// flow) - backed by /api/subcontract-needs.
export type ApiSubcontractNeed = {
  id: string;
  trade: string;
  lot: string | null;
  description: string | null;
  location_city: string | null;
  location_region: string | null;
  budget_min: number | null;
  budget_max: number | null;
  team_size: string | null;
  start_date: string | null;
  duration: string | null;
  qualifications: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: string;
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
};

export const subcontractNeedsApi = {
  list: async (params: { trade?: string; city?: string; region?: string; page?: number; limit?: number } = {}) => {
    const { data } = await apiClient.get<{ results: ApiSubcontractNeed[]; pagination: ApiPagination }>('/subcontract-needs', { params });
    return data;
  },
  mine: async () => {
    const { data } = await apiClient.get<{ results: ApiSubcontractNeed[] }>('/subcontract-needs/mine');
    return data.results;
  },
  create: async (need: {
    trade: string; lot?: string; description?: string; locationCity?: string; locationRegion?: string;
    budgetMin?: number; budgetMax?: number; teamSize?: string; startDate?: string; duration?: string;
    qualifications?: string; contactEmail?: string; contactPhone?: string;
  }): Promise<ApiSubcontractNeed> => {
    const { data } = await apiClient.post('/subcontract-needs', need);
    return data;
  },
  withdraw: async (id: string) => {
    await apiClient.delete(`/subcontract-needs/${id}`);
  },
};

export const tradesApi = {
  list: async () => {
    const { data } = await apiClient.get('/trades');
    return data;
  },
};

export type ApiSiretCompany = {
  name: string | null;
  legal: string | null;
  created: string | null;
  capital: number | null;
  address: string | null;
  city: string | null;
  postal: string | null;
  director: string | null;
  employees: string | null;
  ape: string | null;
  activity: string | null;
  // "Présence détectée" (prototype V17, section 3.3.3) - backend already
  // returns these (routes/siret.ts) but the frontend never mapped them.
  // Only ever real signals from Pappers/INSEE/demo data, never fabricated.
  website?: string | null;
  facebook?: string | null;
  googleRating?: string | null;
  googleReviewCount?: number | null;
  certifications?: string[];
};

export type ApiSiretStatus = {
  companyKnown: boolean;
  siret?: string;
  company?: ApiSiretCompany;
  // "lead" gate (client's newest brief): phone + email captured after SIRET
  // recognition, before the fuller analysis breakdown - global per session,
  // never re-asked once true.
  leadCaptured?: boolean;
  phone?: string | null;
  email?: string | null;
};

// Prototype V17 "reconnaissance d'entreprise" flow (see backend
// routes/siret.ts). Session-scoped: companyKnown is a single flag per
// browser, not per opportunity.
export const siretApi = {
  status: async (sessionId: string): Promise<ApiSiretStatus> => {
    const { data } = await apiClient.get('/siret/status', { params: { sessionId } });
    return data;
  },
  lookup: async (query: string, sessionId: string): Promise<ApiSiretStatus> => {
    const { data } = await apiClient.post('/siret/lookup', { query, sessionId });
    return data;
  },
  // Client's newest brief: phone + email requested after the visitor has
  // already seen the score/why-it-matches, gating the fuller breakdown.
  // opportunityId links the CRM lead to the specific opportunity being
  // viewed so the account manager knows why to call.
  captureLead: async (phone: string, email: string, sessionId: string, opportunityId?: string): Promise<{ leadCaptured: boolean }> => {
    const { data } = await apiClient.post('/siret/lead', { phone, email, sessionId, opportunityId });
    return data;
  },
};

export type ApiDashboardMatch = {
  id: string;
  title: string;
  deadline: string | null;
  estimated_value: number | null;
  location_city: string | null;
  location_region: string | null;
  ai_summary: string | null;
  journey?: 'tender' | 'public_procurement' | 'subcontracting' | null;
  identity_unlocked?: boolean;
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
  matches: async (): Promise<{ matches: ApiDashboardMatch[] }> => {
    const { data } = await apiClient.get('/dashboard/matches');
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
  updateNotificationPreferences: async (prefs: Partial<{
    emailAlerts: boolean; newOpps: boolean; deadlineAlerts: boolean; weeklyDigest: boolean; mobileNotifs: boolean;
  }>) => {
    const { data } = await apiClient.put('/auth/me/notification-preferences', prefs);
    return data as { notificationPreferences: Record<string, boolean> };
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
    sessionId?: string;
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
  uploadAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post('/uploads/avatar', formData, {
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
  filter_journey: 'tender' | 'public_procurement' | 'subcontracting' | null;
  filter_trade_name?: string | null;
  updated_at?: string;
  local_buyers?: string[];
  related_trades?: { name: string; opp_count: string }[];
  neighboring_cities?: string[];
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
  // Backs the clean local-SEO URLs the client asked for by name
  // (/marches-publics/bordeaux, /marches-publics/bordeaux/electricite,
  // /appels-offres/bordeaux, /sous-traitance/bordeaux) - resolves by
  // structural filters instead of a precomputed slug string.
  getByFilters: async (params: { journey: string; city?: string; trade?: string; department?: string }): Promise<ApiSeoPage> => {
    const { data } = await axios.get(`${API_URL}/api/seo-pages/lookup`, { params });
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
  opportunityLeads: async (params: { status?: string; page?: number; limit?: number }) => {
    const { data } = await apiClient.get<{ results: ApiAdminOpportunityLead[] }>('/admin/opportunity-leads', { params });
    return data;
  },
  grantOpportunityAccess: async (leadId: string) => {
    const { data } = await apiClient.put(`/admin/opportunity-leads/${leadId}/grant-access`);
    return data;
  },
  leadJourney: async (leadId: string): Promise<{ events: ApiVisitorEvent[] }> => {
    const { data } = await apiClient.get(`/admin/leads/${leadId}/journey`);
    return data;
  },
  // Plain contact/appointment/callback leads (opportunity_id IS NULL on the
  // backend) - distinct from opportunityLeads() above, which is the
  // graduated-access review queue for opportunity fiches specifically.
  contactLeads: async (params: { status?: string; lead_source?: string; page?: number; limit?: number }) => {
    const { data } = await apiClient.get<{ results: ApiCrmLead[]; pagination: ApiPagination }>('/crm/leads', { params });
    return data;
  },
  updateContactLeadStatus: async (id: string, status: string) => {
    const { data } = await apiClient.put(`/crm/leads/${id}/status`, { status });
    return data;
  },
  brands: async (): Promise<ApiAdminBrand[]> => {
    const { data } = await apiClient.get('/admin/brands');
    return data;
  },
  createBrand: async (brand: {
    code: string; name: string; domain: string; logoUrl?: string;
    colorPrimary?: string; colorSecondary?: string; language?: string; regionFocus?: string;
  }): Promise<ApiAdminBrand> => {
    const { data } = await apiClient.post('/admin/brands', brand);
    return data;
  },
  updateBrand: async (id: string, brand: Partial<{
    name: string; domain: string; logoUrl: string;
    colorPrimary: string; colorSecondary: string; language: string; regionFocus: string;
  }>): Promise<ApiAdminBrand> => {
    const { data } = await apiClient.put(`/admin/brands/${id}`, brand);
    return data;
  },
  subscriptions: async (params: { status?: string; q?: string; page?: number; limit?: number }) => {
    const { data } = await apiClient.get<{
      results: ApiAdminSubscription[]; pagination: ApiPagination; statusCounts: Record<string, number>;
    }>('/admin/subscriptions', { params });
    return data;
  },
  cancelSubscription: async (id: string, immediate = false) => {
    const { data } = await apiClient.patch(`/admin/subscriptions/${id}/cancel`, { immediate });
    return data;
  },
};

export type ApiAdminBrand = {
  id: string;
  code: string;
  name: string;
  domain: string;
  logo_url: string | null;
  color_primary: string | null;
  color_secondary: string | null;
  language: string;
  region_focus: string | null;
  created_at: string;
};

export type ApiAdminSubscription = {
  id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  created_at: string;
  company_id: string;
  company_name: string;
  company_email: string;
  plan_name: string;
  plan_code: string;
  price: number;
  currency: string;
  billing_period: string;
};

export type ApiVisitorEvent = {
  event_type: 'search' | 'view_opportunity' | 'view_seo_page';
  event_label: string | null;
  event_data: Record<string, unknown> | null;
  created_at: string;
};

export type ApiCrmLead = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  industry_trade: string | null;
  location_city: string | null;
  location_region: string | null;
  lead_source: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

export type ApiAdminOpportunityLead = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  company_name: string | null;
  opportunity_id: string;
  opportunity_title: string | null;
  journey: string | null;
  access_level: string | null;
  status: string;
  created_at: string;
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
  // DC1/DC2/DUME (client's dix images, écran 10): each generated
  // independently via tendersApi.generateForms, null until then.
  dc1_text: string | null;
  dc2_text: string | null;
  dume_text: string | null;
  pricing_schedule_json: ApiPricingItem[] | null;
  total_bid_amount: number | null;
  missing_documents: string[] | null;
  submission_deadline: string | null;
};

// Bid-scoped rendez-vous with the "chargé d'affaires" (client's dix images,
// écrans 12-15) - distinct from the generic pre-identification callback on
// the opportunity page.
export type ApiBidAppointment = {
  id: string;
  bid_id: string;
  mode: 'slot' | 'callback';
  slot_label: string | null;
  status: 'requested' | 'confirmed' | 'done' | 'cancelled';
  created_at: string;
};

export type ApiBidSummary = {
  id: string;
  status: string;
  submission_deadline: string | null;
  submitted_at: string | null;
  total_bid_amount: number | null;
  opportunity_id: string;
  title: string;
  deadline: string | null;
  location_city: string | null;
};

export type ApiTenderDocument = {
  id: string;
  document_label: string | null; // best-effort tag: 'RC', 'CCAP', 'CCTP', 'AAPC', 'Autre'
  source_url: string;
  status: 'pending' | 'downloaded' | 'parsed' | 'not_a_document' | 'external_platform_only' | 'failed';
  mime_type: string | null;
  file_size_bytes: number | null;
  has_extracted_text: boolean;
  error_message: string | null;
  created_at: string;
};

export const tendersApi = {
  get: async (opportunityId: string): Promise<ApiTender> => {
    const { data } = await apiClient.get(`/tenders/${opportunityId}`);
    return data;
  },
  // DCE - Dossier de consultation (client's dix images, écran 8): the raw
  // set of documents found/downloaded on the buyer's notice (RC, CCTP,
  // CCAP, DPGF/BPU, plans, ...) - distinct from the AI complexity/required-
  // documents analysis surfaced separately by /:tenderId/analyze below.
  getDocuments: async (opportunityId: string): Promise<{ dce_documents_status: string; documents: ApiTenderDocument[] }> => {
    const { data } = await apiClient.get(`/tenders/${opportunityId}/documents`);
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
  // DC1/DC2/DUME (client's dix images, écran 10) - separate from the main
  // generate() call above since the client wants each form generated
  // independently via its own "Générer" button.
  generateForms: async (bidId: string): Promise<{ bid: ApiBidResponse }> => {
    const { data } = await apiClient.post(`/tenders/bid/${bidId}/generate-forms`);
    return data;
  },
  getAppointment: async (bidId: string): Promise<{ appointment: ApiBidAppointment | null; availableSlots: string[] }> => {
    const { data } = await apiClient.get(`/tenders/bid/${bidId}/appointments`);
    return data;
  },
  requestAppointment: async (bidId: string, payload: { mode: 'slot' | 'callback'; slotLabel?: string }): Promise<{ appointment: ApiBidAppointment }> => {
    const { data } = await apiClient.post(`/tenders/bid/${bidId}/appointments`, payload);
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
  // Used by the dashboard's "Dossiers en cours" stat/section - every bid
  // response the company has started or submitted, across all tenders.
  myBids: async (): Promise<ApiBidSummary[]> => {
    const { data } = await apiClient.get('/tenders/bids/mine');
    return data;
  },
};
