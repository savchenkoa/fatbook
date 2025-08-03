import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchDish } from "@/services/dishes-service.ts";
import { AppLayout } from "@/components/layout/app-layout.tsx";
import { SHARED_COLLECTION_ID } from "@/constants.ts";
import { HeaderBox } from "@/components/ui/header-box.tsx";
import { Button } from "@/components/ui/button.tsx";
import { LucideChevronRight } from "lucide-react";
import { IngredientsList } from "./components/ingredients-list.tsx";
import { cn } from "@/lib/utils.ts";
import { CookingDetails } from "./components/cooking-details.tsx";
import { useState } from "react";
import { DishDropdownActions } from "@/features/dish/components/dish-dropdown-actions.tsx";
import { EditDishForm } from "@/features/dish/components/edit-dish-form.tsx";
import { FormStatusIndicator } from "@/features/dish/components/form-status-indicator.tsx";
import invariant from "tiny-invariant";
import { EditDishFormSkeleton } from "@/features/dish/components/edit-dish-form-skeleton.tsx";

export function EditDishPage() {
  const params = useParams();
  invariant(params.id, "Error: dishId is required!");
  const dishId = +params.id;
  const location = useLocation();
  const navigate = useNavigate();
  const [formState, setFormState] = useState({
    isPending: false,
    success: false,
    error: "",
  });
  const { data: dish, isLoading } = useQuery({
    queryKey: ["dish", dishId],
    queryFn: () => fetchDish(dishId),
  });

  const isDishShared = dish?.collectionId === SHARED_COLLECTION_ID;
  const hasIngredients = dish?.ingredients && dish.ingredients.length > 0;

  if (!isLoading && !dish) {
    navigate("/not-found");
    return null;
  }

  const backUrl = location.state?.backRoute
    ? location.state.backRoute
    : "/dishes";

  const handleAddIngredientClick = async () => {
    navigate(`/dishes/${dish!.id}/add-ingredients`);
  };

  return (
    <AppLayout>
      <HeaderBox
        title={
          <span className="flex items-center gap-2">
            Edit Dish
            <FormStatusIndicator {...formState} />
          </span>
        }
        backRoute={backUrl}
        action={
          <div className="flex gap-4">
            {dish && <DishDropdownActions dish={dish} />}
          </div>
        }
      >
        {!isLoading && dish ? (
          <EditDishForm dish={dish} onFormStatusChange={setFormState} />
        ) : (
          <EditDishFormSkeleton />
        )}
      </HeaderBox>

      <div className="mx-4 sm:mx-6">
        <div className="mt-4 mb-2 flex items-baseline justify-between">
          <span className="text-xl">Ingredients</span>
        </div>

        <div className="mb-4 flex justify-between">
          {hasIngredients && (
            <CookingDetails
              dish={dish}
              disabled={isDishShared}
              buttonClassName="hover:bg-accent active:bg-accent/80 flex h-auto basis-[47%] items-center justify-between rounded-xl bg-white shadow"
            />
          )}
          <Button
            variant="ghost"
            onClick={handleAddIngredientClick}
            className={cn(
              "hover:bg-accent active:bg-accent/80 flex h-auto basis-[47%] items-center justify-between rounded-xl bg-white shadow",
              { "basis-[100%] p-4": !hasIngredients },
            )}
          >
            <span>Add{!hasIngredients && " ingredient"}</span>
            <LucideChevronRight />
          </Button>
        </div>

        {hasIngredients && (
          <IngredientsList dish={dish} isDishShared={isDishShared} />
        )}
      </div>
    </AppLayout>
  );
}
