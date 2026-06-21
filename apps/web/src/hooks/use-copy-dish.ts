import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { copyDish as copyDishService } from "@/services/dishes-service";
import { useAuth } from "@/context/auth.tsx";
import { useNavigate } from "react-router-dom";
import { Dish } from "@/types/dish";

type Props = { shouldNavigate?: boolean };
type UseCopyDish = {
    copyDish: UseMutationResult<Dish | null, Error, Dish>;
};

export function useCopyDish({ shouldNavigate }: Props = {}): UseCopyDish {
    const { userCollectionId } = useAuth();
    const navigate = useNavigate();

    const copyDish = useMutation({
        mutationFn: (originalDish: Dish) => copyDishService(originalDish, userCollectionId),
        onSuccess: (dish: Dish | null) => {
            if (!shouldNavigate) {
                return;
            }
            return dish ? navigate(`/dishes/${dish.id}`) : navigate(`/dishes/`);
        },
    });

    return {
        copyDish,
    };
}
