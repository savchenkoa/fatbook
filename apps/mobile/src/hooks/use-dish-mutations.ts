import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { DishPatch } from "../data/types";
import { useData } from "../context/data";

export function useDishMutations(id: number) {
    const data = useData();
    const queryClient = useQueryClient();
    const updateDish = useMutation({
        mutationFn: (values: DishPatch) => data.updateDish(id, values),
        onSuccess: () => { if (data.isCurrentSession()) return queryClient.invalidateQueries({ queryKey: ["dish", id] }); },
    });
    return { updateDish };
}
