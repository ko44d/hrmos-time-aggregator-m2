// app/page.tsx
"use client";
import Head from "next/head";
import useTimesheets, { UseTimesheetsParams } from "../hooks/useTimesheets";
import TimesheetTable from "../components/TimesheetTable";
import WorkChart from "../components/WorkChart";
import { useEffect, useMemo, useState } from "react";

function monthRangeISO(d = new Date()) {
  const y = d.getFullYear();
  const m = d.getMonth();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);
  const toISO = (x: Date) => x.toISOString().slice(0, 10);
  return { from: toISO(start), to: toISO(end) };
}

export default function Home() {
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [apiKeyHeader, setApiKeyHeader] = useState("X-API-KEY");
  const [companyId, setCompanyId] = useState("");

  // load saved
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('hrmos-conn') : null;
    if (saved) {
      try {
        const v = JSON.parse(saved);
        setBaseUrl(v.baseUrl || "");
        setApiKey(v.apiKey || "");
        setFrom(v.from || "");
        setTo(v.to || "");
        setApiKeyHeader(v.apiKeyHeader || "X-API-KEY");
        setCompanyId(v.companyId || "");
      } catch {}
    }
    if (!from || !to) {
      const r = monthRangeISO();
      setFrom(r.from);
      setTo(r.to);
    }
  }, [from, to]);

  const canQuery = baseUrl && apiKey && from && to;

  const params = useMemo<UseTimesheetsParams | undefined>(() => {
    return canQuery ? { baseUrl, apiKey, from, to, apiKeyHeader: apiKeyHeader || undefined, companyId: companyId || undefined } : undefined;
  }, [baseUrl, apiKey, from, to, apiKeyHeader, companyId, canQuery]);

  const { timesheets, loading } = useTimesheets(params);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = { baseUrl, apiKey, from, to, apiKeyHeader, companyId };
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('hrmos-conn', JSON.stringify(v));
    }
  };

  return (
      <>
        <Head>
          <title>勤怠管理ダッシュボード</title>
        </Head>
        <main className="container mx-auto p-8">
          <h1 className="text-2xl font-bold mb-4">勤怠管理ダッシュボード</h1>

          <form onSubmit={onSubmit} className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-medium mb-1">Company URL (API Base URL)</label>
              <input className="border p-2 w-full" placeholder="https://ieyasu.co/api/v1" value={baseUrl} onChange={(e)=>setBaseUrl(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">API Key</label>
              <input className="border p-2 w-full" type="password" value={apiKey} onChange={(e)=>setApiKey(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">From</label>
                <input className="border p-2 w-full" type="date" value={from} onChange={(e)=>setFrom(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">To</label>
                <input className="border p-2 w-full" type="date" value={to} onChange={(e)=>setTo(e.target.value)} />
              </div>
            </div>
            <details>
              <summary className="cursor-pointer">詳細設定</summary>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">API Key Header (optional)</label>
                  <input className="border p-2 w-full" placeholder="X-API-KEY" value={apiKeyHeader} onChange={(e)=>setApiKeyHeader(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Company ID (optional)</label>
                  <input className="border p-2 w-full" value={companyId} onChange={(e)=>setCompanyId(e.target.value)} />
                </div>
              </div>
            </details>
            <button className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50" disabled={!canQuery} type="submit">設定を保存して読み込み</button>
          </form>

          {!canQuery && (
            <p className="text-sm text-gray-600">Company URL と API Key を入力して「設定を保存して読み込み」を押すとダッシュボードが表示されます。</p>
          )}

          {canQuery && (loading ? (
              <p>読み込み中...</p>
          ) : (
              <>
                <TimesheetTable data={timesheets} />
                <div className="my-8" />
                <WorkChart data={timesheets} />
              </>
          ))}
        </main>
      </>
  );
}
