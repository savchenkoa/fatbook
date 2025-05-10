import { FoodValue as FoodValueType } from "@/types/food-value";
import { emptyFoodValue } from "@/utils/food-value-utils";
import { cn } from "@/lib/utils.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";

type Props = {
  value?: FoodValueType | null;
  className?: string;
  isLoading?: boolean;
  onlyCalories?: boolean;
};

export function FoodValue({
  value,
  className = "",
  isLoading,
  onlyCalories,
}: Props) {
  // TODO: single format func
  const format = (val: number) => (val != null ? Math.round(val) : "n/a");
  const renderedValue = value ?? emptyFoodValue();

  let content;
  if (isLoading) {
    content = (
      <>
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-4 w-10" />
        <Skeleton className="h-4 w-10" />
        <Skeleton className="h-4 w-10" />
      </>
    );
  } else if (onlyCalories) {
    content = (
      <>
        <span>⚡ {format(renderedValue.calories)} kcal</span>
      </>
    );
  } else {
    content = (
      <>
        <span>⚡ {format(renderedValue.calories)} kcal</span>
        <span>🥩 {format(renderedValue.proteins)} g</span>
        <span>🧈 {format(renderedValue.fats)} g</span>
        <span>🍚 {format(renderedValue.carbs)} g</span>
      </>
    );
  }

  return (
    <div
      className={cn(
        "flex h-4 gap-3 text-xs text-slate-500 select-none",
        className,
      )}
    >
      {content}
    </div>
  );
}
