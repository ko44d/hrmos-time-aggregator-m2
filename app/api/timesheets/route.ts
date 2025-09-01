// app/api/timesheets/route.ts
import { NextResponse } from "next/server";
import { fetchAttendanceSummariesAll, toTimesheet } from "@/lib/hrmosApi";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const from = url.searchParams.get('from') || process.env.HRMOS_DEFAULT_FROM || '';
    const to = url.searchParams.get('to') || process.env.HRMOS_DEFAULT_TO || '';

    if (!from || !to) {
      return NextResponse.json({ message: 'from/to is required' }, { status: 400 });
    }

    const summaries = await fetchAttendanceSummariesAll({ from, to });
    const timesheets = summaries.map(toTimesheet);

    return NextResponse.json(timesheets, { status: 200 });
  } catch (err: any) {
    console.error('timesheets api error', err);
    return NextResponse.json({ message: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}
