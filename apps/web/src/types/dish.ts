import { Tables } from "@/types/supabase.types";

/* DB model - internal fields */
export type DishModel = Omit<Tables<"dishes">, "deleted" | "searchable"> & {
    ingredients?: Tables<"ingredients">[];
};
