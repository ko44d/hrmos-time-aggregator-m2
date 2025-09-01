// hooks/useTimesheets.ts
"use client";
import { useState, useEffect } from "react";

export interface Timesheet {
    id: number;
    name: string;
    totalHours: number;
    overtime: number;
}

export type UseTimesheetsParams = {
    baseUrl: string;
    apiKey: string;
    from: string; // YYYY-MM-DD
    to: string;   // YYYY-MM-DD
    apiKeyHeader?: string;
    companyId?: string;
};

export default function useTimesheets(params?: UseTimesheetsParams) {
    const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        if (!params) return; // wait until form provided
        const { baseUrl, apiKey, from, to, apiKeyHeader, companyId } = params;
        if (!baseUrl || !apiKey || !from || !to) return;
        setLoading(true);
        const q = new URLSearchParams({ from, to });
        fetch(`/api/timesheets?${q.toString()}`, {
            headers: {
                'x-api-base-url': baseUrl,
                'x-api-key': apiKey,
                ...(apiKeyHeader ? { 'x-api-key-header': apiKeyHeader } : {}),
                ...(companyId ? { 'x-company-id': companyId } : {}),
            },
        })
            .then((res) => res.json())
            .then((data) => setTimesheets(data))
            .finally(() => setLoading(false));
    }, [params?.baseUrl, params?.apiKey, params?.from, params?.to, params?.apiKeyHeader, params?.companyId]);

    return { timesheets, loading };
}
