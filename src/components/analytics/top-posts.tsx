"use client";

import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTopPosts } from "@/hooks/use-analytics";

export function TopPosts() {
  const { data, isLoading } = useTopPosts();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Performing Posts</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No posts found for the selected period.
          </p>
        ) : (
          <div className="space-y-4">
            {data.map((post) => (
              <div
                key={post.id}
                className="flex items-start gap-4 rounded-lg border p-3"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {post.platform === "instagram"
                        ? "Instagram"
                        : "TikTok"}
                    </Badge>
                    {post.publishedAt && (
                      <span className="text-xs text-muted-foreground">
                        {format(post.publishedAt, "MMM d, yyyy")}
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-2 text-sm">
                    {post.caption || "No caption"}
                  </p>
                </div>
                {post.analytics && (
                  <div className="flex shrink-0 gap-4 text-right text-xs text-muted-foreground">
                    <div>
                      <div className="font-medium text-foreground">
                        {post.analytics.impressions.toLocaleString()}
                      </div>
                      <div>impressions</div>
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {post.analytics.likes.toLocaleString()}
                      </div>
                      <div>likes</div>
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {post.analytics.comments.toLocaleString()}
                      </div>
                      <div>comments</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
