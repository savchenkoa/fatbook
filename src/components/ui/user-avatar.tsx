import { LucideUser } from "lucide-react";
import { cn } from "@/lib/utils.ts";

type Props = {
  avatarUrl?: string;
  variant?: "large" | "regular";
  color?: "dark" | "light";
};

export function UserAvatar({ avatarUrl, variant, color }: Props) {
  if (avatarUrl) {
    return (
      <img
        className={cn("size-7 rounded-full", variant === "large" && "size-16")}
        src={avatarUrl}
        alt=""
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full p-2",
        variant === "large" && "size-16",
        color === "dark"
          ? "text-secondary bg-zinc-700"
          : "text-secondary-foreground bg-white",
      )}
    >
      <LucideUser />
    </div>
  );
}
