export type OverviewResponse = {
  product: string;
  mode: string;
  frontendPort: number;
  backendPort: number;
  modules: string[];
  counts?: {
    accounts: number;
    hotspots: number;
    drafts: number;
    skills: number;
  };
};

export type ConfigRecord = {
  id: string;
  aiProvider: string;
  defaultModel: string;
  apiBaseUrl?: string | null;
  apiKey?: string | null;
  browserPath?: string | null;
  promptDefaults?: string | null;
  hideRevenueByDefault: boolean;
  publishRequiresPreview: boolean;
};

export type AccountRecord = {
  id: string;
  platform: string;
  displayName: string;
  credentialBlob?: string | null;
  credentialStatus: string;
  fansCount: number;
  revenueYesterday: number;
  hideRevenue: boolean;
  isDefault: boolean;
  lastValidatedAt?: string | null;
};

export type HotspotRecord = {
  id: string;
  source: string;
  title: string;
  summary?: string | null;
  score?: string | null;
  rawUrl?: string | null;
  canGenerate: boolean;
  fetchedAt: string;
};

export type ImageSearchResult = {
  id: string;
  title: string;
  pageUrl: string;
  thumbnailUrl: string;
  imageUrl: string;
  width: number;
  height: number;
  source: string;
  license: string;
};

export type SkillRecord = {
  id: string;
  name: string;
  description: string;
  targetPlatforms: string[];
  entryPath?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type DraftRecord = {
  id: string;
  title: string;
  content: string;
  platform: string;
  accountId?: string | null;
  ownerName?: string | null;
  status: string;
  promptText?: string | null;
  previewHtml?: string | null;
  createdAt: string;
  updatedAt: string;
};

type JsonBody = Record<string, unknown>;

export type LoginResponse = {
  user: {
    username: string;
    role: string;
  };
  token: string;
};

export type SessionResponse = {
  user: {
    username: string;
    role: string;
  };
};

export type ChangePasswordResponse = {
  success: boolean;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token =
    typeof window !== 'undefined' ? window.localStorage.getItem('auto_media_auth_token') : null;

  const response = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function put<T>(path: string, body: JsonBody) {
  return request<T>(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

function post<T>(path: string, body?: JsonBody) {
  return request<T>(path, {
    method: 'POST',
    body: JSON.stringify(body || {}),
  });
}

export const api = {
  login: (username: string, password: string) =>
    post<LoginResponse>('/api/auth/login', { username, password }),
  getSession: () => request<SessionResponse>('/api/auth/session'),
  changePassword: (currentPassword: string, newPassword: string) =>
    put<ChangePasswordResponse>('/api/auth/password', { currentPassword, newPassword }),
  getOverview: () => request<OverviewResponse>('/api/overview'),
  getAccounts: () => request<AccountRecord[]>('/api/accounts'),
  validateAllAccounts: () => post<AccountRecord[]>('/api/accounts/validate-all'),
  updateAccountCredential: (id: string, credentialBlob: string) =>
    put<AccountRecord>(`/api/accounts/${id}/credential`, { credentialBlob }),
  validateAccount: (id: string) => post<AccountRecord>(`/api/accounts/${id}/validate`),
  setDefaultAccount: (id: string) => post<AccountRecord[]>(`/api/accounts/${id}/default`),
  getHotspots: () => request<HotspotRecord[]>('/api/hotspots'),
  scanHotspots: (sources: string[]) => post<HotspotRecord[]>('/api/hotspots/scan', { sources }),
  searchImages: (query: string, limit = 8) =>
    request<ImageSearchResult[]>(`/api/images/search?q=${encodeURIComponent(query)}&limit=${limit}`),
  getSkills: () => request<SkillRecord[]>('/api/skills'),
  getDrafts: () => request<DraftRecord[]>('/api/drafts'),
  getDraft: (id: string) => request<DraftRecord | null>(`/api/drafts/${id}`),
  generateDraftFromHotspot: (body: { hotspotId: string; platform?: string; accountId?: string }) =>
    post<DraftRecord>('/api/drafts/generate-from-hotspot', body),
  getConfig: () => request<ConfigRecord | null>('/api/config'),
  updateConfig: (body: Omit<ConfigRecord, 'id'>) => put<ConfigRecord>('/api/config', body),
};
