"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// The email link points HERE instead of straight to Supabase's own verify
// endpoint, with the real one-time confirmation URL embedded in the URL
// FRAGMENT (after #) rather than as a clickable link or query param.
// Fragments are never sent in an HTTP request to any server — not even
// this one — so an automated link-scanner (Microsoft Defender Safe Links
// and similar, common on work/O365 email) that prefetches this page only
// ever sees this static shell. The real single-use URL only becomes
// reachable to client-side JS once an actual browser loads the page,
// which is why gating the *next* hop (/auth/callback) behind a click
// wasn't enough on its own — Supabase's verify endpoint, which is what
// actually burns the token, was being hit a step earlier than that.
export default function AuthConfirmPage() {
  const [status, setStatus] = useState<"loading" | "ready" | "missing">(
    "loading"
  );
  const [confirmationUrl, setConfirmationUrl] = useState<string | null>(null);

  useEffect(() => {
    const fragment = window.location.hash.slice(1);
    if (fragment) {
      setConfirmationUrl(fragment);
      setStatus("ready");
    } else {
      setStatus("missing");
    }
  }, []);

  function handleContinue() {
    if (confirmationUrl) {
      window.location.href = confirmationUrl;
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="font-heading text-2xl font-bold text-ink">
          One more step
        </h1>

        {status === "ready" && (
          <>
            <p className="mt-2 text-sm text-ink-soft">
              Tap below to finish signing in to bearBracket.
            </p>
            <button
              type="button"
              onClick={handleContinue}
              className="mt-6 rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper transition-colors hover:opacity-90"
            >
              Continue
            </button>
            <p className="mt-4 text-xs text-muted">
              We ask for one tap here instead of signing you in
              automatically, since some email providers open links to
              scan them for safety before you click — which would
              otherwise use up a one-time link before you get to it.
            </p>
          </>
        )}

        {status === "missing" && (
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
