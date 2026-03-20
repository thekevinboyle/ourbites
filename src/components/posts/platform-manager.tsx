"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

import type {
  Platform,
  Post,
  PostStatus,
  CreatePostInput,
  UpdatePostInput,
} from "@/lib/data/types";
import { usePosts, useCreatePost, useUpdatePost, useDeletePost, useScheduleToMetricool } from "@/hooks/use-posts";
import { PostsTable } from "./posts-table";
import { PostFormSheet } from "./post-form-sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PlatformManagerProps {
  platform: Platform;
}

const tabStatusMap: Record<string, PostStatus> = {
  scheduled: "scheduled",
  drafts: "draft",
  published: "published",
  backlog: "idea",
};

export function PlatformManager({ platform }: PlatformManagerProps) {
  const [activeTab, setActiveTab] = useState("scheduled");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const status = tabStatusMap[activeTab];
  const { data: posts = [], isLoading } = usePosts({ platform, status });
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();
  const scheduleToMetricool = useScheduleToMetricool();

  const handleEdit = useCallback((post: Post) => {
    setEditingPost(post);
    setSheetOpen(true);
  }, []);

  const handleDelete = useCallback(
    (post: Post) => {
      deletePost.mutate(post.id, {
        onSuccess: () => {
          toast.success("Post deleted successfully.");
        },
        onError: () => {
          toast.error("Failed to delete post.");
        },
      });
    },
    [deletePost]
  );

  const handleDuplicate = useCallback(
    (post: Post) => {
      const input: CreatePostInput = {
        platform: post.platform,
        caption: post.caption ?? undefined,
        postType: post.postType,
        status: "draft",
        notes: post.notes ?? undefined,
      };
      createPost.mutate(input, {
        onSuccess: () => {
          toast.success("Post duplicated as draft.");
        },
        onError: () => {
          toast.error("Failed to duplicate post.");
        },
      });
    },
    [createPost]
  );

  const handleSubmit = useCallback(
    (data: CreatePostInput | (UpdatePostInput & { id: string })) => {
      if ("id" in data) {
        const { id, ...updateData } = data;
        updatePost.mutate(
          { id, ...updateData },
          {
            onSuccess: () => {
              toast.success("Post updated successfully.");
              setSheetOpen(false);
              setEditingPost(null);
              if (updateData.status === "scheduled") {
                scheduleToMetricool.mutate(id, {
                  onSuccess: (result) => {
                    if (result.metricoolPostId) {
                      toast.success("Post pushed to Metricool for publishing.");
                    }
                  },
                  onError: (err) => {
                    toast.error((err as Error).message);
                  },
                });
              }
            },
            onError: () => {
              toast.error("Failed to update post.");
            },
          }
        );
      } else {
        createPost.mutate(data, {
          onSuccess: (createdPost) => {
            toast.success("Post created successfully.");
            setSheetOpen(false);
            setEditingPost(null);
            if (data.status === "scheduled") {
              scheduleToMetricool.mutate(createdPost.id, {
                onSuccess: (result) => {
                  if (result.metricoolPostId) {
                    toast.success("Post pushed to Metricool for publishing.");
                  }
                },
                onError: (err) => {
                  toast.error((err as Error).message);
                },
              });
            }
          },
          onError: () => {
            toast.error("Failed to create post.");
          },
        });
      }
    },
    [createPost, updatePost, scheduleToMetricool]
  );

  const handleStatusChange = useCallback(
    (post: Post, newStatus: PostStatus) => {
      updatePost.mutate(
        { id: post.id, status: newStatus },
        {
          onSuccess: () => {
            const labels: Record<PostStatus, string> = {
              idea: "Backlog",
              draft: "Drafts",
              scheduled: "Scheduled",
              published: "Published",
            };
            toast.success(`Post moved to ${labels[newStatus]}.`);
          },
          onError: () => {
            toast.error("Failed to update post status.");
          },
        }
      );
    },
    [updatePost]
  );

  const handleNewPost = () => {
    setEditingPost(null);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-4">
      <div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              <TabsTrigger value="drafts">Drafts</TabsTrigger>
              <TabsTrigger value="published">Published</TabsTrigger>
              <TabsTrigger value="backlog">Backlog</TabsTrigger>
            </TabsList>
            <Button onClick={handleNewPost}>New Post Idea</Button>
          </div>

          <TabsContent value="scheduled">
            {isLoading ? (
              <p className="text-muted-foreground py-8 text-center">Loading...</p>
            ) : (
              <PostsTable
                posts={posts}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onStatusChange={handleStatusChange}
              />
            )}
          </TabsContent>

          <TabsContent value="drafts">
            {isLoading ? (
              <p className="text-muted-foreground py-8 text-center">Loading...</p>
            ) : (
              <PostsTable
                posts={posts}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onStatusChange={handleStatusChange}
              />
            )}
          </TabsContent>

          <TabsContent value="published">
            {isLoading ? (
              <p className="text-muted-foreground py-8 text-center">Loading...</p>
            ) : (
              <PostsTable
                posts={posts}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onStatusChange={handleStatusChange}
              />
            )}
          </TabsContent>

          <TabsContent value="backlog">
            {isLoading ? (
              <p className="text-muted-foreground py-8 text-center">Loading...</p>
            ) : (
              <PostsTable
                posts={posts}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onStatusChange={handleStatusChange}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      <PostFormSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditingPost(null);
        }}
        defaultPlatform={platform}
        editingPost={editingPost}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
