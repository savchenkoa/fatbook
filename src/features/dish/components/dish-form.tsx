import { Message } from "@/components/ui/message.tsx";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Dish } from "@/types/dish.ts";
import { createDish, updateDish } from "@/services/dishes-service.ts";
import { isNil } from "@/utils/is-nil.ts";
import { useCopyDish } from "@/hooks/use-copy-dish.ts";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form.tsx";
import { getDishIcon } from "@/utils/icon-utils.ts";
import { IconPicker } from "@/components/ui/icon-picker.tsx";
import { Ref, useEffect, useImperativeHandle } from "react";
import { FoodValue } from "@/components/ui/food-value.tsx";
import { Label } from "@/components/ui/label.tsx";
import { useAuth } from "@/context/auth.tsx";
import { PhotoCapture } from "@/components/ui/photo-capture.tsx";

function toForm(dish?: Dish | null): DishInputs {
  return {
    name: dish?.name ?? "",
    icon: getDishIcon(dish),
    defaultPortion: dish?.defaultPortion ?? undefined,
    cookedWeight: dish?.cookedWeight ?? undefined,
    calories: format(dish?.calories),
    proteins: format(dish?.proteins),
    fats: format(dish?.fats),
    carbs: format(dish?.carbs),
  };
}

export type DishInputs = {
  name: string;
  icon: string;
  proteins: number | undefined;
  fats: number | undefined;
  carbs: number | undefined;
  calories: number | undefined;
  defaultPortion: number | undefined;
  cookedWeight: number | undefined;
};

export type DishFormRef = {
  submitForm: () => Promise<Dish | null>;
};

type Props = {
  ref?: Ref<DishFormRef>;
  dish?: Dish | null;
  isDishShared: boolean;
  isLoading: boolean;
  hasIngredients?: boolean;
  isCreate?: boolean;
};

export function DishForm({
  ref,
  dish,
  isDishShared,
  isLoading,
  hasIngredients,
  isCreate = false,
}: Props) {
  const { userCollectionId } = useAuth();
  const params = useParams();
  const navigate = useNavigate();
  const { copyDish } = useCopyDish({ shouldNavigate: true });
  const form = useForm<DishInputs>({
    defaultValues: toForm(dish),
  });

  // Expose the submitForm method via ref
  useImperativeHandle(ref, () => ({
    submitForm: async () => {
      const isValid = await form.trigger();
      if (isValid) {
        const data = form.getValues();
        return await onSubmit(data);
      }
      return null;
    },
  }));

  useEffect(() => {
    // When user made changes, we don't want to reset the form
    if (!dish || (form.getValues("name") !== "" && form.formState.isDirty)) {
      return;
    }
    form.reset(toForm(dish));
  }, [dish, form.formState.isDirty]);

  const inputsDisabled = hasIngredients || isDishShared;

  const onSubmit = async (data: DishInputs) => {
    let resultDish: Dish | null;
    if (isCreate) {
      // Create a new dish with the form data
      resultDish = await createDish({
        ...data,
        collectionId: userCollectionId,
      });
    } else {
      // Update existing dish
      resultDish = await updateDish(+params.id!, data);
    }
    navigate(`/dishes`);
    return resultDish;
  };

  const handleCopy = () => {
    if (dish) {
      copyDish.mutate(dish);
    }
  };

  const handleNameChange = ({ target }) => {
    if (dish) {
      // Update outlet context to save when navigate to ingredients
      dish.name = target.value;
    }
  };

  const handleIconChange = (icon: string) => {
    if (dish) {
      dish.icon = icon;
    }
  };

  const handleCreateDish = () => navigate("/dishes/new");

  const handlePhotoAnalyzed = (nutritionData: {
    calories: number;
    proteins: number;
    fats: number;
    carbs: number;
  }) => {
    form.setValue("calories", nutritionData.calories);
    form.setValue("proteins", nutritionData.proteins);
    form.setValue("fats", nutritionData.fats);
    form.setValue("carbs", nutritionData.carbs);

    if (dish) {
      dish.calories = nutritionData.calories;
      dish.proteins = nutritionData.proteins;
      dish.fats = nutritionData.fats;
      dish.carbs = nutritionData.carbs;
    }
  };

  return (
    <Form {...form}>
      <form id="dish-form" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex justify-center">
          <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <IconPicker
                    isLoading={isLoading}
                    disabled={isDishShared}
                    {...field}
                    onChange={(e) => {
                      handleIconChange(e);
                      field.onChange(e);
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="basis-3/4">
                <FormLabel>Name</FormLabel>
                <FormControl>
                  {isLoading ? (
                    <Skeleton className="h-[42px]" />
                  ) : (
                    <Input
                      type="text"
                      disabled={isDishShared}
                      {...field}
                      onChange={(e) => {
                        handleNameChange(e);
                        field.onChange(e);
                      }}
                    />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="defaultPortion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Portion Size</FormLabel>
                <FormControl>
                  {isLoading ? (
                    <Skeleton className="h-[42px]" />
                  ) : (
                    <Input
                      type="number"
                      step="1"
                      placeholder="gramm"
                      {...field}
                    />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {hasIngredients && (
          <div className="mt-4">
            <Label className="mb-2">Food Value</Label>
            <FoodValue
              value={dish}
              className="text-accent-foreground text-md bg-accent/50 h-auto w-full justify-between rounded-md px-4 py-2 shadow-xs"
            />
          </div>
        )}

        {isDishShared && (
          <Message className="mt-4">
            <span>
              This is a shared dish, it can not be modified. <br />
              You can
              <Button
                variant="link"
                className="p-0 text-blue-500"
                style={{ marginLeft: "0.3rem", lineHeight: "1.4rem" }}
                onClick={handleCreateDish}
              >
                create
              </Button>{" "}
              your own dishes or{" "}
              <Button
                variant="link"
                className="p-0 text-blue-500"
                style={{ lineHeight: "1.4rem" }}
                onClick={handleCopy}
              >
                copy
              </Button>{" "}
              this one
            </span>
          </Message>
        )}

        {!hasIngredients && (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <FormField
              control={form.control}
              name="calories"
              render={({ field }) => (
                <FormItem className="grow">
                  <FormLabel>Calorie (kcal)</FormLabel>
                  <FormControl>
                    {isLoading ? (
                      <Skeleton className="h-[42px]" />
                    ) : (
                      <Input
                        type="number"
                        step="1"
                        placeholder="per 100g."
                        disabled={inputsDisabled}
                        {...field}
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="proteins"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Protein (g)</FormLabel>
                  <FormControl>
                    {isLoading ? (
                      <Skeleton className="h-[42px]" />
                    ) : (
                      <Input
                        type="number"
                        step="1"
                        placeholder="per 100g."
                        disabled={inputsDisabled}
                        {...field}
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fats"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fat (g)</FormLabel>
                  <FormControl>
                    {isLoading ? (
                      <Skeleton className="h-[42px]" />
                    ) : (
                      <Input
                        type="number"
                        step="1"
                        placeholder="per 100g."
                        disabled={inputsDisabled}
                        {...field}
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="carbs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Carbs (g)</FormLabel>
                  <FormControl>
                    {isLoading ? (
                      <Skeleton className="h-[42px]" />
                    ) : (
                      <Input
                        type="number"
                        step="1"
                        placeholder="per 100g."
                        disabled={inputsDisabled}
                        {...field}
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <div className="mt-8 grid grid-cols-2 gap-4">
          {!inputsDisabled && (
            <PhotoCapture onPhotoAnalyzed={handlePhotoAnalyzed} />
          )}

          {!isDishShared && (
            <Button type="submit" className="sm:w-auto sm:px-14">
              Save
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}

const format = (numb: number | null | undefined): number | undefined => {
  return isNil(numb) ? undefined : Math.round(numb);
};
