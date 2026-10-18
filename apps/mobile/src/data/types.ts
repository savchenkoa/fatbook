import type {
    DailyEatings,
    Dish,
    DishPortion,
    FoodValue,
    MealType,
    UserSettings,
} from "@fatbook/shared";
import type { RecipeBody } from "@fatbook/api-client/go";

export type DishValues = {
    name: string;
    icon: string | null;
    defaultPortion: number | null;
    cookedWeight?: number | null;
    proteins?: number | null;
    fats?: number | null;
    carbs?: number | null;
    calories?: number | null;
};
export type DishPatch = Partial<DishValues>;
export type DishSearch = {
    query: string;
    page: number;
    filterDishId?: number;
    filterEmpty?: boolean;
    scope?: "mine" | "ingredients";
};
export type Features = {
    atomicRecipes: boolean;
    diary: boolean;
    insights: boolean;
    dishEditing: boolean;
    dishCopy: boolean;
    dishDelete: boolean;
    goalsEditing: boolean;
};
export interface MobileData {
    features: Features;
    isCurrentSession(): boolean;
    isReadOnlyDish(dish: Dish): boolean;
    searchDishes(
        search: DishSearch,
    ): Promise<{ items: Dish[]; hasMore: boolean }>;
    fetchDish(id: number): Promise<Dish | null>;
    createDish(values: DishValues): Promise<Dish | null>;
    createRecipe(body: RecipeBody, clientRequestId: string): Promise<Dish>;
    updateDish(id: number, patch: DishPatch): Promise<Dish | null>;
    copyDish(dish: Dish): Promise<Dish | null>;
    deleteDish(id: number): Promise<void>;
    addIngredient(dish: Dish, portion: DishPortion): Promise<DishPortion>;
    updateIngredient(dish: Dish, portion: DishPortion): Promise<DishPortion>;
    deleteIngredient(dish: Dish, portion: DishPortion): Promise<void>;
    fetchDailyEatings(day: string): Promise<DailyEatings>;
    createEating(
        day: string,
        meal: MealType,
        portion: DishPortion,
    ): Promise<DishPortion>;
    updateEating(portion: DishPortion): Promise<DishPortion>;
    deleteEating(portion: DishPortion): Promise<void>;
    fetchSettings(): Promise<UserSettings>;
    saveSettings(settings: UserSettings): Promise<void>;
    fetchTrendsData(days: string[]): Promise<(FoodValue & { date: string })[]>;
}
export async function unavailable(): Promise<never> {
    throw new Error("Эта функция пока недоступна в новом API.");
}
