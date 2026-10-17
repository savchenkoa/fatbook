import { createContext, useContext, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { RecipeSubmission, type DishSummary } from "@fatbook/api-client/go";

type Draft = {
    name: string;
    icon: string;
    defaultPortion: number | null;
    cookedWeight: number | null;
    ingredients: { source: DishSummary; portion: number }[];
};
const emptyDraft: Draft = {
    name: "",
    icon: "",
    defaultPortion: null,
    cookedWeight: null,
    ingredients: [],
};
const makeSubmission = () =>
    new RecipeSubmission(() => globalThis.expo.uuidv4());
const RecipeContext = createContext<{
    draft: Draft;
    setDraft: Dispatch<SetStateAction<Draft>>;
    submission: RecipeSubmission;
    reset: () => void;
} | null>(null);

export function RecipeProvider({ children }: { children: React.ReactNode }) {
    const [draft, setDraft] = useState<Draft>(emptyDraft);
    const submission = useRef<RecipeSubmission | null>(null);
    if (!submission.current) submission.current = makeSubmission();
    const reset = () => {
        setDraft(emptyDraft);
        submission.current = makeSubmission();
    };
    return (
        <RecipeContext.Provider
            value={{ draft, setDraft, submission: submission.current, reset }}
        >
            {children}
        </RecipeContext.Provider>
    );
}
export function useRecipeDraft() {
    const context = useContext(RecipeContext);
    if (!context) throw new Error("RecipeProvider is required");
    return context;
}
