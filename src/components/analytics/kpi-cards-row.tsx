"use client";

import { useOverviewMetrics } from "@/hooks/use-analytics";
import { KpiCard } from "./kpi-card";

function calcDelta(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function KpiSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 ring-1 ring-foreground/10">
      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-8 w-20 animate-pulse rounded bg-muted" />
      <div className="mt-3 h-[40px] w-full animate-pulse rounded bg-muted" />
    </div>
  );
}

export function KpiCardsRow() {
  const { data, isLoading } = useOverviewMetrics();

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiSkeleton />
        <KpiSkeleton />
        <KpiSkeleton />
        <KpiSkeleton />
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title="Total Impressions"
        value={data.totalImpressions.toLocaleString()}
        delta={calcDelta(
          data.totalImpressions,
          data.previousPeriod.totalImpressions
        )}
        sparklineData={data.impressionsTrend}
        sparklineType="line"
      />
      <KpiCard
        title="Engagement Rate"
        value={`${data.engagementRate.toFixed(2)}%`}
        delta={calcDelta(
          data.engagementRate,
          data.previousPeriod.engagementRate
        )}
      />
      <KpiCard
        title="Follower Growth"
        value={data.followerGrowth.toLocaleString()}
        delta={calcDelta(
          data.followerGrowth,
          data.previousPeriod.followerGrowth
        )}
        sparklineData={data.followersTrend}
        sparklineType="area"
      />
      <KpiCard
        title="Total Posts"
        value={data.totalPosts.toLocaleString()}
      />
    </div>
  );
}
