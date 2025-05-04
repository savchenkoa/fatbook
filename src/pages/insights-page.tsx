import { FoodValue } from "@/components/food-value.tsx";
import { Datepicker } from "@/components/ui/datepicker.tsx";
import { Message } from "@/components/ui/message.tsx";
import { useState } from "react";
import { now, nowAsDate, subtractDays } from "@/utils/date-utils";
import { DailyTrendChart } from "../components/trends/daily-trend-chart.tsx";
import { FoodValueDiff } from "../components/trends/food-value-diff.tsx";
import { useTrendsData } from "@/hooks/use-trends-data";
import {
  TimeSpan,
  TimeSpanSelect,
} from "@/components/trends/time-span-select.tsx";
import { AppLayout } from "@/components/app-layout.tsx";
import { Button } from "@/components/ui/button.tsx";
import { HeaderBox } from "@/components/ui/header-box.tsx";
import { LucideInfo } from "lucide-react"; // Component name is for react router lazy loading

// Component name is for react router lazy loading
export function Component() {
  const [showGoal, setShowGoal] = useState(false);
  const [activeTimeSpan, setActiveTimeSpan] = useState<TimeSpan | null>("Week");
  const [dateRange, setDateRange] = useState([
    subtractDays(now(), 7),
    nowAsDate(),
  ]);
  const [startDate, endDate] = dateRange;

  const {
    chartData,
    isLoading,
    totalFoodValue,
    dietGoal,
    dietGoalDiff,
    settings,
  } = useTrendsData(startDate, endDate);

  const handleDateChange = (range: [Date, Date]) => {
    setActiveTimeSpan(null);
    setDateRange(range);
  };

  const handleTimeSpanChange = (timespan: TimeSpan, range: [Date, Date]) => {
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
        <Datepicker
          width={250}
          startDate={startDate}
          selectsRange={true}
          endDate={endDate}
          // @ts-expect-error - TS fails to infer the type of `onChange` based on `selectsRange`
          onChange={handleDateChange}
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
        barFill="oklch(62.3% 0.214 259.815)"
        isLoading={isLoading}
        referenceValue={settings?.calories}
        referenceUnits="kcal"
        xKey="date"
        yKey="calories"
      />
      <DailyTrendChart
        title="🥩 Proteins"
        data={chartData}
        barFill="oklch(69.6% 0.17 162.48)"
        isLoading={isLoading}
        referenceValue={settings?.proteins}
        referenceUnits="g."
        xKey="date"
        yKey="proteins"
      />
      <DailyTrendChart
        title="🧈 Fats"
        data={chartData}
        barFill="oklch(70.5% 0.213 47.604)"
        isLoading={isLoading}
        referenceValue={settings?.fats}
        referenceUnits="g."
        xKey="date"
        yKey="fats"
      />
      <DailyTrendChart
        title="🍚 Carbs"
        data={chartData}
        barFill="oklch(63.7% 0.237 25.331)"
        isLoading={isLoading}
        referenceValue={settings?.carbs}
        referenceUnits="g."
        xKey="date"
        yKey="carbs"
      />
    </AppLayout>
  );
}
