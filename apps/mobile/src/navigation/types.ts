import type { MealType } from "@fatbook/shared";

export type HomeStackParamList = {
    Diary: { day?: string } | undefined;
    MealDetail: { day: string; meal: MealType };
    AddEating: { day: string; meal: MealType };
    DishDetail: { dishId: number };
    EditDish: { dishId?: number } | undefined;
    AddIngredients: { dishId: number };
};

export type DishesStackParamList = {
    DishesList: undefined;
    DishDetail: { dishId: number };
    EditDish: { dishId?: number } | undefined;
    AddIngredients: { dishId: number };
};

export type AccountStackParamList = {
    AccountHome: undefined;
    Goals: undefined;
};

export type TabParamList = {
    Home: undefined;
    Dishes: undefined;
    Insights: undefined;
    Account: undefined;
};

// Alias for backward compatibility
export type RootStackParamList = HomeStackParamList;
