import { useOutletContext } from "react-router-dom";
import { DishListSkeleton } from "@/components/ui/dish-list-skeleton.tsx";
import { AddIngredientPage } from "@/pages/dish/add-ingredient-page.tsx";
import { Box } from "@/components/ui/box.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";

const DishIngredientAddSkeleton = () => (
  <Box>
    <Skeleton className="mb-3 h-[54px]" />

    <div className="content">
      <input className="input" />
    </div>

    <DishListSkeleton />
  </Box>
);

export function AddIngredientLoader() {
  const { isLoading } = useOutletContext<{ isLoading: boolean }>();

  if (isLoading) {
    return <DishIngredientAddSkeleton />;
  }

  return <AddIngredientPage />;
}
