import { FoodValue } from "@/components/ui/food-value.tsx";
import { DishPortion } from "@/types/dish-portion";
import { FoodWeight } from "@/components/ui/food-weight.tsx";
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

export function DishPortionListItem({
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
          "hover:bg-accent/60 active:bg-accent relative rounded-xl px-2 py-4 sm:p-4",
          {
            "bg-red-200": noName,
            "bg-green-100": dishPortion.selected,
            "hover:bg-green-200": dishPortion.selected,
          },
        )}
      >
        <div className="flex justify-between">
          <DishTitle dish={dishPortion.dish} />
          {dishPortion.selected ? (
            <LucideCheckCircle2 className="size-6 text-green-500" />
          ) : (
            !isEditing && (
              <LucidePlusCircle className="text-accent-foreground absolute top-1/2 right-4 size-6 -translate-y-1/2 transform" />
            )
          )}
        </div>
        <div className="flex justify-between">
          <FoodValue value={dishPortion} />
          <FoodWeight value={dishPortion.portion} />
        </div>
      </div>
    </a>
  );
}
