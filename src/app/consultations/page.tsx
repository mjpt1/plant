"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Loader2, MessageSquareHeart } from "lucide-react";

type Consultation = {
  id: string;
  subject: string;
  message: string;
  reply: string | null;
  status: string;
  createdAt: string;
  user?: { name: string };
};

export default function ConsultationsPage() {
  const { locale } = useLanguage();
  const { user } = useAuth();
  const [items, setItems] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const isExpert = user?.role === "EXPERT" || user?.role === "ADMIN";

  const fa = locale === "fa";

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/consultations");
      if (!res.ok) throw new Error("fail");
      const data = await res.json();
      setItems(data.consultations || []);
    } catch {
      toast.error(fa ? "بارگذاری ناموفق بود" : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) void load();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Link href="/auth/login" className="btn-primary inline-flex">
          {fa ? "ورود" : "Login"}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquareHeart className="w-6 h-6 text-rose-500" />
          {fa ? "مشاوره کارشناس" : "Expert consultation"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {fa
            ? "سؤال خود را بفرستید؛ کارشناسان گیاه‌یار پاسخ می‌دهند (هدف پاسخ در کمتر از ۲۴ ساعت)."
            : "Ask a question; GiahYar experts aim to reply within 24 hours."}
        </p>
      </div>

      <form
        className="glass-card p-4 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const res = await fetch("/api/consultations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subject, message }),
          });
          if (!res.ok) {
            toast.error(fa ? "ارسال ناموفق" : "Send failed");
            return;
          }
          setSubject("");
          setMessage("");
          toast.success(fa ? "ارسال شد" : "Submitted");
          void load();
        }}
      >
        <input
          className="input-field"
          placeholder={fa ? "موضوع" : "Subject"}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
        <textarea
          className="input-field min-h-[120px]"
          placeholder={fa ? "توضیح مشکل گیاه…" : "Describe the plant issue…"}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
        <button type="submit" className="btn-primary">
          {fa ? "ارسال درخواست" : "Submit request"}
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((c) => (
            <div key={c.id} className="glass-card p-4 space-y-2">
              <div className="flex justify-between gap-2">
                <p className="font-semibold">{c.subject}</p>
                <span className="text-xs text-muted-foreground">{c.status}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{c.message}</p>
              {c.reply && (
                <div className="rounded-xl bg-emerald-500/10 p-3 text-sm">
                  <p className="font-medium mb-1">
                    {fa ? "پاسخ کارشناس" : "Expert reply"}
                  </p>
                  <p className="whitespace-pre-wrap">{c.reply}</p>
                </div>
              )}
              {isExpert && c.status === "OPEN" && (
                <div className="space-y-2 pt-2">
                  <textarea
                    className="input-field min-h-[80px]"
                    placeholder={fa ? "پاسخ…" : "Reply…"}
                    value={replyDrafts[c.id] || ""}
                    onChange={(e) =>
                      setReplyDrafts((d) => ({ ...d, [c.id]: e.target.value }))
                    }
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={async () => {
                      const res = await fetch("/api/consultations", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          id: c.id,
                          reply: replyDrafts[c.id],
                        }),
                      });
                      if (!res.ok) {
                        toast.error(fa ? "خطا" : "Error");
                        return;
                      }
                      toast.success(fa ? "ثبت شد" : "Saved");
                      void load();
                    }}
                  >
                    {fa ? "ارسال پاسخ" : "Send reply"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
