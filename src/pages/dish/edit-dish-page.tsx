import { Message } from "@/components/ui/Message";
import { FaInfoCircle, FaSave } from "react-icons/fa";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { SubmitHandler, useForm } from "react-hook-form";
import { useEffect } from "react";
import { Dish } from "@/types/dish";
import { dishesService } from "@/services/dishes-service";
import { isNil } from "@/utils/is-nil";
import { useCreateDish } from "@/hooks/use-create-dish";
import { useCopyDish } from "@/hooks/use-copy-dish";
import { formatDate } from "@/utils/date-utils";
import { Button } from "@/components/ui/button.tsx";
import { Box } from "@/components/ui/box.tsx";
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
import { EmojiPicker } from "@/components/ui/EmojiPicker.tsx";
import { getDishIcon } from "@/utils/icon-utils.ts";

function toForm(dish?: Dish): DishInputs {
  return {
    name: dish?.name ?? "",
    icon: dish?.icon ?? getDishIcon(dish),
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

export function EditDishPage() {
  const params = useParams();
  const navigate = useNavigate();
  const { dish, isDishShared, isLoading } = useOutletContext<{
    dish?: Dish;
    isDishShared: boolean;
    isLoading: boolean;
  }>();
  const { createDish } = useCreateDish();
  const { copyDish } = useCopyDish({ shouldNavigate: true });
  const form = useForm<DishInputs>({
    defaultValues: toForm(dish),
  });
  useEffect(() => {
    // When user made changes, we don't want to reset the form
    if (!dish || (form.getValues("name") !== "" && form.formState.isDirty)) {
      return;
    }
    form.reset(toForm(dish));
  }, [dish, form.formState.isDirty]);

  const hasIngredients = dish?.ingredients && dish.ingredients.length > 0;
  const inputsDisabled = hasIngredients || isDishShared;

  const onSubmit: SubmitHandler<DishInputs> = async (data) => {
    await dishesService.updateDish(+params.id!, data);

    navigate("/dishes");
  };
  const handleCancel = () => navigate("/dishes");
  const handleCopy = () => {
    if (dish) {
      copyDish.mutate(dish);
    }
  };
  const handleNameChange = ({ target }) => {
    // Update outlet context to save when navigate to ingredients
    dish!.name = target.value;
  };
  const handleIconChange = (icon: string) => {
    dish!.icon = icon;
  };
  const handleCreateDish = () => createDish.mutate();

  return (
    <Form {...form}>
      <form id="dish-form" onSubmit={form.handleSubmit(onSubmit)}>
        <Box>
          <div className="flex gap-2">
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <FormControl>
                    <EmojiPicker
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
            <div className="grow">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
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
            </div>
          </div>

          {hasIngredients && (
            <Message>
              <p className="flex items-center gap-2">
                <FaInfoCircle />
                Food Value is calculated from ingredients
              </p>
            </Message>
          )}

          {isDishShared && (
            <Message>
              <div className="flex items-center gap-2">
                <FaInfoCircle />
                <span>
                  This is a shared dish, it can not be modified. <br />
                  You can
                  <Button
                    variant="ghost"
                    className="p-0"
                    style={{ marginLeft: "0.3rem", lineHeight: "1.4rem" }}
                    onClick={handleCreateDish}
                  >
                    create
                  </Button>{" "}
                  your own dishes or{" "}
                  <Button
                    variant="ghost"
                    className="p-0"
                    style={{ lineHeight: "1.4rem" }}
                    onClick={handleCopy}
                  >
                    copy
                  </Button>{" "}
                  this one
                </span>
              </div>
            </Message>
          )}

          <div className="mt-4 flex gap-4">
            <FormField
              control={form.control}
              name="proteins"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proteins</FormLabel>
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
                  <FormLabel>Fats</FormLabel>
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
                  <FormLabel>Carbs</FormLabel>
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

          <div className="mt-4 flex gap-4">
            <FormField
              control={form.control}
              name="calories"
              render={({ field }) => (
                <FormItem className="grow">
                  <FormLabel>KCal</FormLabel>
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
              name="defaultPortion"
              render={({ field }) => (
                <FormItem className="grow">
                  <FormLabel>Portion Size</FormLabel>
                  <FormControl>
                    {isLoading ? (
                      <Skeleton className="h-[42px]" />
                    ) : (
                      <Input
                        type="number"
                        step="1"
                        placeholder="gramm"
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

          <div className="mt-4 flex flex-wrap items-center text-sm">
            <div className="mr-auto mb-0 flex gap-3">
              <div className="w-24">
                <strong>Created</strong>
                {isLoading ? (
                  <Skeleton className="h-5 w-full" />
                ) : (
                  <p>{formatDate(dish?.createdAt, "DD MMM YYYY")}</p>
                )}
              </div>
              <div className="w-24">
                <strong>Updated</strong>
                {isLoading ? (
                  <Skeleton className="h-5 w-full" />
                ) : (
                  <p>{formatDate(dish?.updatedAt, "DD MMM YYYY")}</p>
                )}
              </div>
            </div>
            <div className="ml-auto flex gap-3">
              <p className="control">
                <Button type="button" onClick={handleCancel}>
                  Cancel
                </Button>
              </p>
              {!isDishShared && (
                <p className="control">
                  <Button type="submit">
                    <FaSave /> Save
                  </Button>
                </p>
              )}
            </div>
          </div>
        </Box>
      </form>
    </Form>
  );
}

const format = (numb: number | null | undefined): number | undefined => {
  return isNil(numb) ? undefined : Math.round(numb);
};
