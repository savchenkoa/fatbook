import { HeaderBox } from "@/components/ui/header-box.tsx";
import { AppLayout } from "@/components/app-layout.tsx";
import { useAuth } from "@/context/auth.tsx";
import { useSettings } from "@/hooks/use-settings.ts";
import { SubmitHandler, useForm } from "react-hook-form";
import { FoodValue } from "@/types/food-value.ts";
import { useMutation } from "@tanstack/react-query";
import { settingsService } from "@/services/settings-service.ts";
import { toast } from "react-toastify";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";

export function GoalsPage() {
  const { userId } = useAuth();
  const { data, isLoading } = useSettings();
  const form = useForm<FoodValue>({
    values: data,
    resetOptions: {
      keepDirtyValues: true,
    },
  });
  const saveMutation = useMutation({
    mutationFn: (values: FoodValue) =>
      settingsService.saveSettings(userId, values),
    onSuccess: () => {
      // TODO: shadcn toast bottom
      toast.success("Settings saved");
    },
    onError: (err) => {
      toast.error(`Saving is failed: ${err}`);
    },
  });

  const onSubmit: SubmitHandler<FoodValue> = async (data) => {
    saveMutation.mutate(data);
  };

  return (
    <AppLayout>
      <HeaderBox title="Daily Intake Goals" backRoute="/account">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="mb-8 grid grid-cols-1 gap-y-8 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="proteins"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-2">Proteins</FormLabel>
                    <FormControl>
                      {isLoading ? (
                        <Skeleton className="h-[42px]" />
                      ) : (
                        <Input
                          type="number"
                          placeholder="gram per day"
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
                    <FormLabel className="mb-2">Fats</FormLabel>
                    <FormControl>
                      {isLoading ? (
                        <Skeleton className="h-[42px]" />
                      ) : (
                        <Input
                          type="number"
                          placeholder="gram per day"
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
                    <FormLabel className="mb-2">Carbs</FormLabel>
                    <FormControl>
                      {isLoading ? (
                        <Skeleton className="h-[42px]" />
                      ) : (
                        <Input
                          type="number"
                          placeholder="gram per day"
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
                name="calories"
                render={({ field }) => (
                  <FormItem className="block sm:col-span-3">
                    <FormLabel className="mb-2">KCal</FormLabel>
                    <FormControl>
                      {isLoading ? (
                        <Skeleton className="h-[42px]" />
                      ) : (
                        <Input
                          type="number"
                          placeholder="kcal per day"
                          {...field}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              className="w-full"
              type="submit"
              disabled={saveMutation.isPending}
            >
              <Spinner loading={saveMutation.isPending} /> Save
            </Button>
          </form>
        </Form>
      </HeaderBox>
    </AppLayout>
  );
}
