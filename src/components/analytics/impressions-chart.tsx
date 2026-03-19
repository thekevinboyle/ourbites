"use client";

import { format, parseISO } from "date-fns";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTimeSeriesMetrics } from "@/hooks/use-analytics";

export function ImpressionsChart() {
  const { data, isLoading } = useTimeSeriesMetrics();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Impressions</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading || !data ? (
          <div className="h-[300px] w-full animate-pulse rounded bg-muted" />
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) =>
                    format(parseISO(String(value)), "MMM d")
                  }
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(value) =>
                    Number(value) >= 1000 ? `${(Number(value) / 1000).toFixed(1)}k` : String(value)
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelFormatter={(label) =>
                    format(parseISO(String(label)), "MMM d, yyyy")
                  }
                  formatter={(value) => [
                    Number(value).toLocaleString(),
                    "Impressions",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="impressions"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
