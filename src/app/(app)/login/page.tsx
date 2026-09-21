"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "sending" | "sent" | "error";
type OtpStatus = "idle" | "verifying" | "error";

// Deliberately code-only, no magic link — see
// supabase/email-templates/magic-link.html for why. A clickable link in
// the email, even alongside a code, isn't safe on accounts with
// corporate link-prescanning (e.g. Microsoft Defender Safe Links): the
// scanner silently burns the shared one-time secret just by prefetching
// the link, whether or not a human ever clicks it — which broke the code
// too. No link in the email at all is the only reliable fix.
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [otpCode, setOtpCode] = useState("");
  const [otpStatus, setOtpStatus] = useState<OtpStatus>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ email });

    setStatus(error ? "error" : "sent");
  }

  async function handleVerifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOtpStatus("verifying");

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode.trim(),
      type: "email",
    });

    if (error) {
      setOtpStatus("error");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-heading text-2xl font-bold text-ink">
          Sign in or create an account
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          There&apos;s no separate registration step and no password to
          remember. Just type your email below: if you&apos;re new, this
          creates your account automatically; if you&apos;ve used
          bearBracket before, it signs you right back in. Either way,
          we&apos;ll email you a code to enter below.
        </p>

        {status === "sent" ? (
          <form
            onSubmit={handleVerifyCode}
            className="mt-6 flex flex-col gap-3"
          >
            <p className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-ink-soft">
              Check {email} for an email from us with a code inside, then
              enter it below. Don&apos;t see it in a minute or two? Check
              your spam folder.
            </p>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              placeholder="Code from the email"
              value={otpCode}
              onChange={(event) => setOtpCode(event.target.value)}
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-border-strong"
            />
            <button
              type="submit"
              disabled={otpStatus === "verifying"}
              className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {otpStatus === "verifying" ? "Checking…" : "Sign in"}
            </button>
            {otpStatus === "error" && (
              <p className="text-sm text-danger">
                That code didn&apos;t work — double check it, or go back
                and request a fresh one.
              </p>
            )}
          </form>
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
              {status === "sending" ? "Sending…" : "Email me a code"}
            </button>
            {status === "error" && (
              <p className="text-sm text-danger">
                Something went wrong sending that code. Try again, or contact the guy in the About page.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
