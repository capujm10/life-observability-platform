"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError } from "@/lib/api";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Input } from "@/components/input";
import { useAuth } from "@/hooks/use-auth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("demo@personalos.local");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="relative overflow-hidden bg-[var(--panel-strong)] p-8 lg:p-12">
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-r from-[var(--accent-soft)] via-transparent to-[var(--danger-soft)]" />
          <div className="relative space-y-10">
            <div className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-[0.34em] text-[var(--muted)]">
                Life Observability Platform
              </div>
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-[var(--text)] lg:text-5xl">
                Observe your life with the clarity of an operating system.
              </h1>
              <p className="max-w-xl text-base leading-7 text-[var(--muted)]">
                Tasks, habits, journal signals, project health, weekly insights, and GitHub activity in one focused workspace.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["Tasks", "Track work, due dates, and priority signals."],
                ["Habits", "Keep streaks visible without noisy gamification."],
                ["Insights", "Read metrics, weekly trends, and delivery momentum."],
              ].map(([title, description]) => (
                <div key={title} className="rounded-[24px] border border-[var(--border)] bg-[var(--panel)] p-5">
                  <div className="text-sm font-semibold text-[var(--text)]">{title}</div>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="flex flex-col justify-center bg-[var(--panel)] p-8 lg:p-10">
          <div className="mb-8 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">Sign in</div>
            <h2 className="text-3xl font-semibold tracking-tight text-[var(--text)]">Open the platform</h2>
            <p className="text-sm leading-6 text-[var(--muted)]">
              Demo credentials are prefilled so you can review the seeded platform state immediately.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--text)]">Email</span>
              <Input onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--text)]">Password</span>
              <Input onChange={(event) => setPassword(event.target.value)} type="password" value={password} />
            </label>

            {error ? (
              <div className="rounded-2xl bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
                {error}
              </div>
            ) : null}

            <Button className="w-full" disabled={submitting} type="submit">
              {submitting ? "Signing in..." : "Enter the dashboard"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
