import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  avatar?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-7 h-7 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-16 h-16 text-2xl",
};

export function UserAvatar({ name, avatar, size = "md", className }: UserAvatarProps) {
  const initial = name.charAt(0).toUpperCase();

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={cn(
          "rounded-full object-cover shrink-0",
          sizeClasses[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white font-medium shrink-0",
        sizeClasses[size],
        className
      )}
    >
      {initial}
    </div>
  );
}
