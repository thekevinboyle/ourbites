import type {
  MetricoolConfig,
  MetricoolSchedulePostRequest,
  MetricoolSchedulePostResponse,
  MetricoolScheduledPost,
  MetricoolPostMetrics,
  MetricoolAnalyticsSnapshot,
  MetricoolBrand,
} from "./types";

const DEFAULT_BASE_URL = "https://app.metricool.com/api";

export class MetricoolClient {
  private config: MetricoolConfig;
  private baseUrl: string;

  constructor(config: MetricoolConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    url.searchParams.set("userId", this.config.userId);
    url.searchParams.set("blogId", this.config.blogId);

    const headers: Record<string, string> = {
      "X-Mc-Auth": this.config.userToken,
      "Content-Type": "application/json",
    };

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "Unknown error");
      throw new Error(
        `Metricool API error ${response.status}: ${text}`
      );
    }

    return response.json() as Promise<T>;
  }

  async schedulePost(
    post: MetricoolSchedulePostRequest
  ): Promise<MetricoolSchedulePostResponse> {
    return this.request<MetricoolSchedulePostResponse>(
      "POST",
      "/scheduler/schedule",
      post
    );
  }

  async updateScheduledPost(
    postId: string,
    post: MetricoolSchedulePostRequest
  ): Promise<MetricoolSchedulePostResponse> {
    return this.request<MetricoolSchedulePostResponse>(
      "PUT",
      `/scheduler/schedule/${postId}`,
      post
    );
  }

  async getScheduledPosts(): Promise<MetricoolScheduledPost[]> {
    return this.request<MetricoolScheduledPost[]>(
      "GET",
      "/scheduler/scheduled"
    );
  }

  async getBrands(): Promise<MetricoolBrand[]> {
    return this.request<MetricoolBrand[]>("GET", "/brands");
  }

  async getInstagramPosts(
    dateStart: string,
    dateEnd: string
  ): Promise<MetricoolPostMetrics[]> {
    return this.request<MetricoolPostMetrics[]>(
      "GET",
      `/analytics/instagram/posts?dateStart=${encodeURIComponent(dateStart)}&dateEnd=${encodeURIComponent(dateEnd)}`
    );
  }

  async getTikTokVideos(
    dateStart: string,
    dateEnd: string
  ): Promise<MetricoolPostMetrics[]> {
    return this.request<MetricoolPostMetrics[]>(
      "GET",
      `/analytics/tiktok/videos?dateStart=${encodeURIComponent(dateStart)}&dateEnd=${encodeURIComponent(dateEnd)}`
    );
  }

  async getMetrics(
    network: string,
    dateStart: string,
    dateEnd: string
  ): Promise<MetricoolAnalyticsSnapshot[]> {
    return this.request<MetricoolAnalyticsSnapshot[]>(
      "GET",
      `/analytics/${encodeURIComponent(network)}/metrics?dateStart=${encodeURIComponent(dateStart)}&dateEnd=${encodeURIComponent(dateEnd)}`
    );
  }
}

export function isMetricoolConfigured(): boolean {
  return !!(
    process.env.METRICOOL_USER_TOKEN &&
    process.env.METRICOOL_USER_ID &&
    process.env.METRICOOL_BLOG_ID
  );
}

export function createMetricoolClient(): MetricoolClient | null {
  const userToken = process.env.METRICOOL_USER_TOKEN;
  const userId = process.env.METRICOOL_USER_ID;
  const blogId = process.env.METRICOOL_BLOG_ID;

  if (!userToken || !userId || !blogId) {
    return null;
  }

  return new MetricoolClient({ userToken, userId, blogId });
}
