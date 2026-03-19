"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dataProvider } from "@/lib/data";
import type { PostFilters, CreatePostInput, UpdatePostInput } from "@/lib/data/types";

export function usePosts(filters: PostFilters) {
  return useQuery({
    queryKey: ["posts", filters],
    queryFn: () => dataProvider.getPosts(filters),
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePostInput) => dataProvider.createPost(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdatePostInput & { id: string }) =>
      dataProvider.updatePost(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dataProvider.deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useScheduleToMetricool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}
