"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/providers/auth-provider";
import { authApi } from "@/lib/api/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, setAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (pathname === "/login") {
      setChecking(false);
      return;
    }

    const checkAuth = async () => {
      try {
        await authApi.refresh();
        setAuthenticated(true);
      } catch {
        setAuthenticated(false);
        router.replace("/login");
      } finally {
        setChecking(false);
      }
    };

    checkAuth();
  }, [pathname, router, setAuthenticated]);

  if (pathname === "/login") return <>{children}</>;

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
