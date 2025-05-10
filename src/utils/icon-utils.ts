import { Dish } from "@/types/dish";
import { SimplifiedDish } from "@/types/dish-portion";

export function getDishIcon(dish?: Dish | SimplifiedDish | null) {
  if (!dish || !dish.icon) {
    return "🥫";
  }

  if (dish.icon) {
    return dish.icon;
  }

  return dish.hasIngredients ? "🥘" : "🥫";
}
