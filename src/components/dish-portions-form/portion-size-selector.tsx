import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "../ui/drawer";
import { Button } from "@/components/ui/button.tsx";
import { DishPortion } from "@/types/dish-portion.ts";
import { Input } from "@/components/ui/input.tsx";
import { LucidePlus, LucideTrash } from "lucide-react";
import { Label } from "@/components/ui/label.tsx";
import { ChangeEvent, KeyboardEvent, useEffect, useState } from "react";
import { DishTitle } from "@/components/ui/dish-title.tsx";

type Props = {
  open: boolean;
  onClose: () => void;
  dishPortion: DishPortion | null;
  isEditing?: boolean;
  onSubmit: (p: DishPortion) => void;
  onDelete?: (p: DishPortion) => void;
};

export function PortionSizeSelector({
  open,
  onClose,
  dishPortion,
  isEditing,
  onSubmit,
  onDelete,
}: Props) {
  const [portionSize, setPortionSize] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (dishPortion) {
      setPortionSize(
        dishPortion.portion ?? dishPortion.dish.defaultPortion ?? 100,
      );
    }
  }, [dishPortion]);

  if (!dishPortion) {
    return null;
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.value) {
      setPortionSize(Number(e.currentTarget.value));
    } else {
      setPortionSize(undefined);
    }
  };
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSubmitClick();
    }
  };
  const handleSubmitClick = () => {
    if (dishPortion) {
      onSubmit({ ...dishPortion, portion: Number(portionSize) });
      onClose();
    }
  };
  const handleDeleteClick = () => {
    onDelete?.(dishPortion);
    onClose();
  };

  return (
    <>
      <Drawer open={open} onClose={onClose}>
        <DrawerContent className="mx-auto max-w-lg">
          <DrawerHeader>
            <DrawerTitle className="mb-4">
              <div className="relative w-full text-center text-2xl">
                <DishTitle dish={dishPortion.dish} className="justify-center" />
                {isEditing && (
                  <Button
                    onClick={handleDeleteClick}
                    variant="ghost"
                    size="icon"
                    className="absolute top-1/2 right-0 translate-y-[-50%] text-red-500 hover:bg-red-100 hover:text-red-500"
                  >
                    <LucideTrash />
                  </Button>
                )}
              </div>
            </DrawerTitle>
            <DrawerDescription>
              <Label htmlFor="portion-size-input">Portion (g.)</Label>
              <Input
                autoFocus
                type="number"
                id="portion-size-input"
                placeholder="gramm"
                className="mt-2 px-6 py-10 text-center text-4xl sm:py-6 sm:text-2xl"
                value={portionSize === undefined ? "" : portionSize}
                onChange={handleInputChange}
                onFocus={(e) => e.target.select()}
                onKeyDown={handleKeyDown}
              />
              {/*<Slider*/}
              {/*  defaultValue={[portionSize ?? 100]}*/}
              {/*  onValueChange={(value) => setPortionSize(value[0])}*/}
              {/*  min={0}*/}
              {/*  max={300}*/}
              {/*  step={1}*/}
              {/*  className="mt-10 mb-5"*/}
              {/*/>*/}
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <Button onClick={handleSubmitClick} className="py-6">
              {!isEditing && <LucidePlus />} {isEditing ? "Save" : "Add"}
            </Button>
            <DrawerClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
