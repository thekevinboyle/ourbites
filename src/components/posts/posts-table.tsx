"use client";

import { useState, useMemo, Fragment } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  flexRender,
  type SortingState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";

import type { Post, PostStatus } from "@/lib/data/types";
import { createColumns } from "./columns";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const responsiveClasses: Record<string, string> = {
  postType: "hidden sm:table-cell",
  scheduledAt: "hidden md:table-cell",
  metricool: "hidden lg:table-cell",
};

const platformLabels: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
};

const postTypeLabels: Record<string, string> = {
  reel: "Reel",
  carousel: "Carousel",
  story: "Story",
  single_image: "Single Image",
  video: "Video",
  photo: "Photo",
};

const platformLinks: Record<string, string> = {
  instagram: "https://instagram.com/ourbitemarks",
  tiktok: "https://tiktok.com/@ourbitemarks",
};

interface PostsTableProps {
  posts: Post[];
  onEdit: (post: Post) => void;
  onDelete: (post: Post) => void;
  onDuplicate: (post: Post) => void;
  onStatusChange: (post: Post, newStatus: PostStatus) => void;
}

export function PostsTable({
  posts,
  onEdit,
  onDelete,
  onDuplicate,
  onStatusChange,
}: PostsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo(
    () => createColumns(onEdit, onDelete, onDuplicate, onStatusChange),
    [onEdit, onDelete, onDuplicate, onStatusChange]
  );

  const table = useReactTable({
    data: posts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: {
      sorting,
      globalFilter,
    },
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search captions..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="max-w-sm"
      />
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(responsiveClasses[header.id])}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <Fragment key={row.id}>
                  <TableRow
                    className="cursor-pointer"
                    onClick={() => row.toggleExpanded()}
                    data-state={row.getIsExpanded() ? "expanded" : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(responsiveClasses[cell.column.id])}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="p-0"
                      >
                        <ExpandedRowDetail post={row.original} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
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

function ExpandedRowDetail({ post }: { post: Post }) {
  const platformLabel = platformLabels[post.platform] ?? post.platform;
  const typeLabel = postTypeLabels[post.postType] ?? post.postType;
  const socialLink = platformLinks[post.platform];

  return (
    <div className="border-t bg-muted/50 p-6 space-y-3">
      {post.caption ? (
        <p className="text-sm whitespace-pre-wrap">{post.caption}</p>
      ) : (
        <p className="text-sm text-muted-foreground">No caption</p>
      )}

      {post.notes && (
        <p className="text-sm text-muted-foreground italic">
          Notes: {post.notes}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        <span>Platform: {platformLabel}</span>
        <span>&middot;</span>
        <span>Type: {typeLabel}</span>
        <span>&middot;</span>
        <span>Created: {format(post.createdAt, "MMM d, yyyy")}</span>
      </div>

      {post.status === "published" && socialLink && (
        <div className="pt-1">
          <a
            href={socialLink}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline", size: "sm" })}
            onClick={(e) => e.stopPropagation()}
          >
            View on {platformLabel}
            <ExternalLink className="ml-1.5 h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}
