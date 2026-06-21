import { DishPortion } from "./dish-portion";

export type Dish = {
    id: number;
    name: string;
    collectionId: number | null;
    icon: string | null;
    proteins: number;
    fats: number;
    carbs: number;
    calories: number;
    cookedWeight?: number | null;
    defaultPortion: number | null;
    hasIngredients: boolean;
    ingredients: DishPortion[];
    updatedAt: string;
    createdAt: string;
};
