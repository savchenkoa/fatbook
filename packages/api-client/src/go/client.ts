import type { components } from "./schema";

export type User = components["schemas"]["User"];
export type Session = components["schemas"]["Session"];
export type AuthState = components["schemas"]["AuthState"];
export type Dish = components["schemas"]["Dish"];
export type DishSummary = components["schemas"]["DishSummary"];
export type DishPage = components["schemas"]["DishPage"];
export type CreateRecipe = components["schemas"]["CreateRecipe"];
export type RecipeBody = Omit<CreateRecipe, "clientRequestId">;
export type Login = components["schemas"]["Login"];
type ErrorResponse = components["schemas"]["Error"];

export class ApiError extends Error {
    constructor(
        readonly status: number,
        readonly code: string,
        readonly requestId: string,
        readonly retryAfter: string | null,
    ) {
        super(code);
    }
}

export function createApi(
    baseUrl: string,
    getToken: () => string | null,
    onUnauthenticated: (token: string) => Promise<void>,
) {
    const base = baseUrl.replace(/\/$/, "");

    async function request<T>(
        route: string,
        method: "GET" | "POST",
        body?: Login | CreateRecipe,
        routeTemplate = route,
    ): Promise<T> {
        const token = getToken();
        const started = Date.now();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10_000);
        try {
            const response = await fetch(base + route, {
                method,
                headers: {
                    ...(body ? { "Content-Type": "application/json" } : {}),
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                credentials: "omit",
                signal: controller.signal,
                ...(body ? { body: JSON.stringify(body) } : {}),
            });
            const requestId = response.headers.get("X-Request-ID") ?? "";
            const log = (errorCode?: string) =>
                console.info(
                    JSON.stringify({
                        route: routeTemplate,
                        status: response.status,
                        requestId,
                        durationMs: Date.now() - started,
                        ...(errorCode ? { errorCode } : {}),
                    }),
                );
            if (!response.ok) {
                if (
                    response.status === 401 &&
                    token &&
                    route !== "/v1/auth/login"
                ) {
                    await onUnauthenticated(token);
                }
                const error = (await response
                    .json()
                    .catch(() => null)) as ErrorResponse | null;
                const code = error?.error?.code ?? "service_unavailable";
                log(code);
                throw new ApiError(
                    response.status,
                    code,
                    requestId || error?.requestId || "",
                    response.headers.get("Retry-After"),
                );
            }
            log();
            const result: unknown =
                response.status === 204 ? undefined : await response.json();
            if (token !== getToken()) throw new Error("session_changed");
            return result as T;
        } finally {
            clearTimeout(timeout);
        }
    }

    return {
        // Проверяется непосредственно перед записью результата мутации в кеш.
        captureSession: () => {
            const token = getToken();
            return () => token !== null && token === getToken();
        },
        listDishes: (scope: "mine" | "ingredients", q = "", page = 1) =>
            request<DishPage>(
                `/v1/dishes?scope=${scope}&q=${encodeURIComponent(q)}&page=${page}`,
                "GET",
                undefined,
                "/v1/dishes",
            ),
        dish: (id: number) =>
            request<Dish>(
                `/v1/dishes/${id}`,
                "GET",
                undefined,
                "/v1/dishes/{id}",
            ),
        createRecipe: (body: CreateRecipe) =>
            request<Dish>("/v1/dishes", "POST", body),
        login: (credentials: Login) =>
            request<Session>("/v1/auth/login", "POST", credentials),
        me: () => request<AuthState>("/v1/auth/me", "GET"),
        logout: () => request<void>("/v1/auth/logout", "POST"),
    };
}

export { createApi as createAuthApi };
export type GoApi = ReturnType<typeof createApi>;
