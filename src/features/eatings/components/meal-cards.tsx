import { Accordion, AccordionItem } from "@/components/ui/accordion.tsx";
import { Meals, MealType } from "@/types/meals";
import { MealContent } from "./meal-content.tsx";
import { MealTitle } from "./meal-title.tsx";
import { DailyEatings } from "@/types/eating";
import { useIsLoading } from "@/hooks/use-is-loading";
import { DAILY_EATINGS_QUERY_KEY } from "@/features/eatings/eatings-page.tsx";
import { Separator } from "@/components/ui/separator.tsx";

interface Props {
  day: string;
  dailyEatings: DailyEatings | undefined;
  activeIndex: number;
  setActiveIndex: (number: number) => void;
}

// TODO: Why this component? used once, harder to navigate template
export function MealCards({
  day,
  dailyEatings,
  activeIndex,
  setActiveIndex,
}: Props) {
  const isLoading = useIsLoading(DAILY_EATINGS_QUERY_KEY);

  return (
    <div className="mx-3 sm:mx-0">
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
            className="mb-4 min-h-[92px] rounded-xl bg-white p-4 shadow"
            selectedStyle={{
              width: "104%",
              marginLeft: "-2%",
            }}
          >
            {dailyEatings && (
              <>
                <Separator className="mt-2 mb-1" />
                <MealContent
                  dailyEatings={dailyEatings}
                  meal={meal as MealType}
                />
              </>
            )}
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
