"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SyncButton } from "./sync-button";

export const navItems = [
  { href: "/", label: "Overview", icon: "/" },
  { href: "/ideas", label: "Ideas", icon: "/" },
  { href: "/instagram", label: "Instagram", icon: "/" },
  { href: "/tiktok", label: "TikTok", icon: "/" },
  { href: "/analytics", label: "Analytics", icon: "/" },
  { href: "/calendar", label: "Calendar", icon: "/" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r-4 border-primary bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <h1 className="text-2xl font-display font-black uppercase tracking-tight">
          OurBiteMarks
        </h1>
      </div>
      <nav className="flex-1 space-y-0.5 p-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-xs font-medium uppercase tracking-widest transition-colors",
              pathname === item.href
                ? "border-l-[3px] border-primary text-primary"
                : "border-l-[3px] border-transparent text-sidebar-foreground/60 hover:text-sidebar-foreground hover:border-sidebar-foreground/30"
            )}
          >
            <span className="text-[10px]">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <SyncButton />
    </aside>
  );
}
