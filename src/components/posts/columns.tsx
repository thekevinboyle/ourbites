"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { MoreHorizontal } from "lucide-react";

import type { Post, PostType, PostStatus } from "@/lib/data/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const postTypeLabels: Record<PostType, string> = {
  reel: "Reel",
  carousel: "Carousel",
  story: "Story",
  single_image: "Single Image",
  video: "Video",
  photo: "Photo",
};

const statusVariants: Record<PostStatus, string> = {
  idea: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  draft: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  published: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
};

const statusLabels: Record<PostStatus, string> = {
  idea: "Idea",
  draft: "Draft",
  scheduled: "Scheduled",
  published: "Published",
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
      cell: ({ row }) => {
        const caption = row.getValue("caption") as string | null;
        return (
          <div
            className="max-w-[300px] truncate"
            title={caption ?? undefined}
          >
            {caption || (
              <span className="text-muted-foreground">No caption</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "postType",
      header: "Post Type",
      cell: ({ row }) => {
        const postType = row.getValue("postType") as PostType;
        return postTypeLabels[postType] ?? postType;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as PostStatus;
        return (
          <Badge
            variant="secondary"
            className={statusVariants[status]}
          >
            {statusLabels[status]}
          </Badge>
        );
      },
    },
    {
      accessorKey: "scheduledAt",
      header: "Scheduled Date",
      cell: ({ row }) => {
        const date = row.getValue("scheduledAt") as Date | null;
        if (!date) return <span className="text-muted-foreground">&mdash;</span>;
        return format(date, "MMM d, yyyy h:mm a");
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const post = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-sm" />
              }
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(post)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(post)}>
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(post)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
