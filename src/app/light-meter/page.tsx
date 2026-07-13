"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Sun, Camera, RefreshCw } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

type LightBand = "dark" | "low" | "medium" | "bright" | "direct";

/**
 * Camera auto-exposure collapses absolute lux. We report:
 * 1) Sensor lux when AmbientLightSensor is available
 * 2) Otherwise a 0–100 brightness index from luma + EV-style gamma
 * and map both onto plant-care bands.
 */
function brightnessIndexFromLuma(avg: number): number {
  // Emphasize mid-tones so indoor differences are visible despite AE
  const n = Math.max(0, Math.min(1, avg / 255));
  return Math.round(Math.pow(n, 1.35) * 100);
}

function bandFromIndex(index: number): LightBand {
  if (index < 12) return "dark";
  if (index < 28) return "low";
  if (index < 52) return "medium";
  if (index < 78) return "bright";
  return "direct";
}

function bandFromSensorLux(lux: number): LightBand {
  if (lux < 50) return "dark";
  if (lux < 250) return "low";
  if (lux < 1000) return "medium";
  if (lux < 5000) return "bright";
  return "direct";
}

export default function LightMeterPage() {
  const { t, locale, direction } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [sensorLux, setSensorLux] = useState<number | null>(null);
  const [band, setBand] = useState<LightBand>("medium");
  const [running, setRunning] = useState(false);
  const [source, setSource] = useState<"sensor" | "camera">("camera");

  const fa = locale === "fa";
  const BackIcon = direction === "rtl" ? ArrowRight : ArrowLeft;

  const labels = {
    title: fa ? "لایت‌متر" : "Light meter",
    subtitle: fa
      ? "دوربین را به محل قرارگیری گیاه بگیرید (نه خود گیاه). از سقف و لامپ مستقیم دوری کنید."
      : "Point at the plant’s spot (not the plant). Avoid pointing at lamps or the ceiling.",
    dark: fa
      ? "خیلی تاریک — فقط سایه‌دوست‌ها (زامیفولیا / سانسوریا)"
      : "Very dark — shade-only (ZZ / snake plant)",
    low: fa
      ? "نور کم — گیاهان مقاوم به سایه"
      : "Low light — shade-tolerant plants",
    medium: fa
      ? "نور متوسط — بیشتر گیاهان آپارتمانی"
      : "Medium — most houseplants",
    bright: fa
      ? "نور روشن غیرمستقیم — ایده‌آل پوتوس / فیکوس / دیفنباخیا"
      : "Bright indirect — pothos / ficus",
    direct: fa
      ? "آفتاب مستقیم / خیلی روشن — کاکتوس و گیاهان آفتاب‌دوست"
      : "Direct / very bright — cactus & sun lovers",
    start: fa ? "شروع سنجش" : "Start measuring",
    stop: fa ? "توقف" : "Stop",
    back: fa ? "بازگشت" : "Back",
    tip: fa
      ? "برای دقت بیشتر: یک کاغذ سفید را در محل گیاه بگیرید و اندازه بگیرید. نزدیک پنجره و وسط اتاق را جداگانه چک کنید."
      : "For better accuracy, measure a white paper at the plant spot. Check window vs mid-room separately.",
    camError: fa ? "دسترسی به دوربین ممکن نشد." : "Could not access the camera.",
    indexLabel: fa ? "شاخص روشنایی" : "Brightness index",
    luxLabel: fa ? "نورسنج دستگاه" : "Device light sensor",
    recommend: fa ? "پیشنهاد گیاه برای این نور" : "Recommend plants for this light",
    calibrate: fa
      ? "دوربین گوشی نور مطلق را دقیق نمی‌سنجد؛ باند مراقبتی مهم‌تر از عدد است."
      : "Phone cameras are not calibrated lux meters — the care band matters more than the number.",
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
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Best-effort continuous exposure
      const track = stream.getVideoTracks()[0];
      try {
        await track?.applyConstraints({
          advanced: [{ exposureMode: "continuous" } as MediaTrackConstraintSet],
        });
      } catch {
        /* ignore unsupported constraints */
      }

      setRunning(true);
    } catch {
      setStreamError(labels.camError);
      setRunning(false);
    }
  }, [labels.camError]);

  // Ambient Light Sensor when available (more trustworthy than camera AE)
  useEffect(() => {
    if (!running) return;
    type ALS = {
      illuminance: number;
      start: () => void;
      stop: () => void;
      addEventListener: (type: string, cb: () => void) => void;
      removeEventListener: (type: string, cb: () => void) => void;
    };
    const SensorCtor = (
      window as unknown as { AmbientLightSensor?: new (opts?: { frequency?: number }) => ALS }
    ).AmbientLightSensor;
    if (!SensorCtor) return;

    let sensor: ALS | null = null;
    try {
      sensor = new SensorCtor({ frequency: 4 });
      const onReading = () => {
        const lux = sensor?.illuminance ?? 0;
        setSensorLux(Math.round(lux));
        setSource("sensor");
        setBand(bandFromSensorLux(lux));
      };
      sensor.addEventListener("reading", onReading);
      sensor.start();
      return () => {
        try {
          sensor?.removeEventListener("reading", onReading);
          sensor?.stop();
        } catch {
          /* ignore */
        }
      };
    } catch {
      return;
    }
  }, [running]);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const tick = () => {
      if (source === "sensor" && sensorLux != null) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState >= 2) {
        const w = 96;
        const h = 96;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          // Sample center 50% to avoid dark edges / vignette
          const sx = video.videoWidth * 0.25;
          const sy = video.videoHeight * 0.25;
          const sw = video.videoWidth * 0.5;
          const sh = video.videoHeight * 0.5;
          ctx.drawImage(video, sx, sy, sw, sh, 0, 0, w, h);
          const data = ctx.getImageData(0, 0, w, h).data;
          let sum = 0;
          for (let i = 0; i < data.length; i += 4) {
            sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
          }
          const avg = sum / (w * h);
          const next = brightnessIndexFromLuma(avg);
          setIndex(next);
          setSource("camera");
          setBand(bandFromIndex(next));
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, source, sensorLux]);

  useEffect(() => () => stop(), [stop]);

  const recommendHref = `/recommend?light=${band}`;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="p-2 rounded-xl hover:bg-rose-400/10 text-muted-foreground"
          aria-label={labels.back}
        >
          <BackIcon className="w-5 h-5" />
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
        <div className="pointer-events-none absolute inset-[18%] rounded-2xl border-2 border-white/50" />
        {!running && (
          <div className="absolute inset-0 grid place-items-center text-white/80 text-sm p-6 text-center">
            <Camera className="w-10 h-10 mb-3 opacity-70" />
            {labels.tip}
          </div>
        )}
      </div>

      <div className="glass-card p-5 space-y-2">
        {source === "sensor" && sensorLux != null ? (
          <p className="text-3xl font-extrabold tracking-tight">
            {sensorLux.toLocaleString(fa ? "fa-IR" : "en-US")}{" "}
            <span className="text-base font-semibold text-muted-foreground">lux</span>
          </p>
        ) : (
          <p className="text-3xl font-extrabold tracking-tight">
            {index.toLocaleString(fa ? "fa-IR" : "en-US")}
            <span className="text-base font-semibold text-muted-foreground"> / 100</span>
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {source === "sensor" ? labels.luxLabel : labels.indexLabel}
        </p>
        <p className="text-sm font-medium text-foreground">{bandLabel[band]}</p>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full transition-all",
              band === "dark" && "bg-slate-500 w-[10%]",
              band === "low" && "bg-amber-700/70 w-[28%]",
              band === "medium" && "bg-amber-500 w-[52%]",
              band === "bright" && "bg-yellow-400 w-[78%]",
              band === "direct" && "bg-orange-400 w-full"
            )}
          />
        </div>
        <p className="text-xs text-muted-foreground">{labels.tip}</p>
      </div>

      {streamError && <p className="text-sm text-red-500">{streamError}</p>}

      <div className="flex gap-2">
        {!running ? (
          <button type="button" className="btn-primary flex-1" onClick={start}>
            {labels.start}
          </button>
        ) : (
          <button type="button" className="btn-secondary flex-1" onClick={stop}>
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
          aria-label={fa ? "اندازه‌گیری دوباره" : "refresh"}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <Link href={recommendHref} className="btn-primary w-full inline-flex justify-center">
        {labels.recommend}
      </Link>

      <p className="text-[11px] text-muted-foreground">{labels.calibrate}</p>
      <p className="sr-only">{t.app.name}</p>
    </div>
  );
}
