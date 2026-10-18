import { createContext, useContext, useState } from "react";
import type { DishPortion, MealType } from "@fatbook/shared";
import { EatingDrafts } from "../data/diary-state";
import { useData } from "./data";

const EatingDraftContext = createContext<{
    drafts: EatingDrafts;
    save(
        day: string,
        meal: MealType,
        portion: DishPortion,
    ): Promise<DishPortion>;
} | null>(null);

export function EatingDraftProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const data = useData();
    const [drafts] = useState(
        () => new EatingDrafts(() => globalThis.expo.uuidv4()),
    );
    const [, refresh] = useState(0);
    const save = async (day: string, meal: MealType, portion: DishPortion) => {
        const result = drafts.save(data, day, meal, portion);
        refresh((revision) => revision + 1);
        try {
            return await result;
        } finally {
            if (data.isCurrentSession()) refresh((revision) => revision + 1);
        }
    };
    return (
        <EatingDraftContext.Provider value={{ drafts, save }}>
            {children}
        </EatingDraftContext.Provider>
    );
}

export function useEatingDrafts() {
    const context = useContext(EatingDraftContext);
    if (!context) throw new Error("EatingDraftProvider is required");
    return context;
}
