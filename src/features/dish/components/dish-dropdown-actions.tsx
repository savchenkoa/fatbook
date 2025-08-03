import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LucideCamera,
  LucideCopy,
  LucideEllipsisVertical,
  LucideTrash,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useCopyDish } from "@/hooks/use-copy-dish.ts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteDish, updateDish } from "@/services/dishes-service.ts";
import { isNil } from "@/utils/is-nil.ts";
import { SHARED_COLLECTION_ID } from "@/constants.ts";
import { Dish } from "@/types/dish.ts";
import { useNavigate, useParams } from "react-router-dom";
import { formatDate } from "@/utils/date-utils.ts";
import { PhotoCapture } from "@/components/ui/photo-capture.tsx";
import { useState } from "react";
import { FoodValue } from "@/types/food-value.ts";

type Props = {
  dish: Dish;
};

export function DishDropdownActions({ dish }: Props) {
  const params = useParams();
  const navigate = useNavigate();
  const { copyDish } = useCopyDish({ shouldNavigate: true });
  const deleteMutation = useMutation({ mutationFn: deleteDish });
  const queryClient = useQueryClient();
  const isCreate = isNil(params.id);
  const isDishShared = dish.collectionId === SHARED_COLLECTION_ID;
  const canDelete = !isCreate && !isDishShared;
  const [photoScannerOpened, setPhotoScannerOpened] = useState(false);
  const nutritionInfoFilled =
    dish.calories && dish.proteins && dish.fats && dish.carbs;

  const handleDelete = () => {
    if (!window.confirm("Please confirm you want to delete this record.")) {
      return;
    }
    deleteMutation.mutate(dish.id, {
      onSuccess: () => {
        navigate("/dishes");
      },
    });
  };
  const handleCopy = () => {
    if (dish) {
      copyDish.mutate(dish);
    }
  };
  const handlePhotoAnalyzed = async (scannedFoodValue: FoodValue) => {
    await updateDish(dish.id, scannedFoodValue);
    await queryClient.invalidateQueries({ queryKey: ["dish", dish.id] });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="rounded-full"
            size="icon"
            aria-label="actions"
          >
            <LucideEllipsisVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {nutritionInfoFilled && (
            <>
              <DropdownMenuItem onClick={() => setPhotoScannerOpened(true)}>
                <LucideCamera /> Scan Nutrition Label
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={handleCopy}>
            <LucideCopy /> Copy
          </DropdownMenuItem>
          {canDelete && (
            <DropdownMenuItem className="text-red-500!" onClick={handleDelete}>
              <LucideTrash className="stroke-red-400" /> Delete
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="ml-4 text-xs text-slate-500">
            Created:{" "}
            <strong>{formatDate(dish.createdAt, "DD MMM YYYY")}</strong>
          </DropdownMenuLabel>
          <DropdownMenuLabel className="ml-4 text-xs text-slate-500">
            Updated:{" "}
            <strong>{formatDate(dish.updatedAt, "DD MMM YYYY")}</strong>
          </DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>
      {nutritionInfoFilled && (
        <PhotoCapture
          hideTriggerButton
          isOpen={photoScannerOpened}
          setOpen={setPhotoScannerOpened}
          onPhotoAnalyzed={handlePhotoAnalyzed}
        />
      )}
    </>
  );
}
