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
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{value}</span>
          {delta !== undefined && (
            <span
              className={cn(
                "text-xs font-medium",
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
                    stroke="hsl(var(--primary))"
                    strokeWidth={1.5}
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
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="100%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={1.5}
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
