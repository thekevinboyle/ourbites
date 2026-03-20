"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getIdeas,
  getIdea,
  createIdea,
  updateIdea,
  deleteIdea,
  uploadIdeaImage,
  deleteIdeaImage,
  convertIdea,
} from "@/lib/data/ideas-provider";
import type { CreateIdeaInput, UpdateIdeaInput } from "@/lib/data/types";

export function useIdeas() {
  return useQuery({
    queryKey: ["ideas"],
    queryFn: getIdeas,
  });
}

export function useIdea(id: string) {
  return useQuery({
    queryKey: ["ideas", id],
    queryFn: () => getIdea(id),
    enabled: !!id,
  });
}

export function useCreateIdea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateIdeaInput) => createIdea(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
    },
  });
}

export function useUpdateIdea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateIdeaInput & { id: string }) => updateIdea(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
    },
  });
}

export function useDeleteIdea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteIdea(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
    },
  });
}

export function useUploadIdeaImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ideaId, file }: { ideaId: string; file: File }) =>
      uploadIdeaImage(ideaId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
    },
  });
}

export function useDeleteIdeaImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ imageId, storagePath }: { imageId: string; storagePath: string }) =>
      deleteIdeaImage(imageId, storagePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
    },
  });
}

export function useConvertIdea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ideaId, postId }: { ideaId: string; postId: string }) =>
      convertIdea(ideaId, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}
