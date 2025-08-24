import { DishPortion } from "@/types/dish-portion";
import { FoodValue } from "@/types/food-value";

export function calculateFoodValue(eating: DishPortion): FoodValue {
    if (!eating.dish || !eating.portion) {
        return emptyFoodValue();
    }

    return {
        proteins: ((eating.dish.proteins ?? 0) * eating.portion) / 100,
        fats: ((eating.dish.fats ?? 0) * eating.portion) / 100,
        carbs: ((eating.dish.carbs ?? 0) * eating.portion) / 100,
        calories: ((eating.dish.calories ?? 0) * eating.portion) / 100,
    };
}

function calculateDishWeight(ingredients: DishPortion[]) {
    return ingredients.reduce((result, item) => (result += item.portion ?? 0), 0);
}

export function calculateDishValuePer100g(
    ingredients: DishPortion[],
    cookedWeight?: number | null,
) {
    const totalDishWeight = cookedWeight ?? calculateDishWeight(ingredients);

    const resultFoodValue = ingredients.reduce((result, item) => {
        result.proteins += item.proteins;
        result.fats += item.fats;
        result.carbs += item.carbs;
        result.calories += item.calories;

        return result;
    }, emptyFoodValue());

    return {
        proteins: (resultFoodValue.proteins / totalDishWeight) * 100,
        fats: (resultFoodValue.fats / totalDishWeight) * 100,
        carbs: (resultFoodValue.carbs / totalDishWeight) * 100,
        calories: (resultFoodValue.calories / totalDishWeight) * 100,
    };
}

export function calculateFoodValueForPortion({ dish, portion }: DishPortion) {
    portion = portion ?? 0;

    return {
        proteins: ((dish.proteins ?? 0) * portion) / 100,
        fats: ((dish.fats ?? 0) * portion) / 100,
        carbs: ((dish.carbs ?? 0) * portion) / 100,
        calories: ((dish.calories ?? 0) * portion) / 100,
    };
}

export function sumFoodValues(foodValues: FoodValue[]) {
    return foodValues.reduce((result, current) => {
        result.proteins += current.proteins;
        result.fats += current.fats;
        result.carbs += current.carbs;
        result.calories += current.calories;

        return result;
    }, emptyFoodValue());
}

export function emptyFoodValue() {
    return {
        proteins: 0,
        fats: 0,
        carbs: 0,
        calories: 0,
    };
}
