import { useState } from "react";
import Accordion, { AccordionItem } from "../../ui/Accordion";

import DishPortionListItem from "./DishPortionListItem";
import DishPortionTitle from "./DishPortionTitle";
import { isNil } from "@/utils/is-nil";
import { DishPortion } from "@/types/dish-portion";
import { clsx } from "clsx";
import DishListSkeleton from "@/components/ui/DishListSkeleton";
import { Separator } from "@/components/ui/separator.tsx";

interface Props {
  dishPortions?: DishPortion[];
  onAdd?: (p: DishPortion) => void;
  onUpdate: (p: DishPortion) => void;
  onDelete: (p: DishPortion) => void;
  isAdded: (p: DishPortion) => boolean;
  isLoading?: boolean;
  disabled?: boolean;
}

function DishPortionList({
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
      <>
        <Separator />
        <p className="has-text-centered mt-3">Nothing was found.</p>
      </>
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
      <Separator />

      <Accordion
        activeIndex={activeIndex}
        onTabChange={(e) => !disabled && setActiveIndex(e.index)}
      >
        {dishPortions.map((dishPortion, i) => (
          <AccordionItem
            key={dishPortion.dish.id + "-" + i}
            title={
              <DishPortionTitle disabled={disabled} dishPortion={dishPortion} />
            }
            className={clsx({
              "background-success-use-theme": dishPortion.selected,
            })}
            selectedClassName="background-info-use-theme"
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

export default DishPortionList;
