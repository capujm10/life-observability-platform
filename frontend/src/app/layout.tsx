import type { Metadata } from "next";

import { Providers } from "@/components/providers";
import { RouteShell } from "@/components/route-shell";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Life Observability Platform",
    template: "%s | Life Observability Platform",
  },
  description:
    "A personal analytics workspace for tasks, habits, journals, projects, weekly insights, and GitHub activity.",
  applicationName: "Life Observability Platform",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <RouteShell>{children}</RouteShell>
        </Providers>
      </body>
    </html>
  );
}
