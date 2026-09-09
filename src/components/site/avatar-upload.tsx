"use client";

import * as React from "react";
import { useActionState } from "react";
import { Camera, Loader2 } from "lucide-react";

import { uploadAvatar, type AvatarFormState } from "@/app/profile/actions";

export function AvatarUpload({
  initialUrl,
  displayLabel,
}: {
  initialUrl: string | null;
  displayLabel: string;
}) {
  const [state, formAction, isPending] = useActionState<AvatarFormState, FormData>(
    uploadAvatar,
    {},
  );
  const [preview, setPreview] = React.useState<string | null>(initialUrl);
  const formRef = React.useRef<HTMLFormElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Fall back to the last confirmed avatar if the upload failed, so a
  // rejected file doesn't leave a "successful-looking" preview behind.
  const displayedUrl = state.error ? initialUrl : preview;

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    formRef.current?.requestSubmit();
  }

  const initial = displayLabel.charAt(0).toUpperCase() || "?";

  return (
    <form ref={formRef} action={formAction} className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative size-28 shrink-0 overflow-hidden rounded-full border-2 border-border transition-colors hover:border-primary"
        aria-label="Change avatar"
      >
        {displayedUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar can be a local blob: preview before upload finishes
          <img src={displayedUrl} alt="" className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center bg-muted font-display text-3xl text-muted-foreground">
            {initial}
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          {isPending ? (
            <Loader2 className="size-6 animate-spin text-white" />
          ) : (
            <Camera className="size-6 text-white" />
          )}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        name="avatar"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleFileChange}
        className="sr-only"
      />
      <p className="text-xs text-muted-foreground">
        {state.error ? (
          <span className="text-destructive">{state.error}</span>
        ) : (
          "Click to change avatar"
        )}
      </p>
    </form>
  );
}
