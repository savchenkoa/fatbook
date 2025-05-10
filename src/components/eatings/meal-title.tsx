import { Meals, MealType } from "@/types/meals";
import { formatDate } from "@/utils/date-utils";
import { FaPlus } from "react-icons/fa";
import { Link } from "react-router-dom";
import { DailyEatings } from "@/types/eating";
import { FoodValue } from "@/components/food-value.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";

type Props = {
  dailyEatings?: DailyEatings | null;
  meal: MealType;
  day: string;
  isLoading?: boolean;
};

export function MealTitle({ dailyEatings, meal, day, isLoading }: Props) {
  const eatingPath = `/eatings/${formatDate(day)}/${meal}`;
  const addEatingFormPath = eatingPath + "/add";
  const mealData = dailyEatings?.meals[meal];
  const showFoodValue = mealData?.calories !== 0;

  return (
    <div className="cursor-pointer">
      <div className="mb-1 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1 select-none">
            <span className="size-7 text-center text-lg">
              {Meals[meal].icon}
            </span>
            <span className="text-lg font-semibold">{Meals[meal].title}</span>
          </div>
          {showFoodValue ? (
            <FoodValue
              value={mealData}
              isLoading={isLoading}
              className="mt-3"
            />
          ) : (
            <div className="mt-3 min-h-4"></div>
          )}
        </div>
        <div>
          {isLoading ? (
            <Skeleton className="size-10" />
          ) : (
            <Link to={addEatingFormPath} onClick={(e) => e.stopPropagation()}>
              <Button size="icon">
                <FaPlus />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
