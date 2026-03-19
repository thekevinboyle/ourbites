"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { getDaysInMonth, startOfMonth, getDay, format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCalendarStore } from "@/store/calendar-store";
import { useCalendarPosts, useReschedulePost } from "@/hooks/use-calendar";
import { useUpdatePost } from "@/hooks/use-posts";
import { PostFormSheet } from "@/components/posts/post-form-sheet";
import { DayCell } from "./day-cell";
import type { CalendarPost, Post, CreatePostInput, UpdatePostInput } from "@/lib/data/types";

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
  } = useCalendarStore();

  const { data: posts = [] } = useCalendarPosts();
  const reschedule = useReschedulePost();
  const updatePost = useUpdatePost();

  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const currentDate = new Date(currentYear, currentMonth - 1, 1);
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfWeek = getDay(startOfMonth(currentDate));
  const monthLabel = format(currentDate, "MMMM yyyy");

  const today = new Date();
  const isCurrentMonthToday =
    today.getMonth() + 1 === currentMonth &&
    today.getFullYear() === currentYear;
  const todayDate = today.getDate();

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (platformFilter && post.platform !== platformFilter) return false;
      if (statusFilter && post.status !== statusFilter) return false;
      return true;
    });
  }, [posts, platformFilter, statusFilter]);

  const postsByDay = useMemo(() => {
    const map: Record<number, CalendarPost[]> = {};
    for (const post of filteredPosts) {
      const day = post.date.getDate();
      if (!map[day]) map[day] = [];
      map[day].push(post);
    }
    return map;
  }, [filteredPosts]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const overId = String(over.id);
    if (!overId.startsWith("day-")) return;

    const dayNumber = parseInt(overId.replace("day-", ""), 10);
    if (isNaN(dayNumber)) return;

    const postId = String(active.id);
    const newDate = new Date(currentYear, currentMonth - 1, dayNumber, 12, 0, 0);

    reschedule.mutate(
      { id: postId, newDate },
      {
        onSuccess: () => {
          toast.success("Post rescheduled");
        },
        onError: () => {
          toast.error("Failed to reschedule post");
        },
      }
    );
  }

  function handleChipClick(calendarPost: CalendarPost) {
    const postAsPost: Post = {
      id: calendarPost.id,
      platform: calendarPost.platform,
      caption: calendarPost.caption,
      postType: calendarPost.postType,
      status: calendarPost.status,
      scheduledAt: calendarPost.date,
      publishedAt: calendarPost.status === "published" ? calendarPost.date : null,
      notes: null,
      createdAt: calendarPost.date,
      updatedAt: calendarPost.date,
    };
    setEditingPost(postAsPost);
    setSheetOpen(true);
  }

  function handleFormSubmit(
    data: CreatePostInput | (UpdatePostInput & { id: string })
  ) {
    if ("id" in data) {
      const { id, ...rest } = data;
      updatePost.mutate(
        { id, ...rest },
        {
          onSuccess: () => {
            toast.success("Post updated");
            setSheetOpen(false);
            setEditingPost(null);
          },
          onError: () => {
            toast.error("Failed to update post");
          },
        }
      );
    }
  }

  return (
    <div>
      {/* Month navigation */}
      <div className="mb-4 flex items-center gap-2">
        <Button variant="outline" size="icon-sm" onClick={goToPrevMonth}>
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="outline" size="icon-sm" onClick={goToNextMonth}>
          <ChevronRight className="size-4" />
        </Button>
        <h3 className="text-lg font-semibold">{monthLabel}</h3>
        <Button variant="outline" size="sm" onClick={goToToday} className="ml-2">
          Today
        </Button>
      </div>

      {/* Calendar grid */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="overflow-hidden rounded-lg border border-b-0 border-r-0">
          {/* Weekday headers */}
          <div className="grid grid-cols-7">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="border-b border-r bg-muted/50 px-2 py-1.5 text-center text-xs font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {/* Empty cells for offset */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="min-h-[100px] border-b border-r bg-muted/30"
              />
            ))}

            {/* Actual day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              return (
                <DayCell
                  key={day}
                  day={day}
                  isToday={isCurrentMonthToday && day === todayDate}
                  isCurrentMonth={true}
                  posts={postsByDay[day] ?? []}
                  onDayClick={() => {}}
                  onChipClick={handleChipClick}
                />
              );
            })}
          </div>
        </div>
      </DndContext>

      {/* Post edit sheet */}
      <PostFormSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditingPost(null);
        }}
        defaultPlatform={editingPost?.platform ?? "instagram"}
        editingPost={editingPost}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
