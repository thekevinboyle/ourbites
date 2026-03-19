import { Header } from "@/components/layout/header";
import { PlatformManager } from "@/components/posts/platform-manager";

export default function TikTokPage() {
  return (
    <div>
      <Header title="TikTok" />
      <div className="p-6">
        <PlatformManager platform="tiktok" />
      </div>
    </div>
  );
}
