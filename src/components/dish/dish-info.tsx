import { FoodValue } from "../food-value.tsx";
import { Dish } from "@/types/dish";
import { DishTitle } from "@/components/ui/dish-title.tsx";
import { SHARED_COLLECTION_ID } from "@/constants";
import { FaUsers } from "react-icons/fa";
import { Tooltip } from "react-tooltip";
import { useIsTouchDevice } from "@/hooks/use-is-touch-device";
import { LucideChevronRight } from "lucide-react";

type Props = {
  dish: Dish;
};

// TODO: why I need this component?
export function DishInfo({ dish }: Props) {
  const isShared = dish.collectionId === SHARED_COLLECTION_ID;
  const isTouchDevice = useIsTouchDevice();

  return (
    <div className="flex items-center justify-between gap-4">
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
  );
}
