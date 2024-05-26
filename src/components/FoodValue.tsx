import { FoodValue as FoodValueType } from "@/types/food-value";
import { emptyFoodValue } from "@/utils/food-value-utils";
import { clsx } from "clsx";
import { useIsLoading } from "@/hooks/use-is-loading";
import { DAILY_EATINGS_KEY } from "@/pages/eatings/Eatings";

type Props = {
  source?: FoodValueType | null;
  className?: string;
};

function FoodValue({ source, className = "" }: Props) {
  // TODO: single format func
  const format = (val: number) => (val != null ? Math.round(val) : "n/a");
  const rendered = source ?? emptyFoodValue();

  const isLoading = useIsLoading(DAILY_EATINGS_KEY);
  const cls = clsx("tag", {
    "is-skeleton": isLoading,
    "has-background-none px-0": !isLoading,
  });

  return (
    <span className={clsx("level", "is-mobile", "mb-0", className)}>
      <span className={cls}>⚡ {format(rendered.calories)} kcal</span>
      <span className={cls}>🥩 {format(rendered.proteins)} g</span>
      <span className={cls}>🧈 {format(rendered.fats)} g</span>
      <span className={cls}>🍚 {format(rendered.carbs)} g</span>
    </span>
  );
}

export default FoodValue;
