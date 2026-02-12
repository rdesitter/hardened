'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface HistoryPoint {
  score: number;
  date: string;
}

interface ScoreHistoryChartProps {
  data: HistoryPoint[];
}

function lineColor(score: number): string {
  if (score >= 70) return '#4ade80';
  if (score >= 40) return '#facc15';
  return '#f87171';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ScoreHistoryChart({ data }: ScoreHistoryChartProps) {
  if (data.length < 2) {
    return (
      <p className="text-sm text-gray-500">
        Score history will appear here after multiple scans.
      </p>
    );
  }

  const lastScore = data[data.length - 1].score;
  const formatted = data.map((d) => ({
    ...d,
    label: formatDate(d.date),
  }));

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formatted} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <XAxis
            dataKey="label"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={{ stroke: '#374151' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={{ stroke: '#374151' }}
            tickLine={false}
            width={35}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: 8,
              color: '#f3f4f6',
              fontSize: 13,
            }}
            formatter={(value) => [`${value ?? 0}/100`, 'Score']}
          />
          <ReferenceLine y={70} stroke="#4ade80" strokeDasharray="3 3" strokeOpacity={0.3} />
          <ReferenceLine y={40} stroke="#facc15" strokeDasharray="3 3" strokeOpacity={0.3} />
          <Line
            type="monotone"
            dataKey="score"
            stroke={lineColor(lastScore)}
            strokeWidth={2}
            dot={{ fill: lineColor(lastScore), r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
