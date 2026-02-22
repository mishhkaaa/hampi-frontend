"use client";

import { QueryProvider } from "@/lib/providers/query-provider";
import { AuthProvider } from "@/lib/providers/auth-provider";
import { PropertyProvider } from "@/lib/providers/property-provider";
import { AuthGuard } from "@/components/auth-guard";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <PropertyProvider>
          <AuthGuard>{children}</AuthGuard>
        </PropertyProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
