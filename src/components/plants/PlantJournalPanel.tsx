"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, BookOpen, Share2, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { formatDateTime } from "@/utils/dateHelper";

type Entry = {
  id: string;
  note: string | null;
  imageUrl: string | null;
  createdAt: string;
};

export function PlantJournalPanel({ plantId }: { plantId: string }) {
  const { locale } = useLanguage();
  const fa = locale === "fa";
  const [entries, setEntries] = useState<Entry[]>([]);
  const [note, setNote] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/plants/${plantId}/journal`);
      if (!res.ok) throw new Error("fail");
      const data = await res.json();
      setEntries(data.entries || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [plantId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const clearPhoto = () => {
    setImageFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="mb-8 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-rose-500" />
          {fa ? "ژورنال پیشرفت" : "Progress journal"}
        </h2>
        <button
          type="button"
          className="btn-secondary text-sm px-3 py-1.5"
          disabled={sharing}
          onClick={async () => {
            setSharing(true);
            try {
              const res = await fetch(`/api/plants/${plantId}/share`, {
                method: "POST",
              });
              if (!res.ok) throw new Error("fail");
              const data = await res.json();
              const url = `${window.location.origin}${data.path}`;
              await navigator.clipboard.writeText(url);
              toast.success(
                fa ? "لینک اشتراک کپی شد" : "Share link copied"
              );
            } catch {
              toast.error(fa ? "اشتراک ناموفق" : "Share failed");
            } finally {
              setSharing(false);
            }
          }}
        >
          <Share2 className="w-4 h-4" />
          {fa ? "اشتراک مراقبت" : "Share care"}
        </button>
      </div>

      <form
        className="glass-card p-3 space-y-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!note.trim() && !imageFile) return;
          setSaving(true);
          try {
            let imageUrl: string | undefined;
            if (imageFile) {
              const fd = new FormData();
              fd.append("file", imageFile);
              const up = await fetch("/api/upload", { method: "POST", body: fd });
              if (!up.ok) {
                const err = await up.json().catch(() => ({}));
                throw new Error(
                  err.error ||
                    (fa
                      ? "آپلود تصویر ممکن نیست"
                      : "Photo upload unavailable")
                );
              }
              const uploaded = await up.json();
              imageUrl = uploaded.url;
            }

            const res = await fetch(`/api/plants/${plantId}/journal`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                note: note.trim() || null,
                imageUrl: imageUrl || null,
              }),
            });
            if (!res.ok) throw new Error("fail");
            setNote("");
            clearPhoto();
            toast.success(fa ? "ثبت شد" : "Saved");
            void load();
          } catch (err) {
            toast.error(
              err instanceof Error
                ? err.message
                : fa
                  ? "خطا"
                  : "Error"
            );
          } finally {
            setSaving(false);
          }
        }}
      >
        <textarea
          className="input-field resize-none"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={
            fa
              ? "یادداشت امروز: برگ جدید، آبیاری، تعویض گلدان…"
              : "Today’s note: new leaf, watering, repot…"
          }
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            if (file && file.size > 10 * 1024 * 1024) {
              toast.error(fa ? "حداکثر ۱۰ مگابایت" : "Max 10MB");
              return;
            }
            setImageFile(file);
          }}
        />
        {previewUrl && (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt=""
              className="h-24 w-24 rounded-lg object-cover"
            />
            <button
              type="button"
              className="absolute -top-1 -end-1 text-xs bg-black/60 text-white rounded-full w-5 h-5"
              onClick={clearPhoto}
              aria-label={fa ? "حذف عکس" : "Remove photo"}
            >
              ×
            </button>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary text-sm"
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlus className="w-4 h-4" />
            {fa ? "عکس پیشرفت" : "Progress photo"}
          </button>
          <button
            type="submit"
            className="btn-primary text-sm"
            disabled={saving || (!note.trim() && !imageFile)}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {fa ? "افزودن به ژورنال" : "Add to journal"}
          </button>
        </div>
      </form>

      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {fa
            ? "هنوز یادداشتی نیست — پیشرفت گیاه را اینجا ثبت کنید."
            : "No entries yet — log how your plant is doing."}
        </p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div key={entry.id} className="glass p-3 rounded-xl text-sm">
              <p className="text-xs text-muted-foreground mb-1">
                {formatDateTime(entry.createdAt, locale)}
              </p>
              {entry.note && <p className="whitespace-pre-wrap">{entry.note}</p>}
              {entry.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={entry.imageUrl}
                  alt=""
                  className="mt-2 rounded-lg max-h-40 object-cover"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
