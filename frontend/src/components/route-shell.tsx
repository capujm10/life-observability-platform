"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { LoadingPanel } from "@/components/loading-panel";
import { useAuth } from "@/hooks/use-auth";

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/tasks": "Tasks",
  "/habits": "Habits",
  "/journal": "Journal",
  "/projects": "Projects",
  "/metrics": "Metrics",
  "/weekly-summary": "Weekly Summary",
  "/settings": "Settings",
  "/login": "Sign In",
};

function getDocumentTitle(pathname: string) {
  const routeTitle = routeTitles[pathname];
  if (!routeTitle) {
    return "Life Observability Platform";
  }
  return `${routeTitle} | Life Observability Platform`;
}

export function RouteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, user } = useAuth();
  const isLoginRoute = pathname === "/login";

  useEffect(() => {
    document.title = getDocumentTitle(pathname);
  }, [pathname]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!user && !isLoginRoute) {
      router.replace("/login");
      return;
    }

    if (user && isLoginRoute) {
      router.replace("/dashboard");
    }
  }, [isLoginRoute, ready, router, user]);

  if (!ready) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl items-center px-4">
        <LoadingPanel label="Loading Life Observability Platform..." />
      </div>
    );
  }

  if (!user && !isLoginRoute) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl items-center px-4">
        <LoadingPanel label="Redirecting to sign in..." />
      </div>
    );
  }

  if (isLoginRoute) {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}
