/* Used for dish portions only */
export type SimplifiedDish = {
    calories: number | null;
    carbs: number | null;
    collectionId: number | null;
    createdAt: string;
    defaultPortion: number | null;
    fats: number | null;
    hasIngredients: boolean;
    icon: string | null;
    id: number;
    name: string | null;
    proteins: number | null;
    updatedAt: string | null;
};

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
