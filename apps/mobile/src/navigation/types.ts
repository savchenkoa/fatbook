import type { MealType } from "@fatbook/shared";

export type DishReference = { dishId: number; draft?: never } | { draft: true; dishId?: never };

export type HomeStackParamList = {
    Diary: { day?: string } | undefined;
    MealDetail: { day: string; meal: MealType };
    AddEating: { day: string; meal: MealType };
    DishDetail: DishReference;
    EditDish: { dishId?: number; draft?: boolean } | undefined;
    AddIngredients: DishReference;
};

export type DishesStackParamList = {
    DishesList: undefined;
    DishDetail: DishReference;
    EditDish: { dishId?: number; draft?: boolean } | undefined;
    AddIngredients: DishReference;
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
