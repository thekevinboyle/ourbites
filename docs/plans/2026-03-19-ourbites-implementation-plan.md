# OurBites Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a content management dashboard for Instagram and TikTok with post management, analytics, and a drag-and-drop content calendar.

**Architecture:** Next.js 15 App Router with a DataProvider abstraction layer over Supabase. Mock data seeds the database for development. shadcn/ui for components, Recharts for analytics charts, @dnd-kit for calendar drag-and-drop. Single-user, no auth.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS v4, shadcn/ui, Recharts, TanStack Table, TanStack Query, Zustand, Supabase, @dnd-kit, pnpm

**Design doc:** `docs/plans/2026-03-19-content-dashboard-design.md`

---

## Phase 1: Project Scaffold

### Task 1.1: Initialize Next.js 15 Project

**Files:**
- Create: All scaffold files via `create-next-app`

**Step 1: Create the Next.js project**

Run from parent directory (the current dir already has files, so we scaffold into a temp dir and move):

```bash
cd /Users/kevin/Documents/web
pnpm create next-app ourbites-scaffold --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --yes
```

**Step 2: Move scaffold files into the existing project**

```bash
# Copy scaffold files into ourbites, preserving existing files
cp -rn /Users/kevin/Documents/web/ourbites-scaffold/* /Users/kevin/Documents/web/ourbites/
cp -rn /Users/kevin/Documents/web/ourbites-scaffold/.* /Users/kevin/Documents/web/ourbites/ 2>/dev/null || true
rm -rf /Users/kevin/Documents/web/ourbites-scaffold
```

**Step 3: Verify it runs**

```bash
cd /Users/kevin/Documents/web/ourbites
pnpm dev
```

Expected: Dev server starts on http://localhost:3000

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 15 project with TypeScript and Tailwind"
```

---

### Task 1.2: Install All Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install production dependencies**

```bash
pnpm add @supabase/supabase-js @tanstack/react-query @tanstack/react-table zustand recharts @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities date-fns
```

**Step 2: Install dev dependencies**

```bash
pnpm add -D @types/node
```

**Step 3: Verify install**

```bash
pnpm build
```

Expected: Build succeeds with no errors.

**Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "feat: install core dependencies (supabase, tanstack, recharts, dnd-kit, zustand)"
```

---

### Task 1.3: Initialize shadcn/ui

**Files:**
- Create: `src/components/ui/` (multiple component files)
- Create/Modify: `components.json`

**Step 1: Initialize shadcn**

```bash
pnpm dlx shadcn@latest init --defaults
```

Accept defaults (New York style, neutral color, CSS variables).

**Step 2: Add required components**

```bash
pnpm dlx shadcn@latest add button card table tabs input textarea select badge sheet dialog separator dropdown-menu calendar popover label toast sonner
```

**Step 3: Verify components exist**

```bash
ls src/components/ui/
```

Expected: All component files present.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: initialize shadcn/ui with dashboard components"
```

---

### Task 1.4: Create Project Directory Structure

**Files:**
- Create: All empty directories and placeholder files

**Step 1: Create directory structure**

```bash
mkdir -p src/components/{layout,posts,analytics,calendar}
mkdir -p src/lib/data
mkdir -p src/hooks
mkdir -p src/store
mkdir -p supabase/migrations
mkdir -p scripts
```

**Step 2: Create placeholder files to preserve git structure**

```bash
touch src/components/layout/.gitkeep
touch src/components/posts/.gitkeep
touch src/components/analytics/.gitkeep
touch src/components/calendar/.gitkeep
touch src/hooks/.gitkeep
touch src/store/.gitkeep
touch supabase/migrations/.gitkeep
touch scripts/.gitkeep
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: create project directory structure"
```

---

## Phase 2: Supabase Setup + Database Schema + Seed Script

### Task 2.1: Create Supabase Client

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `.env.local` (DO NOT commit)
- Modify: `.gitignore`

**Step 1: Add env vars to .gitignore**

Verify `.env*.local` is already in `.gitignore` (Next.js adds it by default). If not, add it.

**Step 2: Create .env.local**

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

User must fill in real values from their Supabase dashboard.

**Step 3: Create Supabase client**

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

**Step 4: Commit**

```bash
git add src/lib/supabase.ts .gitignore
git commit -m "feat: add Supabase client configuration"
```

---

### Task 2.2: Create Database Migration

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

**Step 1: Write the migration**

Create `supabase/migrations/001_initial_schema.sql`:

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Posts table: content for Instagram and TikTok
CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform text NOT NULL CHECK (platform IN ('instagram', 'tiktok')),
  caption text,
  post_type text NOT NULL CHECK (post_type IN ('reel', 'carousel', 'story', 'single_image', 'video', 'photo')),
  status text NOT NULL CHECK (status IN ('idea', 'draft', 'scheduled', 'published')) DEFAULT 'idea',
  scheduled_at timestamptz,
  published_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Analytics snapshots: daily platform-level metrics
CREATE TABLE analytics_snapshots (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform text NOT NULL CHECK (platform IN ('instagram', 'tiktok')),
  date date NOT NULL,
  impressions integer DEFAULT 0,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  shares integer DEFAULT 0,
  saves integer DEFAULT 0,
  followers integer DEFAULT 0,
  engagement_rate decimal DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (platform, date)
);

-- Post analytics: per-post performance metrics
CREATE TABLE post_analytics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  impressions integer DEFAULT 0,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  shares integer DEFAULT 0,
  saves integer DEFAULT 0,
  reach integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Index for fast post queries
CREATE INDEX idx_posts_platform ON posts(platform);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_scheduled_at ON posts(scheduled_at);
CREATE INDEX idx_posts_published_at ON posts(published_at);
CREATE INDEX idx_analytics_snapshots_date ON analytics_snapshots(date);
CREATE INDEX idx_analytics_snapshots_platform ON analytics_snapshots(platform);
CREATE INDEX idx_post_analytics_post_id ON post_analytics(post_id);

-- Auto-update updated_at on posts
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

**Step 2: Run migration in Supabase**

Go to Supabase Dashboard → SQL Editor → paste and run the migration. Or if using Supabase CLI:

```bash
pnpm dlx supabase db push
```

**Step 3: Commit**

```bash
git add supabase/migrations/001_initial_schema.sql
git commit -m "feat: add database schema migration for posts, analytics_snapshots, post_analytics"
```

---

### Task 2.3: Generate Database Types

**Files:**
- Create: `src/lib/database.types.ts`

**Step 1: Write TypeScript types matching the schema**

Create `src/lib/database.types.ts`:

```typescript
export type Platform = "instagram" | "tiktok";

export type PostType =
  | "reel"
  | "carousel"
  | "story"
  | "single_image"
  | "video"
  | "photo";

export type PostStatus = "idea" | "draft" | "scheduled" | "published";

export interface Database {
  public: {
    Tables: {
      posts: {
        Row: {
          id: string;
          platform: Platform;
          caption: string | null;
          post_type: PostType;
          status: PostStatus;
          scheduled_at: string | null;
          published_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          platform: Platform;
          caption?: string | null;
          post_type: PostType;
          status?: PostStatus;
          scheduled_at?: string | null;
          published_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          platform?: Platform;
          caption?: string | null;
          post_type?: PostType;
          status?: PostStatus;
          scheduled_at?: string | null;
          published_at?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
      };
      analytics_snapshots: {
        Row: {
          id: string;
          platform: Platform;
          date: string;
          impressions: number;
          likes: number;
          comments: number;
          shares: number;
          saves: number;
          followers: number;
          engagement_rate: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          platform: Platform;
          date: string;
          impressions?: number;
          likes?: number;
          comments?: number;
          shares?: number;
          saves?: number;
          followers?: number;
          engagement_rate?: number;
          created_at?: string;
        };
        Update: {
          platform?: Platform;
          date?: string;
          impressions?: number;
          likes?: number;
          comments?: number;
          shares?: number;
          saves?: number;
          followers?: number;
          engagement_rate?: number;
        };
      };
      post_analytics: {
        Row: {
          id: string;
          post_id: string;
          impressions: number;
          likes: number;
          comments: number;
          shares: number;
          saves: number;
          reach: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          impressions?: number;
          likes?: number;
          comments?: number;
          shares?: number;
          saves?: number;
          reach?: number;
          created_at?: string;
        };
        Update: {
          post_id?: string;
          impressions?: number;
          likes?: number;
          comments?: number;
          shares?: number;
          saves?: number;
          reach?: number;
        };
      };
    };
  };
}
```

**Step 2: Verify Supabase client compiles**

```bash
pnpm build
```

Expected: No type errors.

**Step 3: Commit**

```bash
git add src/lib/database.types.ts
git commit -m "feat: add TypeScript database types for Supabase schema"
```

---

### Task 2.4: Create Seed Script

**Files:**
- Create: `scripts/seed.ts`
- Modify: `package.json` (add `db:seed` script)

**Step 1: Create the seed script**

Create `scripts/seed.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";
import type { Database, Platform, PostType, PostStatus } from "../src/lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Helpers
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

// Instagram captions
const instagramCaptions = [
  "New recipe drop! This one's a game changer 🍳",
  "Sunday meal prep in 30 minutes flat",
  "POV: you finally nail the perfect sourdough",
  "Quick weeknight dinner that slaps",
  "Breakfast ideas that aren't just toast",
  "This smoothie bowl is almost too pretty to eat",
  "5-ingredient pasta you'll make on repeat",
  "The snack that got 10k saves last week",
  "Healthy lunch ideas for busy people",
  "Dessert that takes 15 minutes, seriously",
  "Behind the scenes of our latest shoot",
  "Your most requested recipe is HERE",
  "Meal prep Sunday hits different",
  "This salad will change your mind about salads",
  "Easy dinner idea you haven't tried yet",
];

// TikTok captions
const tiktokCaptions = [
  "Wait for it... the flip at the end 😱",
  "Replying to @user: here's how I make it",
  "The recipe everyone's been asking for",
  "I can't believe this actually worked",
  "Testing viral food hack - does it work?",
  "Easy recipe even my roommate can make",
  "This took me 3 tries but WORTH IT",
  "Stitch with the original - my version",
  "Day in my life as a food creator",
  "The sauce that makes everything better",
  "5 lunches I eat every week",
  "Grocery haul under $50",
  "Rating my followers' recipes",
  "cooking hack I wish I knew sooner",
  "What I eat in a day - realistic edition",
];

const instagramPostTypes: PostType[] = ["reel", "carousel", "story", "single_image"];
const tiktokPostTypes: PostType[] = ["video", "photo", "story"];
const statuses: PostStatus[] = ["idea", "draft", "scheduled", "published"];

async function seedPosts(): Promise<string[]> {
  const posts: Database["public"]["Tables"]["posts"]["Insert"][] = [];

  // Generate ~30 Instagram posts
  for (let i = 0; i < 30; i++) {
    const status = randomItem(statuses);
    const scheduledDays = randomInt(-30, 30);

    posts.push({
      platform: "instagram" as Platform,
      caption: randomItem(instagramCaptions),
      post_type: randomItem(instagramPostTypes),
      status,
      scheduled_at:
        status === "scheduled"
          ? daysFromNow(randomInt(1, 30)).toISOString()
          : null,
      published_at:
        status === "published"
          ? daysAgo(randomInt(1, 60)).toISOString()
          : null,
      notes: Math.random() > 0.7 ? "Remember to add hashtags" : null,
    });
  }

  // Generate ~30 TikTok posts
  for (let i = 0; i < 30; i++) {
    const status = randomItem(statuses);

    posts.push({
      platform: "tiktok" as Platform,
      caption: randomItem(tiktokCaptions),
      post_type: randomItem(tiktokPostTypes),
      status,
      scheduled_at:
        status === "scheduled"
          ? daysFromNow(randomInt(1, 30)).toISOString()
          : null,
      published_at:
        status === "published"
          ? daysAgo(randomInt(1, 60)).toISOString()
          : null,
      notes: Math.random() > 0.7 ? "Use trending audio" : null,
    });
  }

  const { data, error } = await supabase
    .from("posts")
    .insert(posts)
    .select("id");

  if (error) throw new Error(`Failed to seed posts: ${error.message}`);
  console.log(`Seeded ${data.length} posts`);
  return data.map((p) => p.id);
}

async function seedAnalyticsSnapshots(): Promise<void> {
  const snapshots: Database["public"]["Tables"]["analytics_snapshots"]["Insert"][] = [];
  const platforms: Platform[] = ["instagram", "tiktok"];

  // 90 days of daily snapshots per platform
  for (const platform of platforms) {
    let followers = platform === "instagram" ? 12400 : 8200;

    for (let i = 90; i >= 0; i--) {
      const date = daysAgo(i);
      const dayOfWeek = date.getDay();
      const isWeekday = dayOfWeek > 0 && dayOfWeek < 6;

      // More engagement on weekdays
      const baseImpressions = isWeekday ? randomInt(800, 2500) : randomInt(400, 1500);
      const baseLikes = Math.floor(baseImpressions * (randomInt(3, 8) / 100));
      const baseComments = Math.floor(baseLikes * (randomInt(5, 20) / 100));
      const baseShares = Math.floor(baseLikes * (randomInt(2, 10) / 100));
      const baseSaves = Math.floor(baseLikes * (randomInt(5, 15) / 100));

      // Gradual follower growth with some variance
      followers += randomInt(-5, 25);

      const totalEngagement = baseLikes + baseComments + baseShares + baseSaves;
      const engagementRate =
        baseImpressions > 0
          ? parseFloat(((totalEngagement / baseImpressions) * 100).toFixed(2))
          : 0;

      snapshots.push({
        platform,
        date: date.toISOString().split("T")[0],
        impressions: baseImpressions,
        likes: baseLikes,
        comments: baseComments,
        shares: baseShares,
        saves: baseSaves,
        followers,
        engagement_rate: engagementRate,
      });
    }
  }

  const { error } = await supabase.from("analytics_snapshots").insert(snapshots);
  if (error) throw new Error(`Failed to seed analytics: ${error.message}`);
  console.log(`Seeded ${snapshots.length} analytics snapshots`);
}

async function seedPostAnalytics(postIds: string[]): Promise<void> {
  const analytics: Database["public"]["Tables"]["post_analytics"]["Insert"][] = [];

  for (const postId of postIds) {
    const impressions = randomInt(500, 15000);
    const likes = Math.floor(impressions * (randomInt(3, 12) / 100));
    const comments = Math.floor(likes * (randomInt(5, 25) / 100));
    const shares = Math.floor(likes * (randomInt(2, 15) / 100));
    const saves = Math.floor(likes * (randomInt(5, 20) / 100));
    const reach = Math.floor(impressions * (randomInt(60, 95) / 100));

    analytics.push({
      post_id: postId,
      impressions,
      likes,
      comments,
      shares,
      saves,
      reach,
    });
  }

  const { error } = await supabase.from("post_analytics").insert(analytics);
  if (error) throw new Error(`Failed to seed post analytics: ${error.message}`);
  console.log(`Seeded ${analytics.length} post analytics records`);
}

async function main(): Promise<void> {
  console.log("Seeding database...");

  // Clear existing data
  await supabase.from("post_analytics").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("analytics_snapshots").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("posts").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const postIds = await seedPosts();
  await seedAnalyticsSnapshots();
  await seedPostAnalytics(postIds);

  console.log("Seeding complete!");
}

main().catch(console.error);
```

**Step 2: Add db:seed script to package.json**

Add to `package.json` scripts:

```json
"db:seed": "npx tsx scripts/seed.ts"
```

Also install tsx as a dev dependency:

```bash
pnpm add -D tsx
```

**Step 3: Commit**

```bash
git add scripts/seed.ts package.json pnpm-lock.yaml
git commit -m "feat: add database seed script with realistic mock data"
```

---

## Phase 3: Data Layer

### Task 3.1: Define Shared Types

**Files:**
- Create: `src/lib/data/types.ts`

**Step 1: Write the types**

Create `src/lib/data/types.ts`:

```typescript
import type { Platform, PostType, PostStatus } from "../database.types";

// Re-export database enums
export type { Platform, PostType, PostStatus };

// Domain types
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
  // Posts
  getPosts(filters: PostFilters): Promise<Post[]>;
  createPost(post: CreatePostInput): Promise<Post>;
  updatePost(id: string, data: UpdatePostInput): Promise<Post>;
  deletePost(id: string): Promise<void>;

  // Analytics
  getOverviewMetrics(
    dateRange: DateRange,
    platform?: Platform
  ): Promise<OverviewMetrics>;
  getTimeSeriesMetrics(
    dateRange: DateRange,
    platform?: Platform
  ): Promise<TimeSeriesData[]>;
  getTopPosts(
    dateRange: DateRange,
    limit?: number
  ): Promise<PostWithAnalytics[]>;
  getEngagementByType(
    dateRange: DateRange,
    platform?: Platform
  ): Promise<EngagementByType[]>;

  // Calendar
  getCalendarPosts(month: number, year: number): Promise<CalendarPost[]>;
  reschedulePost(id: string, newDate: Date): Promise<Post>;
}
```

**Step 2: Verify it compiles**

```bash
pnpm build
```

**Step 3: Commit**

```bash
git add src/lib/data/types.ts
git commit -m "feat: define shared data types and DataProvider interface"
```

---

### Task 3.2: Implement Supabase Mock Provider

**Files:**
- Create: `src/lib/data/mock-provider.ts`

**Step 1: Write the provider**

Create `src/lib/data/mock-provider.ts`:

```typescript
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

// Map database row (snake_case) to domain type (camelCase)
function mapPost(row: Record<string, unknown>): Post {
  return {
    id: row.id as string,
    platform: row.platform as Post["platform"],
    caption: row.caption as string | null,
    postType: row.post_type as Post["postType"],
    status: row.status as Post["status"],
    scheduledAt: row.scheduled_at ? new Date(row.scheduled_at as string) : null,
    publishedAt: row.published_at ? new Date(row.published_at as string) : null,
    notes: row.notes as string | null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export class SupabaseMockProvider implements DataProvider {
  // ── Posts ──────────────────────────────────────────────

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
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapPost);
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

    if (error) throw new Error(error.message);
    return mapPost(data);
  }

  async updatePost(id: string, input: UpdatePostInput): Promise<Post> {
    const updateData: Record<string, unknown> = {};
    if (input.caption !== undefined) updateData.caption = input.caption;
    if (input.postType !== undefined) updateData.post_type = input.postType;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.scheduledAt !== undefined)
      updateData.scheduled_at = input.scheduledAt?.toISOString() ?? null;
    if (input.publishedAt !== undefined)
      updateData.published_at = input.publishedAt?.toISOString() ?? null;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.platform !== undefined) updateData.platform = input.platform;

    const { data, error } = await supabase
      .from("posts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapPost(data);
  }

  async deletePost(id: string): Promise<void> {
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  // ── Analytics ─────────────────────────────────────────

  async getOverviewMetrics(
    dateRange: DateRange,
    platform?: Platform
  ): Promise<OverviewMetrics> {
    const startStr = dateRange.start.toISOString().split("T")[0];
    const endStr = dateRange.end.toISOString().split("T")[0];

    // Calculate previous period (same length, immediately before)
    const rangeDays = Math.ceil(
      (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)
    );
    const prevStart = new Date(dateRange.start);
    prevStart.setDate(prevStart.getDate() - rangeDays);
    const prevStartStr = prevStart.toISOString().split("T")[0];

    // Current period
    let currentQuery = supabase
      .from("analytics_snapshots")
      .select("*")
      .gte("date", startStr)
      .lte("date", endStr);
    if (platform) currentQuery = currentQuery.eq("platform", platform);

    // Previous period
    let prevQuery = supabase
      .from("analytics_snapshots")
      .select("*")
      .gte("date", prevStartStr)
      .lt("date", startStr);
    if (platform) prevQuery = prevQuery.eq("platform", platform);

    // Post count current
    let postCountQuery = supabase
      .from("posts")
      .select("id", { count: "exact" })
      .eq("status", "published")
      .gte("published_at", dateRange.start.toISOString())
      .lte("published_at", dateRange.end.toISOString());
    if (platform) postCountQuery = postCountQuery.eq("platform", platform);

    // Post count previous
    let prevPostCountQuery = supabase
      .from("posts")
      .select("id", { count: "exact" })
      .eq("status", "published")
      .gte("published_at", prevStart.toISOString())
      .lt("published_at", dateRange.start.toISOString());
    if (platform) prevPostCountQuery = prevPostCountQuery.eq("platform", platform);

    const [currentRes, prevRes, postCountRes, prevPostCountRes] =
      await Promise.all([currentQuery, prevQuery, postCountQuery, prevPostCountQuery]);

    if (currentRes.error) throw new Error(currentRes.error.message);
    if (prevRes.error) throw new Error(prevRes.error.message);

    const current = currentRes.data ?? [];
    const prev = prevRes.data ?? [];

    const sumField = (arr: typeof current, field: string) =>
      arr.reduce((sum, row) => sum + ((row as Record<string, number>)[field] ?? 0), 0);
    const avgField = (arr: typeof current, field: string) =>
      arr.length > 0 ? sumField(arr, field) / arr.length : 0;

    const currentFollowers = current.length > 0 ? current[current.length - 1].followers : 0;
    const startFollowers = current.length > 0 ? current[0].followers : 0;
    const prevEndFollowers = prev.length > 0 ? prev[prev.length - 1].followers : 0;
    const prevStartFollowers = prev.length > 0 ? prev[0].followers : 0;

    return {
      totalImpressions: sumField(current, "impressions"),
      engagementRate: parseFloat(avgField(current, "engagement_rate").toFixed(2)),
      followerGrowth: currentFollowers - startFollowers,
      totalPosts: postCountRes.count ?? 0,
      previousPeriod: {
        totalImpressions: sumField(prev, "impressions"),
        engagementRate: parseFloat(avgField(prev, "engagement_rate").toFixed(2)),
        followerGrowth: prevEndFollowers - prevStartFollowers,
        totalPosts: prevPostCountRes.count ?? 0,
      },
      impressionsTrend: current.map((r) => ({
        date: r.date,
        value: r.impressions,
      })),
      followersTrend: current.map((r) => ({
        date: r.date,
        value: r.followers,
      })),
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
      .lte("date", dateRange.end.toISOString().split("T")[0])
      .order("date", { ascending: true });

    if (platform) query = query.eq("platform", platform);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (data ?? []).map((row) => ({
      date: row.date,
      impressions: row.impressions,
      likes: row.likes,
      comments: row.comments,
      shares: row.shares,
      saves: row.saves,
      followers: row.followers,
      engagementRate: row.engagement_rate,
      platform: row.platform as Platform,
    }));
  }

  async getTopPosts(
    dateRange: DateRange,
    limit = 10
  ): Promise<PostWithAnalytics[]> {
    const { data, error } = await supabase
      .from("posts")
      .select("*, post_analytics(*)")
      .eq("status", "published")
      .gte("published_at", dateRange.start.toISOString())
      .lte("published_at", dateRange.end.toISOString())
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);

    return (data ?? [])
      .map((row) => {
        const analytics = Array.isArray(row.post_analytics)
          ? row.post_analytics[0]
          : row.post_analytics;
        return {
          ...mapPost(row),
          analytics: analytics
            ? {
                impressions: analytics.impressions,
                likes: analytics.likes,
                comments: analytics.comments,
                shares: analytics.shares,
                saves: analytics.saves,
                reach: analytics.reach,
              }
            : null,
        };
      })
      .sort((a, b) => {
        const aEng = a.analytics
          ? a.analytics.likes + a.analytics.comments + a.analytics.shares
          : 0;
        const bEng = b.analytics
          ? b.analytics.likes + b.analytics.comments + b.analytics.shares
          : 0;
        return bEng - aEng;
      });
  }

  async getEngagementByType(
    dateRange: DateRange,
    platform?: Platform
  ): Promise<EngagementByType[]> {
    let query = supabase
      .from("posts")
      .select("post_type, post_analytics(likes, comments, shares, saves)")
      .eq("status", "published")
      .gte("published_at", dateRange.start.toISOString())
      .lte("published_at", dateRange.end.toISOString());

    if (platform) query = query.eq("platform", platform);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const byType: Record<string, EngagementByType> = {};

    for (const row of data ?? []) {
      const pt = row.post_type as string;
      if (!byType[pt]) {
        byType[pt] = { postType: pt as EngagementByType["postType"], likes: 0, comments: 0, shares: 0, saves: 0 };
      }
      const analytics = Array.isArray(row.post_analytics)
        ? row.post_analytics[0]
        : row.post_analytics;
      if (analytics) {
        byType[pt].likes += analytics.likes;
        byType[pt].comments += analytics.comments;
        byType[pt].shares += analytics.shares;
        byType[pt].saves += analytics.saves;
      }
    }

    return Object.values(byType);
  }

  // ── Calendar ──────────────────────────────────────────

  async getCalendarPosts(month: number, year: number): Promise<CalendarPost[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const { data, error } = await supabase
      .from("posts")
      .select("id, platform, caption, post_type, status, scheduled_at, published_at")
      .or(
        `and(status.eq.scheduled,scheduled_at.gte.${startDate.toISOString()},scheduled_at.lte.${endDate.toISOString()}),and(status.eq.published,published_at.gte.${startDate.toISOString()},published_at.lte.${endDate.toISOString()}),and(status.eq.draft,created_at.gte.${startDate.toISOString()},created_at.lte.${endDate.toISOString()})`
      );

    if (error) throw new Error(error.message);

    return (data ?? []).map((row) => ({
      id: row.id,
      platform: row.platform as Platform,
      caption: row.caption,
      postType: row.post_type as CalendarPost["postType"],
      status: row.status as CalendarPost["status"],
      date: new Date(
        row.status === "published"
          ? (row.published_at as string)
          : row.status === "scheduled"
            ? (row.scheduled_at as string)
            : new Date().toISOString()
      ),
    }));
  }

  async reschedulePost(id: string, newDate: Date): Promise<Post> {
    return this.updatePost(id, { scheduledAt: newDate, status: "scheduled" });
  }
}
```

**Step 2: Verify it compiles**

```bash
pnpm build
```

**Step 3: Commit**

```bash
git add src/lib/data/mock-provider.ts
git commit -m "feat: implement SupabaseMockProvider with full DataProvider interface"
```

---

### Task 3.3: Create Provider Export and Query Setup

**Files:**
- Create: `src/lib/data/index.ts`
- Create: `src/lib/query-provider.tsx`

**Step 1: Create provider export**

Create `src/lib/data/index.ts`:

```typescript
import { SupabaseMockProvider } from "./mock-provider";
import type { DataProvider } from "./types";

export const dataProvider: DataProvider = new SupabaseMockProvider();

export * from "./types";
```

**Step 2: Create TanStack Query provider**

Create `src/lib/query-provider.tsx`:

```typescript
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

**Step 3: Verify build**

```bash
pnpm build
```

**Step 4: Commit**

```bash
git add src/lib/data/index.ts src/lib/query-provider.tsx
git commit -m "feat: add data provider export and TanStack Query provider"
```

---

## Phase 4: Layout Shell

### Task 4.1: Create Sidebar Navigation

**Files:**
- Create: `src/components/layout/sidebar.tsx`
- Create: `src/components/layout/header.tsx`

**Step 1: Create the sidebar**

Create `src/components/layout/sidebar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Overview", icon: "📊" },
  { href: "/instagram", label: "Instagram", icon: "📸" },
  { href: "/tiktok", label: "TikTok", icon: "🎵" },
  { href: "/analytics", label: "Analytics", icon: "📈" },
  { href: "/calendar", label: "Calendar", icon: "📅" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-6">
        <h1 className="text-lg font-semibold">OurBites</h1>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

**Step 2: Create the header**

Create `src/components/layout/header.tsx`:

```tsx
export function Header({ title }: { title: string }) {
  return (
    <header className="flex h-14 items-center border-b px-6">
      <h2 className="text-lg font-semibold">{title}</h2>
    </header>
  );
}
```

**Step 3: Commit**

```bash
git add src/components/layout/
git commit -m "feat: add sidebar navigation and header components"
```

---

### Task 4.2: Wire Up Root Layout

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Update root layout**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { QueryProvider } from "@/lib/query-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OurBites - Content Dashboard",
  description: "Content management dashboard for Instagram and TikTok",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <div className="flex h-screen">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
```

**Step 2: Create overview home page**

Replace `src/app/page.tsx`:

```tsx
import { Header } from "@/components/layout/header";

export default function HomePage() {
  return (
    <div>
      <Header title="Overview" />
      <div className="p-6">
        <p className="text-muted-foreground">
          Welcome to OurBites. Select a section from the sidebar.
        </p>
      </div>
    </div>
  );
}
```

**Step 3: Create placeholder pages**

Create `src/app/instagram/page.tsx`:

```tsx
import { Header } from "@/components/layout/header";

export default function InstagramPage() {
  return (
    <div>
      <Header title="Instagram" />
      <div className="p-6">
        <p className="text-muted-foreground">Instagram manager coming soon.</p>
      </div>
    </div>
  );
}
```

Create `src/app/tiktok/page.tsx`:

```tsx
import { Header } from "@/components/layout/header";

export default function TikTokPage() {
  return (
    <div>
      <Header title="TikTok" />
      <div className="p-6">
        <p className="text-muted-foreground">TikTok manager coming soon.</p>
      </div>
    </div>
  );
}
```

Create `src/app/analytics/page.tsx`:

```tsx
import { Header } from "@/components/layout/header";

export default function AnalyticsPage() {
  return (
    <div>
      <Header title="Analytics" />
      <div className="p-6">
        <p className="text-muted-foreground">Analytics dashboard coming soon.</p>
      </div>
    </div>
  );
}
```

Create `src/app/calendar/page.tsx`:

```tsx
import { Header } from "@/components/layout/header";

export default function CalendarPage() {
  return (
    <div>
      <Header title="Content Calendar" />
      <div className="p-6">
        <p className="text-muted-foreground">Content calendar coming soon.</p>
      </div>
    </div>
  );
}
```

**Step 4: Verify dev server**

```bash
pnpm dev
```

Expected: App runs, sidebar visible with all 5 nav items, clicking each shows the placeholder page.

**Step 5: Commit**

```bash
git add src/app/
git commit -m "feat: wire up root layout with sidebar, query provider, and placeholder pages"
```

---

## Phase 5: Instagram Manager

### Task 5.1: Create Post Table Columns

**Files:**
- Create: `src/components/posts/columns.tsx`

**Step 1: Define TanStack Table columns**

Create `src/components/posts/columns.tsx`:

```tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Post } from "@/lib/data/types";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  idea: "bg-gray-100 text-gray-700",
  draft: "bg-yellow-100 text-yellow-700",
  scheduled: "bg-blue-100 text-blue-700",
  published: "bg-green-100 text-green-700",
};

const postTypeLabels: Record<string, string> = {
  reel: "Reel",
  carousel: "Carousel",
  story: "Story",
  single_image: "Single Image",
  video: "Video",
  photo: "Photo",
};

export function createColumns(
  onEdit: (post: Post) => void,
  onDelete: (post: Post) => void,
  onDuplicate: (post: Post) => void
): ColumnDef<Post>[] {
  return [
    {
      accessorKey: "caption",
      header: "Caption",
      cell: ({ row }) => (
        <div className="max-w-[300px] truncate" title={row.original.caption ?? ""}>
          {row.original.caption || "No caption"}
        </div>
      ),
    },
    {
      accessorKey: "postType",
      header: "Type",
      cell: ({ row }) => postTypeLabels[row.original.postType] ?? row.original.postType,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="secondary" className={statusColors[row.original.status]}>
          {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
        </Badge>
      ),
    },
    {
      accessorKey: "scheduledAt",
      header: "Scheduled",
      cell: ({ row }) =>
        row.original.scheduledAt
          ? format(row.original.scheduledAt, "MMM d, yyyy h:mm a")
          : "—",
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              ···
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(row.original)}>
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(row.original)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
```

**Step 2: Commit**

```bash
git add src/components/posts/columns.tsx
git commit -m "feat: create post table column definitions with status badges and actions"
```

---

### Task 5.2: Create Posts Data Table

**Files:**
- Create: `src/components/posts/posts-table.tsx`

**Step 1: Build the data table component**

Create `src/components/posts/posts-table.tsx`:

```tsx
"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import type { Post } from "@/lib/data/types";
import { createColumns } from "./columns";

interface PostsTableProps {
  posts: Post[];
  onEdit: (post: Post) => void;
  onDelete: (post: Post) => void;
  onDuplicate: (post: Post) => void;
}

export function PostsTable({ posts, onEdit, onDelete, onDuplicate }: PostsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = createColumns(onEdit, onDelete, onDuplicate);

  const table = useReactTable({
    data: posts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: { sorting, globalFilter },
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search captions..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="max-w-sm"
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No posts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/posts/posts-table.tsx
git commit -m "feat: create PostsTable component with sorting and search"
```

---

### Task 5.3: Create New Post Form Sheet

**Files:**
- Create: `src/components/posts/post-form-sheet.tsx`

**Step 1: Build the form sheet**

Create `src/components/posts/post-form-sheet.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Platform, PostType, PostStatus, Post, CreatePostInput, UpdatePostInput } from "@/lib/data/types";

const instagramPostTypes: { value: PostType; label: string }[] = [
  { value: "reel", label: "Reel" },
  { value: "carousel", label: "Carousel" },
  { value: "story", label: "Story" },
  { value: "single_image", label: "Single Image" },
];

const tiktokPostTypes: { value: PostType; label: string }[] = [
  { value: "video", label: "Video" },
  { value: "photo", label: "Photo" },
  { value: "story", label: "Story" },
];

const statusOptions: { value: PostStatus; label: string }[] = [
  { value: "idea", label: "Idea" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
];

interface PostFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPlatform: Platform;
  editingPost?: Post | null;
  onSubmit: (data: CreatePostInput | (UpdatePostInput & { id: string })) => void;
}

export function PostFormSheet({
  open,
  onOpenChange,
  defaultPlatform,
  editingPost,
  onSubmit,
}: PostFormSheetProps) {
  const [platform, setPlatform] = useState<Platform>(defaultPlatform);
  const [caption, setCaption] = useState("");
  const [postType, setPostType] = useState<PostType>(
    defaultPlatform === "instagram" ? "reel" : "video"
  );
  const [status, setStatus] = useState<PostStatus>("idea");
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (editingPost) {
      setPlatform(editingPost.platform);
      setCaption(editingPost.caption ?? "");
      setPostType(editingPost.postType);
      setStatus(editingPost.status);
      setScheduledAt(
        editingPost.scheduledAt
          ? editingPost.scheduledAt.toISOString().slice(0, 16)
          : ""
      );
      setNotes(editingPost.notes ?? "");
    } else {
      setPlatform(defaultPlatform);
      setCaption("");
      setPostType(defaultPlatform === "instagram" ? "reel" : "video");
      setStatus("idea");
      setScheduledAt("");
      setNotes("");
    }
  }, [editingPost, defaultPlatform, open]);

  const postTypes = platform === "instagram" ? instagramPostTypes : tiktokPostTypes;

  const charLimit = platform === "instagram" ? 2200 : 4000;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editingPost) {
      onSubmit({
        id: editingPost.id,
        caption,
        postType,
        status,
        platform,
        scheduledAt: status === "scheduled" && scheduledAt ? new Date(scheduledAt) : null,
        notes: notes || undefined,
      });
    } else {
      onSubmit({
        platform,
        caption,
        postType,
        status,
        scheduledAt:
          status === "scheduled" && scheduledAt ? new Date(scheduledAt) : undefined,
        notes: notes || undefined,
      });
    }

    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{editingPost ? "Edit Post" : "New Post Idea"}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="platform">Platform</Label>
            <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write your caption..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              {caption.length} / {charLimit}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="postType">Post Type</Label>
            <Select value={postType} onValueChange={(v) => setPostType(v as PostType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {postTypes.map((pt) => (
                  <SelectItem key={pt.value} value={pt.value}>
                    {pt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as PostStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {status === "scheduled" && (
            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Scheduled Date & Time</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal reminders..."
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full">
            {editingPost ? "Save Changes" : "Create Post"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/posts/post-form-sheet.tsx
git commit -m "feat: create PostFormSheet with platform-aware form fields"
```

---

### Task 5.4: Create Posts Hook

**Files:**
- Create: `src/hooks/use-posts.ts`

**Step 1: Write the hook**

Create `src/hooks/use-posts.ts`:

```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dataProvider } from "@/lib/data";
import type { PostFilters, CreatePostInput, UpdatePostInput } from "@/lib/data/types";

export function usePosts(filters: PostFilters) {
  return useQuery({
    queryKey: ["posts", filters],
    queryFn: () => dataProvider.getPosts(filters),
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePostInput) => dataProvider.createPost(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: UpdatePostInput & { id: string }) =>
      dataProvider.updatePost(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => dataProvider.deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}
```

**Step 2: Commit**

```bash
git add src/hooks/use-posts.ts
git commit -m "feat: add TanStack Query hooks for posts CRUD"
```

---

### Task 5.5: Build Instagram Manager Page

**Files:**
- Create: `src/components/posts/platform-manager.tsx`
- Modify: `src/app/instagram/page.tsx`

**Step 1: Create reusable platform manager component**

Create `src/components/posts/platform-manager.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PostsTable } from "./posts-table";
import { PostFormSheet } from "./post-form-sheet";
import { usePosts, useCreatePost, useUpdatePost, useDeletePost } from "@/hooks/use-posts";
import type { Platform, PostStatus, Post, CreatePostInput, UpdatePostInput } from "@/lib/data/types";
import { toast } from "sonner";

const tabs: { value: PostStatus | "all"; label: string }[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "draft", label: "Drafts" },
  { value: "published", label: "Published" },
  { value: "idea", label: "Backlog" },
];

export function PlatformManager({ platform }: { platform: Platform }) {
  const [activeTab, setActiveTab] = useState<string>("scheduled");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const statusFilter = activeTab === "all" ? undefined : (activeTab as PostStatus);
  const { data: posts = [], isLoading } = usePosts({
    platform,
    status: statusFilter,
  });

  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();

  function handleEdit(post: Post) {
    setEditingPost(post);
    setSheetOpen(true);
  }

  function handleDelete(post: Post) {
    deletePost.mutate(post.id, {
      onSuccess: () => toast.success("Post deleted"),
      onError: (err) => toast.error(`Failed to delete: ${err.message}`),
    });
  }

  function handleDuplicate(post: Post) {
    createPost.mutate(
      {
        platform: post.platform,
        caption: post.caption ?? undefined,
        postType: post.postType,
        status: "draft",
        notes: post.notes ?? undefined,
      },
      {
        onSuccess: () => toast.success("Post duplicated as draft"),
        onError: (err) => toast.error(`Failed to duplicate: ${err.message}`),
      }
    );
  }

  function handleSubmit(data: CreatePostInput | (UpdatePostInput & { id: string })) {
    if ("id" in data) {
      const { id, ...updateData } = data;
      updatePost.mutate(
        { id, ...updateData },
        {
          onSuccess: () => {
            toast.success("Post updated");
            setEditingPost(null);
          },
          onError: (err) => toast.error(`Failed to update: ${err.message}`),
        }
      );
    } else {
      createPost.mutate(data, {
        onSuccess: () => toast.success("Post created"),
        onError: (err) => toast.error(`Failed to create: ${err.message}`),
      });
    }
  }

  function handleNewPost() {
    setEditingPost(null);
    setSheetOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button onClick={handleNewPost}>+ New Post Idea</Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading posts...</p>
      ) : (
        <PostsTable
          posts={posts}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
        />
      )}

      <PostFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        defaultPlatform={platform}
        editingPost={editingPost}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
```

**Step 2: Update Instagram page**

Replace `src/app/instagram/page.tsx`:

```tsx
import { Header } from "@/components/layout/header";
import { PlatformManager } from "@/components/posts/platform-manager";

export default function InstagramPage() {
  return (
    <div>
      <Header title="Instagram" />
      <div className="p-6">
        <PlatformManager platform="instagram" />
      </div>
    </div>
  );
}
```

**Step 3: Verify dev server**

```bash
pnpm dev
```

Expected: Instagram page shows tabbed view with table and "New Post Idea" button. Form sheet opens when clicking the button.

**Step 4: Commit**

```bash
git add src/components/posts/platform-manager.tsx src/app/instagram/page.tsx
git commit -m "feat: build Instagram manager page with tabbed post table and form sheet"
```

---

## Phase 6: TikTok Manager

### Task 6.1: Wire Up TikTok Page

**Files:**
- Modify: `src/app/tiktok/page.tsx`

**Step 1: Update TikTok page (reuses PlatformManager)**

Replace `src/app/tiktok/page.tsx`:

```tsx
import { Header } from "@/components/layout/header";
import { PlatformManager } from "@/components/posts/platform-manager";

export default function TikTokPage() {
  return (
    <div>
      <Header title="TikTok" />
      <div className="p-6">
        <PlatformManager platform="tiktok" />
      </div>
    </div>
  );
}
```

**Step 2: Verify both managers work**

```bash
pnpm dev
```

Navigate between `/instagram` and `/tiktok`. Both should show platform-specific post types in the form.

**Step 3: Commit**

```bash
git add src/app/tiktok/page.tsx
git commit -m "feat: wire up TikTok manager page reusing PlatformManager component"
```

---

## Phase 7: Analytics Dashboard

### Task 7.1: Create Analytics Hooks

**Files:**
- Create: `src/hooks/use-analytics.ts`
- Create: `src/store/analytics-store.ts`

**Step 1: Create Zustand store for analytics filters**

Create `src/store/analytics-store.ts`:

```typescript
import { create } from "zustand";
import type { Platform } from "@/lib/data/types";

interface AnalyticsStore {
  dateRange: { start: Date; end: Date };
  platform: Platform | undefined;
  setDateRange: (start: Date, end: Date) => void;
  setPlatform: (platform: Platform | undefined) => void;
}

export const useAnalyticsStore = create<AnalyticsStore>((set) => ({
  dateRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date(),
  },
  platform: undefined,
  setDateRange: (start, end) => set({ dateRange: { start, end } }),
  setPlatform: (platform) => set({ platform }),
}));
```

**Step 2: Create analytics hooks**

Create `src/hooks/use-analytics.ts`:

```typescript
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
```

**Step 3: Commit**

```bash
git add src/store/analytics-store.ts src/hooks/use-analytics.ts
git commit -m "feat: add analytics Zustand store and TanStack Query hooks"
```

---

### Task 7.2: Create KPI Cards

**Files:**
- Create: `src/components/analytics/kpi-card.tsx`
- Create: `src/components/analytics/kpi-cards-row.tsx`

**Step 1: Create KPI card component**

Create `src/components/analytics/kpi-card.tsx`:

```tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";

interface KpiCardProps {
  title: string;
  value: string | number;
  delta?: number;
  trend?: { date: string; value: number }[];
  chartType?: "line" | "area";
}

export function KpiCard({ title, value, delta, trend, chartType = "line" }: KpiCardProps) {
  const isPositive = delta !== undefined && delta >= 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{value}</span>
          {delta !== undefined && (
            <span
              className={`text-xs font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}
            >
              {isPositive ? "+" : ""}
              {delta}%
            </span>
          )}
        </div>
        {trend && trend.length > 0 && (
          <div className="mt-3 h-[40px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "area" ? (
                <AreaChart data={trend}>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.1)"
                    strokeWidth={1.5}
                  />
                </AreaChart>
              ) : (
                <LineChart data={trend}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 2: Create KPI cards row**

Create `src/components/analytics/kpi-cards-row.tsx`:

```tsx
"use client";

import { KpiCard } from "./kpi-card";
import { useOverviewMetrics } from "@/hooks/use-analytics";

export function KpiCardsRow() {
  const { data: metrics, isLoading } = useOverviewMetrics();

  if (isLoading || !metrics) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-[140px] animate-pulse rounded-lg border bg-muted" />
        ))}
      </div>
    );
  }

  const impressionsDelta =
    metrics.previousPeriod.totalImpressions > 0
      ? Math.round(
          ((metrics.totalImpressions - metrics.previousPeriod.totalImpressions) /
            metrics.previousPeriod.totalImpressions) *
            100
        )
      : 0;

  const engagementDelta =
    metrics.previousPeriod.engagementRate > 0
      ? parseFloat(
          (metrics.engagementRate - metrics.previousPeriod.engagementRate).toFixed(2)
        )
      : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title="Total Impressions"
        value={metrics.totalImpressions.toLocaleString()}
        delta={impressionsDelta}
        trend={metrics.impressionsTrend}
        chartType="line"
      />
      <KpiCard
        title="Engagement Rate"
        value={`${metrics.engagementRate}%`}
        delta={engagementDelta}
      />
      <KpiCard
        title="Follower Growth"
        value={`+${metrics.followerGrowth.toLocaleString()}`}
        trend={metrics.followersTrend}
        chartType="area"
      />
      <KpiCard
        title="Total Posts"
        value={metrics.totalPosts}
      />
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/components/analytics/
git commit -m "feat: create KPI card components with sparkline charts"
```

---

### Task 7.3: Create Analytics Charts

**Files:**
- Create: `src/components/analytics/impressions-chart.tsx`
- Create: `src/components/analytics/engagement-chart.tsx`
- Create: `src/components/analytics/followers-chart.tsx`

**Step 1: Impressions over time (line chart)**

Create `src/components/analytics/impressions-chart.tsx`:

```tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useTimeSeriesMetrics } from "@/hooks/use-analytics";
import { format, parseISO } from "date-fns";

export function ImpressionsChart() {
  const { data: timeSeries = [], isLoading } = useTimeSeriesMetrics();

  if (isLoading) {
    return <div className="h-[350px] animate-pulse rounded-lg border bg-muted" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Impressions Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeSeries}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => format(parseISO(d), "MMM d")}
                className="text-xs"
              />
              <YAxis className="text-xs" />
              <Tooltip
                labelFormatter={(d) => format(parseISO(d as string), "MMM d, yyyy")}
                formatter={(value: number) => [value.toLocaleString(), "Impressions"]}
              />
              <Line
                type="monotone"
                dataKey="impressions"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Engagement by post type (bar chart)**

Create `src/components/analytics/engagement-chart.tsx`:

```tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useEngagementByType } from "@/hooks/use-analytics";

const postTypeLabels: Record<string, string> = {
  reel: "Reel",
  carousel: "Carousel",
  story: "Story",
  single_image: "Single Image",
  video: "Video",
  photo: "Photo",
};

export function EngagementChart() {
  const { data: engagement = [], isLoading } = useEngagementByType();

  if (isLoading) {
    return <div className="h-[350px] animate-pulse rounded-lg border bg-muted" />;
  }

  const chartData = engagement.map((e) => ({
    ...e,
    postType: postTypeLabels[e.postType] ?? e.postType,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Engagement by Post Type</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="postType" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Legend />
              <Bar dataKey="likes" fill="#f472b6" name="Likes" />
              <Bar dataKey="comments" fill="#60a5fa" name="Comments" />
              <Bar dataKey="shares" fill="#34d399" name="Shares" />
              <Bar dataKey="saves" fill="#a78bfa" name="Saves" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 3: Follower growth (area chart)**

Create `src/components/analytics/followers-chart.tsx`:

```tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useTimeSeriesMetrics } from "@/hooks/use-analytics";
import { format, parseISO } from "date-fns";

export function FollowersChart() {
  const { data: timeSeries = [], isLoading } = useTimeSeriesMetrics();

  if (isLoading) {
    return <div className="h-[350px] animate-pulse rounded-lg border bg-muted" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Follower Growth</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeries}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => format(parseISO(d), "MMM d")}
                className="text-xs"
              />
              <YAxis className="text-xs" />
              <Tooltip
                labelFormatter={(d) => format(parseISO(d as string), "MMM d, yyyy")}
                formatter={(value: number) => [value.toLocaleString(), "Followers"]}
              />
              <Area
                type="monotone"
                dataKey="followers"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary) / 0.1)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 4: Commit**

```bash
git add src/components/analytics/
git commit -m "feat: create analytics charts (impressions, engagement, followers)"
```

---

### Task 7.4: Create Analytics Controls and Top Posts

**Files:**
- Create: `src/components/analytics/analytics-controls.tsx`
- Create: `src/components/analytics/top-posts.tsx`

**Step 1: Create date range and platform controls**

Create `src/components/analytics/analytics-controls.tsx`:

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAnalyticsStore } from "@/store/analytics-store";
import type { Platform } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const presets = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

const platforms: { value: Platform | undefined; label: string }[] = [
  { value: undefined, label: "All" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
];

export function AnalyticsControls() {
  const { dateRange, platform, setDateRange, setPlatform } = useAnalyticsStore();

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        {platforms.map((p) => (
          <Button
            key={p.label}
            variant={platform === p.value ? "default" : "outline"}
            size="sm"
            onClick={() => setPlatform(p.value)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {presets.map((p) => (
          <Button
            key={p.label}
            variant="outline"
            size="sm"
            onClick={() =>
              setDateRange(
                new Date(Date.now() - p.days * 24 * 60 * 60 * 1000),
                new Date()
              )
            }
          >
            {p.label}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={dateRange.start.toISOString().split("T")[0]}
          onChange={(e) => setDateRange(new Date(e.target.value), dateRange.end)}
          className="w-auto"
        />
        <span className="text-muted-foreground">to</span>
        <Input
          type="date"
          value={dateRange.end.toISOString().split("T")[0]}
          onChange={(e) => setDateRange(dateRange.start, new Date(e.target.value))}
          className="w-auto"
        />
      </div>
    </div>
  );
}
```

**Step 2: Create top performing posts**

Create `src/components/analytics/top-posts.tsx`:

```tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTopPosts } from "@/hooks/use-analytics";
import { format } from "date-fns";

export function TopPosts() {
  const { data: posts = [], isLoading } = useTopPosts();

  if (isLoading) {
    return <div className="h-[200px] animate-pulse rounded-lg border bg-muted" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Performing Posts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {posts.length === 0 && (
            <p className="text-sm text-muted-foreground">No published posts in this period.</p>
          )}
          {posts.map((post) => (
            <div key={post.id} className="flex items-start justify-between gap-4 rounded-lg border p-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {post.platform === "instagram" ? "📸" : "🎵"} {post.platform}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {post.publishedAt && format(post.publishedAt, "MMM d, yyyy")}
                  </span>
                </div>
                <p className="text-sm line-clamp-2">{post.caption}</p>
              </div>
              {post.analytics && (
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <div className="text-center">
                    <p className="font-medium text-foreground">
                      {post.analytics.impressions.toLocaleString()}
                    </p>
                    <p className="text-xs">Impressions</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-foreground">
                      {post.analytics.likes.toLocaleString()}
                    </p>
                    <p className="text-xs">Likes</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-foreground">
                      {post.analytics.comments.toLocaleString()}
                    </p>
                    <p className="text-xs">Comments</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 3: Commit**

```bash
git add src/components/analytics/
git commit -m "feat: add analytics controls (date picker, platform toggle) and top posts"
```

---

### Task 7.5: Assemble Analytics Page

**Files:**
- Modify: `src/app/analytics/page.tsx`

**Step 1: Wire up the full analytics page**

Replace `src/app/analytics/page.tsx`:

```tsx
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
```

**Step 2: Verify**

```bash
pnpm dev
```

Expected: Analytics page shows controls, KPI cards, 3 chart panels, and top posts section.

**Step 3: Commit**

```bash
git add src/app/analytics/page.tsx
git commit -m "feat: assemble analytics dashboard page with all components"
```

---

## Phase 8: Content Calendar

### Task 8.1: Create Calendar Hook and Store

**Files:**
- Create: `src/store/calendar-store.ts`
- Create: `src/hooks/use-calendar.ts`

**Step 1: Create calendar store**

Create `src/store/calendar-store.ts`:

```typescript
import { create } from "zustand";
import type { Platform, PostStatus } from "@/lib/data/types";

interface CalendarStore {
  currentMonth: number;
  currentYear: number;
  platformFilter: Platform | undefined;
  statusFilter: PostStatus | undefined;
  selectedDay: number | null;
  goToNextMonth: () => void;
  goToPrevMonth: () => void;
  goToToday: () => void;
  setPlatformFilter: (p: Platform | undefined) => void;
  setStatusFilter: (s: PostStatus | undefined) => void;
  setSelectedDay: (day: number | null) => void;
}

const now = new Date();

export const useCalendarStore = create<CalendarStore>((set) => ({
  currentMonth: now.getMonth() + 1,
  currentYear: now.getFullYear(),
  platformFilter: undefined,
  statusFilter: undefined,
  selectedDay: null,
  goToNextMonth: () =>
    set((state) => {
      if (state.currentMonth === 12) {
        return { currentMonth: 1, currentYear: state.currentYear + 1, selectedDay: null };
      }
      return { currentMonth: state.currentMonth + 1, selectedDay: null };
    }),
  goToPrevMonth: () =>
    set((state) => {
      if (state.currentMonth === 1) {
        return { currentMonth: 12, currentYear: state.currentYear - 1, selectedDay: null };
      }
      return { currentMonth: state.currentMonth - 1, selectedDay: null };
    }),
  goToToday: () =>
    set({
      currentMonth: new Date().getMonth() + 1,
      currentYear: new Date().getFullYear(),
      selectedDay: null,
    }),
  setPlatformFilter: (p) => set({ platformFilter: p }),
  setStatusFilter: (s) => set({ statusFilter: s }),
  setSelectedDay: (day) => set({ selectedDay: day }),
}));
```

**Step 2: Create calendar hook**

Create `src/hooks/use-calendar.ts`:

```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dataProvider } from "@/lib/data";
import { useCalendarStore } from "@/store/calendar-store";

export function useCalendarPosts() {
  const { currentMonth, currentYear } = useCalendarStore();

  return useQuery({
    queryKey: ["calendar", currentMonth, currentYear],
    queryFn: () => dataProvider.getCalendarPosts(currentMonth, currentYear),
  });
}

export function useReschedulePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, newDate }: { id: string; newDate: Date }) =>
      dataProvider.reschedulePost(id, newDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}
```

**Step 3: Commit**

```bash
git add src/store/calendar-store.ts src/hooks/use-calendar.ts
git commit -m "feat: add calendar Zustand store and TanStack Query hooks"
```

---

### Task 8.2: Create Calendar Grid Components

**Files:**
- Create: `src/components/calendar/calendar-chip.tsx`
- Create: `src/components/calendar/day-cell.tsx`
- Create: `src/components/calendar/calendar-grid.tsx`

**Step 1: Create the calendar chip**

Create `src/components/calendar/calendar-chip.tsx`:

```tsx
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import type { CalendarPost } from "@/lib/data/types";

const platformColors: Record<string, string> = {
  instagram: "bg-gradient-to-r from-pink-400 to-purple-500 text-white",
  tiktok: "bg-gradient-to-r from-gray-800 to-teal-500 text-white",
};

const statusDots: Record<string, string> = {
  published: "bg-green-400",
  scheduled: "bg-blue-400",
  draft: "bg-gray-400",
  idea: "bg-gray-300",
};

interface CalendarChipProps {
  post: CalendarPost;
  onClick: () => void;
}

export function CalendarChip({ post, onClick }: CalendarChipProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: post.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "flex cursor-grab items-center gap-1 rounded px-2 py-0.5 text-xs font-medium",
        platformColors[post.platform],
        isDragging && "opacity-50"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", statusDots[post.status])} />
      <span className="truncate">
        {post.caption ? post.caption.slice(0, 20) : "Untitled"}
      </span>
    </div>
  );
}
```

**Step 2: Create day cell**

Create `src/components/calendar/day-cell.tsx`:

```tsx
"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { CalendarChip } from "./calendar-chip";
import type { CalendarPost } from "@/lib/data/types";

interface DayCellProps {
  day: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  posts: CalendarPost[];
  onDayClick: (day: number) => void;
  onChipClick: (post: CalendarPost) => void;
}

export function DayCell({
  day,
  isToday,
  isCurrentMonth,
  posts,
  onDayClick,
  onChipClick,
}: DayCellProps) {
  const droppableId = `day-${day}`;
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

  return (
    <div
      ref={setNodeRef}
      onClick={() => onDayClick(day)}
      className={cn(
        "min-h-[100px] cursor-pointer border-b border-r p-1 transition-colors",
        !isCurrentMonth && "bg-muted/30 text-muted-foreground",
        isOver && "bg-accent/50",
        isToday && "bg-primary/5"
      )}
    >
      <span
        className={cn(
          "mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
          isToday && "bg-primary text-primary-foreground font-bold"
        )}
      >
        {day}
      </span>
      <SortableContext
        items={posts.map((p) => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-0.5">
          {posts.map((post) => (
            <CalendarChip
              key={post.id}
              post={post}
              onClick={() => onChipClick(post)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
```

**Step 3: Create calendar grid**

Create `src/components/calendar/calendar-grid.tsx`:

```tsx
"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { DayCell } from "./day-cell";
import { useCalendarStore } from "@/store/calendar-store";
import { useCalendarPosts, useReschedulePost } from "@/hooks/use-calendar";
import { PostFormSheet } from "@/components/posts/post-form-sheet";
import { useCreatePost, useUpdatePost } from "@/hooks/use-posts";
import type { CalendarPost, CreatePostInput, UpdatePostInput, Post } from "@/lib/data/types";
import { toast } from "sonner";
import {
  getDaysInMonth,
  startOfMonth,
  getDay,
  format,
} from "date-fns";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarGrid() {
  const {
    currentMonth,
    currentYear,
    platformFilter,
    statusFilter,
    goToNextMonth,
    goToPrevMonth,
    goToToday,
    setSelectedDay,
  } = useCalendarStore();

  const { data: allPosts = [] } = useCalendarPosts();
  const reschedule = useReschedulePost();
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [prefillDate, setPrefillDate] = useState<Date | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Filter posts
  const filteredPosts = useMemo(() => {
    return allPosts.filter((p) => {
      if (platformFilter && p.platform !== platformFilter) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      return true;
    });
  }, [allPosts, platformFilter, statusFilter]);

  // Group posts by day
  const postsByDay = useMemo(() => {
    const map: Record<number, CalendarPost[]> = {};
    for (const post of filteredPosts) {
      const day = post.date.getDate();
      if (!map[day]) map[day] = [];
      map[day].push(post);
    }
    return map;
  }, [filteredPosts]);

  // Calendar math
  const daysInMonth = getDaysInMonth(new Date(currentYear, currentMonth - 1));
  const firstDayOfWeek = getDay(startOfMonth(new Date(currentYear, currentMonth - 1)));
  const today = new Date();
  const isCurrentMonthView =
    today.getMonth() + 1 === currentMonth && today.getFullYear() === currentYear;

  const monthLabel = format(new Date(currentYear, currentMonth - 1), "MMMM yyyy");

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const postId = active.id as string;
    const targetDay = parseInt((over.id as string).replace("day-", ""), 10);
    if (isNaN(targetDay)) return;

    const newDate = new Date(currentYear, currentMonth - 1, targetDay, 12, 0, 0);

    reschedule.mutate(
      { id: postId, newDate },
      {
        onSuccess: () => toast.success(`Post moved to ${format(newDate, "MMM d")}`),
        onError: (err) => toast.error(`Failed to move: ${err.message}`),
      }
    );
  }

  function handleDayClick(day: number) {
    setSelectedDay(day);
  }

  function handleChipClick(post: CalendarPost) {
    setEditingPost({
      id: post.id,
      platform: post.platform,
      caption: post.caption,
      postType: post.postType,
      status: post.status,
      scheduledAt: post.status === "scheduled" ? post.date : null,
      publishedAt: post.status === "published" ? post.date : null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    setSheetOpen(true);
  }

  function handleSubmit(data: CreatePostInput | (UpdatePostInput & { id: string })) {
    if ("id" in data) {
      const { id, ...d } = data;
      updatePost.mutate(
        { id, ...d },
        {
          onSuccess: () => toast.success("Post updated"),
          onError: (err) => toast.error(err.message),
        }
      );
    } else {
      createPost.mutate(data, {
        onSuccess: () => toast.success("Post created"),
        onError: (err) => toast.error(err.message),
      });
    }
  }

  // Build grid cells
  const cells = [];
  // Empty cells before first day
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(<div key={`empty-${i}`} className="border-b border-r" />);
  }
  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(
      <DayCell
        key={day}
        day={day}
        isToday={isCurrentMonthView && today.getDate() === day}
        isCurrentMonth={true}
        posts={postsByDay[day] ?? []}
        onDayClick={handleDayClick}
        onChipClick={handleChipClick}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPrevMonth}>
            ←
          </Button>
          <h3 className="min-w-[160px] text-center text-lg font-semibold">{monthLabel}</h3>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            →
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="rounded-lg border">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="border-r p-2 text-center text-xs font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>
          {/* Calendar grid */}
          <div className="grid grid-cols-7">{cells}</div>
        </div>
      </DndContext>

      <PostFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        defaultPlatform="instagram"
        editingPost={editingPost}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add src/components/calendar/
git commit -m "feat: create calendar grid with day cells, chips, and drag-and-drop"
```

---

### Task 8.3: Create Calendar Filters and Assemble Page

**Files:**
- Create: `src/components/calendar/calendar-filters.tsx`
- Modify: `src/app/calendar/page.tsx`

**Step 1: Create filters bar**

Create `src/components/calendar/calendar-filters.tsx`:

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { useCalendarStore } from "@/store/calendar-store";
import type { Platform, PostStatus } from "@/lib/data/types";

const platformOptions: { value: Platform | undefined; label: string }[] = [
  { value: undefined, label: "All Platforms" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
];

const statusOptions: { value: PostStatus | undefined; label: string }[] = [
  { value: undefined, label: "All Status" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
];

export function CalendarFilters() {
  const { platformFilter, statusFilter, setPlatformFilter, setStatusFilter } =
    useCalendarStore();

  return (
    <div className="flex flex-wrap gap-2">
      {platformOptions.map((p) => (
        <Button
          key={p.label}
          variant={platformFilter === p.value ? "default" : "outline"}
          size="sm"
          onClick={() => setPlatformFilter(p.value)}
        >
          {p.label}
        </Button>
      ))}
      <div className="mx-2 border-l" />
      {statusOptions.map((s) => (
        <Button
          key={s.label}
          variant={statusFilter === s.value ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter(s.value)}
        >
          {s.label}
        </Button>
      ))}
    </div>
  );
}
```

**Step 2: Assemble calendar page**

Replace `src/app/calendar/page.tsx`:

```tsx
import { Header } from "@/components/layout/header";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { CalendarFilters } from "@/components/calendar/calendar-filters";

export default function CalendarPage() {
  return (
    <div>
      <Header title="Content Calendar" />
      <div className="space-y-4 p-6">
        <CalendarFilters />
        <CalendarGrid />
      </div>
    </div>
  );
}
```

**Step 3: Verify**

```bash
pnpm dev
```

Expected: Calendar page shows monthly grid with platform/status filters, navigation, and drag-and-drop chips.

**Step 4: Final build check**

```bash
pnpm build
```

Expected: Production build succeeds.

**Step 5: Commit**

```bash
git add src/components/calendar/ src/app/calendar/page.tsx
git commit -m "feat: assemble content calendar page with filters and drag-and-drop"
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1.1–1.4 | Project scaffold, deps, shadcn/ui, directories |
| 2 | 2.1–2.4 | Supabase client, schema migration, types, seed script |
| 3 | 3.1–3.3 | Data types, SupabaseMockProvider, provider export |
| 4 | 4.1–4.2 | Sidebar, header, root layout, placeholder pages |
| 5 | 5.1–5.5 | Post columns, table, form sheet, hooks, Instagram page |
| 6 | 6.1 | TikTok page (reuses PlatformManager) |
| 7 | 7.1–7.5 | Analytics store, hooks, KPI cards, charts, controls, page |
| 8 | 8.1–8.3 | Calendar store, hooks, grid, chips, DnD, filters, page |

**Total:** 22 tasks across 8 phases.
