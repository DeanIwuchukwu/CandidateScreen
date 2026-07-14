"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function VideoPreview({
  stream,
  className,
  mirrored = true,
}: {
  stream: MediaStream | null;
  className?: string;
  mirrored?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) {
    return (
      <div
        className={cn(
          "bg-gradient-to-br from-[#6E7C6F] via-[#4C574E] to-[#333B35]",
          className,
        )}
      />
    );
  }

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted
      className={cn("object-cover", mirrored && "scale-x-[-1]", className)}
    />
  );
}

export function RecordedPlayback({
  blob,
  className,
  onDecodeError,
  emptyMessage,
}: {
  blob: Blob | null;
  className?: string;
  onDecodeError?: () => void;
  /** Shown instead of “Processing…” when there is no blob (e.g. failed take). */
  emptyMessage?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    if (!blob || blob.size === 0) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [blob]);

  if (!blob || blob.size === 0) {
    return (
      <div
        className={cn(
          "grid place-items-center bg-black px-4 text-center text-sm font-medium text-white/70",
          className,
        )}
      >
        {emptyMessage ?? "Processing recording…"}
      </div>
    );
  }

  if (failed || !url) {
    return (
      <div
        className={cn(
          "grid place-items-center bg-black px-4 text-center text-sm font-medium text-white/80",
          className,
        )}
      >
        {failed
          ? "This take couldn’t be played. Please re-record."
          : "Loading playback…"}
      </div>
    );
  }

  return (
    <video
      key={url}
      src={url}
      controls
      playsInline
      preload="auto"
      className={cn("object-cover", className)}
      onError={() => {
        setFailed(true);
        onDecodeError?.();
      }}
    />
  );
}
