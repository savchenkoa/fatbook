import { FoodValue } from "@/components/ui/food-value.tsx";
import { Dish } from "@/types/dish";
import { DishTitle } from "@/components/ui/dish-title.tsx";
import { SHARED_COLLECTION_ID } from "@/constants";
import { LucideChevronRight, LucideUsers } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { MouseEvent } from "react";
import { Link } from "react-router-dom";

type Props = {
  dish: Dish;
  active: boolean;
  onClick: () => void;
  onContextMenu: (e: MouseEvent) => void;
};

export function DishListItem({ dish, active, onContextMenu }: Props) {
  const isShared = dish.collectionId === SHARED_COLLECTION_ID;

  return (
    <Link
      to={`/dishes/${dish.id}`}
      className={cn("hover:bg-accent cursor-pointer rounded-xl", {
        "bg-blue-50": active,
        "bg-red-50 hover:bg-red-100!": !dish.name,
      })}
      onContextMenu={onContextMenu}
    >
      <div className="flex items-center justify-between gap-4 px-2 py-4 sm:p-4">
        <div className="grow">
          <DishTitle dish={dish} />
          <div className="flex justify-between">
            <FoodValue value={dish} />
            {isShared && <LucideUsers className="size-4!" />}
          </div>
        </div>
        <LucideChevronRight className="stroke-accent-foreground" />
      </div>
    </Link>
  );
}
