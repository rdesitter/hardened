'use client';

import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface SparklineProps {
  data: { score: number; date: string }[];
}

function lineColor(score: number): string {
  if (score >= 70) return '#4ade80'; // green-400
  if (score >= 40) return '#facc15'; // yellow-400
  return '#f87171'; // red-400
}

export function ScoreSparkline({ data }: SparklineProps) {
  if (data.length < 2) return null;

  const lastScore = data[data.length - 1].score;

  return (
    <div className="h-8 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="score"
            stroke={lineColor(lastScore)}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
