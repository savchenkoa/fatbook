import FoodValue from "@/components/FoodValue";
import DatePicker from "@/components/ui/DatePicker";
import {
  formatDate,
  getNextDay,
  getPrevDay,
  isToday as checkIsToday,
  now,
  parse,
} from "@/utils/date-utils";
import { useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useNavigate, useOutletContext } from "react-router-dom";
import MealCards from "../../components/eatings/MealCards";
import { DailyEatings } from "@/types/eating";
import { useIsLoading } from "@/hooks/use-is-loading";
import { DAILY_EATINGS_QUERY_KEY } from "@/pages/eatings/EatingsPage";
import Button from "@/components/ui/Button";
import Box from "@/components/ui/Box";
import { Level, LevelItem, LevelLeft, LevelRight } from "@/components/ui/Level";

function EatingsSummaryPage() {
  const navigate = useNavigate();
  const { day, dailyEatings } = useOutletContext<{
    day: string;
    dailyEatings: DailyEatings;
  }>();
  const [activeIndex, setActiveIndex] = useState(-1);
  const isToday = checkIsToday(day);
  const parsedDay = parse(day);
  const isLoading = useIsLoading(DAILY_EATINGS_QUERY_KEY);

  const handleDayChange = (date: string | Date | number | null) => {
    const selectedDay = formatDate(date);
    setActiveIndex(-1);
    navigate(`/eatings/${selectedDay}`);
  };

  const handleBackClick = () => {
    const newDate = getPrevDay(parsedDay);
    handleDayChange(newDate);
  };
  const handleForwardClick = () => {
    const newDate = getNextDay(parsedDay);
    handleDayChange(newDate);
  };
  const handleTodayClick = () => {
    const newDate = now();
    handleDayChange(newDate);
  };

  return (
    <>
      <Box className="mb-4">
        <div className="is-flex is-flex-wrap-wrap is-justify-content-space-between is-gap-2 mb-5">
          <Level className="mb-0 flex-1" style={{ height: "40px" }}>
            <LevelLeft className="is-flex-direction-row">
              <LevelItem>
                <span className="is-size-5">📝</span>
              </LevelItem>
              <LevelItem>
                <span className="is-size-5">Summary</span>
              </LevelItem>
            </LevelLeft>
            <LevelRight>
              <LevelItem>
                {!isToday && (
                  <Button className="ml-4" onClick={handleTodayClick}>
                    To Today
                  </Button>
                )}
              </LevelItem>
            </LevelRight>
          </Level>
          <Level className="is-gap-0 mb-0 flex-1">
            <Button icon={<FaChevronLeft />} onClick={handleBackClick} />
            <DatePicker
              selected={parsedDay}
              onChange={(e) => handleDayChange(e)}
              withIcon={true}
              width={200}
            />
            <Button icon={<FaChevronRight />} onClick={handleForwardClick} />
          </Level>
        </div>
        <Level className="block">
          <FoodValue
            source={dailyEatings}
            isLoading={isLoading}
            className="level-left is-size-7"
          />
        </Level>
      </Box>
      <MealCards activeIndex={activeIndex} setActiveIndex={setActiveIndex} />
    </>
  );
}

export default EatingsSummaryPage;
