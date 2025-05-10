import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";
import { DishPortion } from "@/types/dish-portion";
import { ingredientsService } from "@/services/ingredients-service";
import { Dish } from "@/types/dish";
import { useState } from "react";
import { toast } from "sonner";
import { calculateFoodValue } from "@/utils/food-value-utils";
import { PostgrestError } from "@supabase/supabase-js";

type OnMutate = (portion: DishPortion) => void;

type UseIngredientMutations = {
  addIngredient: UseMutationResult<DishPortion, unknown, DishPortion>;
  updateIngredient: UseMutationResult<DishPortion, unknown, DishPortion>;
  removeIngredient: UseMutationResult<void, unknown, DishPortion>;
  selectedPortions: DishPortion[];
  setSelectedPortions: React.Dispatch<React.SetStateAction<DishPortion[]>>;
};

export function useIngredientMutations(
  dish: Dish,
  initialPortions: DishPortion[] = [],
): UseIngredientMutations {
  const queryClient = useQueryClient();
  const [selectedPortions, setSelectedPortions] =
    useState<DishPortion[]>(initialPortions);

  // Optimistic update
  const createOnMutate = (optimisticMutation: OnMutate) => (portion) => {
    // Perform optimistic update
    optimisticMutation(portion);
    // Snapshot the previous value (will be used in case of error)
    return { previousValue: selectedPortions.slice() };
  };
  // Write actual value from the response
  const onSuccess = (response: DishPortion | void) => {
    queryClient.invalidateQueries({ queryKey: ["dish"] });
    if (response) {
      setSelectedPortions((portions) => {
        const optimisticIndex = portions.findIndex(
          // Only one dish can be added at a time, hence dish id is unique
          (p) => p.dish.id === response.dish.id,
        );
        portions[optimisticIndex] = response;
        return portions;
      });
    }
  };
  // Revert to previous value if error occured
  const onError = (error, _newItem, context) => {
    // code:"23505" means "uniqueingredient" violated - handled by component
    if ((error as PostgrestError).code !== "23505") {
      toast.error("Error while saving");
    }

    setSelectedPortions(context!.previousValue);
  };

  const addIngredient = useMutation({
    mutationFn: (ingredient: DishPortion) =>
      ingredientsService.addIngredient(dish, ingredient),
    onMutate: createOnMutate((newIngredient) => {
      newIngredient.selected = true;
      const foodValue = calculateFoodValue(newIngredient);
      setSelectedPortions((portions) => [
        ...portions,
        { ...newIngredient, ...foodValue },
      ]);
    }),
    onSuccess,
    onError,
  });

  const updateIngredient = useMutation({
    mutationFn: (ingredient: DishPortion) =>
      ingredientsService.updateIngredient(dish, ingredient),
    onMutate: createOnMutate((updatedIngredient) => {
      setSelectedPortions((portions) => {
        const foodValue = calculateFoodValue(updatedIngredient);
        return portions.map((p) =>
          p.dish.id === updatedIngredient.dish.id
            ? { ...updatedIngredient, ...foodValue }
            : p,
        );
      });
    }),
    onSuccess,
    onError,
  });

  const removeIngredient = useMutation({
    mutationFn: (ingredient: DishPortion) =>
      ingredientsService.deleteIngredient(dish, ingredient),
    onMutate: createOnMutate((deletedIngredient) => {
      setSelectedPortions((portions) => {
        return portions.filter((p) => p.dish.id !== deletedIngredient.dish.id);
      });
    }),
    onSuccess,
    onError,
  });

  return {
    addIngredient,
    updateIngredient,
    removeIngredient,
    selectedPortions,
    setSelectedPortions,
  };
}
