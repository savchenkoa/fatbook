import { EditDishPortionsForm } from "@/features/dish-portions-form/edit-dish-portions-form.tsx";
import { Dish } from "@/types/dish.ts";
import { DishPortion } from "@/types/dish-portion.ts";
import { useIngredientMutations } from "../hooks/use-ingredients-mutations.ts";
import { Box } from "@/components/ui/box.tsx";
import { useEffect } from "react";

type Props = {
  dish: Dish;
  isDishShared: boolean;
};

export function IngredientsList({ dish, isDishShared }: Props) {
  const {
    updateIngredient,
    removeIngredient,
    selectedPortions,
    setSelectedPortions,
  } = useIngredientMutations(dish, dish.ingredients);
  const ingredients = selectedPortions.map((p) => ({ ...p, selected: false }));

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
    <Box className="p-2">
      <EditDishPortionsForm
        disabled={isDishShared}
        dishPortions={ingredients}
        onSave={handleUpgradeIngredient}
        onDelete={handleDeleteIngredient}
      />
    </Box>
  );
}
