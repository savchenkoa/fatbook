import { DishPortion } from "@/types/dish-portion.ts";
import { MouseEvent } from "react";
import { cn } from "@/lib/utils.ts";
import { DishTitle } from "@/components/ui/dish-title.tsx";
import { FoodValue } from "@/components/ui/food-value.tsx";
import { QuickAddButton } from "@/features/dish-portions-form/components/quick-add-button.tsx";

type Props = {
  dishPortion: DishPortion;
  disabled?: boolean;
  onClick: () => void;
  onAdd: (p: DishPortion) => void;
  onDelete: (p: DishPortion) => void;
};

export function AddDishPortionListItem({
  dishPortion,
  disabled,
  onClick,
  onAdd,
  onDelete,
}: Props) {
  const noName = !dishPortion.dish.name;

  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    onClick();
  };
  const handleQuickAdd = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (dishPortion.selected) {
      onDelete(dishPortion);
      return;
    }

    if (dishPortion.dish.defaultPortion) {
      dishPortion.portion = dishPortion.dish.defaultPortion;
      onAdd(dishPortion);
    } else {
      onClick();
    }
  };

  return (
    <a
      href="#"
      className={cn("", {
        "cursor-pointer": !disabled,
      })}
      onClick={handleClick}
    >
      <div
        className={cn(
          "hover:bg-accent/60 active:bg-accent relative rounded-xl px-2 py-4 sm:p-4",
          {
            "bg-red-200": noName,
            "bg-green-50": dishPortion.selected,
            "hover:bg-green-100": dishPortion.selected,
          },
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <DishTitle dish={dishPortion.dish} />
            <FoodValue value={dishPortion} />
          </div>
          <QuickAddButton portion={dishPortion} onClick={handleQuickAdd} />
        </div>
      </div>
    </a>
  );
}
