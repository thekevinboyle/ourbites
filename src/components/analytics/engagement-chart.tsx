"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEngagementByType } from "@/hooks/use-analytics";
import type { PostType } from "@/lib/data/types";

const postTypeLabels: Record<PostType, string> = {
  reel: "Reel",
  carousel: "Carousel",
  story: "Story",
  single_image: "Single Image",
  video: "Video",
  photo: "Photo",
};

export function EngagementChart() {
  const { data, isLoading } = useEngagementByType();

  const chartData = data?.map((item) => ({
    ...item,
    name: postTypeLabels[item.postType] ?? item.postType,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Engagement by Post Type</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading || !chartData ? (
          <div className="h-[300px] w-full animate-pulse rounded bg-muted" />
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="name"
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value, name) => [
                    Number(value).toLocaleString(),
                    String(name).charAt(0).toUpperCase() + String(name).slice(1),
                  ]}
                />
                <Legend />
                <Bar dataKey="likes" fill="#f472b6" radius={[2, 2, 0, 0]} />
                <Bar dataKey="comments" fill="#60a5fa" radius={[2, 2, 0, 0]} />
                <Bar dataKey="shares" fill="#34d399" radius={[2, 2, 0, 0]} />
                <Bar dataKey="saves" fill="#a78bfa" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
