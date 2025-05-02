import DishList from "@/components/dish/DishList";
import PageTitle from "@/components/PageTitle";
import SearchBar from "@/components/ui/SearchBar";
import { useNavigate } from "react-router-dom";
import { Dish } from "@/types/dish";
import { useDishesSearch } from "@/hooks/use-dishes-search";
import { ChangeEvent } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useCreateDish } from "@/hooks/use-create-dish";
import Button from "@/components/ui/Button";
import { Box } from "@/components/ui/box-new";

function DishesPage() {
  const navigate = useNavigate();
  const {
    dishes,
    isLoading,
    isFetching,
    query,
    runSearch,
    fetchNextPage,
    hasNextPage,
  } = useDishesSearch();
  const { createDish } = useCreateDish();

  const handleDishClick = (dish: Dish) => {
    navigate(`/dishes/${dish.id}`);
  };

  const handleNewClick = () => {
    createDish.mutate();
  };

  const handleSearch = (event: ChangeEvent<HTMLInputElement>) =>
    runSearch(event.target.value);

  return (
    <AppLayout>
      <Box className="mx-4">
        <PageTitle title="My Dishes" subtitle="Recently used">
          <Button color="success" onClick={handleNewClick}>
            New
          </Button>
        </PageTitle>

        <SearchBar
          isLoading={isLoading}
          defaultValue={query}
          onChange={handleSearch}
        />

        <DishList
          dishes={dishes}
          isLoading={isLoading}
          onDishClick={handleDishClick}
        />

        {hasNextPage && (
          <div className="is-flex is-justify-content-center">
            <Button
              loading={isFetching}
              disabled={isFetching}
              className="mt-4"
              onClick={() => fetchNextPage()}
            >
              Load more
            </Button>
          </div>
        )}
      </Box>
    </AppLayout>
  );
}

export default DishesPage;
