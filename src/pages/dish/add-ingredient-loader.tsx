import { useOutletContext } from "react-router-dom";
import { DishListSkeleton } from "@/components/ui/DishListSkeleton";
import { AddIngredientPage } from "@/pages/dish/add-ingredient-page.tsx";
import { Box } from "@/components/ui/box-new";

const DishIngredientAddSkeleton = () => (
  <Box>
    <div className="is-skeleton mb-3" style={{ height: 54 }}></div>

    <div className="content">
      <input className="input is-skeleton" />
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
