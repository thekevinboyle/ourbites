"use client";

import { Button } from "@/components/ui/button";
import { useCalendarStore } from "@/store/calendar-store";
import type { Platform, PostStatus } from "@/lib/data/types";

export function CalendarFilters() {
  const { platformFilter, statusFilter, setPlatformFilter, setStatusFilter } =
    useCalendarStore();

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Platform filters */}
      <Button
        variant={platformFilter === undefined ? "default" : "outline"}
        size="sm"
        onClick={() => setPlatformFilter(undefined)}
      >
        All Platforms
      </Button>
      <Button
        variant={platformFilter === "instagram" ? "default" : "outline"}
        size="sm"
        onClick={() =>
          setPlatformFilter(
            platformFilter === "instagram" ? undefined : ("instagram" as Platform)
          )
        }
      >
        Instagram
      </Button>
      <Button
        variant={platformFilter === "tiktok" ? "default" : "outline"}
        size="sm"
        onClick={() =>
          setPlatformFilter(
            platformFilter === "tiktok" ? undefined : ("tiktok" as Platform)
          )
        }
      >
        TikTok
      </Button>

      {/* Separator */}
      <div className="mx-2 h-6 border-l" />

      {/* Status filters */}
      <Button
        variant={statusFilter === undefined ? "default" : "outline"}
        size="sm"
        onClick={() => setStatusFilter(undefined)}
      >
        All Status
      </Button>
      <Button
        variant={statusFilter === "scheduled" ? "default" : "outline"}
        size="sm"
        onClick={() =>
          setStatusFilter(
            statusFilter === "scheduled" ? undefined : ("scheduled" as PostStatus)
          )
        }
      >
        Scheduled
      </Button>
      <Button
        variant={statusFilter === "published" ? "default" : "outline"}
        size="sm"
        onClick={() =>
          setStatusFilter(
            statusFilter === "published" ? undefined : ("published" as PostStatus)
          )
        }
      >
        Published
      </Button>
      <Button
        variant={statusFilter === "draft" ? "default" : "outline"}
        size="sm"
        onClick={() =>
          setStatusFilter(
            statusFilter === "draft" ? undefined : ("draft" as PostStatus)
          )
        }
      >
        Draft
      </Button>
    </div>
  );
}
