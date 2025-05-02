import { FaCheckCircle } from "react-icons/fa";
import { FoodValue } from "../../food-value.tsx";
import { DishPortion } from "@/types/dish-portion";
import { FoodWeight } from "@/components/FoodWeight";
import DishTitle from "@/components/ui/DishTitle";
import { clsx } from "clsx";

type Props = {
  dishPortion: DishPortion;
  disabled?: boolean;
};

function DishPortionTitle({ dishPortion, disabled }: Props) {
  const noName = !dishPortion.dish.name;

  return (
    <div
      className={clsx({
        "is-clickable": !disabled,
        "background-danger-use-theme": noName,
      })}
    >
      <div className="px-2 py-4">
        <div className="is-flex-grow-1">
          <div className="is-flex is-align-items-center">
            <div className="is-flex-grow-1">
              <div>
                <DishTitle dish={dishPortion.dish}>
                  {dishPortion.selected ? (
                    <FaCheckCircle className="has-text-success is-size-4" />
                  ) : (
                    ""
                  )}
                </DishTitle>
                <div className="is-flex is-justify-content-space-between">
                  <FoodValue
                    value={dishPortion}
                    className="is-size-7 is-justify-content-flex-start"
                  />
                  <FoodWeight value={dishPortion.portion} />
                  {/*For Debug:*/}
                  {/*<span>ID={dishPortion.id ?? "null"}</span>*/}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DishPortionTitle;
