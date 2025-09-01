// lib/hrmosApi.ts
// Server-side HRMOS/IEYASU Attendance API client with token-based auth lifecycle
// Docs: https://ieyasu.co/docs/api.html#section/APIURL (confirm exact endpoints in your tenant)

export type HrmosAttendanceSummary = {
  employee_id: number;
  employee_name: string;
  // Depending on actual API, adapt these fields
  total_work_minutes?: number;
  overtime_minutes?: number;
};

export type FetchSummariesParams = {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
  page?: number;
  per_page?: number;
  // Add more filter fields if the API supports them (e.g., department_id, employee_ids, etc.)
};


// According to docs, build the correct base URL. The API URL section indicates patterns like
// https://api.ieyasu.co or https://ieyasu.co/api/v1 depending on your plan.
// We keep it configurable.
// NOTE: Do not throw at import time; allow runtime-provided config.
const BASE_URL = process.env.HRMOS_API_BASE_URL || "";

// Authentication header per docs. Many IEYASU integrations use X-Api-Key or Authorization.
// Set the appropriate one in code below based on your environment variable HRMOS_AUTH_SCHEME.
// Supported values: 'X-API-KEY', 'Bearer'
const API_KEY = process.env.HRMOS_API_KEY; // used only for direct key schemes
const AUTH_SCHEME = (process.env.HRMOS_AUTH_SCHEME || 'TOKEN').toUpperCase(); // TOKEN|X-API-KEY|BEARER

// Some tenants require a company or tenant identifier either in query or header.
const COMPANY_ID = process.env.HRMOS_COMPANY_ID;

// --- Token auth lifecycle (Basic -> Token issue -> use -> refresh) ---
const TOKEN_CACHE_TTL_SEC = Number(process.env.HRMOS_TOKEN_TTL_SEC || 50 * 60); // default 50min
let cachedToken: { value: string; expiresAt: number } | null = null;

const BASIC_KEY_ID = process.env.HRMOS_API_KEY_ID; // public key/id
const BASIC_SECRET = process.env.HRMOS_API_SECRET; // secret key used for Basic
const TOKEN_ENDPOINT = process.env.HRMOS_TOKEN_ENDPOINT || '/tokens'; // adjust to actual
const TOKEN_HEADER_NAME = process.env.HRMOS_TOKEN_HEADER || 'X-Token'; // header to send token

function b64(s: string) {
  return Buffer.from(s, 'utf8').toString('base64');
}

async function issueToken(): Promise<{ token: string; expiresIn?: number }> {
  const url = new URL(TOKEN_ENDPOINT, BASE_URL);
  const auth = `Basic ${b64(`${BASIC_KEY_ID}:${BASIC_SECRET}`)}`;
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      Authorization: auth,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Token issue failed ${res.status}: ${body}`);
  }
  const json = await res.json();
  // adapt field names per docs
  const token = json.token || json.access_token || json.Token;
  const expiresIn = json.expires_in || json.expiresIn;
  if (!token) throw new Error('Token not present in response');
  return { token, expiresIn };
}

async function getToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt > now + 60) {
    return cachedToken.value;
  }
  const { token, expiresIn } = await issueToken();
  const ttl = expiresIn ? Math.min(expiresIn, TOKEN_CACHE_TTL_SEC) : TOKEN_CACHE_TTL_SEC;
  cachedToken = { value: token, expiresAt: now + ttl };
  return token;
}

function buildAuthHeaders(): Record<string, string> {
  if (AUTH_SCHEME === 'TOKEN') {
    // placeholder, token obtained dynamically in hrmosFetch
    return {};
  }
  if (AUTH_SCHEME === 'BEARER') {
    if (!API_KEY) throw new Error('HRMOS_API_KEY is not set');
    return { Authorization: `Bearer ${API_KEY}` };
  }
  const headerName = process.env.HRMOS_API_KEY_HEADER || 'X-API-KEY';
  if (!API_KEY) throw new Error('HRMOS_API_KEY is not set');
  return { [headerName]: API_KEY } as Record<string, string>;
}

async function hrmosFetch(path: string, params?: Record<string, unknown>) {
  const url = new URL(path, BASE_URL);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    });
  }

  const dynamicHeaders: Record<string, string> = { ...buildAuthHeaders(), Accept: 'application/json' };
  if (AUTH_SCHEME === 'TOKEN') {
    const token = await getToken();
    dynamicHeaders[TOKEN_HEADER_NAME] = token;
  }
  let res = await fetch(url.toString(), {
    method: 'GET',
    headers: dynamicHeaders,
    cache: 'no-store',
  });

  if (AUTH_SCHEME === 'TOKEN' && res.status === 401) {
    // Token might be expired -> refresh and retry once
    cachedToken = null;
    const newToken = await getToken();
    dynamicHeaders[TOKEN_HEADER_NAME] = newToken;
    res = await fetch(url.toString(), {
      method: 'GET',
      headers: dynamicHeaders,
      cache: 'no-store',
    });
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Hrmos API error ${res.status} ${res.statusText}: ${body}`);
  }

  return res.json();
}

// Fetch all attendance summaries between from and to by following pagination if available.
export async function fetchAttendanceSummariesAll(params: FetchSummariesParams) {
  const perPage = params.per_page ?? 100;
  let page = params.page ?? 1;
  let all: HrmosAttendanceSummary[] = [];

  // IMPORTANT: Replace '/attendance_summaries' with the actual path from the docs.
  // If the API expects month-based aggregation, adjust query accordingly.
  while (true) {
    const data = await hrmosFetch('/attendance_summaries', {
      from: params.from,
      to: params.to,
      page,
      per_page: perPage,
      company_id: COMPANY_ID,
    });

    // Some APIs return { data: [...], total: n, page: 1, per_page: 100 }
    // others return plain arrays. Normalize here.
    const dataObj = data as unknown as { data?: unknown; total?: number };
    const items: HrmosAttendanceSummary[] = Array.isArray(dataObj?.data)
      ? (dataObj.data as HrmosAttendanceSummary[])
      : (Array.isArray(data as unknown as unknown[]) ? (data as unknown as HrmosAttendanceSummary[]) : []);

    all = all.concat(items);

    // Next-page detection. If 'total' and 'per_page' exist, use them; otherwise, stop when items < perPage.
    const total = dataObj?.total as number | undefined;
    const hasNext = items.length === perPage && (total ? all.length < total : items.length > 0);
    if (!hasNext) break;
    page += 1;
  }

  return all;
}

export type Timesheet = {
  id: number;
  name: string;
  totalHours: number; // hours
  overtime: number;   // hours
};

export function toTimesheet(summary: HrmosAttendanceSummary): Timesheet {
  const totalM = summary.total_work_minutes ?? 0;
  const otM = summary.overtime_minutes ?? 0;
  return {
    id: summary.employee_id,
    name: summary.employee_name,
    totalHours: Math.round((totalM / 60) * 10) / 10,
    overtime: Math.round((otM / 60) * 10) / 10,
  };
}

// ---- Runtime-config client (no environment variables required) ----
export type HrmosRuntimeConfig = {
  baseUrl: string; // e.g., https://ieyasu.co/api/v1
  apiKey: string;  // direct API key value
  apiKeyHeader?: string; // default 'X-API-KEY'
  companyId?: string; // optional
};

async function hrmosFetchWithConfig(cfg: HrmosRuntimeConfig, path: string, params?: Record<string, unknown>) {
  if (!cfg.baseUrl) throw new Error('baseUrl is required');
  if (!cfg.apiKey) throw new Error('apiKey is required');
  const url = new URL(path, cfg.baseUrl);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    });
  }
  const headerName = cfg.apiKeyHeader || 'X-API-KEY';
  const headers: Record<string, string> = {
    Accept: 'application/json',
    [headerName]: cfg.apiKey,
  };
  const res = await fetch(url.toString(), { method: 'GET', headers, cache: 'no-store' });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Hrmos API error ${res.status} ${res.statusText}: ${body}`);
  }
  return res.json();
}

export async function fetchAttendanceSummariesAllWithConfig(cfg: HrmosRuntimeConfig, params: FetchSummariesParams) {
  const perPage = params.per_page ?? 100;
  let page = params.page ?? 1;
  let all: HrmosAttendanceSummary[] = [];

  while (true) {
    const data = await hrmosFetchWithConfig(cfg, '/attendance_summaries', {
      from: params.from,
      to: params.to,
      page,
      per_page: perPage,
      company_id: cfg.companyId,
    });

    const dataObj2 = data as unknown as { data?: unknown; total?: number };
    const items: HrmosAttendanceSummary[] = Array.isArray(dataObj2?.data)
      ? (dataObj2.data as HrmosAttendanceSummary[])
      : (Array.isArray(data as unknown as unknown[]) ? (data as unknown as HrmosAttendanceSummary[]) : []);

    all = all.concat(items);

    const total = dataObj2?.total as number | undefined;
    const hasNext = items.length === perPage && (total ? all.length < total : items.length > 0);
    if (!hasNext) break;
    page += 1;
  }

  return all;
}
