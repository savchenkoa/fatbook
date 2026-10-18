import type { CreateEating, EatingBody } from "./client";

export class EatingSubmission {
    private request: CreateEating | null = null;
    private fingerprint: string | null = null;

    constructor(private readonly uuid: () => string) {}

    async save<T>(
        api: { createEating(request: CreateEating): Promise<T> },
        body: EatingBody,
    ): Promise<T> {
        const normalized: EatingBody = {
            dishId: body.dishId,
            day: body.day,
            meal: body.meal,
            portion: body.portion,
        };
        const fingerprint = JSON.stringify(normalized);
        if (fingerprint !== this.fingerprint) {
            this.request = { ...normalized, clientRequestId: this.uuid() };
            this.fingerprint = fingerprint;
        }
        return api.createEating(this.request!);
    }
}
