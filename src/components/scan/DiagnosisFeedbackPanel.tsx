"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, ThumbsDown, ThumbsUp } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function DiagnosisFeedbackPanel({ scanId }: { scanId: string }) {
  const { t } = useLanguage();
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);
  const [correctedLabel, setCorrectedLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/scans/${scanId}/feedback`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.feedback) return;
        setWasCorrect(data.feedback.wasCorrect);
        setCorrectedLabel(data.feedback.correctedLabel || "");
        setNotes(data.feedback.notes || "");
        setSubmitted(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [scanId]);

  const submit = async () => {
    if (wasCorrect === null) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/scans/${scanId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wasCorrect,
          correctedLabel: wasCorrect ? null : correctedLabel,
          notes: notes || null,
        }),
      });
      if (!res.ok) {
        toast.error(t.common.error);
        return;
      }
      setSubmitted(true);
      toast.success(t.scan.results.feedbackThanks);
    } catch {
      toast.error(t.common.error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
      <p className="text-sm font-medium">{t.scan.results.feedbackTitle}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={wasCorrect === true ? "default" : "outline"}
          onClick={() => {
            setWasCorrect(true);
            setSubmitted(false);
          }}
        >
          <ThumbsUp className="w-4 h-4" />
          {t.scan.results.feedbackCorrect}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={wasCorrect === false ? "default" : "outline"}
          onClick={() => {
            setWasCorrect(false);
            setSubmitted(false);
          }}
        >
          <ThumbsDown className="w-4 h-4" />
          {t.scan.results.feedbackWrong}
        </Button>
      </div>

      {wasCorrect === false && (
        <div className="space-y-2">
          <Input
            value={correctedLabel}
            onChange={(e) => setCorrectedLabel(e.target.value)}
            placeholder={t.scan.results.feedbackPlaceholder}
          />
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t.scan.results.feedbackNotes}
            rows={2}
          />
        </div>
      )}

      {wasCorrect !== null && !submitted && (
        <Button type="button" onClick={() => void submit()} disabled={saving} className="w-full">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t.scan.results.feedbackSubmit}
        </Button>
      )}

      {submitted && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {t.scan.results.feedbackThanks}
        </p>
      )}
    </div>
  );
}
