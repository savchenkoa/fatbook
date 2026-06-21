import { useMutation, UseMutationResult, useQueryClient } from "@tanstack/react-query";
import { Dish } from "@fatbook/shared";
import { updateDish as updateDishService, TablesUpdate } from "@fatbook/api-client";
import { supabase } from "@/lib/supabase";

type UseDishMutations = {
    updateDish: UseMutationResult<Dish | null, unknown, TablesUpdate<"dishes">>;
};

export function useDishMutations(id: number): UseDishMutations {
    const queryClient = useQueryClient();

    const updateDish = useMutation({
        mutationFn: (values: TablesUpdate<"dishes">) => updateDishService(supabase, id, values),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dish", id] }),
    });

    return {
        updateDish,
    };
}
