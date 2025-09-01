// app/api/timesheets/route.ts
import { NextResponse } from "next/server";
import { fetchAttendanceSummariesAll, fetchAttendanceSummariesAllWithConfig, toTimesheet } from "@/lib/hrmosApi";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const from = url.searchParams.get('from') || '';
    const to = url.searchParams.get('to') || '';

    // Credentials supplied via headers (preferred, no env vars)
    const baseUrl = req.headers.get('x-api-base-url') || '';
    const apiKey = req.headers.get('x-api-key') || '';
    const apiKeyHeader = req.headers.get('x-api-key-header') || undefined;
    const companyId = req.headers.get('x-company-id') || undefined;

    if (!from || !to) {
      return NextResponse.json({ message: 'from/to is required' }, { status: 400 });
    }

    let summaries;
    if (baseUrl && apiKey) {
      summaries = await fetchAttendanceSummariesAllWithConfig({ baseUrl, apiKey, apiKeyHeader, companyId }, { from, to });
    } else {
      // Fallback to env-based client for backward compatibility
      summaries = await fetchAttendanceSummariesAll({ from, to });
    }

    const timesheets = summaries.map(toTimesheet);
    return NextResponse.json(timesheets, { status: 200 });
  } catch (err: unknown) {
    console.error('timesheets api error', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ message }, { status: 500 });
  }
}
