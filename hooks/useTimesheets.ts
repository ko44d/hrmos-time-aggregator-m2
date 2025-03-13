// hooks/useTimesheets.ts
"use client";
import { useState, useEffect } from "react";

export interface Timesheet {
    id: number;
    name: string;
    totalHours: number;
    overtime: number;
}

export default function useTimesheets() {
    const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/timesheets")
            .then((res) => res.json())
            .then((data) => setTimesheets(data))
            .finally(() => setLoading(false));
    }, []);

    return { timesheets, loading };
}
