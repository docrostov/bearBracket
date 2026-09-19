"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updateDisplayName } from "@/app/profile/actions";

export default function ProfileForm({
  initialDisplayName,
}: {
  initialDisplayName: string;
}) {
  const [name, setName] = useState(initialDisplayName);
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
        await updateDisplayName(name);
        setSaved(true);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Display name
        </span>
        <input
          type="text"
          required
          maxLength={40}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </label>
      <p className="text-xs text-zinc-500 dark:text-zinc-500">
        Visible to everyone else once brackets lock. Can&apos;t look like an
        email address.
      </p>
      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
      >
        {isPending ? "Saving…" : "Save"}
      </button>
      {saved && !error && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          Saved.
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </form>
  );
}
