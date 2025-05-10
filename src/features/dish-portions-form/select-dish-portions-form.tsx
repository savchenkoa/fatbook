import { ChangeEvent } from "react";
import { SearchBar } from "@/components/ui/search-bar.tsx";
import { DishPortionList } from "./components/dish-portion-list.tsx";
import { useDishesSearch } from "@/hooks/use-dishes-search";
import { DishPortion } from "@/types/dish-portion";
import { Dish } from "@/types/dish";
import { Button } from "@/components/ui/button.tsx";
import { Box } from "@/components/ui/box.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { HeaderBox } from "@/components/ui/header-box.tsx";

type Props = {
  title: string;
  backRoute?: string | number;
  subtitle: string;
  selectedPortions: DishPortion[];
  onAdd: (ingredient: DishPortion) => void;
  onDelete: (ingredient: DishPortion) => void;
  onUpdate?: (ingredient: DishPortion) => void;
  filterDishId?: number;
};

export function SelectDishPortionsForm({
  title,
  backRoute,
  subtitle,
  selectedPortions,
  onAdd,
  onUpdate,
  onDelete,
  filterDishId,
}: Props) {
  const {
    dishes,
    isLoading,
    isFetching,
    query,
    runSearch,
    fetchNextPage,
    hasNextPage,
  } = useDishesSearch({
    filterEmpty: true,
    filterDishId: filterDishId,
  });

  const dishPortions: DishPortion[] = dishes.map((d) =>
    mapDishToPortionInputs(d),
  );
  const selectedIds = selectedPortions.map((p) => p.dish.id);
  const renderedPortions: DishPortion[] = [
    ...selectedPortions,
    ...dishPortions.filter((portion) => !selectedIds.includes(portion.dish.id)),
  ];

  const handleSearch = (event: ChangeEvent<HTMLInputElement>) =>
    runSearch(event.target.value, { replace: true });

  return (
    <>
      <HeaderBox
        title={title}
        subtitle={subtitle}
        backRoute={backRoute}
        className="mb-4"
      >
        <SearchBar defaultValue={query} onChange={handleSearch} />
      </HeaderBox>

      <Box className="mx-4 p-3">
        <DishPortionList
          dishPortions={renderedPortions}
          onAdd={onAdd}
          onUpdate={onUpdate ?? (() => null)}
          onDelete={onDelete}
          isAdded={(p) => !!p?.selected}
          isLoading={isLoading}
        />

        {hasNextPage && (
          <div className="flex justify-center">
            <Button
              disabled={isFetching}
              className="mt-4"
              onClick={() => fetchNextPage()}
            >
              <Spinner loading={isFetching} /> Load more
            </Button>
          </div>
        )}
      </Box>
    </>
  );
}

function mapDishToPortionInputs(dish: Dish): DishPortion {
  return {
    proteins: dish.proteins!,
    fats: dish.fats!,
    carbs: dish.carbs!,
    calories: dish.calories!,
    dish: {
      id: dish.id,
      name: dish.name,
      collectionId: dish.collectionId,
      icon: dish.icon,
      proteins: dish.proteins,
      fats: dish.fats,
      carbs: dish.carbs,
      calories: dish.calories,
      hasIngredients: dish.hasIngredients,
      defaultPortion: dish.defaultPortion,
      updatedAt: dish.updatedAt,
      createdAt: dish.createdAt,
    },
    selected: false,
  };
}
