import { Header } from "@/components/layout/header";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { CalendarFilters } from "@/components/calendar/calendar-filters";

export default function CalendarPage() {
  return (
    <div>
      <Header title="Content Calendar" />
      <div className="space-y-4 p-6">
        <CalendarFilters />
        <CalendarGrid />
      </div>
    </div>
  );
}
