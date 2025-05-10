import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { dishesService } from "@/services/dishes-service.ts";
import { isNil } from "@/utils/is-nil.ts";
import { AppLayout } from "@/components/layout/app-layout.tsx";
import { SHARED_COLLECTION_ID } from "@/constants.ts";
import { useCopyDish } from "@/hooks/use-copy-dish.ts";
import { HeaderBox } from "@/components/ui/header-box.tsx";
import { Button } from "@/components/ui/button.tsx";
import { LucideChevronRight, LucideCopy, LucideTrash } from "lucide-react";
import { DishForm, DishFormRef } from "./components/dish-form.tsx";
import { IngredientsList } from "./components/ingredients-list.tsx";
import { cn } from "@/lib/utils.ts";
import { CookingDetails } from "./components/cooking-details.tsx";
import { useRef } from "react";

export function DishPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const dishFormRef = useRef<DishFormRef>(null);
  const { data: dish, isLoading } = useQuery({
    queryKey: ["dish", +params.id!],
    queryFn: () => dishesService.fetchDish(+params.id!),
  });
  const { copyDish } = useCopyDish({ shouldNavigate: true });
  const deleteMutation = useMutation({ mutationFn: dishesService.deleteDish });
  const isCreate = isNil(params.id);
  const isDishShared = dish?.collectionId === SHARED_COLLECTION_ID;
  const hasIngredients = dish?.ingredients && dish.ingredients.length > 0;
  const canDelete = !isCreate && !isDishShared;

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
    <AppLayout>
      <HeaderBox
        title={isCreate ? "New Dish" : "Edit Dish"}
        backRoute={backUrl}
        action={
          <div className="flex gap-4">
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="text-accent-foreground rounded-full px-4 py-2"
              onClick={handleCopy}
            >
              <LucideCopy />
            </Button>

            {canDelete && (
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="rounded-full px-4 py-2"
                onClick={handleDelete}
              >
                <LucideTrash />
              </Button>
            )}
            {/*<Button*/}
            {/*  variant="ghost"*/}
            {/*  size="icon"*/}
            {/*  className="rounded-full"*/}
            {/*  onClick={() => alert("Copy, Delete menu")}*/}
            {/*>*/}
            {/*  <LucideEllipsisVertical />*/}
            {/*</Button>*/}
            {/*  TODO: */}
            {/*  <div className="mr-auto mb-0 flex gap-3">*/}
            {/*    <div className="w-24">*/}
            {/*      <strong>Created</strong>*/}
            {/*      {isLoading ? (*/}
            {/*        <Skeleton className="h-5 w-full" />*/}
            {/*      ) : (*/}
            {/*        <p>{formatDate(dish?.createdAt, "DD MMM YYYY")}</p>*/}
            {/*      )}*/}
            {/*    </div>*/}
            {/*    <div className="w-24">*/}
            {/*      <strong>Updated</strong>*/}
            {/*      {isLoading ? (*/}
            {/*        <Skeleton className="h-5 w-full" />*/}
            {/*      ) : (*/}
            {/*        <p>{formatDate(dish?.updatedAt, "DD MMM YYYY")}</p>*/}
            {/*      )}*/}
            {/*    </div>*/}
            {/*  </div>*/}
            {/*  <div className="ml-auto flex gap-3">*/}
            {/*    <p className="control">*/}
            {/*      <Button type="button" onClick={handleCancel}>*/}
            {/*        Cancel*/}
            {/*      </Button>*/}
            {/*    </p>*/}
            {/*    {!isDishShared && (*/}
            {/*      <p className="control">*/}
            {/*        <Button type="submit">*/}
            {/*          <FaSave /> Save*/}
            {/*        </Button>*/}
            {/*      </p>*/}
            {/*    )}*/}
            {/*  </div>*/}
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

        <div className="mb-4 flex justify-between gap-4">
          {hasIngredients && (
            <CookingDetails
              dish={dish}
              disabled={isDishShared}
              buttonClassName="hover:bg-accent active:bg-accent/80 flex h-auto grow items-center justify-between rounded-xl bg-white shadow"
            />
          )}
          <Button
            variant="ghost"
            onClick={handleAddIngredientClick}
            className={cn(
              "hover:bg-accent active:bg-accent/80 flex h-auto grow items-center justify-between rounded-xl bg-white shadow",
              { "p-4": !hasIngredients },
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
