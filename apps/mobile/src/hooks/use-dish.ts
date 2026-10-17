import { useQuery } from "@tanstack/react-query";
import { useData } from "../context/data";
import { useAuth } from "../context/auth-context";
import { useRecipeDraft } from "../context/recipe-draft";

export function useDish(id?: number, localDraft = false) {
    const data = useData();
    const { userId } = useAuth();
    const { draft } = useRecipeDraft();
    const query = useQuery({
        queryKey: ["dish", id, userId],
        queryFn: () => {
            if (id === undefined) throw new Error("Dish id is required");
            return data.fetchDish(id);
        },
        enabled: id !== undefined && !localDraft,
        retry: false,
    });
    return {
        ...query,
        data: localDraft ? draft : query.data,
        isLoading: localDraft ? false : query.isLoading,
    };
}
