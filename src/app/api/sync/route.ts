import { NextResponse } from "next/server";
import { isMetricoolConfigured } from "@/lib/metricool/client";
import { syncAll } from "@/lib/metricool/sync";

export async function POST() {
  try {
    if (!isMetricoolConfigured()) {
      return NextResponse.json(
        { error: "Metricool is not configured. Set METRICOOL_USER_TOKEN, METRICOOL_USER_ID, and METRICOOL_BLOG_ID environment variables." },
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
