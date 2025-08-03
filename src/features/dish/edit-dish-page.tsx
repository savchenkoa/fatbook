import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchDish } from "@/services/dishes-service.ts";
import { AppLayout } from "@/components/layout/app-layout.tsx";
import { HeaderBox } from "@/components/ui/header-box.tsx";
import { useState } from "react";
import { DishDropdownActions } from "@/features/dish/components/dish-dropdown-actions.tsx";
import { EditDishForm } from "@/features/dish/components/edit-dish-form.tsx";
import { FormStatusIndicator } from "@/features/dish/components/form-status-indicator.tsx";
import invariant from "tiny-invariant";
import { EditDishFormSkeleton } from "@/features/dish/components/edit-dish-form-skeleton.tsx";
import { Ingredients } from "@/features/dish/components/ingredients.tsx";

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

  if (!isLoading && !dish) {
    navigate("/not-found");
    return null;
  }

  const backUrl = location.state?.backRoute
    ? location.state.backRoute
    : "/dishes";

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

      {!isLoading && dish && <Ingredients dish={dish} />}
    </AppLayout>
  );
}
