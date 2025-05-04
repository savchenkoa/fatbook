import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";
import { DishPortion } from "@/types/dish-portion";
import { eatingsService } from "@/services/eatings-service";
import { useParams } from "react-router-dom";
import { useAuth } from "@/context/auth.tsx";
import { useEffect, useState } from "react";
import { calculateFoodValue } from "@/utils/food-value-utils";
import { toast } from "sonner";
import { DAILY_EATINGS_QUERY_KEY } from "@/pages/eatings/eatings-page.tsx";

type OnMutate = (portion: DishPortion) => void;

type UseEatingMutations = {
  addEating: UseMutationResult<DishPortion, unknown, DishPortion>;
  updateEating: UseMutationResult<DishPortion, unknown, DishPortion>;
  removeEating: UseMutationResult<void, unknown, DishPortion>;
  selectedPortions: DishPortion[];
};

/* Ref to an empty array to avoid creating new array on every render
 * As it's used in useEffect dependency array, [] will get new array each time ->
 * Max rendering depth exceeded  */
const EMPTY_ARRAY = [];

export function useEatingMutations(
  meal: string,
  portions: DishPortion[] = EMPTY_ARRAY,
): UseEatingMutations {
  const queryClient = useQueryClient();
  const { day } = useParams();
  const { userId } = useAuth();
  const [selectedPortions, setSelectedPortions] = useState<DishPortion[]>([]);

  useEffect(() => {
    setSelectedPortions(portions);
  }, [portions]);

  // Optimistic update
  const createOnMutate = (optimisticMutation: OnMutate) => (portion) => {
    // Perform optimistic update
    optimisticMutation(portion);
    // Snapshot the previous value (will be used in case of error)
    return { previousValue: selectedPortions.slice() };
  };
  // Write actual value from the response
  const onSuccess = (response: DishPortion | void) => {
    queryClient.invalidateQueries({ queryKey: [DAILY_EATINGS_QUERY_KEY, day] });
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
  const onError = (_err, _newItem, context) => {
    toast.error("Error while saving");
    setSelectedPortions(context!.previousValue);
  };

  const addEating = useMutation({
    mutationFn: (portion: DishPortion) =>
      eatingsService.createEating(userId, day!, meal!, portion),
    onMutate: createOnMutate((newPortion) => {
      newPortion.selected = true;
      const foodValue = calculateFoodValue(newPortion);
      setSelectedPortions((portions) => [
        ...portions,
        { ...newPortion, ...foodValue },
      ]);
    }),
    onSuccess,
    onError,
  });

  const updateEating = useMutation({
    mutationFn: (portion: DishPortion) => eatingsService.updateEating(portion),
    onMutate: createOnMutate((updatedPortion) => {
      setSelectedPortions((portions) => {
        const foodValue = calculateFoodValue(updatedPortion);
        return portions.map((p) =>
          p.dish.id === updatedPortion.dish.id
            ? { ...updatedPortion, ...foodValue }
            : p,
        );
      });
    }),
    onSuccess,
    onError,
  });

  const removeEating = useMutation({
    mutationFn: (portion: DishPortion) => eatingsService.deleteEating(portion),
    onMutate: createOnMutate((deletedPortion) => {
      setSelectedPortions((portions) => {
        return portions.filter((p) => p.dish.id !== deletedPortion.dish.id);
      });
    }),
    onSuccess,
    onError,
  });

  return {
    addEating,
    updateEating,
    removeEating,
    selectedPortions,
  };
}
