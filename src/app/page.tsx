import { Header } from "@/components/layout/header";

export default function HomePage() {
  return (
    <div>
      <Header title="Overview" />
      <div className="p-6">
        <p className="text-muted-foreground">
          Welcome to OurBites. Select a section from the sidebar.
        </p>
      </div>
    </div>
  );
}
