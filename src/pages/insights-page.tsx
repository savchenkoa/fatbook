import { FoodValue } from "@/components/food-value.tsx";
import { Datepicker } from "@/components/ui/datepicker.tsx";
import { Message } from "@/components/ui/Message";
import { useState } from "react";
import { FaInfo } from "react-icons/fa";
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
import { HeaderBox } from "@/components/ui/header-box.tsx"; // Component name is for react router lazy loading

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
      <HeaderBox title="Insights" className="mb-2">
        <Datepicker
          width={250}
          startDate={startDate}
          selectsRange={true}
          endDate={endDate}
          // @ts-expect-error - TS fails to infer the type of `onChange` based on `selectsRange`
          onChange={handleDateChange}
        />
        <div>
          <div className="mt-2">
            <FoodValue isLoading={isLoading} value={totalFoodValue} />
          </div>
          <div className="mt-2">
            <FoodValueDiff foodValue={dietGoalDiff} isLoading={isLoading} />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <TimeSpanSelect
              activeTimespan={activeTimeSpan}
              onChange={handleTimeSpanChange}
            />
            <Button
              size="icon"
              onClick={() => setShowGoal((s) => !s)}
              className="rounded-full"
            >
              <FaInfo />
            </Button>
          </div>
          {showGoal && (
            <Message
              title="Goal for selected days"
              onClose={() => setShowGoal((s) => !s)}
              className="mt-2"
            >
              <FoodValue value={dietGoal} isLoading={isLoading} />
            </Message>
          )}
        </div>
      </HeaderBox>
      <DailyTrendChart
        title="⚡ Calories"
        data={chartData}
        barFill="hsl(171, 100%, 41%)"
        isLoading={isLoading}
        referenceValue={settings?.calories}
        xKey="date"
        yKey="calories"
      />
      <DailyTrendChart
        title="🥩 Proteins"
        data={chartData}
        barFill="hsl(204, 86%, 53%)"
        isLoading={isLoading}
        referenceValue={settings?.proteins}
        xKey="date"
        yKey="proteins"
      />
      <DailyTrendChart
        title="🧈 Fats"
        data={chartData}
        barFill="hsl(48, 100%, 67%)"
        isLoading={isLoading}
        referenceValue={settings?.fats}
        xKey="date"
        yKey="fats"
      />
      <DailyTrendChart
        title="🍚 Carbs"
        data={chartData}
        barFill="hsl(348, 100%, 61%)"
        isLoading={isLoading}
        referenceValue={settings?.carbs}
        xKey="date"
        yKey="carbs"
      />
    </AppLayout>
  );
}
