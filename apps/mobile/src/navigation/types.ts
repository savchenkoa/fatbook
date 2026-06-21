import type { MealType } from "@fatbook/shared";

export type RootStackParamList = {
    Diary: undefined;
    AddEating: { day: string; meal: MealType };
};
