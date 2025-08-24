import { isNil } from "@/utils/is-nil.ts";

export const formatNumber = (n: number | null | undefined): number | undefined => {
    return isNil(n) ? undefined : Math.round(n);
};
