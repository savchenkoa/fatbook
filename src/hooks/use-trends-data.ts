import { useQuery } from "@tanstack/react-query";
import { FoodValue } from "@/types/food-value";
import { useAuth } from "@/context/auth.tsx";
import { getDaysBetween } from "@/utils/date-utils";
import { sumFoodValues } from "@/utils/food-value-utils";
import { useSettings } from "@/hooks/use-settings";
import { fetchTrendsData } from "@/services/trends-service";

type TrendsResult =
  | {
      isLoading: false;
      chartData: FoodValue[];
      totalFoodValue: FoodValue;
      dietGoal: FoodValue;
      dietGoalDiff: FoodValue;
      settings: FoodValue;
    }
  | {
      isLoading: true;
      chartData: FoodValue[];
      totalFoodValue?: FoodValue;
      dietGoal?: FoodValue;
      dietGoalDiff?: FoodValue;
      settings?: FoodValue;
    };

export function useTrendsData(startDate?: Date, endDate?: Date): TrendsResult {
  const { userId } = useAuth();
  const selectedDays = getDaysBetween(
    startDate ?? new Date(),
    endDate ?? new Date(),
  );

  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ["trends", startDate, endDate],
    queryFn: () => fetchTrendsData(userId, selectedDays),
    enabled: Boolean(startDate && endDate),
  });
  const { data: settings, isLoading: settingsLoading } = useSettings();

  if (trendsLoading || settingsLoading || !settings) {
    return {
      chartData: [],
      isLoading: true,
    };
  }

  const chartData = trends ?? [];
  const totalFoodValue = sumFoodValues(chartData);
  const dietGoal = {
    proteins: settings.proteins * selectedDays.length,
    fats: settings.fats * selectedDays.length,
    carbs: settings.carbs * selectedDays.length,
    calories: settings.calories * selectedDays.length,
  };
  const dietGoalDiff: FoodValue = {
    proteins: totalFoodValue.proteins - dietGoal.proteins,
    fats: totalFoodValue.fats - dietGoal.fats,
    carbs: totalFoodValue.carbs - dietGoal.carbs,
    calories: totalFoodValue.calories - dietGoal.calories,
  };

  return {
    isLoading: false,
    chartData,
    settings,
    dietGoal,
    dietGoalDiff,
    totalFoodValue,
  };
}
