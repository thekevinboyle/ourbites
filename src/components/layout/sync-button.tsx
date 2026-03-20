"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);

  async function handleSync() {
    setIsSyncing(true);
    try {
      const response = await fetch("/api/sync", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Sync failed");
        return;
      }

      const parts: string[] = [];
      if (data.postsUpdated > 0) parts.push(`${data.postsUpdated} posts updated`);
      if (data.analyticsUpdated > 0) parts.push(`${data.analyticsUpdated} analytics records`);
      if (data.errors?.length > 0) parts.push(`${data.errors.length} errors`);

      if (parts.length === 0) {
        toast.success("Sync complete - everything up to date");
      } else {
        toast.success(`Synced: ${parts.join(", ")}`);
      }

      if (data.errors?.length > 0) {
        console.warn("Sync errors:", data.errors);
      }
    } catch (err) {
      toast.error(`Sync failed: ${(err as Error).message}`);
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="border-t border-sidebar-border p-4">
      <Button
        variant="outline"
        className="w-full border-2 border-sidebar-foreground/30 text-sidebar-foreground uppercase tracking-widest text-xs font-bold hover:border-primary hover:text-primary hover:bg-transparent"
        onClick={handleSync}
        disabled={isSyncing}
      >
        {isSyncing ? "Syncing..." : "Sync Now"}
      </Button>
    </div>
  );
}
