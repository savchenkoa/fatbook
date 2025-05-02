import { Outlet } from "react-router-dom";
import Navbar from "@/components/navbar.tsx";
import { useIsFetching } from "@tanstack/react-query";
import { clsx } from "clsx";
import { MobileBottomNav } from "@/components/MobileBottomNav.tsx";

function Root() {
  const fetchingCount = useIsFetching({ queryKey: ["dishes"] });
  const isLoading = fetchingCount > 0;

  return (
    <>
      <Navbar />
      <div
        className={clsx("mb-18 sm:mb-0", {
          loading: isLoading,
        })}
      >
        <Outlet />
      </div>
      <MobileBottomNav />
    </>
  );
}

export default Root;
