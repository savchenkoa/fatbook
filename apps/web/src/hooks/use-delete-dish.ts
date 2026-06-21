import { useMutation } from "@tanstack/react-query";
import { deleteDish as deleteDishService } from "@fatbook/api-client";
import { supabase } from "@/lib/supabase";

export function useDeleteDish() {
    const deleteDish = useMutation({ mutationFn: (id: number) => deleteDishService(supabase, id) });

    return {
        deleteDish,
    };
}
