import { SelectDishPortionsForm } from "@/components/dish-portions-form/select-dish-portions-form.tsx";
import { useOutletContext } from "react-router-dom";
import { Dish } from "@/types/dish";
import { DishPortion } from "@/types/dish-portion";
import { useIngredientMutations } from "@/hooks/use-ingredients-mutations";
import { PostgrestError } from "@supabase/supabase-js";

export function AddIngredientPage() {
  const { dish } = useOutletContext<{ dish: Dish }>();
  const {
    addIngredient,
    updateIngredient,
    removeIngredient,
    selectedPortions,
    setSelectedPortions,
  } = useIngredientMutations(dish);

  const handleAddIngredients = async (ingredient: DishPortion) => {
    addIngredient.mutate(ingredient, {
      onError: async (error) => {
        // code:"23505" means "uniqueingredient" violated
        if ((error as PostgrestError).code === "23505") {
          const confirmed = window.confirm(
            "This dish is already added as ingredient. Do you want to overwrite?",
          );
          if (confirmed) {
            await handleUpgradeIngredient(ingredient);
            setSelectedPortions((portions) => [
              ...portions,
              { ...ingredient, selected: true },
            ]);
          }
        }
      },
    });
  };

  const handleUpgradeIngredient = async (ingredient: DishPortion) => {
    updateIngredient.mutate(ingredient);
  };

  const handleDeleteIngredient = async (ingredient: DishPortion) => {
    removeIngredient.mutate(ingredient);
  };

  return (
    <>
      <SelectDishPortionsForm
        filterDishId={dish.id}
        title="Select Ingredient"
        subtitle={"For " + dish.name}
        selectedPortions={selectedPortions}
        onAdd={handleAddIngredients}
        onUpdate={handleUpgradeIngredient}
        onDelete={handleDeleteIngredient}
      />
    </>
  );
}
