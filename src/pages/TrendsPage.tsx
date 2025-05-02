import { FoodValue } from "@/components/food-value.tsx";
import DatePicker from "@/components/ui/DatePicker";
import Message from "@/components/ui/Message";
import { useState } from "react";
import { FaInfo } from "react-icons/fa";
import { now, nowAsDate, subtractDays } from "@/utils/date-utils";
import DailyTrendChart from "../components/trends/DailyTrendChart";
import FoodValueDiff from "../components/trends/FoodValueDiff";
import { useTrendsData } from "@/hooks/use-trends-data";
import { TimeSpan, TimeSpanSelect } from "@/components/trends/TimeSpanSelect";
import AppLayout from "@/components/AppLayout";
import Button from "@/components/ui/Button";
import Box from "@/components/ui/Box";

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
      <Box className="mb-2">
        <div className="is-flex is-justify-content-space-between mb-4">
          <div className="is-size-4 mr-2">Trends</div>

          <DatePicker
            width={230}
            startDate={startDate}
            selectsRange={true}
            endDate={endDate}
            // @ts-expect-error - TS fails to infer the type of `onChange` based on `selectsRange`
            onChange={handleDateChange}
          />
        </div>
        <div>
          <div className="mt-2">
            <FoodValue isLoading={isLoading} value={totalFoodValue} />
          </div>
          <div className="mt-2">
            <div className="is-flex is-align-items-center">
              <FoodValueDiff foodValue={dietGoalDiff} isLoading={isLoading} />
            </div>
          </div>
          <div className="is-flex is-justify-content-space-between is-align-items-center mt-4">
            <TimeSpanSelect
              activeTimespan={activeTimeSpan}
              onChange={handleTimeSpanChange}
            />
            <Button
              icon={<FaInfo />}
              size="small"
              variant="rounded"
              onClick={() => setShowGoal((s) => !s)}
            />
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
      </Box>
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
