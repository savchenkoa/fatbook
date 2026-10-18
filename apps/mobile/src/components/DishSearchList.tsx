import type { Dish } from "@fatbook/shared";
import { useDishesSearch } from "../hooks/use-dishes-search";
import { DishSearchResults } from "./DishSearchResults";

type Props = {
    filterDishId?: number;
    filterEmpty?: boolean;
    onSelect: (dish: Dish) => void;
};

export function DishSearchList({ filterDishId, filterEmpty, onSelect }: Props) {
    const search = useDishesSearch({ filterDishId, filterEmpty });
    return <DishSearchResults {...search} onSelect={onSelect} />;
}
