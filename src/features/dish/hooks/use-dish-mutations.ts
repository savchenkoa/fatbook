import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";
import { Dish } from "@/types/dish";
import { updateDish as updateDishService } from "@/services/dishes-service";
import { TablesUpdate } from "@/types/supabase.types";

type UseDishMutations = {
  updateDish: UseMutationResult<Dish | null, unknown, TablesUpdate<"dishes">>;
};

export function useDishMutations(id: number): UseDishMutations {
  const queryClient = useQueryClient();

  const updateDish = useMutation({
    mutationFn: (values: TablesUpdate<"dishes">) =>
      updateDishService(id, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dish", id] }),
  });

  return {
    updateDish,
  };
}
