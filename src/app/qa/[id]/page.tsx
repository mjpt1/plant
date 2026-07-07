"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  BadgeCheck,
  Send,
  Flag,
  Star,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useLocaleFormat } from "@/hooks/useLocaleFormat";
import { formatDateTime } from "@/utils/dateHelper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface AnswerItem {
  id: string;
  content: string;
  isAccepted: boolean;
  isExpertVerified: boolean;
  voteCount: number;
  userVote: -1 | 0 | 1;
  createdAt: string;
  user: { id: string; name: string; username: string; avatar: string | null; role: string };
}

interface QuestionDetail {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  solved: boolean;
  createdAt: string;
  user: { id: string; name: string; username: string; avatar: string | null };
  answers: AnswerItem[];
}

export default function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useLanguage();
  const { formatNumber } = useLocaleFormat();
  const { user } = useAuth();
  const router = useRouter();
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [answerText, setAnswerText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchQuestion = useCallback(async () => {
    const res = await fetch(`/api/qa/questions/${id}`);
    const data = await res.json();
    if (res.ok) setQuestion(data.question);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);

  const categoryLabel = (cat: string) =>
    t.qa.categories[cat as keyof typeof t.qa.categories] || cat;

  const submitAnswer = async () => {
    if (!answerText.trim() || !user) return;
    setSubmitting(true);
    const res = await fetch(`/api/qa/questions/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: answerText }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.ok) {
      setAnswerText("");
      fetchQuestion();
    } else {
      toast.error(data.error || t.common.error);
    }
  };

  const castVote = async (answerId: string, value: 1 | -1, currentVote: number) => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    const res = await fetch(
      currentVote === value
        ? `/api/qa/answers?answerId=${answerId}`
        : "/api/qa/answers",
      {
        method: currentVote === value ? "DELETE" : "POST",
        headers:
          currentVote === value
            ? undefined
            : { "Content-Type": "application/json" },
        body:
          currentVote === value
            ? undefined
            : JSON.stringify({ answerId, value }),
      }
    );

    if (res.ok) fetchQuestion();
    else {
      const data = await res.json();
      toast.error(data.error || t.common.error);
    }
  };

  const acceptAnswer = async (answerId: string) => {
    const res = await fetch(`/api/qa/questions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answerId, accept: true }),
    });
    if (res.ok) fetchQuestion();
    else toast.error(t.common.error);
  };

  const toggleExpertVerify = async (answerId: string, verified: boolean) => {
    const res = await fetch("/api/qa/answers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answerId, verified: !verified }),
    });
    if (res.ok) fetchQuestion();
    else toast.error(t.common.error);
  };

  const reportQuestion = async () => {
    if (!user || !question) return;
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetType: "QUESTION",
        targetId: question.id,
        reason: "Inappropriate content",
      }),
    });
    if (res.ok) toast.success(t.report.success);
    else toast.error(t.common.error);
  };

  const isExpert = user?.role === "EXPERT" || user?.role === "ADMIN";
  const isOwner = user?.id === question?.user.id;

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="text-center py-16">
        <Button variant="outline" onClick={() => router.push("/qa")}>
          {t.common.back}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href="/qa"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.common.back}
      </Link>

      <Card className="glass-card border-0 mb-6">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="secondary">{categoryLabel(question.category)}</Badge>
                {question.solved && (
                  <Badge variant="success">
                    <CheckCircle2 className="w-3 h-3 me-1" />
                    {t.qa.solved}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-xl">{question.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {question.user.name} · {formatDateTime(question.createdAt, locale)}
              </p>
              {question.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {question.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            {user && (
              <Button size="sm" variant="ghost" onClick={reportQuestion}>
                <Flag className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{question.content}</p>
        </CardContent>
      </Card>

      <h2 className="font-semibold mb-4">
        {t.qa.answers} ({formatNumber(question.answers.length)})
      </h2>

      <div className="space-y-4 mb-8">
        {question.answers.map((answer) => (
          <Card
            key={answer.id}
            className={`glass-card border-0 ${answer.isAccepted ? "ring-2 ring-emerald-500/50" : ""}`}
          >
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Link href={`/profile/${answer.user.username}`} className="font-medium text-sm hover:text-primary">
                      {answer.user.name}
                    </Link>
                    {answer.isExpertVerified && (
                      <Badge variant="success" className="text-[10px]">
                        <BadgeCheck className="w-3 h-3 me-1" />
                        {t.qa.expert}
                      </Badge>
                    )}
                    {answer.isAccepted && (
                      <Badge variant="success" className="text-[10px]">
                        <Star className="w-3 h-3 me-1" />
                        {t.qa.bestAnswer}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{answer.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDateTime(answer.createdAt, locale)}
                  </p>
                  {isExpert && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-2 h-7 text-xs"
                      onClick={() => toggleExpertVerify(answer.id, answer.isExpertVerified)}
                    >
                      {answer.isExpertVerified ? t.qa.unverifyAnswer : t.qa.verifyAnswer}
                    </Button>
                  )}
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Button
                    size="sm"
                    variant={answer.userVote === 1 ? "default" : "outline"}
                    className="h-8 px-2"
                    title={t.qa.upvote}
                    onClick={() => castVote(answer.id, 1, answer.userVote)}
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium tabular-nums">
                    {formatNumber(answer.voteCount)}
                  </span>
                  <Button
                    size="sm"
                    variant={answer.userVote === -1 ? "default" : "outline"}
                    className="h-8 px-2"
                    title={t.qa.downvote}
                    onClick={() => castVote(answer.id, -1, answer.userVote)}
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </Button>
                  {isOwner && !answer.isAccepted && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-1 h-7 text-[10px] whitespace-nowrap"
                      onClick={() => acceptAnswer(answer.id)}
                    >
                      {t.qa.markBest}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {user ? (
        <Card className="glass-card border-0">
          <CardContent className="pt-4 space-y-3">
            <Textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder={t.qa.writeAnswer}
              rows={4}
            />
            <Button onClick={submitAnswer} disabled={submitting || !answerText.trim()}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {t.qa.answer}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-card border-0">
          <CardContent className="pt-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">{t.qa.loginToAnswer}</p>
            <Button asChild>
              <Link href="/auth/login">{t.nav.login}</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
