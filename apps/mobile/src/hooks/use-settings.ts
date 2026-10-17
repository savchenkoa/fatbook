import { useQuery } from "@tanstack/react-query";
import { useData } from "../context/data";
import { useAuth } from "../context/auth";

export function useSettings() {
    const { userId } = useAuth();
    const data = useData();
    return useQuery({
        queryKey: ["settings", userId],
        queryFn: () => data.fetchSettings(),
    });
}
