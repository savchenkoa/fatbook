import { FaCheckCircle } from "react-icons/fa";
import { FoodValue } from "../../food-value.tsx";
import { DishPortion } from "@/types/dish-portion";
import { FoodWeight } from "@/components/food-weight.tsx";
import { DishTitle } from "@/components/ui/dish-title.tsx";
import { cn } from "@/lib/utils.ts";
import { MouseEvent } from "react";

type Props = {
  dishPortion: DishPortion;
  disabled?: boolean;
  onClick: () => void;
};

export function DishPortionTitle({ dishPortion, disabled, onClick }: Props) {
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
        "bg-red-200": noName,
      })}
      onClick={handleClick}
    >
      <div className="hover:bg-accent rounded-xl px-2 py-4 sm:p-4">
        <DishTitle dish={dishPortion.dish}>
          {dishPortion.selected && (
            <FaCheckCircle className="text-xl text-green-500" />
          )}
        </DishTitle>
        <div className="flex justify-between">
          <FoodValue value={dishPortion} />
          <FoodWeight value={dishPortion.portion} />
        </div>
      </div>
    </a>
  );
}
