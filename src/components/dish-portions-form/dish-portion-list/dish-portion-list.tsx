import { useState } from "react";
import { DishPortionTitle } from "./dish-portion-title.tsx";
import { isNil } from "@/utils/is-nil";
import { DishPortion } from "@/types/dish-portion";
import { DishListSkeleton } from "@/components/ui/dish-list-skeleton.tsx";
import { LuCircleSlash } from "react-icons/lu";
import { Separator } from "@/components/ui/separator.tsx";
import { PortionSizeSelector } from "@/components/dish-portions-form/portion-size-selector.tsx";

interface Props {
  dishPortions?: DishPortion[];
  onAdd?: (p: DishPortion) => void;
  onUpdate: (p: DishPortion) => void;
  onDelete: (p: DishPortion) => void;
  isAdded: (p: DishPortion | null) => boolean;
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
  const [prevItems, setPrevItems] = useState(dishPortions);
  const [selectedPortion, setSelectedPortion] = useState<DishPortion | null>(
    null,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isEditing = isAdded(selectedPortion);

  if (isLoading) {
    return <DishListSkeleton />;
  }

  // TODO: move to parent
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
  }

  const handlePortionClick = (portion: DishPortion) => {
    setSelectedPortion(portion);
    setDrawerOpen(true);
  };
  const handleDrawerClose = () => setDrawerOpen(false);

  return (
    <>
      {dishPortions.map((dishPortion, i) => (
        <>
          <DishPortionTitle
            disabled={disabled}
            dishPortion={dishPortion}
            isEditing={isEditing}
            onClick={() => handlePortionClick(dishPortion)}
          />
          {i !== dishPortions.length - 1 && <Separator className="my-1" />}
        </>
      ))}

      <PortionSizeSelector
        open={drawerOpen}
        isEditing={isEditing}
        dishPortion={selectedPortion}
        onClose={handleDrawerClose}
        onSubmit={isEditing ? onUpdate : (onAdd ?? function () {})}
        onDelete={onDelete}
      />
    </>
  );
}
