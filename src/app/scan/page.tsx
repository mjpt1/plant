"use client";

import { useState, useRef, useCallback, useEffect, type DragEvent } from "react";
import Link from "next/link";
import {
  Camera,
  Upload,
  RotateCcw,
  Loader2,
  Leaf,
  Droplets,
  Sun,
  Shovel,
  AlertTriangle,
  CheckCircle2,
  Save,
  Thermometer,
  History,
  FlaskConical,
  ImageIcon,
  LogIn,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useLocaleFormat } from "@/hooks/useLocaleFormat";
import { MAX_IMAGE_BYTES } from "@/lib/image-validation";
import { compressImageDataUrl, isPersistedImageUrl } from "@/lib/image-compress";
import { ScanThumbnail } from "@/components/scan/ScanThumbnail";
import { cn } from "@/lib/utils";
import { localizePlantName } from "@/lib/plant-locale";
import { getHealthStatusLabel } from "@/lib/healthStatus";
import { formatDate } from "@/utils/dateHelper";
import { toast } from "sonner";
import type { PlantAnalysis, ImageScanType } from "@/types/analysis";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type ScanStep = "capture" | "analyzing" | "results";
type ResultTab = "plant" | "health" | "care" | "treatment";

const ANALYSIS_STEPS = ["uploading", "identifying", "diagnosing", "generating"] as const;

function getScanPlantName(
  plant: PlantAnalysis["plant"] | undefined,
  locale: "en" | "fa"
): string {
  if (!plant) return "—";
  if (locale === "fa") {
    return plant.commonNameFa || plant.commonName || plant.commonNameEn || "—";
  }
  return plant.commonNameEn || plant.commonName || plant.commonNameFa || "—";
}

const IMAGE_TYPES: { id: ImageScanType; labelEn: string; labelFa: string }[] = [
  { id: "full_plant", labelEn: "Full plant", labelFa: "کل گیاه" },
  { id: "leaf", labelEn: "Leaf", labelFa: "برگ" },
  { id: "stem", labelEn: "Stem", labelFa: "ساقه" },
  { id: "flower", labelEn: "Flower", labelFa: "گل" },
  { id: "fruit", labelEn: "Fruit", labelFa: "میوه" },
  { id: "root", labelEn: "Root", labelFa: "ریشه" },
  { id: "soil", labelEn: "Soil", labelFa: "خاک" },
  { id: "pest", labelEn: "Pest signs", labelFa: "علائم آفت" },
];

interface ScanListItem {
  id: string;
  imageUrl: string;
  plant: PlantAnalysis["plant"];
  health: PlantAnalysis["health"];
  createdAt: string;
}


export default function ScanPage() {
  const { t, locale } = useLanguage();
  const { formatPercent } = useLocaleFormat();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [step, setStep] = useState<ScanStep>("capture");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageType, setImageType] = useState<ImageScanType>("full_plant");
  const [analysisStep, setAnalysisStep] = useState(0);
  const [result, setResult] = useState<PlantAnalysis | null>(null);
  const [scanId, setScanId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ResultTab>("plant");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<ScanListItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setHistoryLoading(true);
    setHistoryError(false);
    try {
      const res = await fetch("/api/scans?limit=6");
      const data = await res.json();
      if (res.ok) {
        setHistory(data.scans || []);
      } else {
        setHistoryError(true);
      }
    } catch {
      setHistoryError(true);
    } finally {
      setHistoryLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setCameraStarting(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (cameraStarting || cameraActive) return;
    setCameraStarting(true);
    setError(null);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera not supported");
      }

      const constraintSets: MediaStreamConstraints[] = [
        {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        },
        {
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        },
        { video: true, audio: false },
      ];

      let stream: MediaStream | null = null;
      for (const constraints of constraintSets) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch {
          // Try the next, less strict camera constraint set.
        }
      }

      if (!stream) {
        throw new Error("Camera permission denied");
      }

      streamRef.current = stream;
      setImagePreview(null);
      setCameraActive(true);
    } catch {
      stopCamera();
      setError(t.scan.errors.cameraDenied);
    } finally {
      setCameraStarting(false);
    }
  }, [cameraActive, cameraStarting, stopCamera, t.scan.errors.cameraDenied]);

  useEffect(() => {
    if (!cameraActive) return;

    const stream = streamRef.current;
    const video = videoRef.current;
    if (!stream || !video) return;

    video.srcObject = stream;
    void video.play().catch(() => {
      setError(t.scan.errors.cameraDenied);
      stopCamera();
    });
  }, [cameraActive, stopCamera, t.scan.errors.cameraDenied]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    setImagePreview(canvas.toDataURL("image/jpeg", 0.85));
    stopCamera();
  }, [stopCamera]);

  const processImageFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError(t.scan.errors.invalidFile);
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setError(t.scan.errors.fileTooLarge);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreview(ev.target?.result as string);
        stopCamera();
        setError(null);
      };
      reader.readAsDataURL(file);
    },
    [stopCamera, t.scan.errors.invalidFile, t.scan.errors.fileTooLarge]
  );

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processImageFile(file);
      e.target.value = "";
    },
    [processImageFile]
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processImageFile(file);
    },
    [processImageFile]
  );

  const analyzeImage = useCallback(async () => {
    if (!user) {
      setError(t.scan.loginRequired);
      return;
    }
    if (!imagePreview) {
      setError(t.scan.errors.noImage);
      return;
    }
    setStep("analyzing");
    setAnalysisStep(0);
    setError(null);
    const stepInterval = setInterval(() => {
      setAnalysisStep((prev) => Math.min(prev + 1, ANALYSIS_STEPS.length - 1));
    }, 1500);

    try {
      const compressed = await compressImageDataUrl(imagePreview);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: compressed.base64,
          mimeType: compressed.mimeType,
          imageType,
          locale,
        }),
      });
      const data = await res.json();
      clearInterval(stepInterval);
      if (!res.ok) throw new Error(data.error || t.scan.errors.analysisFailed);
      setResult(data.data);
      setScanId(data.scanId || null);
      if (data.imageUrl && isPersistedImageUrl(data.imageUrl)) {
        setImagePreview(data.imageUrl);
      } else {
        setImagePreview(compressed.dataUrl);
      }
      setStep("results");
      setActiveTab("plant");
      fetchHistory();
      if (data.demo) toast.info(t.scan.errors.demoMode);
      if (data.scanId) toast.success(t.scan.autoSaved);
    } catch (err) {
      clearInterval(stepInterval);
      setError(err instanceof Error ? err.message : t.scan.errors.analysisFailed);
      setStep("capture");
    }
  }, [imagePreview, imageType, locale, user, t, fetchHistory]);

  const resetScan = useCallback(() => {
    setStep("capture");
    setImagePreview(null);
    setResult(null);
    setScanId(null);
    setError(null);
    setActiveTab("plant");
    stopCamera();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [stopCamera]);

  const savePlant = useCallback(async () => {
    if (!user || !result || !imagePreview) return;
    setSaving(true);
    try {
      const res = await fetch("/api/scan/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis: result,
          imageUrl: imagePreview,
          imageType,
          scanId,
          createPlant: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t.common.error);
        return;
      }
      toast.success(t.scan.results.savePlant);
      fetchHistory();
      if (data.plant?.id) {
        window.location.href = `/plants/${data.plant.id}`;
      }
    } catch {
      toast.error(t.common.error);
    } finally {
      setSaving(false);
    }
  }, [user, result, imagePreview, imageType, scanId, t, fetchHistory]);

  const saveHistoryOnly = useCallback(async () => {
    if (!user || !result) return;
    if (scanId) {
      toast.success(t.scan.results.savedHistory);
      fetchHistory();
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/scan/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis: result,
          imageUrl: imagePreview,
          imageType,
          createPlant: false,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || t.common.error);
        return;
      }
      const data = await res.json();
      setScanId(data.scanId || null);
      toast.success(t.scan.results.savedHistory);
      fetchHistory();
    } catch {
      toast.error(t.common.error);
    } finally {
      setSaving(false);
    }
  }, [user, result, imagePreview, imageType, scanId, t, fetchHistory]);

  const loadScanFromHistory = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/scans?id=${id}`);
        const data = await res.json();
        if (!res.ok || !data.scan) {
          toast.error(t.scan.historyLoadFailed);
          return;
        }
        setResult({
          plant: data.scan.plant,
          health: data.scan.health,
          care: data.scan.care,
          treatment: data.scan.treatment,
        });
        setScanId(data.scan.id);
        const storedUrl = data.scan.imageUrl as string;
        if (isPersistedImageUrl(storedUrl) || storedUrl.startsWith("data:")) {
          setImagePreview(storedUrl);
        }
        setStep("results");
        setActiveTab("plant");
        setError(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch {
        toast.error(t.scan.historyLoadFailed);
      }
    },
    [t.scan.historyLoadFailed]
  );

  const healthVariant = (status: string) => {
    if (status === "healthy") return "success" as const;
    if (status === "warning") return "warning" as const;
    if (status === "critical") return "destructive" as const;
    return "secondary" as const;
  };

  const tabs: { id: ResultTab; label: string }[] = [
    { id: "plant", label: t.scan.results.plantInfo },
    { id: "health", label: t.scan.results.disease },
    { id: "care", label: t.scan.results.careGuide },
    { id: "treatment", label: t.scan.results.treatment },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 safe-bottom">
      <div className="text-center mb-6 sm:mb-8 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t.scan.title}</h1>
        <p className="text-muted-foreground text-sm sm:text-base">{t.scan.subtitle}</p>
      </div>

      {!user && step === "capture" && (
        <Card className="glass-card border-0 mb-6 border-emerald-500/20">
          <CardContent className="pt-5 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-start">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <LogIn className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{t.scan.loginRequired}</p>
            </div>
            <Button asChild size="sm" className="w-full sm:w-auto">
              <Link href="/auth/login">{t.scan.loginToAnalyze}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "capture" && (
        <div className="space-y-5 sm:space-y-6 animate-fade-in">
          <div className="flex flex-wrap gap-2 justify-center">
            {IMAGE_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setImageType(type.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  imageType === type.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "glass hover:bg-accent"
                )}
              >
                {locale === "fa" ? type.labelFa : type.labelEn}
              </button>
            ))}
          </div>

          <div
            className={cn(
              "relative aspect-[4/3] rounded-2xl overflow-hidden glass-card transition-all",
              isDragging && "ring-2 ring-primary ring-offset-2 ring-offset-background"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {cameraActive ? (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
                autoPlay
              />
            ) : imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-500/5 px-6 text-center">
                <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
                  <ImageIcon className="w-10 h-10 text-emerald-400" />
                </div>
                <p className="font-medium mb-1">{t.scan.emptyState.title}</p>
                <p className="text-muted-foreground text-sm mb-2">
                  {t.scan.emptyState.description}
                </p>
                <p className="text-xs text-muted-foreground/80">{t.scan.emptyState.hint}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-4">
                  {t.scan.dragDrop}
                </p>
              </div>
            )}
            {cameraActive && (
              <div className="absolute inset-8 pointer-events-none">
                <div className="scan-ring" />
                <div className="scan-line" />
              </div>
            )}
            {isDragging && !cameraActive && (
              <div className="absolute inset-0 bg-primary/10 flex items-center justify-center backdrop-blur-sm">
                <p className="text-sm font-medium text-primary">{t.scan.dragDrop}</p>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {error && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-destructive/10 text-destructive text-sm">
              <div className="flex items-center gap-2 flex-1">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              {imagePreview && user && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-destructive/30 text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={analyzeImage}
                >
                  {t.scan.tryAgain}
                </Button>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center">
            {!cameraActive && !imagePreview && (
              <>
                <Button
                  onClick={startCamera}
                  className="w-full sm:w-auto"
                  disabled={cameraStarting}
                >
                  {cameraStarting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                  {t.scan.camera}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto"
                >
                  <Upload className="w-4 h-4" />
                  {t.scan.upload}
                </Button>
              </>
            )}
            {cameraActive && (
              <>
                <Button onClick={capturePhoto} className="w-full sm:w-auto">
                  <Camera className="w-4 h-4" />
                  {t.scan.capture}
                </Button>
                <Button variant="outline" onClick={stopCamera} className="w-full sm:w-auto">
                  {t.scan.retake}
                </Button>
              </>
            )}
            {imagePreview && !cameraActive && (
              <>
                <Button
                  onClick={analyzeImage}
                  className="w-full sm:w-auto"
                  disabled={!user}
                >
                  <Leaf className="w-4 h-4" />
                  {user ? t.scan.analyze : t.scan.loginToAnalyze}
                </Button>
                <Button variant="outline" onClick={resetScan} className="w-full sm:w-auto">
                  <RotateCcw className="w-4 h-4" />
                  {t.scan.retake}
                </Button>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileUpload}
          />

          {user && (
            <section className="pt-2">
              <h2 className="font-semibold flex items-center gap-2 mb-3">
                <History className="w-4 h-4" />
                {t.scan.history}
              </h2>
              {historyLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="aspect-square rounded-xl" />
                  ))}
                </div>
              ) : historyError ? (
                <div className="text-center py-6 glass-card rounded-xl space-y-3">
                  <p className="text-sm text-muted-foreground">{t.common.error}</p>
                  <Button variant="outline" size="sm" onClick={fetchHistory}>
                    {t.scan.tryAgain}
                  </Button>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 glass-card rounded-xl">
                  <History className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">{t.scan.noHistory}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {history.map((scan) => (
                    <button
                      key={scan.id}
                      type="button"
                      onClick={() => loadScanFromHistory(scan.id)}
                      className="glass-card overflow-hidden rounded-xl text-start hover:ring-2 hover:ring-primary/30 transition-all"
                    >
                      <ScanThumbnail
                        src={scan.imageUrl}
                        className="aspect-square object-cover w-full"
                        iconClassName="w-10 h-10"
                      />
                      <div className="p-2">
                        <p className="text-xs font-medium truncate">
                          {getScanPlantName(scan.plant, locale)}
                        </p>
                        <div className="flex items-center justify-between gap-1 mt-1">
                          <Badge
                            variant={healthVariant(scan.health?.status)}
                            className="text-[10px]"
                          >
                            {getHealthStatusLabel(scan.health?.status || "unknown", t)}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDate(scan.createdAt, locale, "MM/dd")}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {step === "analyzing" && (
        <div className="space-y-6 animate-fade-in">
          {imagePreview && (
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden glass-card">
              <img
                src={imagePreview}
                alt=""
                className="w-full h-full object-cover opacity-40 blur-sm scale-105"
              />
              <div className="absolute inset-0 bg-emerald-500/5" />
            </div>
          )}
          <div className="flex flex-col items-center py-8 sm:py-12">
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-200 dark:border-emerald-800" />
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
              <Leaf className="absolute inset-0 m-auto w-10 h-10 sm:w-12 sm:h-12 text-emerald-500" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold mb-6">{t.scan.analyzing}</h2>
            <div className="space-y-3 w-full max-w-xs">
              {ANALYSIS_STEPS.map((s, i) => (
                <div
                  key={s}
                  className={cn(
                    "flex items-center gap-3 text-sm transition-all",
                    i <= analysisStep ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                  )}
                >
                  {i < analysisStep ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                  ) : i === analysisStep ? (
                    <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-muted shrink-0" />
                  )}
                  {t.scan.steps[s]}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === "results" && result && (
        <div className="space-y-5 sm:space-y-6 animate-fade-in">
          {imagePreview && (
            <div className="relative aspect-video rounded-2xl overflow-hidden glass-card">
              <img src={imagePreview} alt="Scanned" className="w-full h-full object-cover" />
              <div className="absolute top-3 end-3 sm:top-4 sm:end-4 flex flex-wrap items-center justify-end gap-2 max-w-[70%]">
                <Badge variant={healthVariant(result.health.status)}>
                  {getHealthStatusLabel(result.health.status, t)}
                </Badge>
                <Badge variant="outline">
                  {t.scan.results.confidence}: {formatPercent(result.plant.confidence)}
                </Badge>
                {scanId && (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {t.scan.autoSaved}
                  </Badge>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-3 sm:px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "glass hover:bg-accent"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "plant" && (
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">
                  {getScanPlantName(result.plant, locale)}
                </CardTitle>
                {result.plant.scientificName && (
                  <p className="text-muted-foreground italic text-sm sm:text-base">
                    <span className="not-italic text-xs text-muted-foreground/80 me-1">
                      {t.scan.results.scientificName}:
                    </span>
                    {result.plant.scientificName}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  {result.plant.family && (
                    <Badge variant="secondary" className="font-normal">
                      {t.scan.results.family}: {result.plant.family}
                    </Badge>
                  )}
                  {result.plant.category && (
                    <Badge variant="outline" className="font-normal">
                      {t.scan.results.category}: {result.plant.category}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground pt-1">
                  {t.scan.results.confidence}: {formatPercent(result.plant.confidence)}
                </p>
              </CardHeader>
              {(result.plant.description || result.plant.uses) && (
                <CardContent className="space-y-4 pt-0">
                  {result.plant.description && (
                    <div>
                      <h4 className="font-medium mb-1 text-sm">{t.scan.results.description}</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                        {result.plant.description}
                      </p>
                    </div>
                  )}
                  {result.plant.uses && (
                    <div>
                      <h4 className="font-medium mb-1 text-sm">{t.scan.results.uses}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {result.plant.uses}
                      </p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )}

          {activeTab === "health" && (
            <Card className="glass-card border-0">
              <CardContent className="pt-6 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={healthVariant(result.health.status)}>
                    {getHealthStatusLabel(result.health.status, t)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatPercent(result.health.confidence)} {t.scan.results.confidence}
                  </span>
                </div>
                {result.health.soilAnalysis && (
                  <div>
                    <h4 className="font-medium mb-1 text-sm">{t.scan.results.soil}</h4>
                    <p className="text-sm text-muted-foreground">{result.health.soilAnalysis}</p>
                  </div>
                )}
                {result.health.diseaseDiagnosis.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      {t.scan.results.disease}
                    </h4>
                    <ul className="list-disc ps-5 text-sm space-y-1">
                      {result.health.diseaseDiagnosis.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.health.pestDiagnosis.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">{t.scan.results.pests}</h4>
                    <ul className="list-disc ps-5 text-sm space-y-1">
                      {result.health.pestDiagnosis.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.health.possibleProblems.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">{t.scan.results.problems}</h4>
                    <ul className="list-disc ps-5 text-sm space-y-1">
                      {result.health.possibleProblems.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.health.diseaseDiagnosis.length === 0 &&
                  result.health.pestDiagnosis.length === 0 && (
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                      {t.scan.results.healthy}
                    </div>
                  )}
              </CardContent>
            </Card>
          )}

          {activeTab === "care" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: Droplets, label: t.scan.results.watering, value: result.care.watering },
                { icon: Sun, label: t.scan.results.light, value: result.care.light },
                { icon: FlaskConical, label: t.scan.results.fertilizer, value: result.care.fertilizer },
                { icon: Shovel, label: t.scan.results.soilType, value: result.care.soil },
                { icon: Thermometer, label: t.catalog.temperature, value: result.care.temperature },
                { icon: Droplets, label: t.catalog.humidity, value: result.care.humidity },
              ].map((item) => (
                <Card key={item.label} className="glass-card border-0">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <item.icon className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === "treatment" && (
            <div className="space-y-4">
              {result.treatment.immediateActions.length > 0 && (
                <Card className="glass-card border-0 border-amber-500/20">
                  <CardHeader>
                    <CardTitle className="text-base">{t.scan.results.immediate}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {result.treatment.immediateActions.map((action, i) => (
                      <p key={i} className="text-sm flex gap-2">
                        <span className="text-amber-500 font-bold">{i + 1}.</span>
                        {action}
                      </p>
                    ))}
                  </CardContent>
                </Card>
              )}
              {result.treatment.stepByStepPlan.length > 0 ? (
                result.treatment.stepByStepPlan.map((planStep, i) => (
                  <Card key={i} className="glass-card border-0">
                    <CardContent className="pt-4 flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-sm">{planStep}</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t.scan.results.healthy}
                </p>
              )}
              {result.treatment.warnings.length > 0 && (
                <Card className="glass-card border-0 border-destructive/20">
                  <CardHeader>
                    <CardTitle className="text-base text-destructive">
                      {t.scan.results.warnings}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {result.treatment.warnings.map((w, i) => (
                      <p key={i} className="text-sm">{w}</p>
                    ))}
                  </CardContent>
                </Card>
              )}
              {result.treatment.prevention.length > 0 && (
                <Card className="glass-card border-0">
                  <CardHeader>
                    <CardTitle className="text-base">{t.scan.results.prevention}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {result.treatment.prevention.map((tip, i) => (
                      <p key={i} className="text-sm">{tip}</p>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center pt-4">
            {user ? (
              <>
                <Button onClick={savePlant} disabled={saving} className="w-full sm:w-auto">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {t.scan.results.savePlant}
                </Button>
                <Button
                  variant="secondary"
                  onClick={saveHistoryOnly}
                  disabled={saving || !!scanId}
                  className="w-full sm:w-auto"
                >
                  <History className="w-4 h-4" />
                  {scanId ? t.scan.alreadySaved : t.scan.results.saveHistory}
                </Button>
              </>
            ) : (
              <Button asChild className="w-full sm:w-auto">
                <Link href="/auth/login">{t.nav.login}</Link>
              </Button>
            )}
            <Button variant="outline" onClick={resetScan} className="w-full sm:w-auto">
              <RotateCcw className="w-4 h-4" />
              {t.scan.results.scanAgain}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
