import { EditDishPortionsForm } from "@/features/dish-portions-form/edit-dish-portions-form.tsx";
import { Dish } from "@/types/dish.ts";
import { DishPortion } from "@/types/dish-portion.ts";
import { useIngredientMutations } from "../hooks/use-ingredients-mutations.ts";
import { useEffect } from "react";
import { useIsTouchDevice } from "@/hooks/use-is-touch-device.ts";

type Props = {
    dish: Dish;
    isDishShared: boolean;
};

export function IngredientsList({ dish, isDishShared }: Props) {
    const { updateIngredient, removeIngredient, selectedPortions, setSelectedPortions } =
        useIngredientMutations(dish, dish.ingredients);
    const ingredients = selectedPortions.map((p) => ({ ...p, selected: false }));
    const isTouchDevice = useIsTouchDevice();

    useEffect(() => {
        // Force sync with BE data, helps to avoid stale optimistic data with slow internet
        setSelectedPortions(dish.ingredients);
    }, [dish, setSelectedPortions]);

    const handleUpgradeIngredient = async (ingredient: DishPortion) => {
        updateIngredient.mutate(ingredient);
    };
    const handleDeleteIngredient = async (ingredient: DishPortion) => {
        removeIngredient.mutate(ingredient);
    };

    return (
        <EditDishPortionsForm
            disabled={isDishShared}
            hideFoodValue={isTouchDevice}
            dishPortions={ingredients}
            onSave={handleUpgradeIngredient}
            onDelete={handleDeleteIngredient}
        />
    );
}
