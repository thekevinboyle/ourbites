"use client";

import { useState, useRef } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import type { Idea, CreatePostInput, UpdatePostInput } from "@/lib/data/types";
import { useIdeas, useCreateIdea, useConvertIdea } from "@/hooks/use-ideas";
import { useCreatePost } from "@/hooks/use-posts";
import { Button } from "@/components/ui/button";
import { IdeaCard } from "./idea-card";
import { IdeaDetailSheet } from "./idea-detail-sheet";
import { PostFormSheet } from "@/components/posts/post-form-sheet";

export function IdeasBoard() {
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [postSheetOpen, setPostSheetOpen] = useState(false);
  const pendingConversionRef = useRef<Idea | null>(null);

  const { data: ideas = [], isLoading } = useIdeas();
  const createIdea = useCreateIdea();
  const createPost = useCreatePost();
  const convertIdea = useConvertIdea();

  const [convertCaption, setConvertCaption] = useState("");
  const [convertNotes, setConvertNotes] = useState("");

  const handleNewIdea = () => {
    createIdea.mutate(
      { title: "" },
      {
        onSuccess: (newIdea) => {
          setSelectedIdea(newIdea);
          setDetailSheetOpen(true);
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
      {/* Ideas grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse bg-muted"
            />
          ))}
        </div>
      ) : ideas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-6">
          <p className="text-muted-foreground uppercase tracking-widest text-sm">
            No ideas yet
          </p>
          <Button
            size="lg"
            onClick={handleNewIdea}
            disabled={createIdea.isPending}
            className="h-16 w-16 text-2xl"
          >
            <Plus className="h-8 w-8" />
          </Button>
          <p className="text-muted-foreground text-sm">
            Tap to start capturing ideas
          </p>
        </div>
      ) : (
        <>
          <div className="flex justify-end">
            <Button
              onClick={handleNewIdea}
              disabled={createIdea.isPending}
            >
              <Plus className="h-4 w-4 mr-2" />
              NEW IDEA
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ideas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} onSelect={handleSelectIdea} />
            ))}
          </div>
        </>
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
