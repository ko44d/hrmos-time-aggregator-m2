// app/api/timesheets/route.ts
import { NextResponse } from "next/server";

export async function GET() {
    const dummyData = [
        { id: 1, name: "田中 太郎", totalHours: 40, overtime: 5 },
        { id: 2, name: "佐藤 花子", totalHours: 38, overtime: 2 },
    ];
    return NextResponse.json(dummyData);
}
