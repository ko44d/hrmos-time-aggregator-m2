// components/TimesheetTable.tsx
import { Timesheet } from "../hooks/useTimesheets";

interface TimesheetTableProps {
    data: Timesheet[];
}

export default function TimesheetTable({ data }: TimesheetTableProps) {
    return (
        <table className="w-full border-collapse">
            <thead>
            <tr>
                <th className="border p-2">名前</th>
                <th className="border p-2">総労働時間</th>
                <th className="border p-2">残業時間</th>
            </tr>
            </thead>
            <tbody>
            {data.map((employee) => (
                <tr key={employee.id}>
                    <td className="border p-2">{employee.name}</td>
                    <td className="border p-2">{employee.totalHours}</td>
                    <td className="border p-2">{employee.overtime}</td>
                </tr>
            ))}
            </tbody>
        </table>
    );
}
