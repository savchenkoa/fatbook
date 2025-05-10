import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";
import { Dish } from "@/types/dish";
import { dishesService } from "@/services/dishes-service";
import { TablesUpdate } from "@/types/supabase.types";

type UseDishMutations = {
  updateDish: UseMutationResult<Dish | null, unknown, TablesUpdate<"dishes">>;
};

export function useDishMutations(id: number): UseDishMutations {
  const queryClient = useQueryClient();

  const onSuccess = () => queryClient.invalidateQueries({ queryKey: ["dish"] });

  const updateDish = useMutation({
    mutationFn: (values: TablesUpdate<"dishes">) =>
      dishesService.updateDish(id, values),
    onSuccess,
  });

  return {
    updateDish,
  };
}
