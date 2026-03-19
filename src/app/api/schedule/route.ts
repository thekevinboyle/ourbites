import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createMetricoolClient } from "@/lib/metricool/client";

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
        { error: "Post must be scheduled with a date before sending to Metricool" },
        { status: 400 }
      );
    }

    // If already has a metricool_post_id, return early
    if (post.metricool_post_id) {
      return NextResponse.json({
        message: "Post already scheduled to Metricool",
        metricoolPostId: post.metricool_post_id,
      });
    }

    // Create Metricool client
    const client = createMetricoolClient();
    if (!client) {
      // Save locally only - Metricool not configured
      return NextResponse.json({
        message: "Metricool is not configured. Post saved locally only.",
        postId: post.id,
      });
    }

    // Map platform to Metricool network name
    const network = post.platform === "tiktok" ? "tiktok" : "instagram";

    try {
      const metricoolResponse = await client.schedulePost({
        network,
        text: post.caption ?? "",
        date: post.scheduled_at,
        type: post.post_type,
      });

      // Store the returned Metricool ID in Supabase
      const { error: updateError } = await supabase
        .from("posts")
        .update({
          metricool_post_id: metricoolResponse.id,
          metricool_status: "pending",
        })
        .eq("id", postId);

      if (updateError) {
        return NextResponse.json(
          { error: `Failed to save Metricool ID: ${updateError.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: "Post scheduled to Metricool",
        metricoolPostId: metricoolResponse.id,
      });
    } catch (metricoolError) {
      // On Metricool error, update status to failed
      await supabase
        .from("posts")
        .update({ metricool_status: "failed" })
        .eq("id", postId);

      return NextResponse.json(
        {
          error: `Metricool scheduling failed: ${metricoolError instanceof Error ? metricoolError.message : "Unknown error"}`,
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
