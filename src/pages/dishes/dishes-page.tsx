import { DishList } from "@/components/dish/dish-list.tsx";
import { SearchBar } from "@/components/ui/SearchBar";
import { useNavigate } from "react-router-dom";
import { Dish } from "@/types/dish";
import { useDishesSearch } from "@/hooks/use-dishes-search";
import { ChangeEvent } from "react";
import { AppLayout } from "@/components/app-layout.tsx";
import { useCreateDish } from "@/hooks/use-create-dish";
import { Button } from "@/components/ui/button.tsx";
import { Box } from "@/components/ui/box-new";
import { Spinner } from "@/components/ui/spinner.tsx";
import { HeaderBox } from "@/components/ui/header-box.tsx";
import { LucidePlus } from "lucide-react";

export function DishesPage() {
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
      <HeaderBox
        title="My Dishes"
        subtitle="Recently used"
        action={
          <Button onClick={handleNewClick}>
            <LucidePlus /> <span className="hidden sm:inline">Create</span>
          </Button>
        }
        className="mb-4"
      >
        <SearchBar
          isLoading={isLoading}
          defaultValue={query}
          onChange={handleSearch}
        />
      </HeaderBox>

      <Box className="mx-4 p-3">
        <DishList
          dishes={dishes}
          isLoading={isLoading}
          onDishClick={handleDishClick}
        />

        {hasNextPage && (
          <div className="flex justify-center">
            <Button
              disabled={isFetching}
              variant="secondary"
              className="mt-4"
              onClick={() => fetchNextPage()}
            >
              <Spinner loading={isFetching} />
              Load more
            </Button>
          </div>
        )}
      </Box>
    </AppLayout>
  );
}
