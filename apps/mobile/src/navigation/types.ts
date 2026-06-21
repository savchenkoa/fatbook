import type { MealType } from "@fatbook/shared";

export type HomeStackParamList = {
    Diary: undefined;
    MealDetail: { day: string; meal: MealType };
    AddEating: { day: string; meal: MealType };
};

export type TabParamList = {
    Home: undefined;
    Dishes: undefined;
    Insights: undefined;
    Account: undefined;
};

// Alias for backward compatibility
export type RootStackParamList = HomeStackParamList;
