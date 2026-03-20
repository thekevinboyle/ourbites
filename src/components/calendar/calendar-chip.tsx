"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import type { CalendarPost } from "@/lib/data/types";

interface CalendarChipProps {
  post: CalendarPost;
  onClick: () => void;
}

const platformStyles: Record<string, string> = {
  instagram: "bg-primary text-primary-foreground",
  tiktok: "bg-foreground text-background",
};

function statusDot(status: string) {
  switch (status) {
    case "published":
      return "bg-green-400";
    case "scheduled":
      return "bg-blue-400";
    default:
      return "bg-gray-400";
  }
}

export function CalendarChip({ post, onClick }: CalendarChipProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: post.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const label =
    post.caption && post.caption.length > 0
      ? post.caption.length > 20
        ? post.caption.slice(0, 20) + "..."
        : post.caption
      : "Untitled";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "flex items-center gap-1 sm:gap-1.5 px-1 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs cursor-grab font-bold uppercase tracking-wide",
        platformStyles[post.platform],
        isDragging && "opacity-50"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <span
        className={cn("size-1.5 shrink-0 rounded-full", statusDot(post.status))}
      />
      <span className="truncate">{label}</span>
    </div>
  );
}
