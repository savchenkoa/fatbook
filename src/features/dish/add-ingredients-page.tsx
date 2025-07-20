import { SelectDishPortionsForm } from "@/features/dish-portions-form/select-dish-portions-form.tsx";
import { useParams } from "react-router-dom";
import { DishPortion } from "@/types/dish-portion.ts";
import { useIngredientMutations } from "./hooks/use-ingredients-mutations.ts";
import { PostgrestError } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { fetchDish } from "@/services/dishes-service.ts";
import { AppLayout } from "@/components/layout/app-layout.tsx";
import { AddIngredientsSkeleton } from "./components/add-ingredients-skeleton.tsx";
import { useEffect } from "react";

export function AddIngredientsPage() {
  const params = useParams();
  const {
    data: dish,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["dish", +params.id!],
    queryFn: () => fetchDish(+params.id!),
  });
  const {
    addIngredient,
    updateIngredient,
    removeIngredient,
    selectedPortions,
    setSelectedPortions,
  } = useIngredientMutations(dish!);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (isLoading) {
    return <AddIngredientsSkeleton />;
  }

  if (!dish || error) {
    return "No dish found:" + error?.message;
  }

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
    <AppLayout>
      <SelectDishPortionsForm
        filterDishId={dish.id}
        title="Select Ingredient"
        subtitle={"For " + dish.name}
        selectedPortions={selectedPortions}
        onAdd={handleAddIngredients}
        onUpdate={handleUpgradeIngredient}
        onDelete={handleDeleteIngredient}
      />
    </AppLayout>
  );
}
