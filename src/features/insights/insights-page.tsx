import { FoodValue } from "@/components/ui/food-value.tsx";
import { Message } from "@/components/ui/message.tsx";
import { useState } from "react";
import { now, nowAsDate, subtractDays } from "@/utils/date-utils";
import { DailyTrendChart } from "./components/daily-trend-chart.tsx";
import { FoodValueDiff } from "./components/food-value-diff.tsx";
import { useTrendsData } from "@/hooks/use-trends-data";
import { TimeSpan, TimeSpanSelect } from "./components/time-span-select.tsx";
import { AppLayout } from "@/components/layout/app-layout.tsx";
import { Button } from "@/components/ui/button.tsx";
import { HeaderBox } from "@/components/ui/header-box.tsx";
import { LucideInfo } from "lucide-react";
import { DatepickerRange } from "@/components/ui/datepicker-range.tsx";
import { DateRange } from "react-day-picker";

// Component name is for react router lazy loading
export function Component() {
  const [showGoal, setShowGoal] = useState(false);
  const [activeTimeSpan, setActiveTimeSpan] = useState<TimeSpan | null>("Week");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subtractDays(now(), 7),
    to: nowAsDate(),
  });
  const { from: startDate, to: endDate } = dateRange;

  const {
    chartData,
    isLoading,
    totalFoodValue,
    dietGoal,
    dietGoalDiff,
    settings,
  } = useTrendsData(startDate, endDate);

  const handleRangeSelect = (range: DateRange) => {
    setActiveTimeSpan(null);
    setDateRange(range);
  };

  const handleTimeSpanChange = (timespan: TimeSpan, range: DateRange) => {
    setActiveTimeSpan(timespan);
    setDateRange(range);
  };

  return (
    <AppLayout>
      <HeaderBox
        title="Insights"
        className="mb-4"
        action={
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setShowGoal((s) => !s)}
            className="rounded-full"
          >
            <LucideInfo className="size-6" />
          </Button>
        }
      >
        {showGoal && (
          <Message
            title="Goal for selected days"
            onClose={() => setShowGoal((s) => !s)}
            className="mb-4"
          >
            <FoodValue value={dietGoal} isLoading={isLoading} />
          </Message>
        )}
        <DatepickerRange
          range={{ from: startDate, to: endDate }}
          onSelect={handleRangeSelect}
          className="w-full"
        />
        <div className="mt-6">
          <FoodValue isLoading={isLoading} value={totalFoodValue} />
        </div>
        <div className="mt-4">
          <FoodValueDiff foodValue={dietGoalDiff} isLoading={isLoading} />
        </div>
        <div className="mt-6 flex justify-center">
          <TimeSpanSelect
            activeTimespan={activeTimeSpan}
            onChange={handleTimeSpanChange}
          />
        </div>
      </HeaderBox>
      <DailyTrendChart
        title="⚡ Calories"
        data={chartData}
        barFill="oklch(58.8% 0.158 241.966)"
        isLoading={isLoading}
        referenceValue={settings?.calories}
        referenceUnits="kcal"
        xKey="date"
        yKey="calories"
      />
      <DailyTrendChart
        title="🥩 Proteins"
        data={chartData}
        barFill="oklch(76.9% 0.188 70.08)"
        isLoading={isLoading}
        referenceValue={settings?.proteins}
        referenceUnits="g."
        xKey="date"
        yKey="proteins"
      />
      <DailyTrendChart
        title="🧈 Fats"
        data={chartData}
        barFill="oklch(70.4% 0.14 182.503)"
        isLoading={isLoading}
        referenceValue={settings?.fats}
        referenceUnits="g."
        xKey="date"
        yKey="fats"
      />
      <DailyTrendChart
        title="🍚 Carbs"
        data={chartData}
        barFill="oklch(55.4% 0.046 257.417)"
        isLoading={isLoading}
        referenceValue={settings?.carbs}
        referenceUnits="g."
        xKey="date"
        yKey="carbs"
      />
    </AppLayout>
  );
}
