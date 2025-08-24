import { Dish } from "@/types/dish";
import { SimplifiedDish } from "@/types/dish-portion";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { cn } from "@/lib/utils.ts";
import { getDishIcon } from "@/utils/icon-utils.ts";

type Props = {
    dish?: Dish | SimplifiedDish;
    isLoading?: boolean;
    className?: string;
};

export function DishTitle({ dish, isLoading, className }: Props) {
    if (isLoading) {
        return (
            <div className="mb-2 flex items-center">
                <Skeleton className="mr-2 size-[27px]" />
                <Skeleton className="h-[18px] w-[200px]" />
            </div>
        );
    }
    const renderedName = dish?.name || "<No Name>";
    const renderedIcon = getDishIcon(dish);

    return (
        <div className={cn("flex items-center gap-1", className)}>
            <span className="inline-flex size-6 items-center justify-center text-xl">
                {renderedIcon}
            </span>
            <p className="select-none">{renderedName}</p>
        </div>
    );
}
