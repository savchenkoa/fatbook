import { ChangeEvent } from "react";
import PageTitle from "../PageTitle";
import SearchBar from "../ui/SearchBar";
import DishPortionList from "./dish-portion-list/DishPortionList";
import { useDishesSearch } from "@/hooks/use-dishes-search";
import { DishPortion } from "@/types/dish-portion";
import { Dish } from "@/types/dish";

type Props = {
  title: string;
  subtitle: string;
  selectedPortions: DishPortion[];
  onAdd: (ingredient: DishPortion) => void;
  onDelete: (ingredient: DishPortion) => void;
  onUpdate?: (ingredient: DishPortion) => void;
  filterDishId?: number;
};

function SelectDishPortionsForm({
  title,
  subtitle,
  selectedPortions,
  onAdd,
  onUpdate,
  onDelete,
  filterDishId,
}: Props) {
  const { dishes, isLoading, query, runSearch } = useDishesSearch({
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
    <div className="block">
      <div className="box">
        <PageTitle title={title} subtitle={subtitle} backPath={-1} />

        <SearchBar
          isLoading={isLoading}
          defaultValue={query}
          onChange={handleSearch}
        />

        <DishPortionList
          dishPortions={renderedPortions}
          onAdd={onAdd}
          onUpdate={onUpdate ?? (() => null)}
          onDelete={onDelete}
          isAdded={(p) => p.selected!}
        />
      </div>
    </div>
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

export default SelectDishPortionsForm;
