import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
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
        className={clsx({
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
