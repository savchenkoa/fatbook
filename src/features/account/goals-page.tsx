import { HeaderBox } from "@/components/ui/header-box.tsx";
import { AppLayout } from "@/components/layout/app-layout.tsx";
import { useSettings } from "@/hooks/use-settings.ts";
import { GoalsForm } from "./components/goals-form";
import { GoalsFormSkeleton } from "./components/goals-form-skeleton";

export function GoalsPage() {
  const { data, isLoading } = useSettings();

  return (
    <AppLayout>
      <HeaderBox title="Daily Intake Goals" backRoute="/account">
        {isLoading ? (
          <GoalsFormSkeleton />
        ) : (
          <GoalsForm userSettings={data ?? {}} />
        )}
      </HeaderBox>
    </AppLayout>
  );
}
