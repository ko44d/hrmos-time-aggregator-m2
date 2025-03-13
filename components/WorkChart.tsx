// components/WorkChart.tsx
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

import { Bar } from "react-chartjs-2";
import { Timesheet } from "../hooks/useTimesheets";

interface WorkChartProps {
    data: Timesheet[];
}

export default function WorkChart({ data }: WorkChartProps) {
    const chartData = {
        labels: data.map((item) => item.name),
        datasets: [
            {
                label: "総労働時間",
                data: data.map((item) => item.totalHours),
                backgroundColor: "rgba(75, 192, 192, 0.6)",
            },
            {
                label: "残業時間",
                data: data.map((item) => item.overtime),
                backgroundColor: "rgba(255, 99, 132, 0.6)",
            },
        ],
    };

    return <Bar data={chartData} />;
}
