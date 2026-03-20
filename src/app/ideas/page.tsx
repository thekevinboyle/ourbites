import { Header } from "@/components/layout/header";
import { IdeasBoard } from "@/components/ideas/ideas-board";

export default function IdeasPage() {
  return (
    <div>
      <Header title="Ideas" />
      <div className="p-6">
        <IdeasBoard />
      </div>
    </div>
  );
}
