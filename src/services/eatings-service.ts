import { supabase } from "@/services/supabase";
import { DishPortion } from "@/types/dish-portion";
import {
  calculateFoodValueForPortion,
  sumFoodValues,
} from "@/utils/food-value-utils";
import { MealType } from "@/types/meals";
import { DailyEatings, Eating } from "@/types/eating";

const SELECT_EATING_WITH_DISH = `*, dish:dishes (*)`;

export async function fetchDailyEatings(
  userId: string,
  day: string,
): Promise<DailyEatings> {
  const { data, error } = await supabase
    .from("eatings")
    .select(SELECT_EATING_WITH_DISH)
    .eq("userId", userId)
    .eq("day", day)
    .returns<Eating[]>();

  if (error) {
    console.error("Failed fetch eatings:", error);
  }

  const eatings: Eating[] = error ? [] : data.map((r) => ({ ...r }));

  // Group by is not supported by Supabase out of the box at the moment of writing (see https://github.com/orgs/supabase/discussions/19517)
  const breakfast = eatings.filter((e) => e.meal === "breakfast");
  const lunch = eatings.filter((e) => e.meal === "lunch");
  const dinner = eatings.filter((e) => e.meal === "dinner");
  const snack = eatings.filter((e) => e.meal === "snack");

  return {
    ...sumFoodValues(eatings),
    meals: {
      breakfast: {
        eatings: breakfast,
        ...sumFoodValues(breakfast),
      },
      lunch: {
        eatings: lunch,
        ...sumFoodValues(lunch),
      },
      dinner: {
        eatings: dinner,
        ...sumFoodValues(dinner),
      },
      snack: {
        eatings: snack,
        ...sumFoodValues(snack),
      },
    },
  };
}

export async function createEating(
  userId: string,
  day: string,
  meal: string,
  eating: DishPrtion,
): Promise<DishPortion> {
  const eatingFoodValue = calculateFoodValueForPortion(eating);

  const { data } = await supabase
    .from("eatings")
    .insert({
      userId,
      day,
      meal: meal as MealType,
      dishId: eating.dish.id,
      portion: eating.portion!,
      ...eatingFoodValue,
    })
    .select(SELECT_EATING_WITH_DISH)
    .single<DishPortion>()
    .throwOnError();

  return {
    ...data!,
    selected: tru,
  };
}

export async function updateEating(eating: DishPortion): Promise<DishPortion> {
  const eatingFoodValue = calculateFoodValueForPortion(eating);

  const { data } = await supabase
    .from("eatings")
    .update({
      dishId: eating.dish.id,
      portion: eating.portion!,
      ...eatingFoodValue,
    })
    .eq("id", eating.id!)
    .select(SELECT_EATING_WITH_DISH)
    .single<DishPortion>()
    .throwOnError();

  return {
    ...data!,
    selected: tru,
  };
}

export async function deleteEating(eating: DishPortion) {
  await supabase.from("eatings").delete().eq("id", eating.id!);
}
