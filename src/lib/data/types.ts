import type { Platform, PostType, PostStatus } from "../database.types";

export type { Platform, PostType, PostStatus };

export interface Post {
  id: string;
  platform: Platform;
  caption: string | null;
  postType: PostType;
  status: PostStatus;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostWithAnalytics extends Post {
  analytics: PostAnalytics | null;
}

export interface PostAnalytics {
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
}

export interface CreatePostInput {
  platform: Platform;
  caption?: string;
  postType: PostType;
  status?: PostStatus;
  scheduledAt?: Date;
  notes?: string;
}

export interface UpdatePostInput {
  caption?: string;
  postType?: PostType;
  status?: PostStatus;
  scheduledAt?: Date | null;
  publishedAt?: Date | null;
  notes?: string;
  platform?: Platform;
}

export interface PostFilters {
  platform?: Platform;
  status?: PostStatus;
  postType?: PostType;
  search?: string;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface OverviewMetrics {
  totalImpressions: number;
  engagementRate: number;
  followerGrowth: number;
  totalPosts: number;
  previousPeriod: {
    totalImpressions: number;
    engagementRate: number;
    followerGrowth: number;
    totalPosts: number;
  };
  impressionsTrend: { date: string; value: number }[];
  followersTrend: { date: string; value: number }[];
}

export interface TimeSeriesData {
  date: string;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  followers: number;
  engagementRate: number;
  platform?: Platform;
}

export interface EngagementByType {
  postType: PostType;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
}

export interface CalendarPost {
  id: string;
  platform: Platform;
  caption: string | null;
  postType: PostType;
  status: PostStatus;
  date: Date;
}

export interface DataProvider {
  getPosts(filters: PostFilters): Promise<Post[]>;
  createPost(post: CreatePostInput): Promise<Post>;
  updatePost(id: string, data: UpdatePostInput): Promise<Post>;
  deletePost(id: string): Promise<void>;
  getOverviewMetrics(dateRange: DateRange, platform?: Platform): Promise<OverviewMetrics>;
  getTimeSeriesMetrics(dateRange: DateRange, platform?: Platform): Promise<TimeSeriesData[]>;
  getTopPosts(dateRange: DateRange, limit?: number): Promise<PostWithAnalytics[]>;
  getEngagementByType(dateRange: DateRange, platform?: Platform): Promise<EngagementByType[]>;
  getCalendarPosts(month: number, year: number): Promise<CalendarPost[]>;
  reschedulePost(id: string, newDate: Date): Promise<Post>;
}
