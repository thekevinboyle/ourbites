export interface MetricoolConfig {
  userToken: string;
  userId: string;
  blogId: string;
  baseUrl?: string;
}

export interface MetricoolSchedulePostRequest {
  network: string;
  text: string;
  date: string;
  type?: string;
}

export interface MetricoolSchedulePostResponse {
  id: string;
  status: string;
  [key: string]: unknown;
}

export interface MetricoolScheduledPost {
  id: string;
  network: string;
  text: string;
  date: string;
  status: string;
  [key: string]: unknown;
}

export interface MetricoolPostMetrics {
  id: string;
  network: string;
  text: string;
  date: string;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  [key: string]: unknown;
}

export interface MetricoolAnalyticsSnapshot {
  date: string;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  followers: number;
  engagement_rate: number;
  [key: string]: unknown;
}

export interface MetricoolBrand {
  id: string;
  name: string;
  [key: string]: unknown;
}
