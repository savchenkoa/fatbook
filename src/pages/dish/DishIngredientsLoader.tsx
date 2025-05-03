import { useOutletContext } from "react-router-dom";
import DishIngredientsPage from "@/pages/dish/DishIngredientsPage";
import PageTitle from "@/components/PageTitle";
import DishListSkeleton from "@/components/ui/DishListSkeleton";
import { Box } from "@/components/ui/box-new";
import { Skeleton } from "@/components/ui/skeleton.tsx";

const DishIngredientsSkeleton = () => {
  return (
    <Box>
      <PageTitle className="mb-0 pb-4" isLoading>
        <Skeleton className="h-9 w-[75px]" />
      </PageTitle>

      <div className="is-flex is-justify-content-end mt-4 mb-2">
        <Skeleton className="h-8 w-[100px]" />
      </div>

      <DishListSkeleton />
    </Box>
  );
};

/* Separate function as there is a tricky state management due to optimistic updates */
export default function DishIngredientsLoader() {
  const { isLoading } = useOutletContext<{ isLoading: boolean }>();

  if (isLoading) {
    return <DishIngredientsSkeleton />;
  }

  return <DishIngredientsPage />;
}
