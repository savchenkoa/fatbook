import { ChangeEvent, Fragment, useState } from "react";
import { SearchBar } from "@/components/ui/search-bar.tsx";
import { useDishesSearch } from "@/hooks/use-dishes-search";
import { DishPortion } from "@/types/dish-portion";
import { Dish } from "@/types/dish";
import { Button } from "@/components/ui/button.tsx";
import { Box } from "@/components/ui/box.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { HeaderBox } from "@/components/ui/header-box.tsx";
import { DishListSkeleton } from "@/components/ui/dish-list-skeleton.tsx";
import { isNil } from "@/utils/is-nil.ts";
import { AddDishPortionListItem } from "@/features/dish-portions-form/components/add-dish-portion-list-item.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { PortionSizeSelector } from "@/features/dish-portions-form/components/portion-size-selector.tsx";
import { dishesService } from "@/services/dishes-service.ts";
import { EmptyState } from "@/components/ui/empty-state.tsx";

type Props = {
  title: string;
  backRoute?: string | number;
  subtitle: string;
  selectedPortions: DishPortion[];
  onAdd: (ingredient: DishPortion) => void;
  onDelete: (ingredient: DishPortion) => void;
  onUpdate: (ingredient: DishPortion) => void;
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
  const [selectedPortion, setSelectedPortion] = useState<DishPortion | null>(
    null,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  const dishPortions: DishPortion[] = dishes.map((d) =>
    mapDishToPortionInputs(d),
  );
  const selectedIds = selectedPortions.map((p) => p.dish.id);
  const renderedPortions: DishPortion[] = [
    ...selectedPortions,
    ...dishPortions.filter((portion) => !selectedIds.includes(portion.dish.id)),
  ];
  const noItemsFound = isNil(dishPortions) || dishPortions.length === 0;

  const handleSearch = (event: ChangeEvent<HTMLInputElement>) =>
    runSearch(event.target.value, { replace: true });
  const handlePortionClick = (portion: DishPortion) => {
    setSelectedPortion(portion);
    setDrawerOpen(true);
  };
  const handleDrawerClose = () => setDrawerOpen(false);
  const handleServingSelect = async (submittedPortion: DishPortion) => {
    // If an added dish has no portion size, then the logged one will be set as such
    if (!submittedPortion.dish.defaultPortion) {
      const { dish } = submittedPortion;
      await dishesService.updateDish(dish.id, {
        defaultPortion: submittedPortion.portion,
      });
    }

    if (submittedPortion.selected) {
      onUpdate(submittedPortion);
    } else {
      onAdd(submittedPortion);
    }
  };

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
        {isLoading && <DishListSkeleton />}
        {!isLoading && noItemsFound && <EmptyState message="No dishes found" />}
        {!isLoading &&
          !noItemsFound &&
          renderedPortions.map((dishPortion, i) => (
            <Fragment key={dishPortion.dish.id}>
              <AddDishPortionListItem
                dishPortion={dishPortion}
                onClick={() => handlePortionClick(dishPortion)}
                onAdd={onAdd}
                onDelete={onDelete}
              />

              {i !== dishPortions.length - 1 && <Separator className="my-1" />}
            </Fragment>
          ))}

        <PortionSizeSelector
          open={drawerOpen}
          isEditing={selectedPortion?.selected}
          dishPortion={selectedPortion}
          onClose={handleDrawerClose}
          onSubmit={handleServingSelect}
          onDelete={onDelete}
        />

        {hasNextPage && (
          <>
            <Separator className="my-1" />
            <div className="flex justify-center">
              <Button
                disabled={isFetching}
                className="mt-4"
                onClick={() => fetchNextPage()}
              >
                <Spinner loading={isFetching} /> Load more
              </Button>
            </div>
          </>
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
