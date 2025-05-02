import { useOutletContext } from "react-router-dom";
import DishIngredientsPage from "@/pages/dish/DishIngredientsPage";
import PageTitle from "@/components/PageTitle";
import { FaChevronDown, FaPlus } from "react-icons/fa";
import DishListSkeleton from "@/components/ui/DishListSkeleton";
import Button from "@/components/ui/Button";
import { Box } from "@/components/ui/box-new";

const DishIngredientsSkeleton = () => {
  return (
    <Box>
      <PageTitle className="mb-0 pb-4" isLoading>
        <Button color="primary" icon={<FaPlus />} className="is-skeleton">
          Add
        </Button>
      </PageTitle>

      <div className="is-flex is-justify-content-end mt-4 mb-2">
        <Button
          size="small"
          variant="rounded"
          iconRight={<FaChevronDown />}
          className="is-skeleton"
        >
          Cooking
        </Button>
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
