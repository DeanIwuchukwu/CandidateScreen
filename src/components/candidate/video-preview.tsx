"use client";

import { useEffect, useRef } from "react";
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
  const ref = useRef<HTMLVideoElement>(null);
  const url = blob ? URL.createObjectURL(blob) : null;

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  if (!url) return null;

  return <video ref={ref} src={url} controls className={cn("object-cover", className)} />;
}
