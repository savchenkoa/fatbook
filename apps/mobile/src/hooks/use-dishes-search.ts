import { useEffect, useState } from "react";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "../context/auth-context";
import { useData } from "../context/data";

type Props = { filterDishId?: number; filterEmpty?: boolean; scope?: "mine" | "ingredients" };

export function useDishesSearch({ filterDishId, filterEmpty, scope = "mine" }: Props = {}) {
    const data = useData();
    const { userId } = useAuth();
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    useEffect(() => {
        const timeout = setTimeout(() => setDebouncedQuery(query), 400);
        return () => clearTimeout(timeout);
    }, [query]);
    const result = useInfiniteQuery({
        queryKey: ["dishes", userId, debouncedQuery, { filterEmpty, filterDishId, scope }],
        queryFn: ({ pageParam }) => data.searchDishes({ query: debouncedQuery, filterDishId, filterEmpty, page: pageParam, scope }),
        initialPageParam: 1,
        getNextPageParam: (lastPage, _pages, lastPageParam) => lastPage.hasMore ? lastPageParam + 1 : undefined,
        placeholderData: keepPreviousData,
        retry: false,
    });
    return { ...result, dishes: result.data?.pages.flatMap((page) => page.items) ?? [], query, setQuery };
}
