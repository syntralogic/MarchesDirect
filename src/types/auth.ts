export interface AuthUser {
  id: string;
  email: string;
  companyId: string;
  role: string;
  firstName: string;
  lastName: string;
  mfaEnabled: boolean;
  notificationPreferences: {
    emailAlerts: boolean;
    newOpps: boolean;
    deadlineAlerts: boolean;
    weeklyDigest: boolean;
    mobileNotifs: boolean;
  };
}

export interface Company {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  siret?: string;
  legal_form?: string;
  headcount?: number;
  status?: string;
  subscription_status?: string | null;
  subscription_tier?: string | null;
  [key: string]: unknown;
}

export interface RegisterPayload {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginResult {
  userId: string;
  companyId?: string;
  email: string;
  firstName?: string;
  role?: string;
  accessToken?: string;
  refreshToken?: string;
  mfaRequired: boolean;
  mfaToken?: string;
}
