import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchDish } from "@/services/dishes-service.ts";
import { isNil } from "@/utils/is-nil.ts";
import { AppLayout } from "@/components/layout/app-layout.tsx";
import { SHARED_COLLECTION_ID } from "@/constants.ts";
import { HeaderBox } from "@/components/ui/header-box.tsx";
import { Button } from "@/components/ui/button.tsx";
import { LucideChevronRight } from "lucide-react";
import { DishForm, DishFormRef } from "./components/dish-form.tsx";
import { IngredientsList } from "./components/ingredients-list.tsx";
import { cn } from "@/lib/utils.ts";
import { CookingDetails } from "./components/cooking-details.tsx";
import { useRef } from "react";
import { DishDropdownActions } from "@/features/dish/components/dish-dropdown-actions.tsx";
import { toast } from "sonner";

export function DishPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const dishFormRef = useRef<DishFormRef>(null);

  const isCreate = params.id === "new" || isNil(params.id);

  const { data: dish, isLoading } = useQuery({
    queryKey: ["dish", isCreate ? "new" : +params.id!],
    queryFn: () => (isCreate ? null : fetchDish(+params.id!)),
    enabled: !isCreate,
  });

  const isDishShared = dish?.collectionId === SHARED_COLLECTION_ID;
  const hasIngredients = dish?.ingredients && dish.ingredients.length > 0;

  if (!isLoading && !dish && !isCreate) {
    navigate("/not-found");
  }

  const backUrl = location.state?.backUrl ? location.state.backUrl : "/dishes";

  const handleAddIngredientClick = async () => {
    try {
      // Save the form first
      if (dishFormRef.current) {
        const resultDish = await dishFormRef.current.submitForm();
        if (resultDish) {
          // Navigate to add ingredients page only if form submission was successful
          navigate(`/dishes/${resultDish.id}/add-ingredients`);
        } else {
          toast.error("Error while creating or updating dish");
        }
      }
    } catch (error) {
      console.error("Error saving dish:", error);
    }
  };

  return (
    <AppLayout>
      <HeaderBox
        title={isCreate ? "New Dish" : "Edit Dish"}
        backRoute={backUrl}
        action={
          <div className="flex gap-4">
            {dish && <DishDropdownActions dish={dish} />}
          </div>
        }
      >
        <DishForm
          ref={dishFormRef}
          dish={dish}
          isDishShared={isDishShared}
          isLoading={isLoading}
          hasIngredients={hasIngredients}
          isCreate={isCreate}
        />
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
