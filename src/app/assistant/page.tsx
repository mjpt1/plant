"use client";

import { useState } from "react";
import Link from "next/link";
import { Bot, Loader2, Send } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

export default function AssistantPage() {
  const { locale } = useLanguage();
  const { user } = useAuth();
  const fa = locale === "fa";
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: fa
        ? "سلام! من دستیار گیاه‌یارم. درباره آبیاری، نور، بیماری، تعویض گلدان یا انتخاب گیاه بپرس."
        : "Hi! I’m your GiahYar assistant. Ask about watering, light, disease, repotting, or plant picks.",
    },
  ]);

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Link href="/auth/login" className="btn-primary inline-flex">
          {fa ? "ورود" : "Login"}
        </Link>
      </div>
    );
  }

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setBusy(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          locale,
          history: next.slice(0, -1).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok && !data.reply) throw new Error("fail");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || (fa ? "پاسخی نبود." : "No reply.") },
      ]);
    } catch {
      toast.error(fa ? "خطا در پاسخ دستیار" : "Assistant error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col min-h-[70vh]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="w-6 h-6 text-rose-500" />
          {fa ? "دستیار گیاه‌یار" : "Plant assistant"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {fa
            ? "مربی مراقبت همه‌جانبه — از علائم برگ تا برنامه آبیاری."
            : "All-in-one care coach — from leaf symptoms to watering plans."}
        </p>
        <div className="flex flex-wrap gap-2 mt-3 text-sm">
          <Link href="/scan" className="btn-secondary text-xs px-3 py-1">
            {fa ? "اسکن بیماری" : "Disease scan"}
          </Link>
          <Link href="/recommend" className="btn-secondary text-xs px-3 py-1">
            {fa ? "پیشنهاد گیاه" : "Recommend"}
          </Link>
          <Link href="/shop" className="btn-secondary text-xs px-3 py-1">
            {fa ? "فروشگاه مراقبت" : "Care shop"}
          </Link>
          <Link href="/consultations" className="btn-secondary text-xs px-3 py-1">
            {fa ? "کارشناس" : "Expert"}
          </Link>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto glass-card p-4 mb-3 max-h-[50vh]">
        {messages.map((m, i) => (
          <div
            key={`${i}-${m.role}`}
            className={`text-sm whitespace-pre-wrap rounded-2xl px-3 py-2 ${
              m.role === "user"
                ? "bg-primary/15 ms-8"
                : "bg-muted/60 me-8"
            }`}
          >
            {m.content}
          </div>
        ))}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          className="input-field flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            fa
              ? "مثلاً: برگ‌های سانسوریام زرد شده…"
              : "e.g. My snake plant leaves are yellowing…"
          }
        />
        <button type="submit" className="btn-primary px-4" disabled={busy}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}
