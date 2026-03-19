import { supabase } from "../supabase";
import { createMetricoolClient } from "./client";
import type { Platform } from "../database.types";

export interface SyncResult {
  postsUpdated: number;
  analyticsUpdated: number;
  errors: string[];
}

/**
 * Finds posts with a metricool_post_id that are still pending,
 * checks Metricool for their current status, and updates accordingly.
 */
export async function syncPostStatuses(): Promise<SyncResult> {
  const result: SyncResult = { postsUpdated: 0, analyticsUpdated: 0, errors: [] };

  const client = createMetricoolClient();
  if (!client) {
    result.errors.push("Metricool is not configured");
    return result;
  }

  try {
    const { data: pendingPosts, error } = await supabase
      .from("posts")
      .select("id, metricool_post_id")
      .not("metricool_post_id", "is", null)
      .eq("metricool_status", "pending");

    if (error) {
      result.errors.push(`Failed to fetch pending posts: ${error.message}`);
      return result;
    }

    if (!pendingPosts || pendingPosts.length === 0) {
      return result;
    }

    const scheduledPosts = await client.getScheduledPosts();
    const statusMap = new Map(
      scheduledPosts.map((sp) => [sp.id, sp.status])
    );

    for (const post of pendingPosts) {
      const metricoolId = post.metricool_post_id;
      if (!metricoolId) continue;

      const metricoolStatus = statusMap.get(metricoolId);
      if (!metricoolStatus) continue;

      let newStatus: string | null = null;
      let postStatus: string | null = null;

      if (metricoolStatus === "published" || metricoolStatus === "sent") {
        newStatus = "published";
        postStatus = "published";
      } else if (metricoolStatus === "failed" || metricoolStatus === "error") {
        newStatus = "failed";
      }

      if (newStatus) {
        const updateData: Record<string, unknown> = {
          metricool_status: newStatus,
        };
        if (postStatus) {
          updateData.status = postStatus;
          updateData.published_at = new Date().toISOString();
        }

        const { error: updateError } = await supabase
          .from("posts")
          .update(updateData)
          .eq("id", post.id);

        if (updateError) {
          result.errors.push(
            `Failed to update post ${post.id}: ${updateError.message}`
          );
        } else {
          result.postsUpdated++;
        }
      }
    }
  } catch (err) {
    result.errors.push(
      `syncPostStatuses error: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  return result;
}

/**
 * Pulls last 30 days of metrics from Metricool for instagram and tiktok,
 * and upserts into analytics_snapshots.
 */
export async function syncAnalytics(): Promise<SyncResult> {
  const result: SyncResult = { postsUpdated: 0, analyticsUpdated: 0, errors: [] };

  const client = createMetricoolClient();
  if (!client) {
    result.errors.push("Metricool is not configured");
    return result;
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const dateStart = thirtyDaysAgo.toISOString().split("T")[0];
  const dateEnd = now.toISOString().split("T")[0];

  const networks: { network: string; platform: Platform }[] = [
    { network: "instagram", platform: "instagram" },
    { network: "tiktok", platform: "tiktok" },
  ];

  for (const { network, platform } of networks) {
    try {
      const metrics = await client.getMetrics(network, dateStart, dateEnd);

      for (const snapshot of metrics) {
        const date = snapshot.date;

        // Check if a record already exists for this platform + date
        const { data: existing, error: fetchError } = await supabase
          .from("analytics_snapshots")
          .select("id")
          .eq("platform", platform)
          .eq("date", date)
          .maybeSingle();

        if (fetchError) {
          result.errors.push(
            `Failed to check existing snapshot for ${platform} ${date}: ${fetchError.message}`
          );
          continue;
        }

        const snapshotData = {
          platform,
          date,
          impressions: snapshot.impressions ?? 0,
          likes: snapshot.likes ?? 0,
          comments: snapshot.comments ?? 0,
          shares: snapshot.shares ?? 0,
          saves: snapshot.saves ?? 0,
          followers: snapshot.followers ?? 0,
          engagement_rate: snapshot.engagement_rate ?? 0,
        };

        if (existing) {
          const { error: updateError } = await supabase
            .from("analytics_snapshots")
            .update(snapshotData)
            .eq("id", existing.id);

          if (updateError) {
            result.errors.push(
              `Failed to update snapshot ${existing.id}: ${updateError.message}`
            );
          } else {
            result.analyticsUpdated++;
          }
        } else {
          const { error: insertError } = await supabase
            .from("analytics_snapshots")
            .insert(snapshotData);

          if (insertError) {
            result.errors.push(
              `Failed to insert snapshot for ${platform} ${date}: ${insertError.message}`
            );
          } else {
            result.analyticsUpdated++;
          }
        }
      }
    } catch (err) {
      result.errors.push(
        `syncAnalytics error for ${network}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return result;
}

/**
 * Matches published posts by metricool_post_id, fetches their metrics
 * from Metricool, and upserts into post_analytics.
 */
export async function syncPostAnalytics(): Promise<SyncResult> {
  const result: SyncResult = { postsUpdated: 0, analyticsUpdated: 0, errors: [] };

  const client = createMetricoolClient();
  if (!client) {
    result.errors.push("Metricool is not configured");
    return result;
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const dateStart = thirtyDaysAgo.toISOString().split("T")[0];
  const dateEnd = now.toISOString().split("T")[0];

  // Fetch published posts with metricool IDs
  const { data: publishedPosts, error: postsError } = await supabase
    .from("posts")
    .select("id, platform, metricool_post_id")
    .not("metricool_post_id", "is", null)
    .eq("metricool_status", "published");

  if (postsError) {
    result.errors.push(`Failed to fetch published posts: ${postsError.message}`);
    return result;
  }

  if (!publishedPosts || publishedPosts.length === 0) {
    return result;
  }

  // Build a map of metricool_post_id -> our post id
  const metricoolToPostId = new Map(
    publishedPosts.map((p) => [p.metricool_post_id, p.id])
  );

  // Fetch metrics from both platforms
  const platformFetchers: {
    platform: Platform;
    fetch: () => Promise<
      { id: string; impressions: number; likes: number; comments: number; shares: number; saves: number; reach: number; [key: string]: unknown }[]
    >;
  }[] = [
    {
      platform: "instagram",
      fetch: () => client.getInstagramPosts(dateStart, dateEnd),
    },
    {
      platform: "tiktok",
      fetch: () => client.getTikTokVideos(dateStart, dateEnd),
    },
  ];

  for (const { platform, fetch: fetchMetrics } of platformFetchers) {
    try {
      const postMetrics = await fetchMetrics();

      for (const metrics of postMetrics) {
        const postId = metricoolToPostId.get(metrics.id);
        if (!postId) continue;

        const analyticsData = {
          post_id: postId,
          impressions: metrics.impressions ?? 0,
          likes: metrics.likes ?? 0,
          comments: metrics.comments ?? 0,
          shares: metrics.shares ?? 0,
          saves: metrics.saves ?? 0,
          reach: metrics.reach ?? 0,
        };

        // Check if a record already exists for this post_id
        const { data: existing, error: fetchError } = await supabase
          .from("post_analytics")
          .select("id")
          .eq("post_id", postId)
          .maybeSingle();

        if (fetchError) {
          result.errors.push(
            `Failed to check existing analytics for post ${postId}: ${fetchError.message}`
          );
          continue;
        }

        if (existing) {
          const { error: updateError } = await supabase
            .from("post_analytics")
            .update(analyticsData)
            .eq("id", existing.id);

          if (updateError) {
            result.errors.push(
              `Failed to update analytics for post ${postId}: ${updateError.message}`
            );
          } else {
            result.analyticsUpdated++;
          }
        } else {
          const { error: insertError } = await supabase
            .from("post_analytics")
            .insert(analyticsData);

          if (insertError) {
            result.errors.push(
              `Failed to insert analytics for post ${postId}: ${insertError.message}`
            );
          } else {
            result.analyticsUpdated++;
          }
        }
      }
    } catch (err) {
      result.errors.push(
        `syncPostAnalytics error for ${platform}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return result;
}

/**
 * Runs all sync operations and returns a combined result.
 */
export async function syncAll(): Promise<SyncResult> {
  const combined: SyncResult = {
    postsUpdated: 0,
    analyticsUpdated: 0,
    errors: [],
  };

  const postStatusResult = await syncPostStatuses();
  combined.postsUpdated += postStatusResult.postsUpdated;
  combined.analyticsUpdated += postStatusResult.analyticsUpdated;
  combined.errors.push(...postStatusResult.errors);

  const analyticsResult = await syncAnalytics();
  combined.postsUpdated += analyticsResult.postsUpdated;
  combined.analyticsUpdated += analyticsResult.analyticsUpdated;
  combined.errors.push(...analyticsResult.errors);

  const postAnalyticsResult = await syncPostAnalytics();
  combined.postsUpdated += postAnalyticsResult.postsUpdated;
  combined.analyticsUpdated += postAnalyticsResult.analyticsUpdated;
  combined.errors.push(...postAnalyticsResult.errors);

  return combined;
}
