import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateDish as updateDishService, type TablesUpdate } from "@fatbook/api-client";
import { supabase } from "../lib/supabase";

export function useDishMutations(id: number) {
    const queryClient = useQueryClient();

    const updateDish = useMutation({
        mutationFn: (values: TablesUpdate<"dishes">) => updateDishService(supabase, id, values),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dish", id] }),
    });

    return { updateDish };
}
