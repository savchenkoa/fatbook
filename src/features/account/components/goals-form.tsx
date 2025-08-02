import { useAuth } from "@/context/auth.tsx";
import { useEffect } from "react";
import { useEnhancedActionState } from "@/hooks/use-enhanced-action-state.ts";
import { saveSettingsAction } from "@/features/account/actions/save-settings-state.ts";
import { toast } from "sonner";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { Form } from "@/components/ui/form.tsx";

export function GoalsForm({ userSettings }) {
  const { userId } = useAuth();
  const [formState, formAction, isPending] = useEnhancedActionState(
    saveSettingsAction,
    {},
  );

  useEffect(() => {
    if (formState.success) {
      toast.success("Settings saved");
    }
  }, [formState.success, formState.updatedAt]);

  return (
    <Form action={formAction}>
      <input type="hidden" name="userId" value={userId} />
      <div className="mb-8 grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-3">
        {(["proteins", "fats", "carbs", "calories"] as const).map((field) => {
          const className = field === "calories" ? "sm:col-span-3" : "";

          return (
            <div key={field} className={className}>
              <label
                htmlFor="proteins-input"
                className="mb-2 inline-block text-sm font-medium capitalize select-none"
              >
                {field}
              </label>

              <Input
                id="proteins-input"
                type="number"
                name={field}
                placeholder={`Enter ${field}`}
                defaultValue={userSettings[field]}
              />
            </div>
          );
        })}
      </div>
      <Button className="w-full" type="submit" disabled={isPending}>
        <Spinner loading={isPending} /> Save
      </Button>
    </Form>
  );
}
