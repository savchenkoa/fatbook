import { CookingDetails } from "@/features/dish/components/cooking-details.tsx";
import { Dish } from "@/types/dish";
import { SHARED_COLLECTION_ID } from "@/constants.ts";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { LucidePlus } from "lucide-react";
import { IngredientsList } from "@/features/dish/components/ingredients-list.tsx";
import { Box } from "@/components/ui/box.tsx";
import { Separator } from "@/components/ui/separator.tsx";

type Props = {
    dish: Dish;
};

export function Ingredients({ dish }: Props) {
    const navigate = useNavigate();
    const isDishShared = dish.collectionId === SHARED_COLLECTION_ID;
    const hasIngredients = dish.ingredients && dish.ingredients.length > 0;
    const handleAddIngredientClick = async () => {
        navigate(`/dishes/${dish.id}/add-ingredients`);
    };

    return (
        <Box className="mx-3 mt-4">
            <div className="flex items-center justify-between">
                <span className="text-xl">
                    Ingredients {hasIngredients ? `(${dish.ingredients.length})` : ""}
                </span>
                <div className="flex items-center gap-4">
                    {hasIngredients && (
                        <CookingDetails
                            dish={dish}
                            disabled={isDishShared}
                            buttonClassName="sm:size-10 size-12"
                        />
                    )}
                    <Button
                        variant="secondary"
                        size="icon"
                        onClick={handleAddIngredientClick}
                        className="size-12 sm:size-10"
                    >
                        <LucidePlus />
                    </Button>
                </div>
            </div>

            {hasIngredients && (
                <div className="mt-4">
                    <Separator className="mb-1" />
                    <IngredientsList dish={dish} isDishShared={isDishShared} />
                </div>
            )}
        </Box>
    );
}
