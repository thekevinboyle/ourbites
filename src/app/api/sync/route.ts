import { NextResponse } from "next/server";
import { isBufferConfigured } from "@/lib/buffer/client";
import { syncAll } from "@/lib/buffer/sync";

export async function POST() {
  try {
    if (!isBufferConfigured()) {
      return NextResponse.json(
        { error: "Buffer is not configured. Set BUFFER_API_TOKEN and BUFFER_ORGANIZATION_ID environment variables." },
        { status: 400 }
      );
    }

    const result = await syncAll();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
