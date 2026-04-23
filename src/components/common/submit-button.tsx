"use client";

import { useFormStatus } from "react-dom";

type Props = {
  label: string;
  pendingLabel: string;
  className?: string;
};

export function SubmitButton({ label, pendingLabel, className = "tm-btn tm-btn-primary w-full" }: Props) {
  const { pending } = useFormStatus();

  return (
    <button
      className={`${className} disabled:opacity-60 disabled:cursor-not-allowed`}
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {pendingLabel}
        </span>
      ) : label}
    </button>
  );
}
