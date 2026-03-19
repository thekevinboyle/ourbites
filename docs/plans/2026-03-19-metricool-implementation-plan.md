# Metricool Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Connect OurBites to Metricool's API for real posting/scheduling to Instagram and TikTok, with sync-back for published status and analytics.

**Architecture:** Metricool client layer wraps their REST API. When a post is scheduled in OurBites, it gets pushed to Metricool. A manual sync route pulls back published statuses and analytics data. OurBites (Supabase) remains source of truth for ideas/drafts.

**Tech Stack:** Metricool REST API, Next.js API routes, Supabase, existing DataProvider pattern

**Design doc:** `docs/plans/2026-03-19-metricool-integration-design.md`

---

## Task 1: Database Migration + Type Updates

**Files:**
- Create: `supabase/migrations/002_metricool_columns.sql`
- Modify: `src/lib/database.types.ts`
- Modify: `src/lib/data/types.ts`
- Modify: `src/lib/data/mock-provider.ts`

**Step 1: Write the migration**

Create `supabase/migrations/002_metricool_columns.sql`:

```sql
ALTER TABLE posts ADD COLUMN metricool_post_id text;
ALTER TABLE posts ADD COLUMN metricool_status text CHECK (metricool_status IN ('pending', 'published', 'failed'));
CREATE INDEX idx_posts_metricool_post_id ON posts(metricool_post_id);
```

User must run this SQL in Supabase Dashboard > SQL Editor.

**Step 2: Update database.types.ts**

Add to the `posts` table Row type:

```typescript
metricool_post_id: string | null;
metricool_status: string | null;
```

Add to Insert type:

```typescript
metricool_post_id?: string | null;
metricool_status?: string | null;
```

Add to Update type:

```typescript
metricool_post_id?: string | null;
metricool_status?: string | null;
```

**Step 3: Update domain Post type**

In `src/lib/data/types.ts`, add two fields to the `Post` interface:

```typescript
metricoolPostId: string | null;
metricoolStatus: string | null; // 'pending' | 'published' | 'failed' | null
```

Add a new method to the `DataProvider` interface:

```typescript
scheduleToMetricool(id: string): Promise<Post>;
```

**Step 4: Update mapPost in mock-provider.ts**

Add to the `mapPost` function return object:

```typescript
metricoolPostId: (row.metricool_post_id as string | null) ?? null,
metricoolStatus: (row.metricool_status as string | null) ?? null,
```

Add a stub implementation for `scheduleToMetricool`:

```typescript
async scheduleToMetricool(id: string): Promise<Post> {
  // In mock mode, just mark the post as if it was pushed to Metricool
  const { data, error } = await supabase
    .from("posts")
    .update({ metricool_status: "pending" })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapPost(data);
}
```

**Step 5: Verify build**

```bash
pnpm build
```

**Step 6: Commit**

```bash
git add supabase/migrations/002_metricool_columns.sql src/lib/database.types.ts src/lib/data/types.ts src/lib/data/mock-provider.ts
git commit -m "feat: add metricool columns to posts table and update types"
```

---

## Task 2: Metricool API Client + Types

**Files:**
- Create: `src/lib/metricool/types.ts`
- Create: `src/lib/metricool/client.ts`

**Step 1: Create Metricool types**

Create `src/lib/metricool/types.ts`:

```typescript
export interface MetricoolConfig {
  userToken: string;
  userId: string;
  blogId: string;
  baseUrl?: string;
}

export interface MetricoolSchedulePostRequest {
  /** The social network: "instagram", "tiktok", etc. */
  network: string;
  /** Post text/caption */
  text: string;
  /** ISO 8601 date string for when to publish */
  date: string;
  /** Post type specific to the network */
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
```

**Step 2: Create Metricool API client**

Create `src/lib/metricool/client.ts`:

```typescript
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
    const separator = path.includes("?") ? "&" : "?";
    const url = `${this.baseUrl}${path}${separator}userId=${this.config.userId}&blogId=${this.config.blogId}`;

    const response = await fetch(url, {
      method,
      headers: {
        "X-Mc-Auth": this.config.userToken,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Metricool API error (${response.status}): ${errorText}`
      );
    }

    return response.json() as Promise<T>;
  }

  /** Schedule a post for publishing */
  async schedulePost(
    post: MetricoolSchedulePostRequest
  ): Promise<MetricoolSchedulePostResponse> {
    return this.request<MetricoolSchedulePostResponse>(
      "POST",
      "/scheduler/schedule",
      post
    );
  }

  /** Update a scheduled post */
  async updateScheduledPost(
    metricoolId: string,
    updates: Partial<MetricoolSchedulePostRequest>
  ): Promise<MetricoolSchedulePostResponse> {
    return this.request<MetricoolSchedulePostResponse>(
      "PUT",
      `/scheduler/schedule/${metricoolId}`,
      updates
    );
  }

  /** Get all scheduled posts */
  async getScheduledPosts(): Promise<MetricoolScheduledPost[]> {
    return this.request<MetricoolScheduledPost[]>(
      "GET",
      "/scheduler/scheduled"
    );
  }

  /** Get available brands/workspaces */
  async getBrands(): Promise<MetricoolBrand[]> {
    return this.request<MetricoolBrand[]>("GET", "/admin/simpleProfiles");
  }

  /** Get Instagram post metrics for a date range */
  async getInstagramPosts(
    initDate: string,
    endDate: string
  ): Promise<MetricoolPostMetrics[]> {
    return this.request<MetricoolPostMetrics[]>(
      "GET",
      `/analytics/instagram/posts?init_date=${initDate}&end_date=${endDate}`
    );
  }

  /** Get TikTok video metrics for a date range */
  async getTikTokVideos(
    initDate: string,
    endDate: string
  ): Promise<MetricoolPostMetrics[]> {
    return this.request<MetricoolPostMetrics[]>(
      "GET",
      `/analytics/tiktok/videos?init_date=${initDate}&end_date=${endDate}`
    );
  }

  /** Get general analytics metrics for a date range */
  async getMetrics(
    network: string,
    initDate: string,
    endDate: string
  ): Promise<MetricoolAnalyticsSnapshot[]> {
    return this.request<MetricoolAnalyticsSnapshot[]>(
      "GET",
      `/analytics/${network}/metrics?init_date=${initDate}&end_date=${endDate}`
    );
  }
}

/** Check if Metricool credentials are configured */
export function isMetricoolConfigured(): boolean {
  return !!(
    process.env.METRICOOL_USER_TOKEN &&
    process.env.METRICOOL_USER_ID &&
    process.env.METRICOOL_BLOG_ID
  );
}

/** Create a MetricoolClient from environment variables */
export function createMetricoolClient(): MetricoolClient | null {
  if (!isMetricoolConfigured()) return null;

  return new MetricoolClient({
    userToken: process.env.METRICOOL_USER_TOKEN!,
    userId: process.env.METRICOOL_USER_ID!,
    blogId: process.env.METRICOOL_BLOG_ID!,
  });
}
```

**Step 3: Verify build**

```bash
pnpm build
```

**Step 4: Commit**

```bash
git add src/lib/metricool/
git commit -m "feat: add Metricool API client and types"
```

---

## Task 3: Sync Logic

**Files:**
- Create: `src/lib/metricool/sync.ts`

**Step 1: Create the sync module**

Create `src/lib/metricool/sync.ts`:

```typescript
import { supabase } from "../supabase";
import { createMetricoolClient } from "./client";
import type { Platform } from "../database.types";

export interface SyncResult {
  postsUpdated: number;
  analyticsUpdated: number;
  errors: string[];
}

/**
 * Sync post statuses from Metricool back to Supabase.
 * Finds posts with a metricool_post_id that are still "scheduled",
 * checks Metricool for their current status, and updates accordingly.
 */
async function syncPostStatuses(): Promise<{
  updated: number;
  errors: string[];
}> {
  const client = createMetricoolClient();
  if (!client) return { updated: 0, errors: ["Metricool not configured"] };

  const errors: string[] = [];
  let updated = 0;

  // Get all posts that are scheduled and have a metricool_post_id
  const { data: pendingPosts, error } = await supabase
    .from("posts")
    .select("id, metricool_post_id, platform")
    .eq("status", "scheduled")
    .not("metricool_post_id", "is", null);

  if (error) {
    return { updated: 0, errors: [error.message] };
  }

  if (!pendingPosts || pendingPosts.length === 0) {
    return { updated: 0, errors: [] };
  }

  // Get scheduled posts from Metricool to check statuses
  let scheduledPosts;
  try {
    scheduledPosts = await client.getScheduledPosts();
  } catch (err) {
    return {
      updated: 0,
      errors: [`Failed to fetch scheduled posts: ${(err as Error).message}`],
    };
  }

  const metricoolStatusMap = new Map<string, string>();
  for (const sp of scheduledPosts) {
    metricoolStatusMap.set(sp.id, sp.status);
  }

  for (const post of pendingPosts) {
    const metricoolId = post.metricool_post_id;
    if (!metricoolId) continue;

    const mcStatus = metricoolStatusMap.get(metricoolId);

    // If post is no longer in scheduled list, it was probably published
    if (!mcStatus || mcStatus === "published") {
      const { error: updateError } = await supabase
        .from("posts")
        .update({
          status: "published",
          metricool_status: "published",
          published_at: new Date().toISOString(),
        })
        .eq("id", post.id);

      if (updateError) {
        errors.push(`Failed to update post ${post.id}: ${updateError.message}`);
      } else {
        updated++;
      }
    } else if (mcStatus === "failed" || mcStatus === "error") {
      const { error: updateError } = await supabase
        .from("posts")
        .update({ metricool_status: "failed" })
        .eq("id", post.id);

      if (updateError) {
        errors.push(`Failed to update post ${post.id}: ${updateError.message}`);
      } else {
        updated++;
      }
    }
  }

  return { updated, errors };
}

/**
 * Sync analytics data from Metricool into analytics_snapshots.
 * Pulls the last 30 days of data for each platform.
 */
async function syncAnalytics(): Promise<{
  updated: number;
  errors: string[];
}> {
  const client = createMetricoolClient();
  if (!client) return { updated: 0, errors: ["Metricool not configured"] };

  const errors: string[] = [];
  let updated = 0;

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const initDateStr = startDate.toISOString().split("T")[0];
  const endDateStr = endDate.toISOString().split("T")[0];

  const platforms: { name: string; platform: Platform }[] = [
    { name: "instagram", platform: "instagram" },
    { name: "tiktok", platform: "tiktok" },
  ];

  for (const { name, platform } of platforms) {
    try {
      const metrics = await client.getMetrics(name, initDateStr, endDateStr);

      for (const metric of metrics) {
        const totalEngagement =
          (metric.likes || 0) +
          (metric.comments || 0) +
          (metric.shares || 0) +
          (metric.saves || 0);
        const engagementRate =
          metric.impressions > 0
            ? parseFloat(
                ((totalEngagement / metric.impressions) * 100).toFixed(2)
              )
            : 0;

        const { error: upsertError } = await supabase
          .from("analytics_snapshots")
          .upsert(
            {
              platform,
              date: metric.date,
              impressions: metric.impressions || 0,
              likes: metric.likes || 0,
              comments: metric.comments || 0,
              shares: metric.shares || 0,
              saves: metric.saves || 0,
              followers: metric.followers || 0,
              engagement_rate: engagementRate,
            },
            { onConflict: "platform,date" }
          );

        if (upsertError) {
          errors.push(
            `Analytics upsert error (${platform}, ${metric.date}): ${upsertError.message}`
          );
        } else {
          updated++;
        }
      }
    } catch (err) {
      errors.push(
        `Failed to fetch ${platform} analytics: ${(err as Error).message}`
      );
    }
  }

  return { updated, errors };
}

/**
 * Sync post-level analytics from Metricool into post_analytics.
 * Matches published posts by metricool_post_id.
 */
async function syncPostAnalytics(): Promise<{
  updated: number;
  errors: string[];
}> {
  const client = createMetricoolClient();
  if (!client) return { updated: 0, errors: ["Metricool not configured"] };

  const errors: string[] = [];
  let updated = 0;

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90);

  const initDateStr = startDate.toISOString().split("T")[0];
  const endDateStr = endDate.toISOString().split("T")[0];

  // Get published posts that have metricool IDs
  const { data: publishedPosts, error: postsError } = await supabase
    .from("posts")
    .select("id, metricool_post_id, platform")
    .eq("status", "published")
    .not("metricool_post_id", "is", null);

  if (postsError || !publishedPosts) {
    return {
      updated: 0,
      errors: [postsError?.message ?? "No published posts found"],
    };
  }

  // Fetch metrics from both platforms
  let igPosts: { id: string; impressions: number; likes: number; comments: number; shares: number; saves: number; reach: number }[] = [];
  let ttPosts: typeof igPosts = [];

  try {
    igPosts = await client.getInstagramPosts(initDateStr, endDateStr);
  } catch (err) {
    errors.push(`Instagram posts fetch: ${(err as Error).message}`);
  }

  try {
    ttPosts = await client.getTikTokVideos(initDateStr, endDateStr);
  } catch (err) {
    errors.push(`TikTok videos fetch: ${(err as Error).message}`);
  }

  const allMetricoolPosts = [...igPosts, ...ttPosts];
  const metricsById = new Map(allMetricoolPosts.map((p) => [p.id, p]));

  for (const post of publishedPosts) {
    const metrics = metricsById.get(post.metricool_post_id!);
    if (!metrics) continue;

    const { error: upsertError } = await supabase
      .from("post_analytics")
      .upsert(
        {
          post_id: post.id,
          impressions: metrics.impressions || 0,
          likes: metrics.likes || 0,
          comments: metrics.comments || 0,
          shares: metrics.shares || 0,
          saves: metrics.saves || 0,
          reach: metrics.reach || 0,
        },
        { onConflict: "post_id" }
      );

    if (upsertError) {
      errors.push(`Post analytics upsert (${post.id}): ${upsertError.message}`);
    } else {
      updated++;
    }
  }

  return { updated, errors };
}

/** Run all sync operations */
export async function syncAll(): Promise<SyncResult> {
  const postSync = await syncPostStatuses();
  const analyticsSync = await syncAnalytics();
  const postAnalyticsSync = await syncPostAnalytics();

  return {
    postsUpdated: postSync.updated,
    analyticsUpdated: analyticsSync.updated + postAnalyticsSync.updated,
    errors: [
      ...postSync.errors,
      ...analyticsSync.errors,
      ...postAnalyticsSync.errors,
    ],
  };
}
```

**Step 2: Verify build**

```bash
pnpm build
```

**Step 3: Commit**

```bash
git add src/lib/metricool/sync.ts
git commit -m "feat: add Metricool sync logic for posts and analytics"
```

---

## Task 4: API Routes for Scheduling + Sync

**Files:**
- Create: `src/app/api/sync/route.ts`
- Create: `src/app/api/schedule/route.ts`

**Step 1: Create sync API route**

Create `src/app/api/sync/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { syncAll } from "@/lib/metricool/sync";
import { isMetricoolConfigured } from "@/lib/metricool/client";

export async function POST() {
  if (!isMetricoolConfigured()) {
    return NextResponse.json(
      {
        error: "Metricool is not configured. Set METRICOOL_USER_TOKEN, METRICOOL_USER_ID, and METRICOOL_BLOG_ID in .env.local",
      },
      { status: 400 }
    );
  }

  try {
    const result = await syncAll();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
```

**Step 2: Create schedule API route**

Create `src/app/api/schedule/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createMetricoolClient } from "@/lib/metricool/client";

export async function POST(request: NextRequest) {
  const { postId } = await request.json();

  if (!postId) {
    return NextResponse.json({ error: "postId is required" }, { status: 400 });
  }

  // Get the post from Supabase
  const { data: post, error: fetchError } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .single();

  if (fetchError || !post) {
    return NextResponse.json(
      { error: fetchError?.message ?? "Post not found" },
      { status: 404 }
    );
  }

  if (post.status !== "scheduled" || !post.scheduled_at) {
    return NextResponse.json(
      { error: "Post must be scheduled with a date" },
      { status: 400 }
    );
  }

  // If already pushed to Metricool, skip
  if (post.metricool_post_id) {
    return NextResponse.json({
      message: "Post already pushed to Metricool",
      metricoolPostId: post.metricool_post_id,
    });
  }

  const client = createMetricoolClient();
  if (!client) {
    // No Metricool configured - just mark as pending locally
    return NextResponse.json({
      message: "Metricool not configured - post saved locally only",
      metricoolPostId: null,
    });
  }

  try {
    const result = await client.schedulePost({
      network: post.platform,
      text: post.caption || "",
      date: post.scheduled_at,
      type: post.post_type,
    });

    // Store the Metricool post ID back in Supabase
    const { error: updateError } = await supabase
      .from("posts")
      .update({
        metricool_post_id: result.id,
        metricool_status: "pending",
      })
      .eq("id", postId);

    if (updateError) {
      return NextResponse.json(
        { error: `Scheduled in Metricool but failed to save ID: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Post scheduled in Metricool",
      metricoolPostId: result.id,
    });
  } catch (err) {
    // Update post with failed status
    await supabase
      .from("posts")
      .update({ metricool_status: "failed" })
      .eq("id", postId);

    return NextResponse.json(
      { error: `Metricool scheduling failed: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
```

**Step 3: Verify build**

```bash
pnpm build
```

**Step 4: Commit**

```bash
git add src/app/api/
git commit -m "feat: add API routes for Metricool scheduling and sync"
```

---

## Task 5: Update Post Scheduling Flow in UI

**Files:**
- Modify: `src/hooks/use-posts.ts`
- Modify: `src/components/posts/platform-manager.tsx`

**Step 1: Add schedule hook**

Add to `src/hooks/use-posts.ts`:

```typescript
export function useScheduleToMetricool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}
```

**Step 2: Update platform-manager.tsx**

In the `handleSubmit` callback, after a successful create or update where status is "scheduled", trigger the Metricool scheduling:

Import the new hook:

```typescript
import { usePosts, useCreatePost, useUpdatePost, useDeletePost, useScheduleToMetricool } from "@/hooks/use-posts";
```

Add to the component:

```typescript
const scheduleToMetricool = useScheduleToMetricool();
```

Update the `handleSubmit` create success handler - after `toast.success("Post created successfully.")`, add:

```typescript
// If the new post is scheduled, push to Metricool
if (data.status === "scheduled") {
  scheduleToMetricool.mutate(/* need the post id from result */);
}
```

Since `createPost.mutate` gives us the result in `onSuccess`, update the create branch:

```typescript
createPost.mutate(data, {
  onSuccess: (createdPost) => {
    toast.success("Post created successfully.");
    setSheetOpen(false);
    setEditingPost(null);
    if (data.status === "scheduled") {
      scheduleToMetricool.mutate(createdPost.id, {
        onSuccess: (result) => {
          if (result.metricoolPostId) {
            toast.success("Post pushed to Metricool for publishing.");
          }
        },
        onError: (err) => {
          toast.error(`Metricool: ${err.message}`);
        },
      });
    }
  },
  onError: () => {
    toast.error("Failed to create post.");
  },
});
```

Similarly for the update branch, when status changes to "scheduled":

```typescript
updatePost.mutate(
  { id, ...updateData },
  {
    onSuccess: (updatedPost) => {
      toast.success("Post updated successfully.");
      setSheetOpen(false);
      setEditingPost(null);
      if (updateData.status === "scheduled" && !updatedPost.metricoolPostId) {
        scheduleToMetricool.mutate(id, {
          onSuccess: (result) => {
            if (result.metricoolPostId) {
              toast.success("Post pushed to Metricool for publishing.");
            }
          },
          onError: (err) => {
            toast.error(`Metricool: ${err.message}`);
          },
        });
      }
    },
    onError: () => {
      toast.error("Failed to update post.");
    },
  }
);
```

**Step 3: Verify build**

```bash
pnpm build
```

**Step 4: Commit**

```bash
git add src/hooks/use-posts.ts src/components/posts/platform-manager.tsx
git commit -m "feat: trigger Metricool scheduling when posts are set to scheduled"
```

---

## Task 6: Update Post Table with Sync Indicators

**Files:**
- Modify: `src/components/posts/columns.tsx`

**Step 1: Add a "Synced" column**

Add a new column after the "Scheduled Date" column and before the "actions" column:

```typescript
{
  id: "metricool",
  header: "Metricool",
  cell: ({ row }) => {
    const post = row.original;
    if (!post.metricoolPostId) return null;

    if (post.metricoolStatus === "failed") {
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
          Failed
        </Badge>
      );
    }

    if (post.metricoolStatus === "published") {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
          Published
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
        Synced
      </Badge>
    );
  },
},
```

**Step 2: Verify build**

```bash
pnpm build
```

**Step 3: Commit**

```bash
git add src/components/posts/columns.tsx
git commit -m "feat: add Metricool status indicator column to posts table"
```

---

## Task 7: Add Sync Button to Sidebar

**Files:**
- Create: `src/components/layout/sync-button.tsx`
- Modify: `src/components/layout/sidebar.tsx`

**Step 1: Create sync button component**

Create `src/components/layout/sync-button.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);

  async function handleSync() {
    setIsSyncing(true);
    try {
      const response = await fetch("/api/sync", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Sync failed");
        return;
      }

      const parts: string[] = [];
      if (data.postsUpdated > 0) parts.push(`${data.postsUpdated} posts updated`);
      if (data.analyticsUpdated > 0) parts.push(`${data.analyticsUpdated} analytics records`);
      if (data.errors?.length > 0) parts.push(`${data.errors.length} errors`);

      if (parts.length === 0) {
        toast.success("Sync complete - everything up to date");
      } else {
        toast.success(`Synced: ${parts.join(", ")}`);
      }

      if (data.errors?.length > 0) {
        console.warn("Sync errors:", data.errors);
      }
    } catch (err) {
      toast.error(`Sync failed: ${(err as Error).message}`);
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="border-t p-4">
      <Button
        variant="outline"
        className="w-full"
        onClick={handleSync}
        disabled={isSyncing}
      >
        {isSyncing ? "Syncing..." : "🔄 Sync Now"}
      </Button>
    </div>
  );
}
```

**Step 2: Add SyncButton to sidebar**

In `src/components/layout/sidebar.tsx`, import and render the SyncButton at the bottom of the sidebar, between the closing `</nav>` and closing `</aside>`:

```tsx
import { SyncButton } from "./sync-button";
```

Add before `</aside>`:

```tsx
<SyncButton />
```

**Step 3: Verify build**

```bash
pnpm build
```

**Step 4: Commit**

```bash
git add src/components/layout/sync-button.tsx src/components/layout/sidebar.tsx
git commit -m "feat: add Sync Now button to sidebar for manual Metricool sync"
```

---

## Task 8: Update Environment and Documentation

**Files:**
- Modify: `.env.local`
- Modify: `CLAUDE.md`

**Step 1: Add Metricool env vars to .env.local**

Append to `.env.local`:

```
METRICOOL_USER_TOKEN=your-metricool-token
METRICOOL_USER_ID=your-metricool-user-id
METRICOOL_BLOG_ID=your-metricool-blog-id
```

**Step 2: Update CLAUDE.md**

Add Metricool info to the Commands section:

```markdown
- `pnpm db:seed` - Seed mock data into Supabase
```

Add after it:

```markdown
## Metricool Integration

- Posts with status "scheduled" are pushed to Metricool via `/api/schedule`
- Manual sync via "Sync Now" button calls `/api/sync`
- Metricool credentials: `METRICOOL_USER_TOKEN`, `METRICOOL_USER_ID`, `METRICOOL_BLOG_ID`
- Graceful degradation: if Metricool is not configured, scheduling saves to Supabase only
- Metricool client: `src/lib/metricool/client.ts`
- Sync logic: `src/lib/metricool/sync.ts`
```

**Step 3: Verify build**

```bash
pnpm build
```

**Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with Metricool integration details"
```

---

## Summary

| Task | Description |
|------|-------------|
| 1 | DB migration + update types (Post gains metricoolPostId, metricoolStatus) |
| 2 | Metricool API client + types |
| 3 | Sync logic (post statuses, analytics snapshots, post analytics) |
| 4 | API routes (`/api/sync`, `/api/schedule`) |
| 5 | Update UI scheduling flow (auto-push to Metricool on schedule) |
| 6 | Post table Metricool status indicator column |
| 7 | Sync Now button in sidebar |
| 8 | Environment vars + documentation |

**Total:** 8 tasks
