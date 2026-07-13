"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sun, Camera, RefreshCw } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

type LightBand = "dark" | "low" | "medium" | "bright" | "direct";

function luxEstimateFromLuma(avg: number): number {
  // Rough relative lux proxy from 0–255 luma
  return Math.round(Math.pow(avg / 255, 2.2) * 20000);
}

function bandFromLux(lux: number): LightBand {
  if (lux < 200) return "dark";
  if (lux < 800) return "low";
  if (lux < 2500) return "medium";
  if (lux < 10000) return "bright";
  return "direct";
}

export default function LightMeterPage() {
  const { t, locale } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [lux, setLux] = useState(0);
  const [band, setBand] = useState<LightBand>("medium");
  const [running, setRunning] = useState(false);

  const labels =
    locale === "fa"
      ? {
          title: "لایت‌متر",
          subtitle: "دوربین را به سمت محل گیاه بگیرید (نه خود گیاه).",
          dark: "خیلی تاریک — فقط گیاهان سایه‌دوست",
          low: "نور کم — مناسب سانسوریا / زامیفولیا",
          medium: "نور متوسط — بیشتر گیاهان آپارتمانی",
          bright: "نور روشن غیرمستقیم — ایده‌آل پوتوس / فیکوس",
          direct: "آفتاب مستقیم — کاکتوس و گیاهان آفتاب‌دوست",
          start: "شروع سنجش",
          stop: "توقف",
          back: "بازگشت",
          tip: "نزدیک پنجره و وسط اتاق را جداگانه اندازه بگیرید.",
          camError: "دسترسی به دوربین ممکن نشد.",
        }
      : {
          title: "Light meter",
          subtitle: "Point the camera at the plant location (not the plant).",
          dark: "Very dark — shade-only plants",
          low: "Low light — snake plant / ZZ",
          medium: "Medium — most houseplants",
          bright: "Bright indirect — pothos / ficus",
          direct: "Direct sun — cactus & sun lovers",
          start: "Start measuring",
          stop: "Stop",
          back: "Back",
          tip: "Measure by the window and mid-room separately.",
          camError: "Could not access the camera.",
        };

  const bandLabel: Record<LightBand, string> = {
    dark: labels.dark,
    low: labels.low,
    medium: labels.medium,
    bright: labels.bright,
    direct: labels.direct,
  };

  const stop = useCallback(() => {
    const video = videoRef.current;
    const stream = video?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((tr) => tr.stop());
    if (video) video.srcObject = null;
    setRunning(false);
  }, []);

  const start = useCallback(async () => {
    setStreamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setRunning(true);
    } catch {
      setStreamError(labels.camError);
      setRunning(false);
    }
  }, [labels.camError]);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const tick = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState >= 2) {
        const w = 64;
        const h = 64;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, w, h);
          const data = ctx.getImageData(0, 0, w, h).data;
          let sum = 0;
          for (let i = 0; i < data.length; i += 4) {
            sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
          }
          const avg = sum / (w * h);
          const estimate = luxEstimateFromLuma(avg);
          setLux(estimate);
          setBand(bandFromLux(estimate));
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  useEffect(() => () => stop(), [stop]);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="p-2 rounded-xl hover:bg-rose-400/10 text-muted-foreground"
          aria-label={labels.back}
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-500" />
            {labels.title}
          </h1>
          <p className="text-sm text-muted-foreground">{labels.subtitle}</p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-black aspect-[3/4]">
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        {!running && (
          <div className="absolute inset-0 grid place-items-center text-white/80 text-sm p-6 text-center">
            <Camera className="w-10 h-10 mb-3 opacity-70" />
            {labels.tip}
          </div>
        )}
      </div>

      <div className="glass-card p-5 space-y-2">
        <p className="text-3xl font-extrabold tracking-tight">
          ~{lux.toLocaleString(locale === "fa" ? "fa-IR" : "en-US")} lux
        </p>
        <p className="text-sm font-medium text-foreground">{bandLabel[band]}</p>
        <p className="text-xs text-muted-foreground">{labels.tip}</p>
      </div>

      {streamError && (
        <p className="text-sm text-red-500">{streamError}</p>
      )}

      <div className="flex gap-2">
        {!running ? (
          <button type="button" className="btn-primary flex-1" onClick={start}>
            {labels.start}
          </button>
        ) : (
          <button
            type="button"
            className="btn-secondary flex-1"
            onClick={stop}
          >
            {labels.stop}
          </button>
        )}
        <button
          type="button"
          className={cn("btn-secondary px-4")}
          onClick={() => {
            stop();
            void start();
          }}
          aria-label="refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        {locale === "fa"
          ? "این یک تخمین نسبی از روشنایی فریم دوربین است، نه نورسنج کالیبره‌شده."
          : "Relative estimate from camera luma — not a calibrated lux meter."}
      </p>
      <p className="sr-only">{t.app.name}</p>
    </div>
  );
}
