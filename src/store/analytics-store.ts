import { create } from "zustand";
import type { Platform } from "@/lib/data/types";

interface AnalyticsStore {
  dateRange: { start: Date; end: Date };
  platform: Platform | undefined;
  setDateRange: (start: Date, end: Date) => void;
  setPlatform: (platform: Platform | undefined) => void;
}

export const useAnalyticsStore = create<AnalyticsStore>((set) => ({
  dateRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
  },
  platform: undefined,
  setDateRange: (start, end) => set({ dateRange: { start, end } }),
  setPlatform: (platform) => set({ platform }),
}));
