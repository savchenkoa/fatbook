import Message from "@/components/ui/Message";
import { FaInfoCircle, FaSave } from "react-icons/fa";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { SubmitHandler, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { Dish } from "@/types/dish";
import { dishesService } from "@/services/dishes-service";
import { isNil } from "@/utils/is-nil";
import { getDishIcon } from "@/utils/icon-utils";
import { clsx } from "clsx";
import EmojiPicker from "@/components/ui/EmojiPicker";
import { useCreateDish } from "@/hooks/use-create-dish";
import { useCopyDish } from "@/hooks/use-copy-dish";
import { formatDate } from "@/utils/date-utils";
import Button from "@/components/ui/Button";
import Box from "@/components/ui/Box";
import FormField from "@/components/ui/FormField";
import GroupedFormField from "@/components/ui/GroupedFormField";
import { Level, LevelLeft } from "@/components/ui/Level";

export type DishInputs = {
  name: string | null;
  icon: string | null;
  proteins: number | null;
  fats: number | null;
  carbs: number | null;
  calories: number | null;
  defaultPortion: number | null;
  cookedWeight: number | null;
};

function EditDishPage() {
  const params = useParams();
  const navigate = useNavigate();
  const { dish, isDishShared, isLoading } = useOutletContext<{
    dish?: Dish;
    isDishShared: boolean;
    isLoading: boolean;
  }>();
  const { createDish } = useCreateDish();
  const { copyDish } = useCopyDish({ shouldNavigate: true });
  const { register, reset, handleSubmit, setValue, getValues, formState } =
    useForm<DishInputs>();
  const [icon, setIcon] = useState<string>("");
  useEffect(() => {
    // When user made changes, we don't want to reset the form
    if (!dish || (getValues("name") !== "" && formState.isDirty)) {
      return;
    }
    const icon = getDishIcon(dish);
    reset({
      name: dish.name,
      icon: dish.icon,
      defaultPortion: dish.defaultPortion,
      cookedWeight: dish.cookedWeight,
      calories: format(dish.calories),
      proteins: format(dish.proteins),
      fats: format(dish.fats),
      carbs: format(dish.carbs),
    });
    setIcon(icon);
  }, [dish, formState.isDirty]);

  const hasIngredients = dish?.ingredients && dish.ingredients.length > 0;
  const inputsDisabled = hasIngredients || isDishShared;

  const onSubmit: SubmitHandler<DishInputs> = async (data) => {
    await dishesService.updateDish(+params.id!, data);

    navigate("/dishes");
  };

  const onCancel = () => navigate("/dishes");

  const onCopy = () => {
    if (dish) {
      copyDish.mutate(dish);
    }
  };

  const handleNameChange = ({ target }) => {
    // Update outlet context to save when navigate to ingredients
    dish!.name = target.value;
  };

  const handleIconChange = (icon: string) => {
    setValue("icon", icon);
    setIcon(icon);
  };

  const onCreateClick = () => createDish.mutate();

  return (
    <form id="dish-form" onSubmit={handleSubmit(onSubmit)}>
      <Box>
        <GroupedFormField>
          <FormField label="Icon" className="mr-3">
            <EmojiPicker
              value={icon}
              onChange={handleIconChange}
              isLoading={isLoading}
              disabled={isDishShared}
            />
          </FormField>
          <FormField label="Name" className="is-flex-grow-1">
            <input
              className={clsx("input", { "is-skeleton": isLoading })}
              type="text"
              disabled={isDishShared}
              {...register("name", { onChange: handleNameChange })}
            />
          </FormField>
        </GroupedFormField>

        {hasIngredients && (
          <Message>
            <p className="is-flex is-align-items-center">
              <span className="icon is-medium">
                <FaInfoCircle />
              </span>
              Food Value is calculated from ingredients
            </p>
          </Message>
        )}

        {isDishShared && (
          <Message>
            <p className="is-flex is-align-items-center">
              <span className="icon is-medium">
                <FaInfoCircle />
              </span>
              <span>
                This is a shared dish, it can not be modified. <br />
                You can
                <Button
                  variant="ghost"
                  className="p-0"
                  style={{ marginLeft: "0.3rem", lineHeight: "1.4rem" }}
                  onClick={onCreateClick}
                >
                  create
                </Button>{" "}
                your own dishes or{" "}
                <Button
                  variant="ghost"
                  className="p-0"
                  style={{ lineHeight: "1.4rem" }}
                  onClick={onCopy}
                >
                  copy
                </Button>{" "}
                this one
              </span>
            </p>
          </Message>
        )}

        <GroupedFormField>
          <FormField label="Proteins" className="mr-3">
            <input
              className={clsx("input", { "is-skeleton": isLoading })}
              type="number"
              step=".01"
              placeholder="per 100g."
              disabled={inputsDisabled}
              {...register("proteins", {
                valueAsNumber: true,
              })}
            />
          </FormField>
          <FormField label="Fats" className="mr-3">
            <input
              className={clsx("input", { "is-skeleton": isLoading })}
              type="number"
              step=".01"
              placeholder="per 100g."
              disabled={inputsDisabled}
              {...register("fats", { valueAsNumber: true })}
            />
          </FormField>
          <FormField label="Carbs">
            <input
              className={clsx("input", { "is-skeleton": isLoading })}
              type="number"
              step=".01"
              placeholder="per 100g."
              disabled={inputsDisabled}
              {...register("carbs", { valueAsNumber: true })}
            />
          </FormField>
        </GroupedFormField>

        <GroupedFormField align="centered">
          <FormField label="KCal" className="mr-3">
            <input
              className={clsx("input", { "is-skeleton": isLoading })}
              type="number"
              step=".01"
              placeholder="per 100g."
              disabled={inputsDisabled}
              {...register("calories", { valueAsNumber: true })}
            />
          </FormField>
          <FormField label="Portion Size">
            <input
              className={clsx("input", { "is-skeleton": isLoading })}
              type="number"
              placeholder="gramms"
              disabled={isDishShared}
              {...register("defaultPortion", { valueAsNumber: true })}
            />
          </FormField>
        </GroupedFormField>

        <Level className="is-flex-wrap-wrap">
          <LevelLeft className="level is-mobile mr-auto mb-0">
            <div className="is-size-7 is-align-self-flex-end">
              <strong>Created</strong>
              <p className={clsx({ "is-skeleton": isLoading })}>
                {formatDate(dish?.createdAt, "DD MMM YYYY")}
              </p>
            </div>
            <div className="is-size-7 is-align-self-flex-end is-flex-grow-1">
              <strong>Updated</strong>
              <p className={clsx({ "is-skeleton": isLoading })}>
                {formatDate(dish?.updatedAt, "DD MMM YYYY")}
              </p>
            </div>
          </LevelLeft>
          <LevelLeft className="level is-mobile ml-auto">
            <p className="control">
              <Button type="button" onClick={onCancel}>
                Cancel
              </Button>
            </p>
            {!isDishShared && (
              <p className="control">
                <Button icon={<FaSave />} color="primary" type="submit">
                  Save
                </Button>
              </p>
            )}
          </LevelLeft>
        </Level>
      </Box>
    </form>
  );
}

const format = (numb: number | null): number | null => {
  return isNil(numb) ? null : Math.round(numb);
};

export default EditDishPage;
