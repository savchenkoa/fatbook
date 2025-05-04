import { FaCheckCircle } from "react-icons/fa";
import { FoodValue } from "../../food-value.tsx";
import { DishPortion } from "@/types/dish-portion";
import { FoodWeight } from "@/components/food-weight.tsx";
import { DishTitle } from "@/components/ui/dish-title.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { cn } from "@/lib/utils.ts";

type Props = {
  dishPortion: DishPortion;
  disabled?: boolean;
  isLast?: boolean;
};

export function DishPortionTitle({ dishPortion, disabled, isLast }: Props) {
  const noName = !dishPortion.dish.name;

  return (
    <div
      className={cn({
        "cursor-pointer": !disabled,
        "bg-red-200": noName,
      })}
    >
      <div className="p-4">
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
      {!isLast && <Separator />}
    </div>
  );
}
