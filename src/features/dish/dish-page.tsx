import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { dishesService } from "@/services/dishes-service.ts";
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

export function DishPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const dishFormRef = useRef<DishFormRef>(null);
  const { data: dish, isLoading } = useQuery({
    queryKey: ["dish", +params.id!],
    queryFn: () => dishesService.fetchDish(+params.id!),
  });
  const isCreate = isNil(params.id);
  const isDishShared = dish?.collectionId === SHARED_COLLECTION_ID;
  const hasIngredients = dish?.ingredients && dish.ingredients.length > 0;

  if (!isLoading && !dish) {
    navigate("/not-found");
  }

  const backUrl = location.state?.backUrl ? location.state.backUrl : "/dishes";

  const handleAddIngredientClick = async () => {
    try {
      // Save the form first
      if (dishFormRef.current) {
        const data = await dishFormRef.current.submitForm();
        if (data) {
          // Navigate to add ingredients page only if form submission was successful
          navigate("add-ingredients");
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
