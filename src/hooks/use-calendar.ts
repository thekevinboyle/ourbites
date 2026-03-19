"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dataProvider } from "@/lib/data";
import { useCalendarStore } from "@/store/calendar-store";

export function useCalendarPosts() {
  const { currentMonth, currentYear } = useCalendarStore();
  return useQuery({
    queryKey: ["calendar", currentMonth, currentYear],
    queryFn: () => dataProvider.getCalendarPosts(currentMonth, currentYear),
  });
}

export function useReschedulePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newDate }: { id: string; newDate: Date }) =>
      dataProvider.reschedulePost(id, newDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}
