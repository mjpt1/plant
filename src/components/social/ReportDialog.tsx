"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ReportTargetType = "POST" | "COMMENT" | "USER";

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
}

const REASON_KEYS = [
  "spam",
  "harassment",
  "inappropriate",
  "misinformation",
  "other",
] as const;

export function ReportDialog({ open, onClose, targetType, targetId }: ReportDialogProps) {
  const { t } = useLanguage();
  const [reasonKey, setReasonKey] = useState<string>("inappropriate");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const submit = async () => {
    setSubmitting(true);
    try {
      const reason =
        t.report.reasons[reasonKey as keyof typeof t.report.reasons] || reasonKey;
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          reason,
          details: details.trim() || null,
        }),
      });
      if (res.ok) {
        toast.success(t.report.success);
        setDetails("");
        onClose();
      } else {
        const data = await res.json();
        toast.error(data.error || t.common.error);
      }
    } catch {
      toast.error(t.common.error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="glass-card w-full max-w-md p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">{t.report.title}</h3>
          <button type="button" onClick={onClose}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <label className="text-sm font-medium mb-2 block">{t.report.reason}</label>
        <select
          value={reasonKey}
          onChange={(e) => setReasonKey(e.target.value)}
          className="input-field mb-4"
        >
          {REASON_KEYS.map((key) => (
            <option key={key} value={key}>
              {t.report.reasons[key as keyof typeof t.report.reasons]}
            </option>
          ))}
        </select>

        <label className="text-sm font-medium mb-2 block">{t.report.details}</label>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder={t.report.detailsPlaceholder}
          className="input-field min-h-[80px] resize-none mb-4"
          rows={3}
        />

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {t.common.cancel}
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {t.report.submit}
          </Button>
        </div>
      </div>
    </div>
  );
}
