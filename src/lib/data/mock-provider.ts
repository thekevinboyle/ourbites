import { supabase } from "../supabase";
import type {
  DataProvider,
  Post,
  PostWithAnalytics,
  CreatePostInput,
  UpdatePostInput,
  PostFilters,
  DateRange,
  OverviewMetrics,
  TimeSeriesData,
  EngagementByType,
  CalendarPost,
  Platform,
} from "./types";

function mapPost(row: Record<string, unknown>): Post {
  return {
    id: row.id as string,
    platform: row.platform as Platform,
    caption: (row.caption as string | null) ?? null,
    postType: row.post_type as Post["postType"],
    status: row.status as Post["status"],
    scheduledAt: row.scheduled_at ? new Date(row.scheduled_at as string) : null,
    publishedAt: row.published_at ? new Date(row.published_at as string) : null,
    notes: (row.notes as string | null) ?? null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export class SupabaseMockProvider implements DataProvider {
  async getPosts(filters: PostFilters): Promise<Post[]> {
    let query = supabase.from("posts").select("*");

    if (filters.platform) {
      query = query.eq("platform", filters.platform);
    }
    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.postType) {
      query = query.eq("post_type", filters.postType);
    }
    if (filters.search) {
      query = query.ilike("caption", `%${filters.search}%`);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []).map((row) => mapPost(row as Record<string, unknown>));
  }

  async createPost(input: CreatePostInput): Promise<Post> {
    const { data, error } = await supabase
      .from("posts")
      .insert({
        platform: input.platform,
        caption: input.caption ?? null,
        post_type: input.postType,
        status: input.status ?? "idea",
        scheduled_at: input.scheduledAt?.toISOString() ?? null,
        notes: input.notes ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return mapPost(data as Record<string, unknown>);
  }

  async updatePost(id: string, input: UpdatePostInput): Promise<Post> {
    const updateData: Record<string, unknown> = {};

    if (input.caption !== undefined) updateData.caption = input.caption;
    if (input.postType !== undefined) updateData.post_type = input.postType;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.scheduledAt !== undefined) {
      updateData.scheduled_at = input.scheduledAt?.toISOString() ?? null;
    }
    if (input.publishedAt !== undefined) {
      updateData.published_at = input.publishedAt?.toISOString() ?? null;
    }
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.platform !== undefined) updateData.platform = input.platform;

    const { data, error } = await supabase
      .from("posts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return mapPost(data as Record<string, unknown>);
  }

  async deletePost(id: string): Promise<void> {
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) throw error;
  }

  async getOverviewMetrics(
    dateRange: DateRange,
    platform?: Platform
  ): Promise<OverviewMetrics> {
    const duration = dateRange.end.getTime() - dateRange.start.getTime();
    const previousStart = new Date(dateRange.start.getTime() - duration);
    const previousEnd = new Date(dateRange.start.getTime());

    // Current period analytics
    let currentQuery = supabase
      .from("analytics_snapshots")
      .select("*")
      .gte("date", dateRange.start.toISOString().split("T")[0])
      .lte("date", dateRange.end.toISOString().split("T")[0]);

    if (platform) {
      currentQuery = currentQuery.eq("platform", platform);
    }

    const { data: currentData, error: currentError } = await currentQuery.order("date");
    if (currentError) throw currentError;

    // Previous period analytics
    let previousQuery = supabase
      .from("analytics_snapshots")
      .select("*")
      .gte("date", previousStart.toISOString().split("T")[0])
      .lte("date", previousEnd.toISOString().split("T")[0]);

    if (platform) {
      previousQuery = previousQuery.eq("platform", platform);
    }

    const { data: previousData, error: previousError } = await previousQuery.order("date");
    if (previousError) throw previousError;

    // Current period posts count
    let postsQuery = supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .gte("created_at", dateRange.start.toISOString())
      .lte("created_at", dateRange.end.toISOString());

    if (platform) {
      postsQuery = postsQuery.eq("platform", platform);
    }

    const { count: currentPostsCount, error: postsError } = await postsQuery;
    if (postsError) throw postsError;

    // Previous period posts count
    let prevPostsQuery = supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .gte("created_at", previousStart.toISOString())
      .lte("created_at", previousEnd.toISOString());

    if (platform) {
      prevPostsQuery = prevPostsQuery.eq("platform", platform);
    }

    const { count: previousPostsCount, error: prevPostsError } = await prevPostsQuery;
    if (prevPostsError) throw prevPostsError;

    const current = currentData ?? [];
    const previous = previousData ?? [];

    const totalImpressions = current.reduce((sum, r) => sum + (r.impressions ?? 0), 0);
    const avgEngagement =
      current.length > 0
        ? current.reduce((sum, r) => sum + (r.engagement_rate ?? 0), 0) / current.length
        : 0;

    const firstFollowers = current.length > 0 ? (current[0].followers ?? 0) : 0;
    const lastFollowers = current.length > 0 ? (current[current.length - 1].followers ?? 0) : 0;
    const followerGrowth = lastFollowers - firstFollowers;

    const prevTotalImpressions = previous.reduce((sum, r) => sum + (r.impressions ?? 0), 0);
    const prevAvgEngagement =
      previous.length > 0
        ? previous.reduce((sum, r) => sum + (r.engagement_rate ?? 0), 0) / previous.length
        : 0;

    const prevFirstFollowers = previous.length > 0 ? (previous[0].followers ?? 0) : 0;
    const prevLastFollowers =
      previous.length > 0 ? (previous[previous.length - 1].followers ?? 0) : 0;
    const prevFollowerGrowth = prevLastFollowers - prevFirstFollowers;

    const impressionsTrend = current.map((r) => ({
      date: r.date,
      value: r.impressions ?? 0,
    }));

    const followersTrend = current.map((r) => ({
      date: r.date,
      value: r.followers ?? 0,
    }));

    return {
      totalImpressions,
      engagementRate: avgEngagement,
      followerGrowth,
      totalPosts: currentPostsCount ?? 0,
      previousPeriod: {
        totalImpressions: prevTotalImpressions,
        engagementRate: prevAvgEngagement,
        followerGrowth: prevFollowerGrowth,
        totalPosts: previousPostsCount ?? 0,
      },
      impressionsTrend,
      followersTrend,
    };
  }

  async getTimeSeriesMetrics(
    dateRange: DateRange,
    platform?: Platform
  ): Promise<TimeSeriesData[]> {
    let query = supabase
      .from("analytics_snapshots")
      .select("*")
      .gte("date", dateRange.start.toISOString().split("T")[0])
      .lte("date", dateRange.end.toISOString().split("T")[0]);

    if (platform) {
      query = query.eq("platform", platform);
    }

    const { data, error } = await query.order("date");
    if (error) throw error;

    return (data ?? []).map((row) => ({
      date: row.date,
      impressions: row.impressions ?? 0,
      likes: row.likes ?? 0,
      comments: row.comments ?? 0,
      shares: row.shares ?? 0,
      saves: row.saves ?? 0,
      followers: row.followers ?? 0,
      engagementRate: row.engagement_rate ?? 0,
      platform: row.platform,
    }));
  }

  async getTopPosts(
    dateRange: DateRange,
    limit: number = 5
  ): Promise<PostWithAnalytics[]> {
    const { data, error } = await supabase
      .from("posts")
      .select("*, post_analytics(*)")
      .gte("created_at", dateRange.start.toISOString())
      .lte("created_at", dateRange.end.toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;

    const posts: PostWithAnalytics[] = (data ?? []).map((row) => {
      const post = mapPost(row as unknown as Record<string, unknown>);
      const pa = row.post_analytics;

      return {
        ...post,
        analytics: pa
          ? {
              impressions: pa.impressions ?? 0,
              likes: pa.likes ?? 0,
              comments: pa.comments ?? 0,
              shares: pa.shares ?? 0,
              saves: pa.saves ?? 0,
              reach: pa.reach ?? 0,
            }
          : null,
      };
    });

    // Sort by total engagement (likes + comments + shares + saves)
    posts.sort((a, b) => {
      const engA = a.analytics
        ? a.analytics.likes + a.analytics.comments + a.analytics.shares + a.analytics.saves
        : 0;
      const engB = b.analytics
        ? b.analytics.likes + b.analytics.comments + b.analytics.shares + b.analytics.saves
        : 0;
      return engB - engA;
    });

    return posts.slice(0, limit);
  }

  async getEngagementByType(
    dateRange: DateRange,
    platform?: Platform
  ): Promise<EngagementByType[]> {
    let query = supabase
      .from("posts")
      .select("post_type, post_analytics(likes, comments, shares, saves)")
      .gte("created_at", dateRange.start.toISOString())
      .lte("created_at", dateRange.end.toISOString());

    if (platform) {
      query = query.eq("platform", platform);
    }

    const { data, error } = await query;
    if (error) throw error;

    const byType: Record<
      string,
      { likes: number; comments: number; shares: number; saves: number }
    > = {};

    for (const row of data ?? []) {
      const postType = row.post_type;
      if (!byType[postType]) {
        byType[postType] = { likes: 0, comments: 0, shares: 0, saves: 0 };
      }

      const pa = row.post_analytics;

      if (pa) {
        byType[postType].likes += pa.likes ?? 0;
        byType[postType].comments += pa.comments ?? 0;
        byType[postType].shares += pa.shares ?? 0;
        byType[postType].saves += pa.saves ?? 0;
      }
    }

    return Object.entries(byType).map(([postType, metrics]) => ({
      postType: postType as EngagementByType["postType"],
      ...metrics,
    }));
  }

  async getCalendarPosts(month: number, year: number): Promise<CalendarPost[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const { data, error } = await supabase
      .from("posts")
      .select("id, platform, caption, post_type, status, scheduled_at, published_at, created_at")
      .or(
        `scheduled_at.gte.${startDate.toISOString()},published_at.gte.${startDate.toISOString()},created_at.gte.${startDate.toISOString()}`
      )
      .or(
        `scheduled_at.lte.${endDate.toISOString()},published_at.lte.${endDate.toISOString()},created_at.lte.${endDate.toISOString()}`
      );

    if (error) throw error;

    return (data ?? [])
      .filter((row) => {
        const dateStr =
          (row.scheduled_at as string | null) ??
          (row.published_at as string | null) ??
          (row.created_at as string);
        const d = new Date(dateStr);
        return d >= startDate && d <= endDate;
      })
      .map((row) => {
        const dateStr =
          (row.scheduled_at as string | null) ??
          (row.published_at as string | null) ??
          (row.created_at as string);

        return {
          id: row.id,
          platform: row.platform,
          caption: row.caption,
          postType: row.post_type,
          status: row.status,
          date: new Date(dateStr),
        };
      });
  }

  async reschedulePost(id: string, newDate: Date): Promise<Post> {
    const { data, error } = await supabase
      .from("posts")
      .update({
        scheduled_at: newDate.toISOString(),
        status: "scheduled" as const,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return mapPost(data as Record<string, unknown>);
  }
}
