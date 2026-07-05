type IconableDish = {
    icon: string | null;
    hasIngredients: boolean;
};

export function getDishIcon(dish: IconableDish) {
    if (dish.icon) {
        return dish.icon;
    }
    return dish.hasIngredients ? "🥘" : "🥫";
}
