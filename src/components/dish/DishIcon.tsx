import { Dish } from "@/types/dish";
import { clsx } from "clsx";
import { SimplifiedDish } from "@/types/dish-portion";
import { getDishIcon } from "@/utils/icon-utils";

type Props = {
  dish?: Dish | SimplifiedDish;
  className: string;
};

function DishIcon({ dish, className }: Props) {
  const renderedIcon = getDishIcon(dish);

  return (
    <span
      className={clsx("size-6 text-center align-middle text-xl", className)}
    >
      {renderedIcon}
    </span>
  );
}

export default DishIcon;
