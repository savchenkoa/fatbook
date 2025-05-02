import { useOutletContext } from "react-router-dom";
import DishListSkeleton from "@/components/ui/DishListSkeleton";
import AddDishIngredientPage from "@/pages/dish/AddDishIngredientPage";
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

export default function DishIngredientAddLoader() {
  const { isLoading } = useOutletContext<{ isLoading: boolean }>();

  if (isLoading) {
    return <DishIngredientAddSkeleton />;
  }

  return <AddDishIngredientPage />;
}
