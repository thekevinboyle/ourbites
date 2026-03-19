import { Header } from "@/components/layout/header";
import { AnalyticsControls } from "@/components/analytics/analytics-controls";
import { KpiCardsRow } from "@/components/analytics/kpi-cards-row";
import { ImpressionsChart } from "@/components/analytics/impressions-chart";
import { EngagementChart } from "@/components/analytics/engagement-chart";
import { FollowersChart } from "@/components/analytics/followers-chart";
import { TopPosts } from "@/components/analytics/top-posts";

export default function AnalyticsPage() {
  return (
    <div>
      <Header title="Analytics" />
      <div className="space-y-6 p-6">
        <AnalyticsControls />
        <KpiCardsRow />
        <div className="grid gap-6 lg:grid-cols-2">
          <ImpressionsChart />
          <EngagementChart />
          <FollowersChart />
        </div>
        <TopPosts />
      </div>
    </div>
  );
}
