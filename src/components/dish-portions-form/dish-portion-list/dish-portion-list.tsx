import { useState } from "react";
import { Accordion, AccordionItem } from "../../ui/Accordion";

import { DishPortionListItem } from "./dish-portion-list-item.tsx";
import { DishPortionTitle } from "./dish-portion-title.tsx";
import { isNil } from "@/utils/is-nil";
import { DishPortion } from "@/types/dish-portion";
import { DishListSkeleton } from "@/components/ui/DishListSkeleton";
import { LuCircleSlash } from "react-icons/lu";
import { cn } from "@/lib/utils.ts";

interface Props {
  dishPortions?: DishPortion[];
  onAdd?: (p: DishPortion) => void;
  onUpdate: (p: DishPortion) => void;
  onDelete: (p: DishPortion) => void;
  isAdded: (p: DishPortion) => boolean;
  isLoading?: boolean;
  disabled?: boolean;
}

export function DishPortionList({
  dishPortions,
  onAdd,
  onUpdate,
  onDelete,
  isAdded,
  isLoading,
  disabled,
}: Props) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [prevItems, setPrevItems] = useState(dishPortions);

  if (isLoading) {
    return <DishListSkeleton />;
  }

  if (isNil(dishPortions) || dishPortions.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center gap-1">
        <LuCircleSlash className="text-xl text-slate-500" />
        <p className="text-sm">No food recorded</p>
      </div>
    );
  }

  // Reset selection after search
  if (dishPortions !== prevItems) {
    setPrevItems(dishPortions);
    setActiveIndex(-1);
  }

  const handleAdd = (portion: DishPortion) => {
    setActiveIndex(-1);
    if (onAdd) {
      onAdd(portion);
    }
  };

  const handleUpdate = (portion: DishPortion) => {
    setActiveIndex(-1);
    onUpdate(portion);
  };

  const handleDelete = (portion: DishPortion) => {
    setActiveIndex(-1);
    onDelete(portion);
  };

  return (
    <>
      <Accordion
        activeIndex={activeIndex}
        onTabChange={(e) => !disabled && setActiveIndex(e.index)}
      >
        {dishPortions.map((dishPortion, i) => (
          <AccordionItem
            key={dishPortion.dish.id + "-" + i}
            title={
              <DishPortionTitle
                disabled={disabled}
                dishPortion={dishPortion}
                isLast={i === dishPortions.length - 1}
              />
            }
            className={cn({
              "bg-green-100": dishPortion.selected,
            })}
            selectedClassName="bg-blue-100"
          >
            <DishPortionListItem
              focused={i === activeIndex}
              dishPortion={dishPortion}
              onAdd={handleAdd}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              isAdded={isAdded}
            />{" "}
          </AccordionItem>
        ))}
      </Accordion>
    </>
  );
}
