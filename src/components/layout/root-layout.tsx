import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/layout/navbar.tsx";
import { useIsFetching } from "@tanstack/react-query";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav.tsx";
import { cn } from "@/lib/utils.ts";
import { Toaster } from "@/components/ui/sonner.tsx";
import { DemoBanner } from "@/components/ui/demo-banner.tsx";

export function RootLayout() {
    const fetchingCount = useIsFetching({ queryKey: ["dishes"] });
    const isLoading = fetchingCount > 0;

    return (
        <>
            <DemoBanner />
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
                position="top-right"
                toastOptions={{
                    style: {
                        padding: "1.5rem",
                    },
                }}
            />
        </>
    );
}
