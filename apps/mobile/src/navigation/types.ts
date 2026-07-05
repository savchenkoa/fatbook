import type { MealType } from "@fatbook/shared";

export type HomeStackParamList = {
    Diary: { day?: string } | undefined;
    MealDetail: { day: string; meal: MealType };
    AddEating: { day: string; meal: MealType };
    DishDetail: { dishId: number };
    EditDish: { dishId: number };
    AddIngredients: { dishId: number };
};

export type TabParamList = {
    Home: undefined;
    Dishes: undefined;
    Insights: undefined;
    Account: undefined;
};

// Alias for backward compatibility
export type RootStackParamList = HomeStackParamList;
