"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, BookOpen, Share2 } from "lucide-react";
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);

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
          if (!note.trim()) return;
          setSaving(true);
          try {
            const res = await fetch(`/api/plants/${plantId}/journal`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ note }),
            });
            if (!res.ok) throw new Error("fail");
            setNote("");
            toast.success(fa ? "ثبت شد" : "Saved");
            void load();
          } catch {
            toast.error(fa ? "خطا" : "Error");
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
        <button type="submit" className="btn-primary text-sm" disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {fa ? "افزودن به ژورنال" : "Add to journal"}
        </button>
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
