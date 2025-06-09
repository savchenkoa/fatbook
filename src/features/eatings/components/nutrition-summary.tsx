import { CalorieGauge } from "./calorie-gauge";
import { MacroGauge } from "./macro-gauge";
import { MacroProgressBar } from "./macro-progress-bar";
import { FoodValue } from "@/types/food-value";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  current?: FoodValue | null;
  goals?: FoodValue | null;
  isLoading?: boolean;
  className?: string;
};

export function NutritionSummary({
  current,
  goals,
  isLoading = false,
  className,
}: Props) {
  // Default values if data is not available
  const currentValues = current || {
    calories: 0,
    proteins: 0,
    fats: 0,
    carbs: 0,
  };
  const goalValues = goals || {
    calories: 2000,
    proteins: 150,
    fats: 67,
    carbs: 250,
  };

  if (isLoading) {
    return (
      <div className={cn("w-full", className)}>
        {/* Desktop Loading */}
        <div className="hidden h-[203px] sm:flex sm:items-baseline sm:justify-between">
          <Skeleton className="mb-4 h-[165px] w-[165px] rounded-full" />
          <Skeleton className="mb-4 h-[100px] w-[100px] rounded-full" />
          <Skeleton className="mb-4 h-[100px] w-[100px] rounded-full" />
          <Skeleton className="mb-4 h-[100px] w-[100px] rounded-full" />
        </div>

        {/* Mobile Loading - Progress bar layout */}
        <div className="flex h-[200px] items-center sm:hidden">
          <div className="mr-4 mb-3">
            <Skeleton className="h-[130px] w-[130px] rounded-full" />
          </div>
          <div className="flex flex-1 flex-col gap-8">
            <Skeleton className="h-4 w-full min-w-[140px]" />
            <Skeleton className="h-4 w-full min-w-[140px]" />
            <Skeleton className="h-4 w-full min-w-[140px]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop Layout: Side by side */}
      <div className="hidden sm:flex sm:items-baseline sm:justify-between">
        <CalorieGauge
          consumed={currentValues.calories || 0}
          goal={goalValues.calories || 2000}
        />
        <MacroGauge
          type="protein"
          current={currentValues.proteins || 0}
          goal={goalValues.proteins || 150}
        />
        <MacroGauge
          type="fat"
          current={currentValues.fats || 0}
          goal={goalValues.fats || 67}
        />
        <MacroGauge
          type="carbs"
          current={currentValues.carbs || 0}
          goal={goalValues.carbs || 250}
        />
      </div>

      {/* Mobile Layout: Calorie pie + Progress bars (max 200px height) */}
      <div className="flex h-[200px] items-center justify-between sm:hidden">
        {/* Calorie gauge - compact */}
        <div className="ml-[-20px] scale-80">
          <CalorieGauge
            consumed={currentValues.calories || 0}
            goal={goalValues.calories || 2000}
          />
        </div>

        {/* Macro progress bars - stacked vertically */}
        <div className="mb-6 flex flex-1 flex-col gap-5">
          <MacroProgressBar
            type="protein"
            current={currentValues.proteins || 0}
            goal={goalValues.proteins || 150}
          />
          <MacroProgressBar
            type="fat"
            current={currentValues.fats || 0}
            goal={goalValues.fats || 67}
          />
          <MacroProgressBar
            type="carbs"
            current={currentValues.carbs || 0}
            goal={goalValues.carbs || 250}
          />
        </div>
      </div>
    </div>
  );
}
