import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createBufferClient, isBufferConfigured } from "@/lib/buffer/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { postId } = body as { postId?: string };

    if (!postId) {
      return NextResponse.json(
        { error: "postId is required" },
        { status: 400 }
      );
    }

    // Fetch the post from Supabase
    const { data: post, error: fetchError } = await supabase
      .from("posts")
      .select("*")
      .eq("id", postId)
      .single();

    if (fetchError || !post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Validate the post is scheduled and has a date
    if (post.status !== "scheduled" || !post.scheduled_at) {
      return NextResponse.json(
        { error: "Post must be scheduled with a date before sending to Buffer" },
        { status: 400 }
      );
    }

    // If already has a metricool_post_id (reused for Buffer), return early
    if (post.metricool_post_id) {
      return NextResponse.json({
        message: "Post already scheduled to Buffer",
        bufferPostId: post.metricool_post_id,
      });
    }

    // Create Buffer client
    const client = createBufferClient();
    if (!client) {
      // Save locally only - Buffer not configured
      return NextResponse.json({
        message: "Buffer is not configured. Post saved locally only.",
        postId: post.id,
      });
    }

    // Get channels from Buffer to find the right one for this platform
    const channels = await client.getChannels();
    const channel = channels.find(
      (ch) => ch.service === (post.platform === "tiktok" ? "tiktok" : "instagram")
    );

    if (!channel) {
      return NextResponse.json(
        { error: `No Buffer channel found for platform: ${post.platform}` },
        { status: 400 }
      );
    }

    try {
      const bufferPost = await client.schedulePost({
        channelId: channel.id,
        text: post.caption ?? "",
        schedulingType: "automatic",
        mode: "customScheduled",
        dueAt: post.scheduled_at,
      });

      // Store the returned Buffer post ID in the metricool_post_id column
      const { error: updateError } = await supabase
        .from("posts")
        .update({
          metricool_post_id: bufferPost.id,
          metricool_status: "pending",
        })
        .eq("id", postId);

      if (updateError) {
        return NextResponse.json(
          { error: `Failed to save Buffer post ID: ${updateError.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: "Post scheduled to Buffer",
        bufferPostId: bufferPost.id,
      });
    } catch (bufferError) {
      // On Buffer error, update status to failed
      await supabase
        .from("posts")
        .update({ metricool_status: "failed" })
        .eq("id", postId);

      return NextResponse.json(
        {
          error: `Buffer scheduling failed: ${bufferError instanceof Error ? bufferError.message : "Unknown error"}`,
        },
        { status: 500 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
