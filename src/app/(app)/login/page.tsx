"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "sending" | "sent" | "error";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setStatus(error ? "error" : "sent");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-heading text-2xl font-bold text-ink">Sign in</h1>
        <p className="mt-2 text-sm text-ink-soft">
          No password needed &mdash; we&apos;ll email you a sign-in link.
        </p>

        {status === "sent" ? (
          <p className="mt-6 rounded-md border border-border bg-surface px-4 py-3 text-sm text-ink-soft">
            Check {email} for a sign-in link.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-border-strong"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {status === "sending" ? "Sending…" : "Send sign-in link"}
            </button>
            {status === "error" && (
              <p className="text-sm text-danger">
                Something went wrong sending that link. Try again, or contact the guy in the About page.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
