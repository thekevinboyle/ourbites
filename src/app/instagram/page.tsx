import { Header } from "@/components/layout/header";
import { PlatformManager } from "@/components/posts/platform-manager";

export default function InstagramPage() {
  return (
    <div>
      <Header title="Instagram" />
      <div className="p-6">
        <PlatformManager platform="instagram" />
      </div>
    </div>
  );
}
