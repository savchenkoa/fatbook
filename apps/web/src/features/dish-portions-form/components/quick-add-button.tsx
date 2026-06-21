import { Button } from "@/components/ui/button.tsx";
import { LucideCheckCircle2, LucidePlusCircle } from "lucide-react";
import { DishPortion } from "@/types/dish-portion.ts";
import { MouseEvent } from "react";
import { cn } from "@/lib/utils.ts";

type Props = {
    portion: DishPortion;
    onClick: (e: MouseEvent) => void;
};

export function QuickAddButton({ portion, onClick }: Props) {
    const Icon = portion.selected ? LucideCheckCircle2 : LucidePlusCircle;

    return (
        <Button
            variant="ghost"
            size="icon"
            className={cn("rounded-full hover:bg-neutral-200", {
                "hover:bg-green-200": portion.selected,
            })}
            onClick={onClick}
        >
            <Icon
                className={cn("size-10! stroke-1 text-neutral-600", {
                    "text-green-600": portion.selected,
                })}
            />
        </Button>
    );
}
