import { cn } from "@/lib/utils.ts";

export function FatbookLogo({ className }: { className?: string }) {
    return <img src="/burger.png" alt="burger-icon" className={cn("size-[28px]", className)} />;
}
