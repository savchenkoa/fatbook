import { FoodValue } from "../food-value.tsx";
import { Dish } from "@/types/dish";
import { DishTitle } from "@/components/ui/dish-title.tsx";
import { SHARED_COLLECTION_ID } from "@/constants";
import { FaUsers } from "react-icons/fa";
import { Tooltip } from "react-tooltip";
import { useIsTouchDevice } from "@/hooks/use-is-touch-device";

type Props = {
  dish: Dish;
};

export function DishInfo({ dish }: Props) {
  const isShared = dish.collectionId === SHARED_COLLECTION_ID;
  const isTouchDevice = useIsTouchDevice();

  return (
    <div className="is-flex-grow-1">
      <div className="is-flex is-align-items-center">
        <div className="is-flex-grow-1">
          <DishTitle dish={dish} />
          <div className="subtitle is-7">
            <span className="is-flex is-justify-content-space-between">
              <span>
                <FoodValue value={dish} />
              </span>
              {isShared && (
                <span
                  className="icon"
                  data-tooltip-id="shared-tooltip"
                  data-tooltip-content="This dish is available to all users"
                >
                  <FaUsers />
                  {!isTouchDevice && <Tooltip id="shared-tooltip" />}
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
