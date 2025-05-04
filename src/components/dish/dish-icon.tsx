import { Dish } from "@/types/dish";
import { SimplifiedDish } from "@/types/dish-portion";
import { getDishIcon } from "@/utils/icon-utils";
import { cn } from "@/lib/utils.ts";

type Props = {
  dish?: Dish | SimplifiedDish;
  className?: string;
};

export function DishIcon({ dish, className }: Props) {
  const renderedIcon = getDishIcon(dish);

  return (
    <span
      className={cn(
        "inline-flex size-6 items-center justify-center text-xl",
        className,
      )}
    >
      {renderedIcon}
    </span>
  );
}
