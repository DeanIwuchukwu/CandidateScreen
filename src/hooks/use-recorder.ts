"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useMediaDevices() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [cameraId, setCameraId] = useState("");
  const [micId, setMicId] = useState("");

  const refresh = useCallback(async () => {
    const list = await navigator.mediaDevices.enumerateDevices();
    setDevices(list);
    const cams = list.filter((d) => d.kind === "videoinput");
    const mics = list.filter((d) => d.kind === "audioinput");
    if (!cameraId && cams[0]) setCameraId(cams[0].deviceId);
    if (!micId && mics[0]) setMicId(mics[0].deviceId);
  }, [cameraId, micId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    devices,
    cameras: devices.filter((d) => d.kind === "videoinput"),
    mics: devices.filter((d) => d.kind === "audioinput"),
    cameraId,
    micId,
    setCameraId,
    setMicId,
    refresh,
  };
}

export function useMediaStream(cameraId: string, micId: string, enabled: boolean) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setStream(null);
      return;
    }

    let active = true;
    setError(null);

    navigator.mediaDevices
      .getUserMedia({
        video: cameraId ? { deviceId: { exact: cameraId } } : true,
        audio: micId ? { deviceId: { exact: micId } } : true,
      })
      .then((s) => {
        if (active) setStream(s);
      })
      .catch(() => {
        if (active) setError("denied");
      });

    return () => {
      active = false;
    };
  }, [cameraId, micId, enabled]);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  return { stream, error };
}

export function useAudioLevel(stream: MediaStream | null) {
  const [levels, setLevels] = useState<number[]>([0.2, 0.2, 0.2, 0.2, 0.2]);
  const raf = useRef<number>(0);

  useEffect(() => {
    if (!stream) return;
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length / 255;
      setLevels(Array.from({ length: 5 }, (_, i) => 0.15 + avg * (0.5 + i * 0.12)));
      raf.current = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf.current);
      ctx.close();
    };
  }, [stream]);

  return levels;
}

export function useMediaRecorder(stream: MediaStream | null) {
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stopResolver = useRef<((blob: Blob | null) => void) | null>(null);
  const generation = useRef(0);
  const [recording, setRecording] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timer = useRef<number>(0);

  const start = useCallback(() => {
    if (!stream) return;
    chunks.current = [];
    setBlob(null);
    setElapsed(0);
    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : "video/webm";
    const myGen = ++generation.current;
    const mr = new MediaRecorder(stream, { mimeType: mime });
    mr.ondataavailable = (e) => {
      if (myGen !== generation.current) return;
      if (e.data.size > 0) chunks.current.push(e.data);
    };
    mr.onstop = () => {
      if (myGen !== generation.current) return;
      const nextBlob =
        chunks.current.length > 0
          ? new Blob(chunks.current, { type: "video/webm" })
          : null;
      setBlob(nextBlob);
      setRecording(false);
      window.clearInterval(timer.current);
      stopResolver.current?.(nextBlob);
      stopResolver.current = null;
    };
    mr.start(250);
    recorder.current = mr;
    setRecording(true);
    timer.current = window.setInterval(() => setElapsed((e) => e + 1), 1000);
  }, [stream]);

  const stop = useCallback(() => {
    return new Promise<Blob | null>((resolve) => {
      const mr = recorder.current;
      if (!mr || mr.state === "inactive") {
        resolve(null);
        return;
      }
      stopResolver.current = resolve;
      try {
        if (mr.state === "recording") mr.requestData();
      } catch {
        /* some browsers throw if requestData is unavailable mid-stop */
      }
      mr.stop();
    });
  }, []);

  /** Stop the current take without using it, then start a fresh recording. */
  const restart = useCallback(() => {
    generation.current += 1;
    const mr = recorder.current;
    if (mr && mr.state !== "inactive") {
      try {
        mr.ondataavailable = () => {};
        mr.onstop = () => {};
        mr.stop();
      } catch {
        /* ignore */
      }
    }
    stopResolver.current?.(null);
    stopResolver.current = null;
    window.clearInterval(timer.current);
    recorder.current = null;
    chunks.current = [];
    setBlob(null);
    setElapsed(0);
    setRecording(false);

    // Defer so the previous recorder fully releases before opening a new one
    window.setTimeout(() => {
      if (!stream) return;
      start();
    }, 50);
  }, [stream, start]);

  const reset = useCallback(() => {
    setBlob(null);
    setElapsed(0);
    chunks.current = [];
  }, []);

  return { recording, blob, elapsed, start, stop, reset, restart };
}

export function useCountdown(seconds: number, active: boolean, onComplete: () => void) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (!active) {
      setRemaining(seconds);
      return;
    }
    setRemaining(seconds);
    const id = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(id);
          onComplete();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [active, seconds, onComplete]);

  return remaining;
}

export function formatTime(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
