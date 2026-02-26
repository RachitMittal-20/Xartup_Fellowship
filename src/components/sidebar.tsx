"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  List,
  Bookmark,
  Radar,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

const navItems = [
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/lists", label: "Lists", icon: List },
  { href: "/saved", label: "Saved Searches", icon: Bookmark },
];

// ── Shared nav content (used by both desktop & mobile) ──

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* Logo / Brand */}
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Radar className="h-6 w-6 text-primary" />
        <span className="text-lg font-semibold tracking-tight">VC Scout</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t px-4 py-3">
        <p className="text-xs text-muted-foreground">
          Thesis: Early-stage AI &amp; Dev Infra
        </p>
      </div>
    </>
  );
}

// ── Desktop sidebar (hidden on mobile) ──

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-card md:flex">
      <SidebarContent />
    </aside>
  );
}

// ── Mobile sidebar (Sheet overlay, visible only on small screens) ──

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-60 p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="flex h-full flex-col">
          <SidebarContent onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
