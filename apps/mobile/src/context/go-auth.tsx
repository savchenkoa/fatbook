import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import * as SecureStore from "expo-secure-store";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError, AuthSession, type AuthState } from "@fatbook/api-client/go";
import { AuthContext, type AuthContextValue } from "./auth-context";
import { AppText } from "../components/AppText";
import { Button } from "../components/Button";
import { colors, spacing } from "../theme";

const tokenKey = "fatbook.go.session";
const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? "";

function errorMessage(error: unknown) {
    if (error instanceof ApiError) {
        if (error.code === "invalid_credentials")
            return "Неверный email или пароль.";
        if (error.status === 429)
            return "Слишком много попыток. Попробуйте позже.";
        if (error.status === 401) return "Сессия истекла. Войдите снова.";
    }
    return "Не удалось связаться с сервером. Проверьте соединение и повторите попытку.";
}

export function GoAuthProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient();
    const [state, setState] = useState<AuthState | null>(null);
    const [loading, setLoading] = useState(true);
    const [restoreError, setRestoreError] = useState<string | null>(null);
    const session = useMemo(
        () =>
            new AuthSession(
                baseUrl,
                {
                    get: () => SecureStore.getItemAsync(tokenKey),
                    set: (token) =>
                        SecureStore.setItemAsync(tokenKey, token, {
                            keychainAccessible:
                                SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
                        }),
                    remove: () => SecureStore.deleteItemAsync(tokenKey),
                },
                async (next) => {
                    await queryClient.cancelQueries();
                    queryClient.clear();
                    setState(next);
                },
            ),
        [queryClient],
    );

    const restore = async () => {
        setLoading(true);
        setRestoreError(null);
        try {
            await session.restore();
        } catch (error) {
            setRestoreError(errorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void restore();
    }, [session]);

    const value: AuthContextValue = {
        user: state?.user ?? null,
        userId: state?.user.id ?? "guest",
        userCollectionId: null,
        loading,
        signInWithEmailPassword: async (email, password) => {
            try {
                await session.login({ email, password });
                return { error: null };
            } catch (error) {
                return { error: { message: errorMessage(error) } };
            }
        },
        signOut: () => session.logout(),
    };

    if (loading)
        return (
            <View style={styles.centered}>
                <ActivityIndicator color={colors.brand} />
            </View>
        );
    if (restoreError)
        return (
            <View style={styles.centered}>
                <AppText>{restoreError}</AppText>
                <Button
                    title="Повторить"
                    variant="primary"
                    onPress={() => void restore()}
                />
            </View>
        );
    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.lg,
        padding: spacing["2xl"],
        backgroundColor: colors.surface.screen,
    },
});
