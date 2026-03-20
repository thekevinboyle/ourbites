"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";

interface KpiCardProps {
  title: string;
  value: string;
  delta?: number;
  sparklineData?: { date: string; value: number }[];
  sparklineType?: "line" | "area";
}

export function KpiCard({
  title,
  value,
  delta,
  sparklineData,
  sparklineType = "line",
}: KpiCardProps) {
  return (
    <Card className="border-2 border-foreground">
      <CardHeader>
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-display font-black">{value}</span>
          {delta !== undefined && (
            <span
              className={cn(
                "text-xs font-bold uppercase tracking-wide",
                delta >= 0 ? "text-green-600" : "text-red-600"
              )}
            >
              {delta >= 0 ? "+" : ""}
              {delta.toFixed(1)}%
            </span>
          )}
        </div>
        {sparklineData && sparklineData.length > 0 && (
          <div className="h-[40px]">
            <ResponsiveContainer width="100%" height="100%">
              {sparklineType === "line" ? (
                <LineChart data={sparklineData}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              ) : (
                <AreaChart data={sparklineData}>
                  <defs>
                    <linearGradient
                      id="sparklineGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="var(--primary)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--primary)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fill="url(#sparklineGradient)"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
