import { DishPortionList } from "./dish-portion-list/DishPortionList";
import { DishPortion } from "@/types/dish-portion";

interface Props {
  dishPortions?: DishPortion[];
  onSave: (portion: DishPortion) => void;
  onDelete: (portion: DishPortion) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function EditDishPortionsForm({
  dishPortions,
  onSave,
  onDelete,
  isLoading,
  disabled,
}: Props) {
  const handleSaveClick = (portion) => {
    onSave(portion);
  };

  const handleDeleteClick = (portion) => {
    onDelete(portion);
  };

  return (
    <DishPortionList
      disabled={disabled}
      isLoading={isLoading}
      dishPortions={dishPortions}
      onUpdate={handleSaveClick}
      onDelete={handleDeleteClick}
      isAdded={() => true}
    />
  );
}
