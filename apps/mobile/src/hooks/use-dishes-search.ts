import { useEffect, useState } from "react";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { searchDishes, PAGE_SIZE } from "@fatbook/api-client";
import { useAuth } from "../context/auth";
import { supabase } from "../lib/supabase";

const DEBOUNCE_MS = 400;

type Props = {
    filterDishId?: number;
    filterEmpty?: boolean;
};

export function useDishesSearch({ filterDishId, filterEmpty }: Props = {}) {
    const { userCollectionId } = useAuth();
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");

    useEffect(() => {
        const timeout = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
        return () => clearTimeout(timeout);
    }, [query]);

    const {
        fetchNextPage,
        hasNextPage,
        data: dishes,
        isLoading,
        isFetching,
        isError,
    } = useInfiniteQuery({
        queryKey: ["dishes", debouncedQuery, { filterEmpty }],
        queryFn: ({ pageParam }) =>
            searchDishes(supabase, {
                query: debouncedQuery,
                collectionId: userCollectionId,
                filterDishId,
                filterEmpty,
                page: pageParam,
            }),
        initialPageParam: 1,
        getNextPageParam: (lastPage, _pages, lastPageParam) =>
            lastPage.length < PAGE_SIZE ? null : lastPageParam + 1,
        placeholderData: keepPreviousData,
    });

    return {
        dishes: dishes?.pages.flat() ?? [],
        isLoading,
        isFetching,
        isError,
        query,
        setQuery,
        fetchNextPage,
        hasNextPage,
    };
}
