"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Heart,
  MessageCircle,
  Send,
  ImagePlus,
  Loader2,
  X,
  Flag,
  Trash2,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useLocaleFormat } from "@/hooks/useLocaleFormat";
import { formatDateTime } from "@/utils/dateHelper";
import { cn } from "@/lib/utils";
import type { PostWithMeta } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserAvatar } from "@/components/social/UserAvatar";
import { FollowButton } from "@/components/social/FollowButton";
import { ReportDialog } from "@/components/social/ReportDialog";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
}

type FeedTab = "all" | "following";

export function SocialFeed() {
  const { t, locale } = useLanguage();
  const { formatNumber } = useLocaleFormat();
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [posts, setPosts] = useState<PostWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [feedTab, setFeedTab] = useState<FeedTab>("all");
  const [newPost, setNewPost] = useState("");
  const [newImage, setNewImage] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});
  const [reportTarget, setReportTarget] = useState<{
    type: "POST";
    id: string;
  } | null>(null);

  const fetchPosts = useCallback(
    async (pageNum: number, append = false) => {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const params = new URLSearchParams({
          page: String(pageNum),
          limit: "20",
        });
        if (feedTab === "following") params.set("following", "true");

        const res = await fetch(`/api/posts?${params}`);
        const data = await res.json();
        const fetched: PostWithMeta[] = data.posts || [];

        setPosts((prev) => (append ? [...prev, ...fetched] : fetched));
        setHasMore(data.hasMore ?? false);
        setPage(pageNum);
      } catch {
        toast.error(t.common.error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [feedTab, t.common.error]
  );

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setNewImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const createPost = async () => {
    if (!newPost.trim() || !user) return;
    setPosting(true);
    try {
      let imageUrl = newImage;
      if (newImage?.startsWith("data:")) {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: newImage }),
        });
        if (uploadRes.ok) {
          const uploaded = await uploadRes.json();
          imageUrl = uploaded.url;
        }
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newPost, imageUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setPosts((prev) => [data.post, ...prev]);
        setNewPost("");
        setNewImage(null);
        setShowCreate(false);
      } else {
        toast.error(data.error || t.common.error);
      }
    } catch {
      toast.error(t.common.error);
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    const post = posts.find((p) => p.id === postId);
    const res = await fetch(
      post?.likedByUser ? `/api/likes?postId=${postId}` : "/api/likes",
      {
        method: post?.likedByUser ? "DELETE" : "POST",
        headers: post?.likedByUser ? undefined : { "Content-Type": "application/json" },
        body: post?.likedByUser ? undefined : JSON.stringify({ postId }),
      }
    );
    const data = await res.json();
    if (res.ok) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                likedByUser: data.liked,
                _count: { ...p._count, likes: data.count },
              }
            : p
        )
      );
    }
  };

  const loadComments = async (postId: string) => {
    if (expandedComments === postId) {
      setExpandedComments(null);
      return;
    }
    setExpandedComments(postId);
    if (!comments[postId]) {
      const res = await fetch(`/api/posts/${postId}`);
      const data = await res.json();
      setComments((prev) => ({ ...prev, [postId]: data.post?.comments || [] }));
    }
  };

  const submitComment = async (postId: string) => {
    const text = commentText[postId]?.trim();
    if (!text || !user) return;
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, content: text }),
    });
    const data = await res.json();
    if (res.ok) {
      setComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), data.comment],
      }));
      setCommentText((prev) => ({ ...prev, [postId]: "" }));
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, _count: { ...p._count, comments: p._count.comments + 1 } }
            : p
        )
      );
    }
  };

  const toggleFollow = async (userId: string) => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    setFollowLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followingId: userId }),
      });
      const data = await res.json();
      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) =>
            p.user.id === userId ? { ...p, isFollowing: data.following } : p
          )
        );
      }
    } finally {
      setFollowLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm(t.social.deleteConfirm)) return;
    const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success(t.social.deleted);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">{t.social.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {t.social.subtitle}
          </p>
        </div>
        {user && (
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm px-4 py-2">
            {t.social.createPost}
          </button>
        )}
      </div>

      {user && (
        <div className="flex gap-2 mb-6">
          {(["all", "following"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFeedTab(tab)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                feedTab === tab
                  ? "bg-emerald-500 text-white"
                  : "glass hover:bg-white/20"
              )}
            >
              {tab === "all" ? t.social.feedAll : t.social.feedFollowing}
            </button>
          ))}
        </div>
      )}

      {!user && (
        <div className="glass-card p-6 text-center mb-6 animate-fade-in">
          <p className="text-gray-600 dark:text-gray-400 mb-4">{t.social.loginToPost}</p>
          <Link href="/auth/login" className="btn-primary">
            {t.nav.login}
          </Link>
        </div>
      )}

      {showCreate && user && (
        <div className="glass-card p-6 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{t.social.createPost}</h3>
            <button onClick={() => setShowCreate(false)}>
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder={t.social.whatsOnMind}
            className="input-field min-h-[100px] resize-none mb-3"
            rows={3}
          />
          {newImage && (
            <div className="relative mb-3 rounded-xl overflow-hidden">
              <img src={newImage} alt="Preview" className="w-full max-h-48 object-cover" />
              <button
                onClick={() => setNewImage(null)}
                className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex items-center justify-between">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-500"
            >
              <ImagePlus className="w-5 h-5" />
              {t.social.addPhoto}
            </button>
            <button
              onClick={createPost}
              disabled={posting || !newPost.trim()}
              className="btn-primary text-sm px-4 py-2"
            >
              {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {t.social.post}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : posts.length === 0 ? (
        <div className="glass-card p-12 text-center text-gray-500 animate-fade-in">
          {feedTab === "following" ? t.social.noFollowingPosts : t.social.noPosts}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post, i) => (
            <article
              key={post.id}
              className={`glass-card p-5 animate-fade-in-delay-${Math.min(i + 1, 3)}`}
            >
              <div className="flex items-center justify-between mb-3">
                <Link href={`/profile/${post.user.username}`} className="flex items-center gap-3">
                  <UserAvatar name={post.user.name} avatar={post.user.avatar} />
                  <div>
                    <p className="font-medium text-sm">{post.user.name}</p>
                    <p className="text-xs text-gray-500">
                      @{post.user.username} · {formatDateTime(post.createdAt, locale)}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  {user && user.id !== post.user.id && (
                    <FollowButton
                      isFollowing={!!post.isFollowing}
                      onToggle={() => toggleFollow(post.user.id)}
                      loading={followLoading[post.user.id]}
                    />
                  )}
                  {user && (
                    <button
                      type="button"
                      onClick={() => setReportTarget({ type: "POST", id: post.id })}
                      className="text-gray-400 hover:text-gray-300"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {user && user.id === post.user.id && (
                    <button
                      type="button"
                      onClick={() => deletePost(post.id)}
                      className="text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <Link href={`/social/post/${post.id}`}>
                <p className="text-sm mb-3 whitespace-pre-wrap">{post.content}</p>
                {post.imageUrl && (
                  <div className="rounded-xl overflow-hidden mb-3">
                    <img
                      src={post.imageUrl}
                      alt="Post"
                      className="w-full max-h-80 object-cover"
                    />
                  </div>
                )}
              </Link>

              <div className="flex items-center gap-4 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => toggleLike(post.id)}
                  className={cn(
                    "flex items-center gap-1.5 text-sm transition-colors",
                    post.likedByUser
                      ? "text-red-500"
                      : "text-gray-500 hover:text-red-500"
                  )}
                >
                  <Heart className={cn("w-4 h-4", post.likedByUser && "fill-current")} />
                  {formatNumber(post._count.likes)}
                </button>
                <button
                  type="button"
                  onClick={() => loadComments(post.id)}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-500 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  {formatNumber(post._count.comments)}
                </button>
              </div>

              {expandedComments === post.id && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                  {(comments[post.id] || []).map((c) => (
                    <div key={c.id} className="flex gap-2">
                      <UserAvatar name={c.user.name} avatar={c.user.avatar} size="sm" />
                      <div className="glass p-3 rounded-xl flex-1">
                        <Link
                          href={`/profile/${c.user.username}`}
                          className="text-xs font-medium hover:text-emerald-500"
                        >
                          {c.user.name}
                        </Link>
                        <p className="text-sm mt-0.5">{c.content}</p>
                      </div>
                    </div>
                  ))}
                  {user ? (
                    <div className="flex gap-2">
                      <input
                        value={commentText[post.id] || ""}
                        onChange={(e) =>
                          setCommentText((prev) => ({
                            ...prev,
                            [post.id]: e.target.value,
                          }))
                        }
                        placeholder={t.social.writeComment}
                        className="input-field text-sm py-2 flex-1"
                        onKeyDown={(e) => e.key === "Enter" && submitComment(post.id)}
                      />
                      <button
                        type="button"
                        onClick={() => submitComment(post.id)}
                        className="p-2 rounded-xl bg-emerald-500 text-white"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 text-center">{t.social.loginToComment}</p>
                  )}
                </div>
              )}
            </article>
          ))}

          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={() => fetchPosts(page + 1, true)}
                disabled={loadingMore}
                className="btn-primary text-sm px-6 py-2"
              >
                {loadingMore ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t.social.loadMore
                )}
              </button>
            </div>
          )}
        </div>
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
