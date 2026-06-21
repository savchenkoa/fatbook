import { useQuery } from "@tanstack/react-query";
import { fetchSettings } from "@/services/settings-service";
import { useAuth } from "@/context/auth.tsx";

export function useSettings() {
    const { userId } = useAuth();

    return useQuery({
        queryKey: ["settings"],
        queryFn: () => fetchSettings(userId),
    });
}
