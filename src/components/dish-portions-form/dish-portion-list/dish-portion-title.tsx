import { FoodValue } from "../../food-value.tsx";
import { DishPortion } from "@/types/dish-portion";
import { FoodWeight } from "@/components/food-weight.tsx";
import { DishTitle } from "@/components/ui/dish-title.tsx";
import { cn } from "@/lib/utils.ts";
import { MouseEvent } from "react";
import { LucideCheckCircle2, LucidePlusCircle } from "lucide-react";

type Props = {
  isEditing: boolean;
  dishPortion: DishPortion;
  disabled?: boolean;
  onClick: () => void;
};

export function DishPortionTitle({
  dishPortion,
  isEditing,
  disabled,
  onClick,
}: Props) {
  const noName = !dishPortion.dish.name;

  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    onClick();
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
          "hover:bg-accent flex justify-between rounded-xl px-2 py-4 sm:p-4",
          {
            "bg-red-200": noName,
            "bg-green-100": dishPortion.selected,
            "hover:bg-green-200": dishPortion.selected,
          },
        )}
      >
        <div>
          <DishTitle dish={dishPortion.dish} />
          <FoodValue value={dishPortion} />
        </div>

        <div classNam="flex flex-col items-end justify-center gap-2">
          {dishPortion.selected ? (
            <>
              <LucideCheckCircle2 className="size-6 text-green-500" />
              <FoodWeight value={dishPortion.portion} />
            </>
          ) : isEditing ? null : (
            <LucidePlusCircle className="text-accent-foreground size-6" />
          )}
        </div>
      </div>
    </a>
  );
}
