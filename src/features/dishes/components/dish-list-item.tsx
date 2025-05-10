import { FoodValue } from "@/components/ui/food-value.tsx";
import { Dish } from "@/types/dish";
import { DishTitle } from "@/components/ui/dish-title.tsx";
import { SHARED_COLLECTION_ID } from "@/constants";
import { FaUsers } from "react-icons/fa";
import { Tooltip } from "react-tooltip";
import { useIsTouchDevice } from "@/hooks/use-is-touch-device";
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
  const isTouchDevice = useIsTouchDevice();

  return (
    <div
      className={cn("hover:bg-accent cursor-pointer rounded-xl", {
        "bg-blue-50": active,
        "bg-red-100 hover:bg-red-200!": !dish.name,
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
              <span
                className="text-xs"
                data-tooltip-id="shared-tooltip"
                data-tooltip-content="This dish is available to all users"
              >
                <FaUsers />
                {!isTouchDevice && <Tooltip id="shared-tooltip" />}
              </span>
            )}
          </div>
        </div>
        <LucideChevronRight className="stroke-accent-foreground" />
      </div>
    </div>
  );
}
