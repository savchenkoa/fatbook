import { FoodValue } from "@/components/ui/food-value.tsx";
import { Dish } from "@/types/dish";
import { DishTitle } from "@/components/ui/dish-title.tsx";
import { SHARED_COLLECTION_ID } from "@/constants";
import { FaUsers } from "react-icons/fa";
import { LucideChevronRight } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { MouseEvent } from "react";

type Props = {
  dish: Dish;
  active: boolean;
  onClick: () => void;
  onContextMenu: (e: MouseEvent) => void;
};

export function DishListItem({ dish, active, onClick, onContextMenu }: Props) {
  const isShared = dish.collectionId === SHARED_COLLECTION_ID;

  return (
    <div
      className={cn("hover:bg-accent cursor-pointer rounded-xl", {
        "bg-blue-50": active,
        "bg-red-50 hover:bg-red-100!": !dish.name,
      })}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <div className="flex items-center justify-between gap-4 px-2 py-4 sm:p-4">
        <div className="grow">
          <DishTitle dish={dish} />
          <div className="flex justify-between">
            <FoodValue value={dish} />
            {isShared && (
              <span className="text-xs">
                <FaUsers />
              </span>
            )}
          </div>
        </div>
        <LucideChevronRight className="stroke-accent-foreground" />
      </div>
    </div>
  );
}
