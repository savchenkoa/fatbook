import FoodValue from "@/components/FoodValue";
import DatePicker from "@/components/ui/DatePicker";
import Message from "@/components/ui/Message";
import { useState } from "react";
import { FaInfo } from "react-icons/fa";
import { now, nowAsDate, subtractDays } from "@/utils/date-utils";
import DailyTrendChart from "../components/trends/DailyTrendChart";
import FoodValueDiff from "../components/trends/FoodValueDiff";
import { useTrendsData } from "@/hooks/use-trends-data";
import { TimeSpan, TimeSpanSelect } from "@/components/trends/TimeSpanSelect";

function Trends() {
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
    <>
      <div className="box mb-2">
        <div className="is-flex is-justify-content-space-between mb-4">
          <div className="is-size-4 mr-2">Trends</div>

          <DatePicker
            width={230}
            selectsRange={true}
            startDate={startDate}
            endDate={endDate}
            onChange={handleDateChange}
          />
        </div>
        <div>
          <div className="mt-2">
            <FoodValue
              isLoading={isLoading}
              source={totalFoodValue}
              className="level-left is-size-7"
            />
          </div>
          <div className="mt-2">
            <div className="is-flex is-align-items-center">
              <FoodValueDiff foodValue={dietGoalDiff} isLoading={isLoading} />
            </div>
          </div>
          <div className="mt-4 is-flex is-justify-content-space-between is-align-items-center">
            <TimeSpanSelect
              activeTimespan={activeTimeSpan}
              onChange={handleTimeSpanChange}
            />
            <button
              onClick={() => setShowGoal((s) => !s)}
              className="button is-small is-rounded "
            >
              <FaInfo />
            </button>
          </div>
          {showGoal && (
            <Message
              title="Goal for selected days"
              onClose={() => setShowGoal((s) => !s)}
              className="mt-2"
            >
              <FoodValue
                source={dietGoal}
                isLoading={isLoading}
                className="level-left is-size-7 has-text-dark"
              />
            </Message>
          )}
        </div>
      </div>
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
    </>
  );
}

export default Trends;
