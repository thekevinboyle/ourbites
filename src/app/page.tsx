import { Header } from "@/components/layout/header";

export default function HomePage() {
  return (
    <div>
      <Header title="Overview" />
      <div className="p-6 space-y-2">
        <p className="text-2xl md:text-3xl font-display font-black uppercase tracking-tight">
          Welcome to OurBiteMarks.
        </p>
        <p className="text-sm text-muted-foreground uppercase tracking-wide">
          Select a section from the sidebar to get started.
        </p>
      </div>
    </div>
  );
}
