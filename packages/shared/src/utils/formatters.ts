import { isNil } from "./is-nil";

export const formatNumber = (n: number | null | undefined): number | undefined => {
    return isNil(n) ? undefined : Math.round(n);
};
