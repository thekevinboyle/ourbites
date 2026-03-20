"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { navItems } from "./sidebar";
import { SyncButton } from "./sync-button";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center border-b-4 border-primary bg-sidebar px-4 md:hidden">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setOpen(true)}
          aria-label="Open navigation menu"
          className="text-sidebar-foreground hover:text-primary"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="ml-3 text-xl font-display font-black uppercase tracking-tight text-sidebar-foreground">
          OurBiteMarks
        </h1>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar text-sidebar-foreground border-r-4 border-primary">
          <SheetHeader className="border-b border-sidebar-border px-6">
            <SheetTitle className="text-2xl font-display font-black uppercase tracking-tight text-sidebar-foreground">
              OurBiteMarks
            </SheetTitle>
          </SheetHeader>
          <nav className="flex-1 space-y-0.5 p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
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
        </SheetContent>
      </Sheet>
    </>
  );
}
