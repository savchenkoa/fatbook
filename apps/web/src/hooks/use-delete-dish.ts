import { useMutation } from "@tanstack/react-query";
import { deleteDish as deleteDishService } from "@/services/dishes-service";

export function useDeleteDish() {
    const deleteDish = useMutation({ mutationFn: deleteDishService });

    return {
        deleteDish,
    };
}
