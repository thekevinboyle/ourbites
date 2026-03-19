import { create } from "zustand";
import type { Platform, PostStatus } from "@/lib/data/types";

interface CalendarStore {
  currentMonth: number;
  currentYear: number;
  platformFilter: Platform | undefined;
  statusFilter: PostStatus | undefined;
  selectedDay: number | null;
  goToNextMonth: () => void;
  goToPrevMonth: () => void;
  goToToday: () => void;
  setPlatformFilter: (p: Platform | undefined) => void;
  setStatusFilter: (s: PostStatus | undefined) => void;
  setSelectedDay: (day: number | null) => void;
}

const now = new Date();

export const useCalendarStore = create<CalendarStore>((set) => ({
  currentMonth: now.getMonth() + 1,
  currentYear: now.getFullYear(),
  platformFilter: undefined,
  statusFilter: undefined,
  selectedDay: null,
  goToNextMonth: () =>
    set((state) => {
      if (state.currentMonth === 12)
        return {
          currentMonth: 1,
          currentYear: state.currentYear + 1,
          selectedDay: null,
        };
      return { currentMonth: state.currentMonth + 1, selectedDay: null };
    }),
  goToPrevMonth: () =>
    set((state) => {
      if (state.currentMonth === 1)
        return {
          currentMonth: 12,
          currentYear: state.currentYear - 1,
          selectedDay: null,
        };
      return { currentMonth: state.currentMonth - 1, selectedDay: null };
    }),
  goToToday: () =>
    set({
      currentMonth: new Date().getMonth() + 1,
      currentYear: new Date().getFullYear(),
      selectedDay: null,
    }),
  setPlatformFilter: (p) => set({ platformFilter: p }),
  setStatusFilter: (s) => set({ statusFilter: s }),
  setSelectedDay: (day) => set({ selectedDay: day }),
}));
