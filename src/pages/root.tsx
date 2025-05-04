import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/navbar.tsx";
import { useIsFetching } from "@tanstack/react-query";
import { MobileBottomNav } from "@/components/mobile-bottom-nav.tsx";
import { cn } from "@/lib/utils.ts";

export function Root() {
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
    </>
  );
}
