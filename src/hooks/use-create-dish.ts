import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { dishesService } from "@/services/dishes-service";
import { useAuth } from "@/context/auth.tsx";
import { useNavigate } from "react-router-dom";
import { Dish } from "@/types/dish";

type UseCreateDish = {
  createDish: UseMutationResult<Dish | null, Error, void>;
};

export function useCreateDish(): UseCreateDish {
  const { userCollectionId } = useAuth();
  const navigate = useNavigate();

  const createDish = useMutation({
    mutationFn: () =>
      dishesService.createDish({ name: "", collectionId: userCollectionId }),
    onSuccess: (dish: Dish | null) =>
      dish ? navigate(`/dishes/${dish.id}/edit`) : navigate(`/dishes/`),
  });

  return {
    createDish,
  };
}
