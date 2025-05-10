import { EditDishPortionsForm } from "@/features/dish-portions-form/edit-dish-portions-form.tsx";
import { DailyEatings } from "@/types/eating";
import { MealType } from "@/types/meals";
import { DishPortion } from "@/types/dish-portion";
import { useEatingMutations } from "@/hooks/use-eating-mutations";

type Props = {
  dailyEatings: DailyEatings;
  meal: MealType;
};

export function MealContent({ dailyEatings, meal }: Props) {
  const mealData = dailyEatings.meals[meal];
  const { updateEating, removeEating, selectedPortions } = useEatingMutations(
    meal!,
    mealData.eatings,
  );
  const eatings = selectedPortions.map((p) => ({ ...p, selected: false }));

  const handleDaySave = async (portion: DishPortion) => {
    updateEating.mutate(portion);
  };

  const handleDeleteEating = async (portion: DishPortion) => {
    removeEating.mutate(portion);
  };

  return (
    <EditDishPortionsForm
      dishPortions={eatings}
      onSave={handleDaySave}
      onDelete={handleDeleteEating}
    />
  );
}
