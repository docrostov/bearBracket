"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Only ever reached after a human has already tapped through the
// protected /auth/confirm hop (see that page for why), so it's safe to
// complete the sign-in automatically here rather than asking for a
// second tap.
export default function AuthCallbackPage() {
  return (
    <Suspense>
      <AuthCallbackHandler />
    </Suspense>
  );
}

function AuthCallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (!code) {
      router.replace("/login?error=auth-callback-failed");
      return;
    }

    let cancelled = false;

    (async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (cancelled) return;
      if (error) {
        setErrored(true);
        router.replace("/login?error=auth-callback-failed");
      } else {
        router.replace(next);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <p className="text-sm text-ink-soft">
        {errored ? "That didn't work…" : "Signing you in…"}
      </p>
    </div>
  );
}
