import { FoodValue as FoodValueType } from "@/types/food-value";
import { emptyFoodValue } from "@/utils/food-value-utils";
import { cn } from "@/lib/utils.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";

type Props = {
  value?: FoodValueType | null;
  className?: string;
  isLoading?: boolean;
};

export function FoodValue({ value, className = "", isLoading }: Props) {
  // TODO: single format func
  const format = (val: number) => (val != null ? Math.round(val) : "n/a");
  const renderedValue = value ?? emptyFoodValue();

  return (
    <div className={cn("flex h-4 gap-3 text-xs", className)}>
      {isLoading ? (
        <>
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-10" />
        </>
      ) : (
        <>
          <span>⚡ {format(renderedValue.calories)} kcal</span>
          <span>🥩 {format(renderedValue.proteins)} g</span>
          <span>🧈 {format(renderedValue.fats)} g</span>
          <span>🍚 {format(renderedValue.carbs)} g</span>
        </>
      )}
    </div>
  );
}
