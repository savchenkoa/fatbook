import Accordion, { AccordionItem } from "@/components/ui/Accordion";
import { Meals, MealType } from "@/types/meals";
import MealContent from "./MealContent";
import MealTitle from "./MealTitle";
import { DailyEatings } from "@/types/eating";
import { useIsLoading } from "@/hooks/use-is-loading";
import { DAILY_EATINGS_QUERY_KEY } from "@/pages/eatings/eatings-page.tsx";

interface Props {
  day: string;
  dailyEatings: DailyEatings | undefined;
  activeIndex: number;
  setActiveIndex: (number: number) => void;
}

function MealCards({ day, dailyEatings, activeIndex, setActiveIndex }: Props) {
  const isLoading = useIsLoading(DAILY_EATINGS_QUERY_KEY);

  return (
    <>
      <Accordion
        activeIndex={activeIndex}
        onTabChange={(e) => setActiveIndex(e.index)}
        disabled={isLoading}
      >
        {Object.keys(Meals).map((meal) => (
          <AccordionItem
            key={meal}
            title={
              <MealTitle
                isLoading={isLoading}
                dailyEatings={dailyEatings}
                meal={meal as MealType}
                day={day}
              />
            }
            className="box mb-4"
            selectedStyle={{
              width: "104%",
              marginLeft: "-2%",
            }}
          >
            {dailyEatings && (
              <MealContent
                dailyEatings={dailyEatings}
                meal={meal as MealType}
              />
            )}
          </AccordionItem>
        ))}
      </Accordion>
    </>
  );
}

export default MealCards;
