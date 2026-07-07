"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Heart, Loader2, Send, Flag, Trash2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useLocaleFormat } from "@/hooks/useLocaleFormat";
import { formatDateTime } from "@/utils/dateHelper";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { UserAvatar } from "@/components/social/UserAvatar";
import { ReportDialog } from "@/components/social/ReportDialog";

interface PostDetail {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  likedByUser: boolean;
  user: { id: string; name: string; username: string; avatar: string | null };
  _count: { likes: number; comments: number };
  comments: Array<{
    id: string;
    content: string;
    createdAt: string;
    user: { id: string; name: string; username: string; avatar: string | null };
  }>;
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useLanguage();
  const { formatNumber } = useLocaleFormat();
  const { user } = useAuth();
  const router = useRouter();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    type: "POST" | "COMMENT";
    id: string;
  } | null>(null);

  const fetchPost = useCallback(async () => {
    const res = await fetch(`/api/posts/${id}`);
    const data = await res.json();
    if (res.ok) setPost(data.post);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const toggleLike = async () => {
    if (!user || !post) {
      router.push("/auth/login");
      return;
    }
    const res = await fetch(
      post.likedByUser ? `/api/likes?postId=${post.id}` : "/api/likes",
      {
        method: post.likedByUser ? "DELETE" : "POST",
        headers: post.likedByUser ? undefined : { "Content-Type": "application/json" },
        body: post.likedByUser ? undefined : JSON.stringify({ postId: post.id }),
      }
    );
    const data = await res.json();
    if (res.ok) {
      setPost((p) =>
        p
          ? {
              ...p,
              likedByUser: data.liked,
              _count: { ...p._count, likes: data.count },
            }
          : p
      );
    }
  };

  const submitComment = async () => {
    if (!comment.trim() || !user || !post) return;
    setSubmitting(true);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: post.id, content: comment }),
    });
    setSubmitting(false);
    if (res.ok) {
      setComment("");
      fetchPost();
    } else {
      const data = await res.json();
      toast.error(data.error || t.common.error);
    }
  };

  const deletePost = async () => {
    if (!post || !confirm(t.social.deleteConfirm)) return;
    const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(t.social.deleted);
      router.push("/social");
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm(t.social.deleteCommentConfirm)) return;
    const res = await fetch(`/api/comments?id=${commentId}`, { method: "DELETE" });
    if (res.ok) fetchPost();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-16">
        <Button variant="outline" onClick={() => router.push("/social")}>
          {t.common.back}
        </Button>
      </div>
    );
  }

  const isOwner = user?.id === post.user.id;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/social"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.common.back}
      </Link>

      <Card className="glass-card border-0 mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <Link href={`/profile/${post.user.username}`} className="flex items-center gap-3">
              <UserAvatar name={post.user.name} avatar={post.user.avatar} />
              <div>
                <p className="font-medium text-sm hover:text-primary">{post.user.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(post.createdAt, locale)}
                </p>
              </div>
            </Link>
            <div className="flex gap-1">
              {user && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setReportTarget({ type: "POST", id: post.id })}
                >
                  <Flag className="w-4 h-4" />
                </Button>
              )}
              {isOwner && (
                <Button size="sm" variant="ghost" onClick={deletePost}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          <p className="whitespace-pre-wrap">{post.content}</p>
          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt=""
              className="mt-4 rounded-xl w-full max-h-96 object-cover"
            />
          )}
          <div className="flex items-center gap-4 mt-4">
            <Button
              size="sm"
              variant={post.likedByUser ? "default" : "outline"}
              onClick={toggleLike}
            >
              <Heart className="w-4 h-4" />
              {formatNumber(post._count.likes)}
            </Button>
          </div>
        </CardContent>
      </Card>

      <h2 className="font-semibold mb-4">
        {t.social.comment} ({formatNumber(post.comments.length)})
      </h2>
      <div className="space-y-3 mb-6">
        {post.comments.map((c) => (
          <Card key={c.id} className="glass-card border-0">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3 flex-1">
                  <UserAvatar name={c.user.name} avatar={c.user.avatar} size="sm" />
                  <div>
                    <Link
                      href={`/profile/${c.user.username}`}
                      className="text-sm font-medium hover:text-primary"
                    >
                      {c.user.name}
                    </Link>
                    <p className="text-sm mt-1">{c.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDateTime(c.createdAt, locale)}
                    </p>
                  </div>
                </div>
                {user && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setReportTarget({ type: "COMMENT", id: c.id })}
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </Button>
                    {user.id === c.user.id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteComment(c.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {user ? (
        <div className="flex gap-2">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t.social.writeComment}
            rows={2}
            className="flex-1"
          />
          <Button onClick={submitComment} disabled={submitting || !comment.trim()}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      ) : (
        <Card className="glass-card border-0">
          <CardContent className="pt-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">{t.social.loginToComment}</p>
            <Button asChild>
              <Link href="/auth/login">{t.nav.login}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {reportTarget && (
        <ReportDialog
          open
          onClose={() => setReportTarget(null)}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
        />
      )}
    </div>
  );
}
