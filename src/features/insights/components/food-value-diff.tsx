import { FaArrowDown, FaArrowUp } from "react-icons/fa";
import { FoodValue as FoodValueType } from "@/types/food-value";
import { FoodValue } from "@/components/ui/food-value.tsx";
import { cn } from "@/lib/utils.ts";

interface FoodValueDiffProps {
  foodValue?: FoodValueType;
  isLoading?: boolean;
}

const FoodValueDiffItem = ({
  value,
  measure,
  successColor = "text-green-600",
  failColor = "text-red-600",
}) => {
  const className = value >= 0 ? failColor : successColor;
  const icon = value >= 0 ? <FaArrowUp /> : <FaArrowDown />;
  return (
    <strong className={cn("flex gap-1 text-xs", className)}>
      {icon} {Math.round(value)} {measure}
    </strong>
  );
};

export function FoodValueDiff({ foodValue, isLoading }: FoodValueDiffProps) {
  if (isLoading || !foodValue) {
    return <FoodValue isLoading />;
  }

  return (
    <div className="mb-0 flex gap-5">
      <FoodValueDiffItem value={foodValue.calories} measure="kcal" />
      <FoodValueDiffItem
        value={foodValue.proteins}
        measure="g"
        successColor="text-red-600"
        failColor="text-green-600"
      />
      <FoodValueDiffItem value={foodValue.fats} measure="g" />
      <FoodValueDiffItem value={foodValue.carbs} measure="g" />
    </div>
  );
}
