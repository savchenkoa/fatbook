import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/navbar.tsx";
import { useIsFetching } from "@tanstack/react-query";
import { MobileBottomNav } from "@/components/mobile-bottom-nav.tsx";
import { cn } from "@/lib/utils.ts";
import { Toaster } from "@/components/ui/sonner.tsx";
import { useIsTouchDevice } from "@/hooks/use-is-touch-device.ts";

export function Root() {
  const isTouchDevice = useIsTouchDevice();
  const fetchingCount = useIsFetching({ queryKey: ["dishes"] });
  const isLoading = fetchingCount > 0;

  return (
    <>
      <Navbar />
      <div
        className={cn("mb-18 pb-4 sm:mb-0", {
          loading: isLoading,
        })}
      >
        <Outlet />
      </div>
      <MobileBottomNav />
      <Toaster
        closeButton
        richColors
        position={isTouchDevice ? "top-center" : "top-right"}
        toastOptions={{
          style: {
            padding: "1.5rem",
          },
        }}
      />
    </>
  );
}
