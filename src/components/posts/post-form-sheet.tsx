"use client";

import { useEffect, useState } from "react";

import type {
  Post,
  Platform,
  PostType,
  PostStatus,
  CreatePostInput,
  UpdatePostInput,
} from "@/lib/data/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

const platformPostTypes: Record<Platform, { value: PostType; label: string }[]> = {
  instagram: [
    { value: "reel", label: "Reel" },
    { value: "carousel", label: "Carousel" },
    { value: "story", label: "Story" },
    { value: "single_image", label: "Single Image" },
  ],
  tiktok: [
    { value: "video", label: "Video" },
    { value: "photo", label: "Photo" },
    { value: "story", label: "Story" },
  ],
};

const captionLimits: Record<Platform, number> = {
  instagram: 2200,
  tiktok: 4000,
};

interface PostFormInitialValues {
  caption?: string;
  status?: PostStatus;
  notes?: string;
}

interface PostFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPlatform: Platform;
  editingPost: Post | null;
  onSubmit: (data: CreatePostInput | (UpdatePostInput & { id: string })) => void;
  initialValues?: PostFormInitialValues;
}

export function PostFormSheet({
  open,
  onOpenChange,
  defaultPlatform,
  editingPost,
  onSubmit,
  initialValues,
}: PostFormSheetProps) {
  const [platform, setPlatform] = useState<Platform>(defaultPlatform);
  const [caption, setCaption] = useState("");
  const [postType, setPostType] = useState<PostType>(
    platformPostTypes[defaultPlatform][0].value
  );
  const [status, setStatus] = useState<PostStatus>("idea");
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (editingPost) {
      setPlatform(editingPost.platform);
      setCaption(editingPost.caption ?? "");
      setPostType(editingPost.postType);
      setStatus(editingPost.status);
      setScheduledAt(
        editingPost.scheduledAt
          ? formatDateTimeLocal(editingPost.scheduledAt)
          : ""
      );
      setNotes(editingPost.notes ?? "");
    } else {
      setPlatform(defaultPlatform);
      setCaption(initialValues?.caption ?? "");
      setPostType(platformPostTypes[defaultPlatform][0].value);
      setStatus(initialValues?.status ?? "idea");
      setScheduledAt("");
      setNotes(initialValues?.notes ?? "");
    }
  }, [editingPost, open, defaultPlatform, initialValues]);

  function formatDateTimeLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  const handlePlatformChange = (value: Platform) => {
    setPlatform(value);
    const types = platformPostTypes[value];
    if (!types.some((t) => t.value === postType)) {
      setPostType(types[0].value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingPost) {
      const data: UpdatePostInput & { id: string } = {
        id: editingPost.id,
        platform,
        caption: caption || undefined,
        postType,
        status,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        notes: notes || undefined,
      };
      onSubmit(data);
    } else {
      const data: CreatePostInput = {
        platform,
        caption: caption || undefined,
        postType,
        status,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        notes: notes || undefined,
      };
      onSubmit(data);
    }
  };

  const charLimit = captionLimits[platform];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {editingPost ? "Edit Post" : "New Post Idea"}
          </SheetTitle>
          <SheetDescription>
            {editingPost
              ? "Update the details of your post."
              : "Fill in the details for your new post idea."}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 pb-4 overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="platform">Platform</Label>
            <Select
              value={platform}
              onValueChange={(val) => handlePlatformChange(val as Platform)}
            >
              <SelectTrigger className="w-full" id="platform">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write your caption..."
              maxLength={charLimit}
            />
            <p className="text-xs text-muted-foreground text-right">
              {caption.length}/{charLimit}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="postType">Post Type</Label>
            <Select
              value={postType}
              onValueChange={(val) => setPostType(val as PostType)}
            >
              <SelectTrigger className="w-full" id="postType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {platformPostTypes[platform].map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={status}
              onValueChange={(val) => setStatus(val as PostStatus)}
            >
              <SelectTrigger className="w-full" id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="idea">Idea</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {status === "scheduled" && (
            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Scheduled Date/Time</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes..."
            />
          </div>

          <Button type="submit" className="mt-2">
            {editingPost ? "Save Changes" : "Create Post"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
