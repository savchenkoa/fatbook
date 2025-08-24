import { useIsFetching } from "@tanstack/react-query";

export function useIsLoading(queryKey: string) {
    const fetchingCount = useIsFetching({ queryKey: [queryKey] });
    return fetchingCount > 0;
}
