"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProperty } from "@/lib/providers/property-provider";
import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { selectedPropertyId } = useProperty();
  const router = useRouter();

  useEffect(() => {
    if (!selectedPropertyId) {
      router.replace("/properties");
    }
  }, [selectedPropertyId, router]);

  if (!selectedPropertyId) return null;

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
