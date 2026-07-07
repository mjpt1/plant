"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  CheckCircle2,
  Loader2,
  X,
  Send,
  ChevronDown,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useLocaleFormat } from "@/hooks/useLocaleFormat";
import { formatDateTime } from "@/utils/dateHelper";
import { cn } from "@/lib/utils";
import { QA_CATEGORY_FILTER } from "@/lib/qa-categories";
import type { QuestionWithMeta } from "@/types";
import Link from "next/link";
import { toast } from "sonner";

export default function QAPage() {
  const { t, locale } = useLanguage();
  const { formatNumber } = useLocaleFormat();
  const { user } = useAuth();

  const [questions, setQuestions] = useState<QuestionWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showAsk, setShowAsk] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [newTags, setNewTags] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== "all") params.set("category", category);
      if (search) params.set("search", search);
      const res = await fetch(`/api/qa/questions?${params}`);
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    const timer = setTimeout(fetchQuestions, 300);
    return () => clearTimeout(timer);
  }, [fetchQuestions]);

  const openAskForm = () => {
    if (!user) return;
    setShowAsk(true);
  };

  const submitQuestion = async () => {
    if (!newTitle.trim() || !newContent.trim() || !user) return;
    setSubmitting(true);
    try {
      const tags = newTags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const res = await fetch("/api/qa/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          category: newCategory,
          tags,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setQuestions((prev) => [data.question, ...prev]);
        setNewTitle("");
        setNewContent("");
        setNewTags("");
        setShowAsk(false);
      } else {
        toast.error(data.error || t.common.error);
      }
    } catch {
      toast.error(t.common.error);
    } finally {
      setSubmitting(false);
    }
  };

  const categoryLabel = (cat: string) =>
    t.qa.categories[cat as keyof typeof t.qa.categories] || cat;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">{t.qa.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {t.qa.subtitle}
          </p>
        </div>
        {user ? (
          <button onClick={openAskForm} className="btn-primary text-sm px-4 py-2">
            <Plus className="w-4 h-4" />
            {t.qa.askQuestion}
          </button>
        ) : (
          <Link href="/auth/login" className="btn-primary text-sm px-4 py-2">
            <Plus className="w-4 h-4" />
            {t.qa.askQuestion}
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-fade-in">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.qa.search}
            className="input-field ps-10"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {QA_CATEGORY_FILTER.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all",
                category === cat
                  ? "bg-emerald-500 text-white"
                  : "glass hover:bg-white/20"
              )}
            >
              {categoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>

      {!user && (
        <div className="glass-card p-6 text-center mb-6">
          <p className="text-sm text-gray-500 mb-4">{t.qa.loginToAsk}</p>
          <Link href="/auth/login" className="btn-primary">
            {t.nav.login}
          </Link>
        </div>
      )}

      {showAsk && user && (
        <div className="glass-card p-6 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{t.qa.askQuestion}</h3>
            <button onClick={() => setShowAsk(false)}>
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={t.qa.questionTitle}
            className="input-field mb-3"
          />
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder={t.qa.questionContent}
            className="input-field min-h-[120px] resize-none mb-3"
            rows={4}
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="input-field mb-3"
          >
            {QA_CATEGORY_FILTER.filter((c) => c !== "all").map((cat) => (
              <option key={cat} value={cat}>
                {categoryLabel(cat)}
              </option>
            ))}
          </select>
          <input
            value={newTags}
            onChange={(e) => setNewTags(e.target.value)}
            placeholder={t.qa.tags}
            className="input-field mb-4"
          />
          <button
            onClick={submitQuestion}
            disabled={submitting || !newTitle.trim() || !newContent.trim()}
            className="btn-primary w-full"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            {t.qa.submit}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : questions.length === 0 ? (
        <div className="glass-card p-12 text-center text-gray-500">
          {t.qa.noQuestions}
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <Link key={q.id} href={`/qa/${q.id}`} className="glass-card block p-5 hover:bg-white/5 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px]">
                      {categoryLabel(q.category)}
                    </span>
                    {q.solved && (
                      <span className="badge-healthy text-[10px]">
                        <CheckCircle2 className="w-3 h-3 me-1" />
                        {t.qa.solved}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm">{q.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {q.user.name} · {formatDateTime(q.createdAt, locale)} ·{" "}
                    {formatNumber(q._count.answers)} {t.qa.answers}
                  </p>
                </div>
                <ChevronDown className="w-5 h-5 text-gray-400 shrink-0 -rotate-90" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
