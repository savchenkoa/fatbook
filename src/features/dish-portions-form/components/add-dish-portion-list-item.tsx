import { DishPortion } from "@/types/dish-portion.ts";
import { MouseEvent } from "react";
import { cn } from "@/lib/utils.ts";
import { DishTitle } from "@/components/ui/dish-title.tsx";
import { FoodValue } from "@/components/ui/food-value.tsx";
import { QuickAddButton } from "@/features/dish-portions-form/components/quick-add-button.tsx";
import { LucideDot, LucidePencil } from "lucide-react";

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
          "hover:bg-accent/60 active:bg-accent relative rounded-xl px-2 py-4 transition-colors duration-100 ease-in sm:p-4",
          {
            "bg-green-50 hover:bg-green-100": dishPortion.selected,
          },
        )}
        role="listitem"
      >
        <div className="flex items-center justify-between">
          <div>
            <DishTitle dish={dishPortion.dish} />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-1">
              <FoodValue value={dishPortion} />
              <LucideDot className="hidden sm:block" />
              <span className="flex items-center text-xs text-slate-500">
                <LucidePencil className="mr-1 size-3!" />
                <strong>
                  {dishPortion.portion ??
                    dishPortion.dish.defaultPortion ??
                    "N/A"}{" "}
                  g
                </strong>
              </span>
            </div>
          </div>
          <QuickAddButton portion={dishPortion} onClick={handleQuickAdd} />
        </div>
      </div>
    </a>
  );
}
