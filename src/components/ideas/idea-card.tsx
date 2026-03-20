"use client";

import { formatDistanceToNow } from "date-fns";
import { Link as LinkIcon } from "lucide-react";

import type { Idea } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface IdeaCardProps {
  idea: Idea;
  onSelect: (idea: Idea) => void;
}

export function IdeaCard({ idea, onSelect }: IdeaCardProps) {
  const hasImages = idea.images.length > 0;
  const isConverted = idea.convertedTo !== null;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-shadow hover:shadow-md",
        isConverted && "opacity-60"
      )}
      onClick={() => onSelect(idea)}
    >
      {hasImages && (
        <img
          src={idea.images[0].url}
          alt={idea.title ?? "Idea image"}
          className="h-40 w-full object-cover rounded-t-xl"
        />
      )}
      <CardContent className="space-y-1.5">
        <p className={cn("font-medium line-clamp-2", !idea.title && "text-muted-foreground italic")}>
          {idea.title || "Untitled idea"}
        </p>
        {idea.content && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {idea.content.length > 100
              ? idea.content.slice(0, 100) + "..."
              : idea.content}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>
          {formatDistanceToNow(idea.createdAt, { addSuffix: true })}
        </span>
        <span className="flex-1" />
        {idea.links.length > 0 && (
          <Badge variant="secondary" className="gap-1">
            <LinkIcon className="size-3" />
            {idea.links.length} {idea.links.length === 1 ? "link" : "links"}
          </Badge>
        )}
        {isConverted && (
          <Badge variant="outline" className="border-green-500 text-green-600">
            Converted
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
}
