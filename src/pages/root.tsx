import { Outlet } from "react-router-dom";
import Navbar from "@/components/navbar.tsx";
import { useIsFetching } from "@tanstack/react-query";
import { clsx } from "clsx";
import { MobileBottomNav } from "@/components/mobile-bottom-nav.tsx";

export function Root() {
  const fetchingCount = useIsFetching({ queryKey: ["dishes"] });
  const isLoading = fetchingCount > 0;

  return (
    <>
      <Navbar />
      <div
        className={clsx("mb-18 pb-4 sm:mb-0 sm:py-4", {
          loading: isLoading,
        })}
      >
        <Outlet />
      </div>
      <MobileBottomNav />
    </>
  );
}
