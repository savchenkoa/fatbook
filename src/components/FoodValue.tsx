import { NutritionFacts } from "@/types/nutrition-facts";
import foodValueUtils from "@/utils/food-value-utils";
import { clsx } from "clsx";

type Props = {
  source: NutritionFacts;
  className?: string;
};

function FoodValue({
  source = foodValueUtils.emptyFoodValue(),
  className = "",
}: Props) {
  // TODO: single format func
  const format = (val: number) => (val != null ? Math.round(val) : "n/a");

  return (
    <span className={clsx("level ", className)}>
      <span className="mr-2">⚡ {format(source.calories)} kcal</span>
      <span className="mr-2">🥩 {format(source.proteins)} g</span>
      <span className="mr-2">🧈 {format(source.fats)} g</span>
      <span className="mr-2">🍚 {format(source.carbs)} g</span>
    </span>
  );
}

export default FoodValue;
