import { Dish, SimplifiedDish } from "@fatbook/shared";

export function getDishIcon(dish?: Dish | SimplifiedDish | null) {
    if (!dish || !dish.icon) {
        return "🥫";
    }

    if (dish.icon) {
        return dish.icon;
    }

    return dish.hasIngredients ? "🥘" : "🥫";
}
