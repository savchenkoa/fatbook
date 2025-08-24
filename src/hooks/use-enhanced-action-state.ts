import { useActionState, useEffect } from "react";
import { toast } from "sonner";

export type FormState = {
    error?: string;
    success?: boolean;
    updatedAt?: number;
};

type UseActionStateArgs<T> = Parameters<typeof useActionState<T, FormData>>;
type UseActionStateResult<T> = ReturnType<typeof useActionState<T, FormData>>;

export function useEnhancedActionState<State extends FormState>(
    action: UseActionStateArgs<State>[0],
    initialState: UseActionStateArgs<State>[1],
): UseActionStateResult<State> {
    const [formState, formAction, isPending] = useActionState(action, initialState);

    useEffect(() => {
        if (formState.error) {
            toast.error(formState.error);
        }
    }, [formState.error, formState.updatedAt]);

    return [formState, formAction, isPending];
}
