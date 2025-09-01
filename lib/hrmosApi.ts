// lib/hrmosApi.ts
// Server-side HRMOS/IEYASU Attendance API client
// NOTE: Adjust endpoints and header names to the official docs:
// https://ieyasu.co/docs/api.html#section/APIURL

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

function required(name: string, v: string | undefined): string {
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

// According to docs, build the correct base URL. The API URL section indicates patterns like
// https://api.ieyasu.co or https://ieyasu.co/api/v1 depending on your plan.
// We keep it configurable.
const BASE_URL = required("HRMOS_API_BASE_URL", process.env.HRMOS_API_BASE_URL);

// Authentication header per docs. Many IEYASU integrations use X-Api-Key or Authorization.
// Set the appropriate one in code below based on your environment variable HRMOS_AUTH_SCHEME.
// Supported values: 'X-API-KEY', 'Bearer'
const API_KEY = required("HRMOS_API_KEY", process.env.HRMOS_API_KEY);
const AUTH_SCHEME = (process.env.HRMOS_AUTH_SCHEME || 'X-API-KEY').toUpperCase();

// Some tenants require a company or tenant identifier either in query or header.
const COMPANY_ID = process.env.HRMOS_COMPANY_ID;

function buildAuthHeaders(): Record<string, string> {
  if (AUTH_SCHEME === 'BEARER') {
    return { Authorization: `Bearer ${API_KEY}` };
  }
  // Default to X-API-KEY (exact case sometimes matters; docs often show 'X-Api-Key')
  const headerName = process.env.HRMOS_API_KEY_HEADER || 'X-API-KEY';
  return { [headerName]: API_KEY } as Record<string, string>;
}

async function hrmosFetch(path: string, params?: Record<string, any>) {
  const url = new URL(path, BASE_URL);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    });
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      ...buildAuthHeaders(),
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

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
    const items: HrmosAttendanceSummary[] = Array.isArray((data as any)?.data)
      ? (data as any).data
      : (Array.isArray(data) ? data as HrmosAttendanceSummary[] : []);

    all = all.concat(items);

    // Next-page detection. If 'total' and 'per_page' exist, use them; otherwise, stop when items < perPage.
    const total = (data as any)?.total as number | undefined;
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
