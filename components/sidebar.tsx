"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/providers/auth-provider";
import { useProperty } from "@/lib/providers/property-provider";
import {
  LayoutDashboard,
  BedDouble,
  Layers,
  DollarSign,
  CalendarDays,
  BookOpen,
  Users,
  Shield,
  Wrench,
  Building2,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/rooms", label: "Rooms", icon: BedDouble },
  { href: "/room-types", label: "Room Types", icon: Layers },
  { href: "/rate-plans", label: "Rate Plans", icon: DollarSign },
  { href: "/availability", label: "Availability", icon: CalendarDays },
  { href: "/bookings", label: "Bookings", icon: BookOpen },
  { href: "/users", label: "Users", icon: Users },
  { href: "/roles", label: "Roles", icon: Shield },
  { href: "/maintenance", label: "Maintenance", icon: Wrench },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { selectedPropertyId, clearProperty } = useProperty();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Building2 className="h-6 w-6 text-sidebar-primary" />
        <span className="text-lg font-bold text-sidebar-primary">HMS</span>
      </div>

      {selectedPropertyId && (
        <div className="border-b px-4 py-2">
          <button
            onClick={clearProperty}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-3 w-3" />
            Switch Property
          </button>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-sidebar-foreground"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
