import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { eatingsService } from "@/services/eatings-service";
import { useAuth } from "@/context/Auth";
import AppLayout from "@/components/AppLayout";
import { useState } from "react";
import {
  formatDate,
  getNextDay,
  getPrevDay,
  isToday as checkIsToday,
  now,
  parse,
} from "@/utils/date-utils.ts";
import { useIsLoading } from "@/hooks/use-is-loading.ts";
import Button from "@/components/ui/Button.tsx";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import DatePicker from "@/components/ui/DatePicker.tsx";
import { FoodValue } from "@/components/food-value.tsx";
import MealCards from "@/components/eatings/MealCards.tsx";
import { HeaderBox } from "@/components/ui/header-box.tsx";
import { FatbookLogo } from "@/components/ui/fatbook-logo.tsx";
import { LucideCalendarSync } from "lucide-react";

export const DAILY_EATINGS_QUERY_KEY = "dailyEatings";

export function EatingsPage() {
  const { userId } = useAuth();
  const params = useParams();
  const day = params.day || formatDate(now());
  const { data: dailyEatings } = useQuery({
    queryKey: [DAILY_EATINGS_QUERY_KEY, day],
    queryFn: () => eatingsService.fetchDailyEatings(userId, day!),
  });
  const navigate = useNavigate();
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
    <AppLayout>
      <HeaderBox className="relative mb-4">
        <div className="absolute top-2 right-2">
          {!isToday && (
            <Button variant="text" onClick={handleTodayClick}>
              <LucideCalendarSync />
            </Button>
          )}
        </div>

        <div className="mb-4 flex flex-col items-center gap-4">
          <div className="flex gap-2 sm:hidden">
            <FatbookLogo />
            <span className="text-xl font-bold">Fatbook</span>
          </div>
          <div className="flex w-full justify-between sm:w-md sm:justify-center">
            <Button icon={<FaChevronLeft />} onClick={handleBackClick} />
            <DatePicker
              selected={parsedDay}
              onChange={(e) => handleDayChange(e)}
              withIcon={true}
              width={200}
            />
            <Button icon={<FaChevronRight />} onClick={handleForwardClick} />
          </div>
        </div>
        <div className="flex justify-between">
          <FoodValue
            value={dailyEatings}
            isLoading={isLoading}
            className="is-size-7"
          />
        </div>
      </HeaderBox>

      <MealCards
        day={day}
        dailyEatings={dailyEatings}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
      />
    </AppLayout>
  );
}
