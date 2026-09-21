"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Where Supabase redirects the browser after the user clicks their
// magic-link email. Deliberately does NOT exchange the one-time code
// automatically on page load — corporate email security (e.g. Microsoft
// Defender Safe Links, common on work/O365 accounts) pre-fetches every
// link in incoming mail to scan it for safety before the human ever
// clicks, which would otherwise burn the single-use code before it's
// actually used. Scanners fetch URLs; they don't click buttons — so
// requiring an explicit tap here keeps the link alive until a real
// person acts on it.
export default function AuthCallbackPage() {
  return (
    <Suspense>
      <AuthCallbackForm />
    </Suspense>
  );
}

function AuthCallbackForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const [status, setStatus] = useState<"idle" | "working">("idle");

  async function handleConfirm() {
    if (!code) return;
    setStatus("working");

    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      router.push("/login?error=auth-callback-failed");
      return;
    }

    router.push(next);
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="font-heading text-2xl font-bold text-ink">
          One more step
        </h1>

        {code ? (
          <>
            <p className="mt-2 text-sm text-ink-soft">
              Tap below to finish signing in to bearBracket.
            </p>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={status === "working"}
              className="mt-6 rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {status === "working" ? "Signing in…" : "Finish signing in"}
            </button>
            <p className="mt-4 text-xs text-muted">
              We ask for one tap here instead of signing you in
              automatically, since some email providers open links to
              scan them for safety before you click — which would
              otherwise use up a one-time link before you get to it.
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-ink-soft">
            This link looks incomplete.{" "}
            <Link href="/login" className="underline">
              Request a new one
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
