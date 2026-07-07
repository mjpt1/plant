"use client";

import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  isFollowing: boolean;
  onToggle: () => void | Promise<void>;
  loading?: boolean;
  size?: "sm" | "default";
  className?: string;
}

export function FollowButton({
  isFollowing,
  onToggle,
  loading = false,
  size = "sm",
  className,
}: FollowButtonProps) {
  const { t } = useLanguage();

  if (size === "sm") {
    return (
      <button
        type="button"
        onClick={onToggle}
        disabled={loading}
        className={cn(
          "flex items-center gap-1 text-xs transition-colors disabled:opacity-50",
          isFollowing
            ? "text-gray-500 hover:text-gray-400"
            : "text-emerald-600 hover:text-emerald-500",
          className
        )}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isFollowing ? (
          <UserMinus className="w-3.5 h-3.5" />
        ) : (
          <UserPlus className="w-3.5 h-3.5" />
        )}
        {isFollowing ? t.social.unfollow : t.social.follow}
      </button>
    );
  }

  return (
    <Button
      onClick={onToggle}
      disabled={loading}
      variant={isFollowing ? "outline" : "default"}
      className={className}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <UserMinus className="w-4 h-4" />
      ) : (
        <UserPlus className="w-4 h-4" />
      )}
      {isFollowing ? t.social.unfollow : t.social.follow}
    </Button>
  );
}
