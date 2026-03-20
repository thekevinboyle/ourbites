"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  X,
  Plus,
  ExternalLink,
  Trash2,
  Upload,
  Loader2,
  ArrowRight,
} from "lucide-react";

import type { Idea } from "@/lib/data/types";
import {
  useUpdateIdea,
  useDeleteIdea,
  useUploadIdeaImage,
  useDeleteIdeaImage,
} from "@/hooks/use-ideas";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface IdeaDetailSheetProps {
  idea: Idea | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConvertToPost: (idea: Idea) => void;
}

export function IdeaDetailSheet({
  idea,
  open,
  onOpenChange,
  onConvertToPost,
}: IdeaDetailSheetProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [linkInput, setLinkInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateIdea = useUpdateIdea();
  const deleteIdea = useDeleteIdea();
  const uploadImage = useUploadIdeaImage();
  const deleteImage = useDeleteIdeaImage();

  useEffect(() => {
    if (idea) {
      setTitle(idea.title ?? "");
      setContent(idea.content ?? "");
      setLinkInput("");
    }
  }, [idea]);

  if (!idea) return null;

  const handleTitleBlur = () => {
    const newTitle = title.trim() || undefined;
    const oldTitle = idea.title ?? undefined;
    if (newTitle !== oldTitle) {
      updateIdea.mutate({ id: idea.id, title: newTitle ?? "" });
    }
  };

  const handleContentBlur = () => {
    const newContent = content.trim() || undefined;
    const oldContent = idea.content ?? undefined;
    if (newContent !== oldContent) {
      updateIdea.mutate({ id: idea.id, content: newContent ?? "" });
    }
  };

  const handleDeleteImage = (imageId: string, storagePath: string) => {
    deleteImage.mutate(
      { imageId, storagePath },
      {
        onError: () => {
          toast.error("Failed to delete image.");
        },
      }
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadImage.mutate(
      { ideaId: idea.id, file },
      {
        onError: () => {
          toast.error("Failed to upload image.");
        },
      }
    );
    // Reset file input so same file can be re-selected
    e.target.value = "";
  };

  const handleAddLink = () => {
    const url = linkInput.trim();
    if (!url) return;
    try {
      new URL(url);
    } catch {
      toast.error("Please enter a valid URL.");
      return;
    }
    const updatedLinks = [...idea.links, url];
    updateIdea.mutate(
      { id: idea.id, links: updatedLinks },
      {
        onSuccess: () => {
          setLinkInput("");
        },
        onError: () => {
          toast.error("Failed to add link.");
        },
      }
    );
  };

  const handleRemoveLink = (index: number) => {
    const updatedLinks = idea.links.filter((_, i) => i !== index);
    updateIdea.mutate(
      { id: idea.id, links: updatedLinks },
      {
        onError: () => {
          toast.error("Failed to remove link.");
        },
      }
    );
  };

  const handleDelete = () => {
    deleteIdea.mutate(idea.id, {
      onSuccess: () => {
        toast.success("Idea deleted.");
        onOpenChange(false);
      },
      onError: () => {
        toast.error("Failed to delete idea.");
      },
    });
  };

  const handleConvert = () => {
    onConvertToPost(idea);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Idea</SheetTitle>
          <SheetDescription>
            Update the details of your idea.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4 pb-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="idea-title">
              Title
            </label>
            <Input
              id="idea-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              placeholder="Idea title..."
            />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="idea-content">
              Content
            </label>
            <Textarea
              id="idea-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onBlur={handleContentBlur}
              placeholder="Write your thoughts..."
              className="min-h-[120px]"
            />
          </div>

          {/* Images */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Images</p>
            {idea.images.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {idea.images.map((image) => (
                  <div key={image.id} className="group relative">
                    <img
                      src={image.url}
                      alt={image.fileName}
                      className="h-28 w-full rounded-lg object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon-xs"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() =>
                        handleDeleteImage(image.id, image.storagePath)
                      }
                    >
                      <X className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadImage.isPending}
            >
              {uploadImage.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              {uploadImage.isPending ? "Uploading..." : "Add Image"}
            </Button>
          </div>

          {/* Links */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Links</p>
            {idea.links.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {idea.links.map((link, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="gap-1 max-w-[200px]"
                  >
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {link.replace(/^https?:\/\//, "").slice(0, 30)}
                    </a>
                    <ExternalLink className="size-3 shrink-0" />
                    <button
                      className="ml-0.5 shrink-0 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveLink(index);
                      }}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="https://..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddLink();
                  }
                }}
              />
              <Button variant="outline" size="sm" onClick={handleAddLink}>
                <Plus className="size-4" />
                Add
              </Button>
            </div>
          </div>

          {/* Convert to Post */}
          <div className="border-t pt-4">
            {idea.convertedTo ? (
              <Badge variant="outline" className="border-green-500 text-green-600">
                Converted to Post
              </Badge>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleConvert}
              >
                <ArrowRight className="size-4" />
                Convert to Post
              </Button>
            )}
          </div>

          {/* Delete */}
          <div className="border-t pt-4">
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleDelete}
              disabled={deleteIdea.isPending}
            >
              <Trash2 className="size-4" />
              {deleteIdea.isPending ? "Deleting..." : "Delete Idea"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
