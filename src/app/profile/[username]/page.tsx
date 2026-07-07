"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, Leaf, MessageCircle, Heart, Flag, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useLocaleFormat } from "@/hooks/useLocaleFormat";
import { formatDate } from "@/utils/dateHelper";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/social/UserAvatar";
import { FollowButton } from "@/components/social/FollowButton";
import { ReportDialog } from "@/components/social/ReportDialog";

interface PublicProfile {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  country: string | null;
  city: string | null;
  role: string;
  createdAt: string;
  isFollowing: boolean;
  isOwnProfile: boolean;
  _count: { plants: number; posts: number; followers: number; following: number };
  posts: Array<{
    id: string;
    content: string;
    imageUrl: string | null;
    createdAt: string;
    _count: { likes: number; comments: number };
  }>;
}

interface FollowUser {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  isFollowing: boolean;
  isSelf: boolean;
}

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { t, locale } = useLanguage();
  const { formatNumber } = useLocaleFormat();
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [listModal, setListModal] = useState<"followers" | "following" | null>(null);
  const [listUsers, setListUsers] = useState<FollowUser[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const fetchProfile = useCallback(async () => {
    const res = await fetch(`/api/users/${username}`);
    const data = await res.json();
    if (res.ok) setProfile(data.profile);
    setLoading(false);
  }, [username]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const toggleFollow = async () => {
    if (!profile || !user) return;
    setFollowLoading(true);
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followingId: profile.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile((p) =>
          p
            ? {
                ...p,
                isFollowing: data.following,
                _count: {
                  ...p._count,
                  followers: p._count.followers + (data.following ? 1 : -1),
                },
              }
            : p
        );
      }
    } finally {
      setFollowLoading(false);
    }
  };

  const openFollowList = async (type: "followers" | "following") => {
    if (!profile) return;
    setListModal(type);
    setListLoading(true);
    try {
      const res = await fetch(`/api/follow?userId=${profile.id}&type=${type}`);
      const data = await res.json();
      if (res.ok) setListUsers(data.users || []);
    } finally {
      setListLoading(false);
    }
  };

  const toggleListFollow = async (userId: string) => {
    if (!user) return;
    const res = await fetch("/api/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followingId: userId }),
    });
    const data = await res.json();
    if (res.ok) {
      setListUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isFollowing: data.following } : u))
      );
      if (profile && userId === profile.id) {
        setProfile((p) =>
          p
            ? {
                ...p,
                isFollowing: data.following,
                _count: {
                  ...p._count,
                  followers: p._count.followers + (data.following ? 1 : -1),
                },
              }
            : p
        );
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return <p className="text-center py-16 text-muted-foreground">{t.common.error}</p>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Card className="glass-card border-0 mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <UserAvatar name={profile.name} avatar={profile.avatar} size="lg" />
              <div>
                <h1 className="text-2xl font-bold">{profile.name}</h1>
                <p className="text-muted-foreground">@{profile.username}</p>
                {profile.role === "EXPERT" && (
                  <Badge variant="success" className="mt-1">
                    {t.profile.expert}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {!profile.isOwnProfile && user && (
                <>
                  <FollowButton
                    isFollowing={profile.isFollowing}
                    onToggle={toggleFollow}
                    loading={followLoading}
                    size="default"
                  />
                  <Button size="sm" variant="ghost" onClick={() => setShowReport(true)}>
                    <Flag className="w-4 h-4" />
                  </Button>
                </>
              )}
              {profile.isOwnProfile && (
                <Button asChild variant="outline">
                  <Link href="/settings">{t.dashboard.actions.settings}</Link>
                </Button>
              )}
            </div>
          </div>
          {profile.bio && <p className="mt-4 text-sm">{profile.bio}</p>}
          {(profile.city || profile.country) && (
            <p className="text-xs text-muted-foreground mt-2">
              {[profile.city, profile.country].filter(Boolean).join(", ")}
            </p>
          )}
          <div className="flex gap-6 mt-4 text-sm">
            <button
              type="button"
              onClick={() => openFollowList("followers")}
              className="hover:text-primary transition-colors"
            >
              <strong>{formatNumber(profile._count.followers)}</strong> {t.social.followers}
            </button>
            <button
              type="button"
              onClick={() => openFollowList("following")}
              className="hover:text-primary transition-colors"
            >
              <strong>{formatNumber(profile._count.following)}</strong> {t.social.following}
            </button>
            <span>
              <strong>{formatNumber(profile._count.plants)}</strong> {t.plants.title}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {t.dashboard.memberSince} {formatDate(profile.createdAt, locale)}
          </p>
        </CardContent>
      </Card>

      <h2 className="font-semibold mb-4">{t.social.posts}</h2>
      <div className="space-y-4">
        {profile.posts.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{t.social.noPosts}</p>
        ) : (
          profile.posts.map((post) => (
            <Link key={post.id} href={`/social/post/${post.id}`}>
              <Card className="glass-card border-0 hover:bg-accent/50 transition-colors">
                <CardContent className="pt-4">
                  <p className="text-sm line-clamp-3">{post.content}</p>
                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt=""
                      className="mt-2 rounded-lg w-full max-h-40 object-cover"
                    />
                  )}
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {formatNumber(post._count.likes)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      {formatNumber(post._count.comments)}
                    </span>
                    <span>{formatDate(post.createdAt, locale)}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      {profile.isOwnProfile && (
        <div className="mt-6 text-center">
          <Button asChild variant="outline">
            <Link href="/plants">
              <Leaf className="w-4 h-4" />
              {t.plants.title}
            </Link>
          </Button>
        </div>
      )}

      {listModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="glass-card w-full max-w-md max-h-[70vh] flex flex-col p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">
                {listModal === "followers" ? t.social.followers : t.social.following}
              </h3>
              <button type="button" onClick={() => setListModal(null)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-3">
              {listLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : listUsers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t.social.noUsers}</p>
              ) : (
                listUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between gap-3">
                    <Link
                      href={`/profile/${u.username}`}
                      className="flex items-center gap-3 flex-1 min-w-0"
                      onClick={() => setListModal(null)}
                    >
                      <UserAvatar name={u.name} avatar={u.avatar} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{u.name}</p>
                        <p className="text-xs text-muted-foreground">@{u.username}</p>
                      </div>
                    </Link>
                    {user && !u.isSelf && (
                      <FollowButton
                        isFollowing={u.isFollowing}
                        onToggle={() => toggleListFollow(u.id)}
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showReport && (
        <ReportDialog
          open
          onClose={() => setShowReport(false)}
          targetType="USER"
          targetId={profile.id}
        />
      )}
    </div>
  );
}
