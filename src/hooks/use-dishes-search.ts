import { useSearchParams } from "react-router-dom";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { dishesService, PAGE_SIZE } from "@/services/dishes-service";
import { isNil } from "@/utils/is-nil";
import { useAuth } from "@/context/Auth";

type RunSearchOptions = {
  replace?: boolean;
};

type Props = {
  filterDishId?: number;
  filterEmpty?: boolean;
};

export function useDishesSearch({ filterDishId, filterEmpty }: Props = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.has("q") ? searchParams.getAll("q")[0] : "";
  const { userCollectionId } = useAuth();

  const {
    fetchNextPage,
    hasNextPage,
    data: dishes,
    isLoading,
    isFetching,
    isError,
  } = useInfiniteQuery({
    queryKey: ["dishes", query, { filterEmpty }],
    queryFn: ({ pageParam }) =>
      dishesService.searchDishes({
        query,
        collectionId: userCollectionId,
        filterDishId,
        filterEmpty,
        page: pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.length < PAGE_SIZE ? null : lastPageParam + 1,
    // Skeleton is currently used. This is how to keep previous data:
    placeholderData: keepPreviousData,
  });

  const runSearch = (query: string, { replace }: RunSearchOptions = {}) => {
    const queryParams = new URLSearchParams();

    if (!isNil(query)) {
      queryParams.append("q", query);
    }

    setSearchParams(queryParams, { replace: replace ?? false });
  };

  return {
    dishes: dishes?.pages.flat() ?? [],
    isLoading,
    isFetching,
    isError,
    query,
    runSearch,
    fetchNextPage,
    hasNextPage,
  };
}
