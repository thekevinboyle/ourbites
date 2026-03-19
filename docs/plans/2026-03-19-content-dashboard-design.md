# OurBites Content Management Dashboard - Design Document

**Date:** 2026-03-19
**Status:** Approved

---

## Overview

OurBites is a content management dashboard for Instagram and TikTok. It provides post management, analytics visualization, and a content calendar with drag-and-drop scheduling. Built for a single user with no authentication. Uses mock data with a provider abstraction that allows swapping in Metricool for real analytics when ready.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui (Radix UI primitives) |
| Charts | Recharts |
| Tables | TanStack Table |
| Server State | TanStack Query |
| Client State | Zustand |
| Database | Supabase (Postgres) |
| Drag & Drop | @dnd-kit |
| Package Manager | pnpm |
| Deployment | Vercel |

---

## Pages

### 1. Instagram Manager (`/instagram`)

Tabbed view: **Scheduled | Drafts | Published | Backlog**

Data table (TanStack Table) with columns:
- Thumbnail (image/video preview)
- Caption (truncated, expand on hover)
- Post Type (Reel, Carousel, Story, Single Image)
- Status (Draft, Scheduled, Published, Idea - color-coded badges)
- Scheduled Date (date/time, blank for drafts/backlog)
- Actions (Edit, Delete, Duplicate)

**"New Post Idea" button** opens a slide-out sheet with form fields:
- Caption (textarea with character count)
- Post Type (select)
- Status (select: Idea, Draft, Scheduled)
- Scheduled Date/Time (conditional on status = Scheduled)
- Platform (pre-filled as Instagram, changeable)
- Notes (optional textarea)

**Backlog tab** is a lightweight brainstorm space for ideas not yet scheduled. Promote to Draft or Scheduled when ready.

Sorting and filtering in table headers. Full-text search across captions.

### 2. TikTok Manager (`/tiktok`)

Same layout and functionality as Instagram Manager with TikTok-specific post types:
- Video, Photo, Story

### 3. Analytics Dashboard (`/analytics`)

**Controls:**
- Date range picker (top-right) - filters all data
- Platform toggle - Instagram, TikTok, or Combined

**KPI Cards (4 across top):**

| Card | Metric | Visual |
|------|--------|--------|
| Total Impressions | Sum for date range | Spark line trend |
| Engagement Rate | Percentage + delta | Green/red vs previous period |
| Follower Growth | Net new followers | Mini area chart |
| Total Posts | Published count in range | Simple number |

**Charts (two-column grid):**
- Impressions Over Time (Line chart) - daily impressions, one line per platform when combined
- Engagement by Post Type (Bar chart) - grouped bars: likes, comments, shares, saves per type
- Follower Growth (Area chart) - cumulative followers over time
- Best Posting Times (Bar chart) - engagement by day/hour

**Top Performing Posts:**
- Table/card grid of top 5-10 posts by engagement
- Thumbnail, caption preview, metrics, date
- Sortable by impressions, likes, comments, engagement rate

All charts: Recharts with ResponsiveContainer, custom tooltips, smooth animations.

### 4. Content Calendar (`/calendar`)

**Monthly Grid:**
- Month navigation (prev/next) and "Today" button
- Day cells hold multiple content chips
- Click day number to open day detail panel

**Chip Design:**
- Color-coded: Instagram (pink/purple gradient), TikTok (black/teal)
- Truncated caption (~20 chars)
- Status dot: green (published), blue (scheduled), gray (draft)
- Click chip to open post editor sheet

**Drag-and-Drop (@dnd-kit):**
- Drag chips between days to reschedule
- Drop indicator highlights target day
- Confirmation toast with new date
- Sortable containers per day cell

**Filters Bar:**
- Platform: Instagram, TikTok, All (checkboxes)
- Status: Scheduled, Published, Draft (checkboxes)
- Post Type: dropdown with platform-specific options
- Filters persist in URL params

**Day Detail Panel:**
- Side panel listing all posts for selected day
- "+ Add Post" button pre-filled with that date

Published posts show with subtle opacity difference from upcoming scheduled posts.

---

## Database Schema (Supabase)

### `posts`

```sql
id              uuid        PRIMARY KEY (auto-generated)
platform        text        NOT NULL ('instagram' | 'tiktok')
caption         text
post_type       text        NOT NULL ('reel' | 'carousel' | 'story' | 'single_image' | 'video' | 'photo')
status          text        NOT NULL ('idea' | 'draft' | 'scheduled' | 'published')
scheduled_at    timestamptz NULL
published_at    timestamptz NULL
notes           text        NULL
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

### `analytics_snapshots`

```sql
id              uuid        PRIMARY KEY
platform        text        NOT NULL
date            date        NOT NULL
impressions     integer     DEFAULT 0
likes           integer     DEFAULT 0
comments        integer     DEFAULT 0
shares          integer     DEFAULT 0
saves           integer     DEFAULT 0
followers       integer     DEFAULT 0
engagement_rate decimal     DEFAULT 0
created_at      timestamptz DEFAULT now()
```

### `post_analytics`

```sql
id              uuid        PRIMARY KEY
post_id         uuid        REFERENCES posts(id) ON DELETE CASCADE
impressions     integer     DEFAULT 0
likes           integer     DEFAULT 0
comments        integer     DEFAULT 0
shares          integer     DEFAULT 0
saves           integer     DEFAULT 0
reach           integer     DEFAULT 0
created_at      timestamptz DEFAULT now()
```

Tables mirror Metricool API response shapes so the mock-to-real swap is a provider change, not a schema change.

---

## Data Layer

### Provider Interface

```typescript
interface DataProvider {
  // Posts
  getPosts(filters: PostFilters): Promise<Post[]>
  createPost(post: CreatePostInput): Promise<Post>
  updatePost(id: string, data: UpdatePostInput): Promise<Post>
  deletePost(id: string): Promise<void>

  // Analytics
  getOverviewMetrics(dateRange: DateRange): Promise<OverviewMetrics>
  getTimeSeriesMetrics(dateRange: DateRange, platform?: Platform): Promise<TimeSeriesData[]>
  getTopPosts(dateRange: DateRange, limit?: number): Promise<PostWithAnalytics[]>
  getEngagementByType(dateRange: DateRange): Promise<EngagementByType[]>

  // Calendar
  getCalendarPosts(month: number, year: number): Promise<CalendarPost[]>
  reschedulePost(id: string, newDate: Date): Promise<Post>
}
```

### Implementations

- **`SupabaseMockProvider`** - Reads/writes Supabase with mock-seeded data (current)
- **`MetricoolProvider`** - Future drop-in replacement using Metricool REST API for analytics, Supabase for post management

### Provider Selection

```typescript
export const dataProvider: DataProvider =
  process.env.NEXT_PUBLIC_USE_METRICOOL === 'true'
    ? new MetricoolProvider()
    : new SupabaseMockProvider()
```

### Mock Data Seeding

Seed script generates 3 months of realistic content:
- ~60 posts across Instagram and TikTok with varied statuses
- Analytics snapshots with believable daily trends
- Run via `pnpm db:seed`

---

## Folder Structure

```
ourbites/
├── .claude/
│   ├── PRPs/
│   │   ├── templates/
│   │   └── completed/
│   └── commands/
├── CLAUDE.md
├── examples/
├── docs/
│   └── plans/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── instagram/
│   │   ├── tiktok/
│   │   ├── analytics/
│   │   └── calendar/
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── posts/
│   │   ├── analytics/
│   │   └── calendar/
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── data/
│   │   │   ├── types.ts
│   │   │   ├── mock-provider.ts
│   │   │   └── metricool-provider.ts
│   │   └── utils.ts
│   ├── hooks/
│   └── store/
├── supabase/
│   └── migrations/
└── public/
```

---

## Design Decisions

1. **No auth** - Single user, skip overhead
2. **Provider abstraction** - Mock now, Metricool later with one env var flip
3. **Single `posts` table** - Both platforms share the same shape, platform column distinguishes them
4. **Separate platform pages** - Instagram and TikTok get their own routes for cleaner UX, but share components
5. **URL-persisted filters** - Calendar and table filters survive page refresh
6. **@dnd-kit over alternatives** - Best React DnD library for accessible, performant drag-and-drop with sortable containers
