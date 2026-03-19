"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SyncButton } from "./sync-button";

const navItems = [
  { href: "/", label: "Overview", icon: "📊" },
  { href: "/instagram", label: "Instagram", icon: "📸" },
  { href: "/tiktok", label: "TikTok", icon: "🎵" },
  { href: "/analytics", label: "Analytics", icon: "📈" },
  { href: "/calendar", label: "Calendar", icon: "📅" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-6">
        <h1 className="text-lg font-semibold">OurBites</h1>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <SyncButton />
    </aside>
  );
}
