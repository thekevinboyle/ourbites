"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";

import type { Idea, CreatePostInput, UpdatePostInput } from "@/lib/data/types";
import { useIdeas, useCreateIdea, useConvertIdea } from "@/hooks/use-ideas";
import { useCreatePost } from "@/hooks/use-posts";
import { Input } from "@/components/ui/input";
import { IdeaCard } from "./idea-card";
import { IdeaDetailSheet } from "./idea-detail-sheet";
import { PostFormSheet } from "@/components/posts/post-form-sheet";

export function IdeasBoard() {
  const [quickAddValue, setQuickAddValue] = useState("");
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [postSheetOpen, setPostSheetOpen] = useState(false);
  const pendingConversionRef = useRef<Idea | null>(null);

  const { data: ideas = [], isLoading } = useIdeas();
  const createIdea = useCreateIdea();
  const createPost = useCreatePost();
  const convertIdea = useConvertIdea();

  // Pre-filled values for PostFormSheet when converting
  const [convertCaption, setConvertCaption] = useState("");
  const [convertNotes, setConvertNotes] = useState("");

  const handleQuickAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const value = quickAddValue.trim();
    if (!value) return;

    createIdea.mutate(
      { title: value },
      {
        onSuccess: () => {
          setQuickAddValue("");
        },
        onError: () => {
          toast.error("Failed to create idea.");
        },
      }
    );
  };

  const handleSelectIdea = (idea: Idea) => {
    setSelectedIdea(idea);
    setDetailSheetOpen(true);
  };

  const handleConvertToPost = (idea: Idea) => {
    // Store the idea for conversion after post creation
    pendingConversionRef.current = idea;

    // Prepare pre-filled data
    const caption = [idea.title, idea.content]
      .filter(Boolean)
      .join("\n\n")
      .trim();
    const notes = idea.links.length > 0 ? idea.links.join("\n") : "";

    setConvertCaption(caption);
    setConvertNotes(notes);

    // Close detail sheet, open post sheet
    setDetailSheetOpen(false);
    setPostSheetOpen(true);
  };

  const handlePostSubmit = (
    data: CreatePostInput | (UpdatePostInput & { id: string })
  ) => {
    // We only handle create here (not edit)
    if ("id" in data) return;

    createPost.mutate(data, {
      onSuccess: (createdPost) => {
        toast.success("Post created successfully.");
        setPostSheetOpen(false);

        // If there's a pending conversion, link the idea to the post
        const pendingIdea = pendingConversionRef.current;
        if (pendingIdea) {
          convertIdea.mutate(
            { ideaId: pendingIdea.id, postId: createdPost.id },
            {
              onSuccess: () => {
                toast.success("Idea converted to post!");
              },
              onError: () => {
                toast.error("Post created but failed to mark idea as converted.");
              },
            }
          );
          pendingConversionRef.current = null;
        }
      },
      onError: () => {
        toast.error("Failed to create post.");
      },
    });
  };

  const handlePostSheetClose = (open: boolean) => {
    setPostSheetOpen(open);
    if (!open) {
      pendingConversionRef.current = null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick-add bar */}
      <Input
        placeholder="Jot down an idea..."
        value={quickAddValue}
        onChange={(e) => setQuickAddValue(e.target.value)}
        onKeyDown={handleQuickAdd}
        disabled={createIdea.isPending}
      />

      {/* Ideas grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
      ) : ideas.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          No ideas yet. Start typing above!
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} onSelect={handleSelectIdea} />
          ))}
        </div>
      )}

      {/* Detail sheet */}
      <IdeaDetailSheet
        idea={selectedIdea}
        open={detailSheetOpen}
        onOpenChange={(open) => {
          setDetailSheetOpen(open);
          if (!open) setSelectedIdea(null);
        }}
        onConvertToPost={handleConvertToPost}
      />

      {/* Post form sheet for conversion */}
      <PostFormSheet
        open={postSheetOpen}
        onOpenChange={handlePostSheetClose}
        defaultPlatform="instagram"
        editingPost={null}
        onSubmit={handlePostSubmit}
        initialValues={{
          caption: convertCaption,
          status: "draft",
          notes: convertNotes,
        }}
      />
    </div>
  );
}
