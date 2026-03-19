"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import type { CalendarPost } from "@/lib/data/types";
import { CalendarChip } from "./calendar-chip";

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
  const { setNodeRef, isOver } = useDroppable({ id: `day-${day}` });

  const sortableIds = posts.map((p) => p.id);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[100px] border-b border-r p-1",
        !isCurrentMonth && "bg-muted/30 text-muted-foreground",
        isToday && "bg-primary/5",
        isOver && "bg-accent/50"
      )}
      onClick={() => onDayClick(day)}
    >
      <div className="mb-1 flex items-center justify-start">
        <span
          className={cn(
            "flex size-6 items-center justify-center text-xs",
            isToday &&
              "rounded-full bg-primary text-primary-foreground font-semibold"
          )}
        >
          {day}
        </span>
      </div>
      <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-1">
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
