"use client";

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAnalyticsStore } from "@/store/analytics-store";
import { cn } from "@/lib/utils";
import type { Platform } from "@/lib/data/types";

const platformOptions: { label: string; value: Platform | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Instagram", value: "instagram" },
  { label: "TikTok", value: "tiktok" },
];

const presets = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

export function AnalyticsControls() {
  const { dateRange, platform, setDateRange, setPlatform } =
    useAnalyticsStore();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1">
        {platformOptions.map((opt) => (
          <Button
            key={opt.label}
            variant={platform === opt.value ? "default" : "outline"}
            size="sm"
            onClick={() => setPlatform(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-1">
        {presets.map((preset) => {
          const presetStart = new Date(
            Date.now() - preset.days * 24 * 60 * 60 * 1000
          );
          const diffMs =
            dateRange.end.getTime() -
            dateRange.start.getTime();
          const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
          const isActive = diffDays === preset.days;

          return (
            <Button
              key={preset.label}
              variant={isActive ? "secondary" : "outline"}
              size="sm"
              onClick={() => setDateRange(presetStart, new Date())}
            >
              {preset.label}
            </Button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={format(dateRange.start, "yyyy-MM-dd")}
          onChange={(e) => {
            const date = new Date(e.target.value + "T00:00:00");
            if (!isNaN(date.getTime())) {
              setDateRange(date, dateRange.end);
            }
          }}
          className={cn("w-[140px]")}
        />
        <span className="text-sm text-muted-foreground">to</span>
        <Input
          type="date"
          value={format(dateRange.end, "yyyy-MM-dd")}
          onChange={(e) => {
            const date = new Date(e.target.value + "T00:00:00");
            if (!isNaN(date.getTime())) {
              setDateRange(dateRange.start, date);
            }
          }}
          className={cn("w-[140px]")}
        />
      </div>
    </div>
  );
}
