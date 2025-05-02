import { FoodValue } from "@/components/food-value.tsx";
import { Meals, MealType } from "@/types/meals";
import { formatDate } from "@/utils/date-utils";
import { FaPlus } from "react-icons/fa";
import { Link } from "react-router-dom";
import { DailyEatings } from "@/types/eating";
import { clsx } from "clsx";
import { Level, LevelLeft, LevelRight } from "@/components/ui/Level";

type Props = {
  dailyEatings?: DailyEatings | null;
  meal: MealType;
  day: string;
  isLoading?: boolean;
};

function MealTitle({ dailyEatings, meal, day, isLoading }: Props) {
  const eatingPath = `/eatings/${formatDate(day)}/${meal}`;
  const addEatingFormPath = eatingPath + "/add";
  const mealData = dailyEatings?.meals[meal];

  return (
    <div className="is-clickable">
      <Level className="mb-1">
        <LevelLeft className="is-flex-direction-row">
          <span className="is-size-4">{Meals[meal].icon}</span>
          <span className="is-size-5">{Meals[meal].title}</span>
        </LevelLeft>
        <LevelRight>
          <Link
            to={addEatingFormPath}
            className={clsx("button is-primary", {
              "is-skeleton": isLoading,
            })}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="icon">
              <FaPlus />
            </span>
          </Link>
        </LevelRight>
      </Level>
      <FoodValue value={mealData} isLoading={isLoading} />
    </div>
  );
}

export default MealTitle;
