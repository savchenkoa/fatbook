import type { CreateRecipe, RecipeBody } from "./client";

export class RecipeSubmission {
    private fingerprint: string | null = null;
    private request: CreateRecipe | null = null;

    constructor(private readonly uuid: () => string) {}

    async save<T>(
        api: { createRecipe(request: CreateRecipe): Promise<T> },
        body: RecipeBody,
    ): Promise<T> {
        const normalized: RecipeBody = {
            name: body.name.trim(),
            icon: body.icon,
            defaultPortion: body.defaultPortion,
            cookedWeight: body.cookedWeight,
            ingredients: body.ingredients
                .map(({ dishId, portion }) => ({ dishId, portion }))
                .sort((a, b) => a.dishId - b.dishId),
        };
        const fingerprint = JSON.stringify(normalized);
        if (fingerprint !== this.fingerprint) {
            this.request = { ...normalized, clientRequestId: this.uuid() };
            this.fingerprint = fingerprint;
        }
        // Ключ и тело остаются после неизвестного результата HTTP. Следующую
        // новую операцию начинает новый RecipeSubmission вместе с черновиком.
        return api.createRecipe(this.request!);
    }
}
