import { EditDishPortionsForm } from "@/components/dish-portions-form/edit-dish-portions-form.tsx";
import { Dish } from "@/types/dish";
import { DishPortion } from "@/types/dish-portion";
import { useIngredientMutations } from "@/hooks/use-ingredients-mutations";
import { Box } from "@/components/ui/box.tsx";

type Props = {
  dish: Dish;
  isDishShared: boolean;
};

export function IngredientsList({ dish, isDishShared }: Props) {
  const { updateIngredient, removeIngredient, selectedPortions } =
    useIngredientMutations(dish, dish.ingredients);
  const ingredients = selectedPortions.map((p) => ({ ...p, selected: false }));

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
