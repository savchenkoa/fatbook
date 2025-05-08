import { DishIcon } from "@/components/dish/dish-icon.tsx";
import { Dish } from "@/types/dish";
import { SimplifiedDish } from "@/types/dish-portion";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { cn } from "@/lib/utils.ts";

type Props = {
  dish?: Dish | SimplifiedDish;
  isLoading?: boolean;
  className?: string;
};

export function DishTitle({ dish, isLoading, className }: Props) {
  const renderedName = dish?.name || "<No Name>";

  if (isLoading) {
    return (
      <div className="mb-2 flex items-center">
        <Skeleton className="mr-2 size-[27px]" />
        <Skeleton className="h-[18px] w-[200px]" />
      </div>
    );
  }

  return (
    <div className={cn("mb-2 flex items-center gap-1", className)}>
      <DishIcon dish={dish} />
      <p className="select-none">{renderedName}</p>
    </div>
  );
}
