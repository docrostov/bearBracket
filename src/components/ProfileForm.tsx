"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/(app)/profile/actions";
import EmojiPicker from "./EmojiPicker";

export default function ProfileForm({
  initialDisplayName,
  initialEmoji,
}: {
  initialDisplayName: string;
  initialEmoji: string | null;
}) {
  const [name, setName] = useState(initialDisplayName);
  const [emoji, setEmoji] = useState<string | null>(initialEmoji);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateProfile(name, emoji);
        setSaved(true);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-ink-soft">
          Display name
        </span>
        <input
          type="text"
          required
          maxLength={40}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-border-strong"
        />
      </label>
      <p className="-mt-2 text-xs text-muted">
        Visible to everyone else once brackets lock. Can&apos;t look like an
        email address.
      </p>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-ink-soft">
          Leaderboard emoji (optional)
        </span>
        <EmojiPicker value={emoji} onChange={setEmoji} />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper transition-colors hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Save"}
      </button>
      {saved && !error && (
        <p className="text-sm text-success">Saved.</p>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  );
}
