"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Shield,
  Users,
  Flag,
  BarChart3,
  BookOpen,
  MessageSquare,
  MessageCircleQuestion,
  Search,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useLocaleFormat } from "@/hooks/useLocaleFormat";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AdminStats {
  users: number;
  scans: number;
  posts: number;
  questions: number;
  comments: number;
  likes: number;
  pendingReports: number;
  pendingCatalog: number;
  experts: number;
  recentUsers: number;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  createdAt: string;
  _count: { plants: number; posts: number; questions: number; scanHistory: number };
}

interface AdminReport {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  reporter: { name: string; username: string };
}

interface AdminPost {
  id: string;
  content: string;
  isHidden: boolean;
  createdAt: string;
  user: { name: string; username: string };
  _count: { likes: number; comments: number };
}

interface PendingCatalog {
  id: string;
  slug: string;
  nameEn: string;
  nameFa: string;
  category: string;
  description: string | null;
  createdAt: string;
  addedBy: { name: string; username: string } | null;
}

interface AdminComment {
  id: string;
  content: string;
  isHidden: boolean;
  createdAt: string;
  user: { name: string; username: string };
  postPreview: string;
}

interface AdminQuestion {
  id: string;
  title: string;
  category: string;
  solved: boolean;
  createdAt: string;
  user: { name: string; username: string };
  answerCount: number;
}

type AdminTab = "stats" | "users" | "posts" | "reports" | "catalog" | "comments" | "questions";
type ReportFilter = "PENDING" | "REVIEWED" | "DISMISSED" | "ALL";

const TAB_ICONS: Record<AdminTab, React.ReactNode> = {
  stats: <BarChart3 className="w-4 h-4" />,
  users: <Users className="w-4 h-4" />,
  posts: <MessageSquare className="w-4 h-4" />,
  reports: <Flag className="w-4 h-4" />,
  catalog: <BookOpen className="w-4 h-4" />,
  comments: <MessageSquare className="w-4 h-4" />,
  questions: <MessageCircleQuestion className="w-4 h-4" />,
};

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { t, locale } = useLanguage();
  const { formatNumber } = useLocaleFormat();
  const router = useRouter();

  const [tab, setTab] = useState<AdminTab>("stats");
  const [tabLoading, setTabLoading] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [pendingCatalog, setPendingCatalog] = useState<PendingCatalog[]>([]);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);

  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [postSearch, setPostSearch] = useState("");
  const [postHiddenFilter, setPostHiddenFilter] = useState("");
  const [questionSearch, setQuestionSearch] = useState("");
  const [reportFilter, setReportFilter] = useState<ReportFilter>("PENDING");

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/admin/stats");
    if (res.ok) setStats((await res.json()).stats);
    else toast.error(t.common.error);
  }, [t.common.error]);

  const fetchTab = useCallback(
    async (activeTab: AdminTab) => {
      setTabLoading(true);
      try {
        switch (activeTab) {
          case "stats":
            await fetchStats();
            break;
          case "users": {
            const params = new URLSearchParams();
            if (userSearch) params.set("search", userSearch);
            if (userRoleFilter) params.set("role", userRoleFilter);
            const res = await fetch(`/api/admin/users?${params}`);
            if (res.ok) setUsers((await res.json()).users);
            break;
          }
          case "reports": {
            const res = await fetch(`/api/admin/reports?status=${reportFilter}`);
            if (res.ok) setReports((await res.json()).reports);
            break;
          }
          case "posts": {
            const params = new URLSearchParams();
            if (postSearch) params.set("search", postSearch);
            if (postHiddenFilter) params.set("hidden", postHiddenFilter);
            const res = await fetch(`/api/admin/posts?${params}`);
            if (res.ok) setPosts((await res.json()).posts);
            break;
          }
          case "catalog": {
            const res = await fetch("/api/admin/catalog");
            if (res.ok) setPendingCatalog((await res.json()).plants);
            break;
          }
          case "comments": {
            const res = await fetch("/api/admin/comments");
            if (res.ok) setComments((await res.json()).comments);
            break;
          }
          case "questions": {
            const params = new URLSearchParams();
            if (questionSearch) params.set("search", questionSearch);
            const res = await fetch(`/api/admin/questions?${params}`);
            if (res.ok) setQuestions((await res.json()).questions);
            break;
          }
        }
      } catch {
        toast.error(t.common.error);
      } finally {
        setTabLoading(false);
      }
    },
    [
      fetchStats,
      userSearch,
      userRoleFilter,
      reportFilter,
      postSearch,
      postHiddenFilter,
      questionSearch,
      t.common.error,
    ]
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    fetchStats();
  }, [user, authLoading, router, fetchStats]);

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    const timer = setTimeout(() => fetchTab(tab), tab === "stats" ? 0 : 200);
    return () => clearTimeout(timer);
  }, [tab, user, fetchTab]);

  const refresh = () => {
    fetchStats();
    fetchTab(tab);
  };

  const updateRole = async (userId: string, role: string) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success(t.admin.roleUpdated);
      refresh();
    } else {
      toast.error(data.error || t.common.error);
    }
  };

  const togglePostVisibility = async (postId: string, isHidden: boolean) => {
    const res = await fetch("/api/admin/posts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, isHidden }),
    });
    if (res.ok) {
      toast.success(isHidden ? t.admin.hidePost : t.admin.showPost);
      refresh();
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm(t.admin.deletePostConfirm)) return;
    const res = await fetch(`/api/admin/posts?id=${postId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(t.admin.postDeleted);
      refresh();
    }
  };

  const toggleCommentVisibility = async (commentId: string, isHidden: boolean) => {
    const res = await fetch("/api/admin/comments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId, isHidden }),
    });
    if (res.ok) {
      toast.success(isHidden ? t.admin.hideComment : t.admin.showComment);
      refresh();
    }
  };

  const reviewReport = async (reportId: string, status: string, hideTarget = false) => {
    const res = await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, status, hideTarget }),
    });
    if (res.ok) {
      toast.success(t.admin.reportUpdated);
      refresh();
    }
  };

  const reviewCatalog = async (catalogId: string, action: "approve" | "reject") => {
    if (action === "reject" && !confirm(t.admin.rejectConfirm)) return;
    const res = await fetch("/api/admin/catalog", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ catalogId, action }),
    });
    if (res.ok) {
      toast.success(action === "approve" ? t.admin.catalogApproved : t.admin.catalogRejected);
      refresh();
    }
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm(t.admin.deleteQuestionConfirm)) return;
    const res = await fetch(`/api/admin/questions?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(t.admin.questionDeleted);
      refresh();
    }
  };

  const tabLabel = (id: AdminTab) => {
    if (id === "stats") return t.admin.overview;
    return t.admin[id];
  };

  const roleBadgeVariant = (role: string) => {
    if (role === "ADMIN") return "destructive" as const;
    if (role === "EXPERT") return "success" as const;
    return "secondary" as const;
  };

  if (authLoading || !user || user.role !== "ADMIN") {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{t.admin.title}</h1>
          <p className="text-muted-foreground">{t.admin.subtitle}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {(
          ["stats", "users", "catalog", "posts", "comments", "questions", "reports"] as AdminTab[]
        ).map((id) => (
          <Button
            key={id}
            variant={tab === id ? "default" : "outline"}
            size="sm"
            onClick={() => setTab(id)}
            className="shrink-0"
          >
            {TAB_ICONS[id]}
            {tabLabel(id)}
            {id === "catalog" && stats && stats.pendingCatalog > 0 && (
              <Badge variant="destructive" className="ms-1 h-5 px-1.5">
                {formatNumber(stats.pendingCatalog)}
              </Badge>
            )}
            {id === "reports" && stats && stats.pendingReports > 0 && (
              <Badge variant="destructive" className="ms-1 h-5 px-1.5">
                {formatNumber(stats.pendingReports)}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {tabLoading && tab !== "stats" ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {tab === "stats" && stats && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: t.admin.totalUsers, value: stats.users },
                { label: t.admin.recentUsers, value: stats.recentUsers },
                { label: t.admin.totalExperts, value: stats.experts },
                { label: t.admin.totalScans, value: stats.scans },
                { label: t.admin.posts, value: stats.posts },
                { label: t.admin.questions, value: stats.questions },
                { label: t.admin.totalComments, value: stats.comments },
                { label: t.admin.totalLikes, value: stats.likes },
                { label: t.admin.pendingReports, value: stats.pendingReports },
                { label: t.admin.pendingCatalog, value: stats.pendingCatalog },
              ].map((s) => (
                <Card key={s.label} className="glass-card border-0">
                  <CardContent className="pt-6">
                    <p className="text-2xl font-bold">{formatNumber(s.value)}</p>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {tab === "users" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder={t.admin.searchUsers}
                    className="input-field ps-10"
                  />
                </div>
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="input-field sm:w-40"
                >
                  <option value="">{t.admin.allRoles}</option>
                  <option value="USER">USER</option>
                  <option value="EXPERT">EXPERT</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              {users.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t.admin.noUsers}</p>
              ) : (
                users.map((u) => (
                  <Card key={u.id} className="glass-card border-0">
                    <CardContent className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">
                          @{u.username} · {u.email}
                        </p>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <Badge variant={roleBadgeVariant(u.role)}>{u.role}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatNumber(u._count.posts)} {t.admin.posts} ·{" "}
                            {formatNumber(u._count.questions)} {t.admin.questions}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant={u.role === "USER" ? "default" : "outline"}
                          onClick={() => updateRole(u.id, "USER")}
                        >
                          {t.admin.makeUser}
                        </Button>
                        <Button
                          size="sm"
                          variant={u.role === "EXPERT" ? "default" : "outline"}
                          onClick={() => updateRole(u.id, "EXPERT")}
                        >
                          {t.admin.makeExpert}
                        </Button>
                        <Button
                          size="sm"
                          variant={u.role === "ADMIN" ? "default" : "outline"}
                          onClick={() => updateRole(u.id, "ADMIN")}
                          disabled={u.id === user.id}
                        >
                          {t.admin.makeAdmin}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {tab === "catalog" && (
            <div className="space-y-3">
              {pendingCatalog.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t.admin.noPendingCatalog}</p>
              ) : (
                pendingCatalog.map((p) => (
                  <Card key={p.id} className="glass-card border-0">
                    <CardContent className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{locale === "fa" ? p.nameFa : p.nameEn}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {p.description}
                        </p>
                        {p.addedBy && (
                          <p className="text-xs text-muted-foreground mt-1">
                            @{p.addedBy.username} · {p.category}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => reviewCatalog(p.id, "approve")}>
                          {t.admin.approve}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => reviewCatalog(p.id, "reject")}
                        >
                          {t.admin.reject}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {tab === "posts" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={postSearch}
                    onChange={(e) => setPostSearch(e.target.value)}
                    placeholder={t.admin.searchPosts}
                    className="input-field ps-10"
                  />
                </div>
                <select
                  value={postHiddenFilter}
                  onChange={(e) => setPostHiddenFilter(e.target.value)}
                  className="input-field sm:w-40"
                >
                  <option value="">{t.admin.allPosts}</option>
                  <option value="false">{t.admin.visible}</option>
                  <option value="true">{t.admin.hidden}</option>
                </select>
              </div>
              {posts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t.admin.noPosts}</p>
              ) : (
                posts.map((p) => (
                  <Card key={p.id} className="glass-card border-0">
                    <CardContent className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-2">{p.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          @{p.user.username} · {formatNumber(p._count.likes)} {t.admin.likes}
                        </p>
                        {p.isHidden && (
                          <Badge variant="destructive" className="mt-1">
                            {t.admin.hidden}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => togglePostVisibility(p.id, !p.isHidden)}
                        >
                          {p.isHidden ? t.admin.showPost : t.admin.hidePost}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deletePost(p.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {tab === "comments" && (
            <div className="space-y-3">
              {comments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t.admin.noComments}</p>
              ) : (
                comments.map((c) => (
                  <Card key={c.id} className="glass-card border-0">
                    <CardContent className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-2">{c.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          @{c.user.username} · {c.postPreview}…
                        </p>
                        {c.isHidden && (
                          <Badge variant="destructive" className="mt-1">
                            {t.admin.hidden}
                          </Badge>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleCommentVisibility(c.id, !c.isHidden)}
                      >
                        {c.isHidden ? t.admin.showComment : t.admin.hideComment}
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {tab === "questions" && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={questionSearch}
                  onChange={(e) => setQuestionSearch(e.target.value)}
                  placeholder={t.admin.searchQuestions}
                  className="input-field ps-10"
                />
              </div>
              {questions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t.admin.noQuestions}</p>
              ) : (
                questions.map((q) => (
                  <Card key={q.id} className="glass-card border-0">
                    <CardContent className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{q.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          @{q.user.username} · {formatNumber(q.answerCount)} {t.qa.answers} ·{" "}
                          {q.category}
                        </p>
                        {q.solved && (
                          <Badge variant="secondary" className="mt-1">
                            {t.qa.solved}
                          </Badge>
                        )}
                      </div>
                      <Button size="sm" variant="destructive" onClick={() => deleteQuestion(q.id)}>
                        {t.admin.deleteQuestion}
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {tab === "reports" && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {(["PENDING", "REVIEWED", "DISMISSED", "ALL"] as ReportFilter[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setReportFilter(f)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      reportFilter === f
                        ? "bg-emerald-500 text-white"
                        : "glass hover:bg-white/10"
                    )}
                  >
                    {t.admin.reportStatus[f]}
                  </button>
                ))}
              </div>
              {reports.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t.admin.noReports}</p>
              ) : (
                reports.map((r) => (
                  <Card key={r.id} className="glass-card border-0">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Badge variant="outline">{r.targetType}</Badge>
                        {r.reason}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {t.admin.reportedBy} {r.reporter.name} · {r.status}
                      </p>
                      {r.details && (
                        <p className="text-xs text-muted-foreground mt-1">{r.details}</p>
                      )}
                    </CardHeader>
                    <CardContent className="flex gap-2 flex-wrap">
                      {r.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => reviewReport(r.id, "DISMISSED")}
                          >
                            {t.admin.dismissReport}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => reviewReport(r.id, "REVIEWED")}
                          >
                            {t.admin.reviewReport}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => reviewReport(r.id, "REVIEWED", true)}
                          >
                            {t.admin.reviewAndHide}
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
