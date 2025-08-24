/* Used for dish portions only */
import { DishModel } from "@/types/dish";

export type SimplifiedDish = Omit<DishModel, "ingredients" | "cookedWeight">;

export type DishPortion = {
    id?: number;
    proteins: number;
    fats: number;
    carbs: number;
    calories: number;
    portion?: number;
    dish: SimplifiedDish;
    selected?: boolean;
};
