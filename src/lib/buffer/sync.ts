import { supabase } from "../supabase";
import { createBufferClient } from "./client";
import type { BufferPost } from "./types";

export interface SyncResult {
  postsUpdated: number;
  analyticsUpdated: number;
  errors: string[];
}

export async function syncAll(): Promise<SyncResult> {
  const client = createBufferClient();
  if (!client) {
    return { postsUpdated: 0, analyticsUpdated: 0, errors: ["Buffer not configured"] };
  }

  const errors: string[] = [];
  let postsUpdated = 0;

  // Get all posts that are scheduled and have a metricool_post_id (reused for Buffer post IDs)
  const { data: pendingPosts, error } = await supabase
    .from("posts")
    .select("id, metricool_post_id, platform")
    .eq("status", "scheduled")
    .not("metricool_post_id", "is", null);

  if (error) {
    return { postsUpdated: 0, analyticsUpdated: 0, errors: [error.message] };
  }

  if (!pendingPosts || pendingPosts.length === 0) {
    return { postsUpdated: 0, analyticsUpdated: 0, errors: [] };
  }

  // Get sent posts from Buffer
  let sentPosts;
  try {
    sentPosts = await client.getPosts("sent");
  } catch (err) {
    return { postsUpdated: 0, analyticsUpdated: 0, errors: [(err as Error).message] };
  }

  const sentIds = new Set(sentPosts.map((p) => p.id));

  // Get error posts from Buffer
  let errorPosts: BufferPost[];
  try {
    errorPosts = await client.getPosts("error");
  } catch (err) {
    errors.push(`Failed to fetch error posts: ${(err as Error).message}`);
    errorPosts = [];
  }

  const errorIds = new Set(errorPosts.map((p) => p.id));

  for (const post of pendingPosts) {
    const bufferId = post.metricool_post_id;
    if (!bufferId) continue;

    if (sentIds.has(bufferId)) {
      const { error: updateError } = await supabase
        .from("posts")
        .update({
          status: "published",
          metricool_status: "published",
          published_at: new Date().toISOString(),
        })
        .eq("id", post.id);

      if (updateError) {
        errors.push(`Failed to update post ${post.id}: ${updateError.message}`);
      } else {
        postsUpdated++;
      }
    } else if (errorIds.has(bufferId)) {
      const { error: updateError } = await supabase
        .from("posts")
        .update({ metricool_status: "failed" })
        .eq("id", post.id);

      if (updateError) {
        errors.push(`Failed to update post ${post.id}: ${updateError.message}`);
      } else {
        postsUpdated++;
      }
    }
  }

  return { postsUpdated, analyticsUpdated: 0, errors };
}
