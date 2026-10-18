import { ApiError, createAuthApi, type AuthState, type Login } from "./client";

interface TokenStorage {
    get(): Promise<string | null>;
    set(token: string): Promise<void>;
    remove(): Promise<void>;
}

export class AuthSession {
    private token: string | null = null;
    private busy = false;
    readonly api;

    constructor(
        baseUrl: string,
        private readonly storage: TokenStorage,
        private readonly onChange: (state: AuthState | null) => Promise<void>,
    ) {
        this.api = createAuthApi(
            baseUrl,
            () => this.token,
            async (rejectedToken) => {
                // Ответ предыдущего аккаунта не должен сбрасывать новый вход.
                if (this.token === rejectedToken) await this.clear();
            },
        );
    }

    private async clear() {
        this.token = null;
        await this.onChange(null);
        await this.storage.remove();
    }

    private async run<T>(operation: () => Promise<T>): Promise<T> {
        if (this.busy) throw new Error("auth_busy");
        this.busy = true;
        try {
            return await operation();
        } finally {
            this.busy = false;
        }
    }

    restore() {
        return this.run(async () => {
            this.token = await this.storage.get();
            if (!this.token) {
                await this.onChange(null);
                return;
            }
            try {
                const state = await this.api.me();
                await this.onChange(state);
            } catch (error) {
                if (error instanceof ApiError && error.status === 401) return;
                throw error;
            }
        });
    }

    login(credentials: Login) {
        return this.run(async () => {
            const session = await this.api.login(credentials);
            await this.storage.set(session.token);
            this.token = session.token;
            await this.onChange({
                user: session.user,
                expiresAt: session.expiresAt,
            });
        });
    }

    logout() {
        return this.run(async () => {
            await this.api.logout();
            await this.clear();
        });
    }
}
