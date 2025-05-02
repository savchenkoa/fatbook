import { FaSave } from "react-icons/fa";
import { clsx } from "clsx";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/context/Auth";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useSettings } from "@/hooks/use-settings";
import { FoodValue } from "@/types/food-value";
import { settingsService } from "@/services/settings-service";
import About from "@/components/About";
import AppLayout from "@/components/AppLayout";
import Button from "@/components/ui/Button";
import Box from "@/components/ui/Box";
import FormField from "@/components/ui/FormField";
import GroupedFormField from "@/components/ui/GroupedFormField";

function SettingsPage() {
  const { userId } = useAuth();
  const { data, isLoading } = useSettings();
  const { register, handleSubmit } = useForm<FoodValue>({
    values: data,
    resetOptions: {
      keepDirtyValues: true,
    },
  });
  const saveMutation = useMutation({
    mutationFn: (values: FoodValue) =>
      settingsService.saveSettings(userId, values),
    onSuccess: () => {
      toast.success("Settings saved");
    },
    onError: (err) => {
      toast.error(`Saving is failed: ${err}`);
    },
  });
  const inputClasses = clsx("input", { "is-skeleton": isLoading });

  const onSubmit: SubmitHandler<FoodValue> = async (data) => {
    saveMutation.mutate(data);
  };

  return (
    <>
      <AppLayout>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={clsx({ loading: saveMutation.isPending })}
        >
          <Box>
            <div className="is-size-4 mb-4">My Daily Goals</div>
            <GroupedFormField>
              <FormField label="Proteins" className="mr-3">
                <input
                  {...register("proteins")}
                  className={inputClasses}
                  type="number"
                  placeholder="per 100g."
                />
              </FormField>
              <FormField label="Fats" className="mr-3">
                <input
                  {...register("fats")}
                  className={inputClasses}
                  type="number"
                  placeholder="per 100g."
                />
              </FormField>
              <FormField label="Carbs">
                <input
                  {...register("carbs")}
                  className={inputClasses}
                  type="number"
                  placeholder="per 100g."
                />
              </FormField>
            </GroupedFormField>

            <FormField label="KCal">
              <input
                {...register("calories")}
                className={inputClasses}
                type="number"
                placeholder="per 100g."
              />
            </FormField>

            <GroupedFormField align="right">
              <FormField className="mt-3">
                <Button
                  type="submit"
                  color="primary"
                  icon={<FaSave />}
                  loading={saveMutation.isPending}
                >
                  Save
                </Button>
              </FormField>
            </GroupedFormField>
          </Box>
        </form>
      </AppLayout>

      <About />
    </>
  );
}

export default SettingsPage;
