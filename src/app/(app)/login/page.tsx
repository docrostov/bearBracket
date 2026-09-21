"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type SendStatus = "idle" | "sending" | "sent" | "error";
type OtpStatus = "idle" | "verifying" | "error";

// Deliberately code-only for actual sign-in — no magic link. See
// supabase/email-templates/magic-link.html for why: a clickable link
// that authenticates on click, even alongside a code, isn't safe on
// accounts with corporate link-prescanning (e.g. Microsoft Defender Safe
// Links) — the scanner silently burns the shared one-time secret just by
// prefetching the link, breaking the code too. The email does link back
// to this page (plain navigation, no side effects, safe for anything to
// prefetch), which is why both forms below are always visible rather
// than the code form only appearing right after requesting one — someone
// could land here from that link on a different device/session than the
// one that requested the code.
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sendStatus, setSendStatus] = useState<SendStatus>("idle");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpStatus, setOtpStatus] = useState<OtpStatus>("idle");

  async function handleSendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSendStatus("sending");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ email });

    setSendStatus(error ? "error" : "sent");
    if (!error) setOtpEmail(email);
  }

  async function handleVerifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOtpStatus("verifying");

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: otpEmail,
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
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="font-heading text-2xl font-bold text-ink">
          Sign in or create an account
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          There&apos;s no separate registration step and no password to
          remember. Enter your email below to get a one-time code, then
          enter that code to sign in.
        </p>

        <form onSubmit={handleSendCode} className="mt-6 flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-ink-soft">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-border-strong"
            />
          </label>
          <button
            type="submit"
            disabled={sendStatus === "sending"}
            className="self-start rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {sendStatus === "sending" ? "Sending…" : "Email me a code"}
          </button>
          {sendStatus === "sent" && (
            <p className="text-sm text-success">
              Code sent to {email} — check your inbox (and spam folder).
            </p>
          )}
          {sendStatus === "error" && (
            <p className="text-sm text-danger">
              Something went wrong sending that code. Try again, or contact the guy in the About page.
            </p>
          )}
        </form>

        <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6">
          <p className="text-sm font-medium text-ink-soft">
            Already have a code?
          </p>
          <form onSubmit={handleVerifyCode} className="flex flex-col gap-3">
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="Email the code was sent to"
              value={otpEmail}
              onChange={(event) => setOtpEmail(event.target.value)}
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-border-strong"
            />
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
              className="self-start rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {otpStatus === "verifying" ? "Checking…" : "Sign in with code"}
            </button>
            {otpStatus === "error" && (
              <p className="text-sm text-danger">
                That code didn&apos;t work — double check it, or request a
                fresh one above.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
