import { useAuth } from "@/context/auth.tsx";
import { useEffect, useState } from "react";
import { useEnhancedActionState } from "@/hooks/use-enhanced-action-state.ts";
import { saveSettingsAction } from "@/features/account/actions/save-settings-state.ts";
import { toast } from "sonner";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";

export function GoalsForm({ userSettings }) {
  const { userId } = useAuth();
  const [localSettings, setLocalSettings] = useState(userSettings);
  const [formState, formAction, isPending] = useEnhancedActionState(
    saveSettingsAction,
    { settings: userSettings },
  );

  useEffect(() => {
    if (formState.success) {
      toast.success("Settings saved");
      setLocalSettings(formState.settings);
    }
  }, [formState.success, formState.updatedAt, formState.settings]);

  return (
    <form action={formAction}>
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
                value={localSettings[field]}
                onChange={(e) => {
                  setLocalSettings((settings) => ({
                    ...settings,
                    [field]: Number(e.target.value),
                  }));
                }}
              />
            </div>
          );
        })}
      </div>
      <Button className="w-full" type="submit" disabled={isPending}>
        <Spinner loading={isPending} /> Save
      </Button>
    </form>
  );
}

export function GoalsFormSkeleton() {
  return (
    <div>
      <div className="mb-8 grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-3">
        {(["proteins", "fats", "carbs", "calories"] as const).map((field) => (
          <div
            key={field}
            className={field === "calories" ? "sm:col-span-3" : ""}
          >
            <span className="mb-2 inline-block text-sm font-medium capitalize select-none">
              {field}
            </span>
            <Skeleton className={"h-[42px] w-full"} />
          </div>
        ))}
      </div>
      <Button disabled className="w-full">
        Save
      </Button>
    </div>
  );
}
