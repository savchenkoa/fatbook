import { useOutletContext } from "react-router-dom";
import { IngredientsPage } from "@/pages/dish/ingredients-page.tsx";
import { PageTitle } from "@/components/page-title.tsx";
import { DishListSkeleton } from "@/components/ui/DishListSkeleton";
import { Box } from "@/components/ui/box.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";

const DishIngredientsSkeleton = () => {
  return (
    <Box>
      <PageTitle className="mb-0 pb-4" isLoading>
        <Skeleton className="h-9 w-[75px]" />
      </PageTitle>

      <div className="mt-4 mb-2 flex justify-end">
        <Skeleton className="h-8 w-[100px]" />
      </div>

      <DishListSkeleton />
    </Box>
  );
};

/* Separate function as there is a tricky state management due to optimistic updates */
export function IngredientsLoader() {
  const { isLoading } = useOutletContext<{ isLoading: boolean }>();

  if (isLoading) {
    return <DishIngredientsSkeleton />;
  }

  return <IngredientsPage />;
}
