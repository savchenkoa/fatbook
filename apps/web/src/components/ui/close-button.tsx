import { MouseEventHandler } from "react";
import { LucideX } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";

type Props = {
    onClick: MouseEventHandler;
    className?: string;
};

export function CloseButton({ onClick, className }: Props) {
    return (
        <Button
            size="icon"
            variant="ghost"
            className={cn("hover:bg-accent/30 rounded-full", className)}
            aria-label="close"
            onClick={onClick}
        >
            <LucideX />
        </Button>
    );
}
