import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LucideCopy, LucideEllipsisVertical, LucideTrash } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useCopyDish } from "@/hooks/use-copy-dish.ts";
import { useMutation } from "@tanstack/react-query";
import { deleteDish } from "@/services/dishes-service.ts";
import { isNil } from "@/utils/is-nil.ts";
import { SHARED_COLLECTION_ID } from "@/constants.ts";
import { Dish } from "@/types/dish.ts";
import { useNavigate, useParams } from "react-router-dom";
import { formatDate } from "@/utils/date-utils.ts";

type Props = {
  dish: Dish;
};

export function DishDropdownActions({ dish }: Props) {
  const params = useParams();
  const navigate = useNavigate();
  const { copyDish } = useCopyDish({ shouldNavigate: true });
  const deleteMutation = useMutation({ mutationFn: deleteDish });
  const isCreate = isNil(params.id);
  const isDishShared = dish?.collectionId === SHARED_COLLECTION_ID;
  const canDelete = !isCreate && !isDishShared;

  const handleDelete = () => {
    if (!window.confirm("Please confirm you want to delete this record.")) {
      return;
    }
    deleteMutation.mutate(dish!.id, {
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

  return (
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
          Created: <strong>{formatDate(dish?.createdAt, "DD MMM YYYY")}</strong>
        </DropdownMenuLabel>
        <DropdownMenuLabel className="ml-4 text-xs text-slate-500">
          Updated: <strong>{formatDate(dish?.updatedAt, "DD MMM YYYY")}</strong>
        </DropdownMenuLabel>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
