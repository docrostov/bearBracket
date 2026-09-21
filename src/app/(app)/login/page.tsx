"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "sending" | "sent" | "error";
type OtpStatus = "idle" | "verifying" | "error";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [otpCode, setOtpCode] = useState("");
  const [otpStatus, setOtpStatus] = useState<OtpStatus>("idle");
  const callbackFailed = useSearchParams().get("error") === "auth-callback-failed";

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
          we&apos;ll email you a link to click instead of a password.
        </p>

        {callbackFailed && status !== "sent" && (
          <p className="mt-4 rounded-md border border-danger/40 bg-danger-bg px-4 py-3 text-sm text-ink-soft">
            That sign-in link didn&apos;t work. The most common reason:
            these links only work once, and some email providers (common on
            work email) automatically open links to scan them for safety
            before you ever click — which uses up the link before you get
            to it. Request a fresh one below, then either click the link
            directly from your phone or computer&apos;s mail app, or use
            the code from that same email instead.
          </p>
        )}

        {status === "sent" ? (
          <div className="mt-6 flex flex-col gap-4">
            <p className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-ink-soft">
              Check {email} for an email from us, then click the link
              inside to finish signing in. Don&apos;t see it in a minute
              or two? Check your spam folder.
            </p>

            <form
              onSubmit={handleVerifyCode}
              className="flex flex-col gap-2 rounded-md border border-border bg-surface px-4 py-3"
            >
              <p className="text-sm text-ink-soft">
                Link not working? That same email has a code in it — enter
                it here instead:
              </p>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                placeholder="Code from the email"
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value)}
                className="rounded-md border border-border bg-cream px-3 py-2 text-sm text-ink outline-none focus:border-border-strong"
              />
              <button
                type="submit"
                disabled={otpStatus === "verifying"}
                className="self-start rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper transition-colors hover:opacity-90 disabled:opacity-50"
              >
                {otpStatus === "verifying" ? "Checking…" : "Use this code"}
              </button>
              {otpStatus === "error" && (
                <p className="text-sm text-danger">
                  That code didn&apos;t work — double check it, or request
                  a fresh link/code above.
                </p>
              )}
            </form>
          </div>
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
