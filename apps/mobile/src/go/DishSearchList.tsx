import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { DishSummary } from "@fatbook/api-client/go";
import { useAuth } from "../context/auth-context";
import { useGoApi } from "../context/go-api";
import { DishSearchResults } from "../components/DishSearchResults";

export function GoDishSearchList({
    scope,
    onSelect,
    excludedIds = [],
}: {
    scope: "mine" | "ingredients";
    onSelect: (dish: DishSummary) => void;
    excludedIds?: number[];
}) {
    const api = useGoApi();
    const { userId } = useAuth();
    const [query, setQuery] = useState("");
    const [search, setSearch] = useState("");
    useEffect(() => {
        const timeout = setTimeout(() => setSearch(query.trim()), 250);
        return () => clearTimeout(timeout);
    }, [query]);
    const result = useInfiniteQuery({
        queryKey: ["go", userId, "dishes", scope, search],
        queryFn: ({ pageParam }) => api.listDishes(scope, search, pageParam),
        initialPageParam: 1,
        getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
        retry: false,
    });
    return (
        <DishSearchResults
            dishes={
                result.data?.pages
                    .flatMap((page) => page.items)
                    .filter((dish) => !excludedIds.includes(dish.id)) ?? []
            }
            isLoading={result.isLoading}
            isFetching={result.isFetching}
            isError={result.isError}
            maxQueryLength={100}
            query={query}
            setQuery={setQuery}
            fetchNextPage={() => result.fetchNextPage()}
            hasNextPage={result.hasNextPage}
            onSelect={onSelect}
            onRetry={() => void result.refetch()}
        />
    );
}
