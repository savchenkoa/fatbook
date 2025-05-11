import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { eatingsService } from "@/services/eatings-service";
import { useAuth } from "@/context/auth.tsx";
import { AppLayout } from "@/components/layout/app-layout.tsx";
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
import { Button } from "@/components/ui/button.tsx";
import { Datepicker } from "@/components/ui/datepicker.tsx";
import { FoodValue } from "@/components/ui/food-value.tsx";
import { MealCards } from "./components/meal-cards.tsx";
import { HeaderBox } from "@/components/ui/header-box.tsx";
import { FatbookLogo } from "@/components/ui/fatbook-logo.tsx";
import {
  LucideCalendarSync,
  LucideChevronLeft,
  LucideChevronRight,
} from "lucide-react";

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
        <div className="absolute top-2 right-2 sm:top-6">
          {!isToday && (
            <Button variant="ghost" onClick={handleTodayClick}>
              <span className="hidden sm:inline">To Today</span>
              <LucideCalendarSync className="size-5" />{" "}
            </Button>
          )}
        </div>

        <div className="mb-4 flex flex-col items-center gap-4">
          <div className="flex gap-2 sm:hidden">
            <FatbookLogo />
            <span className="text-xl font-bold">Fatbook</span>
          </div>
          <div className="flex w-full items-center justify-between gap-2 sm:w-md sm:justify-center">
            <Button size="icon" variant="ghost" onClick={handleBackClick}>
              <LucideChevronLeft className="size-5" />
            </Button>
            <Datepicker value={parsedDay} onSelect={handleDayChange} />
            <Button size="icon" variant="ghost" onClick={handleForwardClick}>
              <LucideChevronRight className="size-5" />
            </Button>
          </div>
        </div>
        <div className="flex justify-between">
          <FoodValue value={dailyEatings} isLoading={isLoading} />
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
