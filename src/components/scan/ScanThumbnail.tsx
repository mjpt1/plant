import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function isDisplayableScanImage(url?: string | null): boolean {
  if (!url) return false;
  return (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:")
  );
}

interface ScanThumbnailProps {
  src?: string | null;
  alt?: string;
  className?: string;
  iconClassName?: string;
}

export function ScanThumbnail({
  src,
  alt = "",
  className,
  iconClassName,
}: ScanThumbnailProps) {
  if (!isDisplayableScanImage(src)) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-emerald-500/10",
          className
        )}
      >
        <ImageIcon
          className={cn("w-8 h-8 text-emerald-400/60", iconClassName)}
        />
      </div>
    );
  }

  return <img src={src!} alt={alt} className={className} />;
}
