import { FaArrowDown, FaArrowUp } from "react-icons/fa";
import { FoodValue as FoodValueType } from "@/types/food-value";
import { FoodValue } from "@/components/FoodValue";
import { clsx } from "clsx";
import { Level } from "@/components/ui/Level";

interface FoodValueDiffProps {
  foodValue?: FoodValueType;
  isLoading?: boolean;
}

const FoodValueDiffItem = ({
  value,
  measure,
  successColor = "has-text-success",
  failColor = "has-text-danger",
}) => {
  const className = value >= 0 ? failColor : successColor;
  const icon = value >= 0 ? <FaArrowUp /> : <FaArrowDown />;
  return (
    <strong
      className={clsx("tag has-background-none is-size-7 px-0", className)}
    >
      {icon} {Math.round(value)} {measure}
    </strong>
  );
};

function FoodValueDiff({ foodValue, isLoading }: FoodValueDiffProps) {
  if (isLoading || !foodValue) {
    return <FoodValue isLoading />;
  }

  return (
    <Level className="level-left mb-0">
      <FoodValueDiffItem value={foodValue.calories} measure="kcal" />
      <FoodValueDiffItem
        value={foodValue.proteins}
        measure="g"
        successColor="has-text-danger"
        failColor="has-text-success"
      />
      <FoodValueDiffItem value={foodValue.fats} measure="g" />
      <FoodValueDiffItem value={foodValue.carbs} measure="g" />
    </Level>
  );
}

export default FoodValueDiff;
