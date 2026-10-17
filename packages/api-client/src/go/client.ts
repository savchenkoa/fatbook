import type { components } from "./schema";

export type User = components["schemas"]["User"];
export type Session = components["schemas"]["Session"];
export type AuthState = components["schemas"]["AuthState"];
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

export function createAuthApi(
    baseUrl: string,
    getToken: () => string | null,
    onUnauthenticated: (token: string) => Promise<void>,
) {
    const base = baseUrl.replace(/\/$/, "");

    async function request<T>(
        route: string,
        method: "GET" | "POST",
        body?: Login,
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
                        route,
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
            if (response.status === 204) return undefined as T;
            return (await response.json()) as T;
        } finally {
            clearTimeout(timeout);
        }
    }

    return {
        login: (credentials: Login) =>
            request<Session>("/v1/auth/login", "POST", credentials),
        me: () => request<AuthState>("/v1/auth/me", "GET"),
        logout: () => request<void>("/v1/auth/logout", "POST"),
    };
}
