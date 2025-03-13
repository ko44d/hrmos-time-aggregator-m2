// app/page.tsx
"use client";
import Head from "next/head";
import useTimesheets from "../hooks/useTimesheets";
import TimesheetTable from "../components/TimesheetTable";
import WorkChart from "../components/WorkChart";

export default function Home() {
  const { timesheets, loading } = useTimesheets();

  return (
      <>
        <Head>
          <title>勤怠管理ダッシュボード</title>
        </Head>
        <main className="container mx-auto p-8">
          <h1 className="text-2xl font-bold mb-4">勤怠管理ダッシュボード</h1>
          {loading ? (
              <p>読み込み中...</p>
          ) : (
              <>
                <TimesheetTable data={timesheets} />
                <WorkChart data={timesheets} />
              </>
          )}
        </main>
      </>
  );
}
