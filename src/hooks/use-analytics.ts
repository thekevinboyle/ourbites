"use client";

import { useQuery } from "@tanstack/react-query";
import { dataProvider } from "@/lib/data";
import { useAnalyticsStore } from "@/store/analytics-store";

export function useOverviewMetrics() {
  const { dateRange, platform } = useAnalyticsStore();
  return useQuery({
    queryKey: ["analytics", "overview", dateRange, platform],
    queryFn: () => dataProvider.getOverviewMetrics(dateRange, platform),
  });
}

export function useTimeSeriesMetrics() {
  const { dateRange, platform } = useAnalyticsStore();
  return useQuery({
    queryKey: ["analytics", "timeseries", dateRange, platform],
    queryFn: () => dataProvider.getTimeSeriesMetrics(dateRange, platform),
  });
}

export function useTopPosts() {
  const { dateRange } = useAnalyticsStore();
  return useQuery({
    queryKey: ["analytics", "top-posts", dateRange],
    queryFn: () => dataProvider.getTopPosts(dateRange, 10),
  });
}

export function useEngagementByType() {
  const { dateRange, platform } = useAnalyticsStore();
  return useQuery({
    queryKey: ["analytics", "engagement-by-type", dateRange, platform],
    queryFn: () => dataProvider.getEngagementByType(dateRange, platform),
  });
}
