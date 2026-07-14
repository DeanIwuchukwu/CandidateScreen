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
}: {
  blob: Blob | null;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
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

  if (!blob) {
    return (
      <div
        className={cn(
          "grid place-items-center bg-black text-sm font-medium text-white/70",
          className,
        )}
      >
        Processing recording…
      </div>
    );
  }

  if (!url) {
    return (
      <div
        className={cn(
          "grid place-items-center bg-black text-sm font-medium text-white/70",
          className,
        )}
      >
        Loading playback…
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
    />
  );
}
