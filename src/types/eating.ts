import { MealType } from "@/types/meals";
import { DishPortion } from "@/types/dish-portion";

export type Eating = DishPortion & { meal: MealType };

export type DailyEatings = {
    proteins: number;
    fats: number;
    carbs: number;
    calories: number;
    meals: {
        [key in MealType]: {
            proteins: number;
            fats: number;
            carbs: number;
            calories: number;
            eatings: DishPortion[];
        };
    };
};
