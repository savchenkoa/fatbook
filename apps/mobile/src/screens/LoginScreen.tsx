import { useState } from "react";
import { Alert, StyleSheet, TextInput, View } from "react-native";
import { useAuth } from "../context/auth-context";
import { AppText } from "../components/AppText";
import { Button } from "../components/Button";
import { colors, spacing, radius, typography } from "../theme";

export function LoginScreen({ showOAuth = true }: { showOAuth?: boolean }) {
    const { signInWithEmailPassword } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) return;
        setLoading(true);
        try {
            const { error } = await signInWithEmailPassword(email, password);
            if (error) Alert.alert("Ошибка входа", error.message);
        } catch {
            Alert.alert(
                "Ошибка входа",
                "Не удалось связаться с сервером. Повторите попытку.",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <AppText weight="bold" style={styles.title}>
                Fatbook
            </AppText>

            <View style={styles.form}>
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    editable={!loading}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Пароль"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoComplete="current-password"
                    editable={!loading}
                />

                <Button
                    title="Войти"
                    variant="primary"
                    size="lg"
                    fullWidth
                    onPress={handleLogin}
                    loading={loading}
                    disabled={!email || !password}
                />
            </View>
            {showOAuth && (
                <View style={styles.oauth}>
                    <AppText style={styles.muted}>или</AppText>
                    {(["VK ID", "Yandex ID"] as const).map((provider) => (
                        <Button
                            key={provider}
                            title={`Войти через ${provider}`}
                            variant="secondary"
                            fullWidth
                            onPress={() =>
                                Alert.alert(
                                    "Недоступно",
                                    "Войти через этот способ можно будет в следующей версии.",
                                )
                            }
                        />
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.surface.card,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: spacing["2xl"],
    },
    title: {
        fontSize: typography.title.size,
        marginBottom: spacing["3xl"],
        color: colors.text.primary,
    },
    form: { width: "100%", gap: spacing.md },
    oauth: {
        width: "100%",
        gap: spacing.md,
        marginTop: spacing.xl,
        alignItems: "center",
    },
    muted: { color: colors.text.muted },
    input: {
        width: "100%",
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.control,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        fontSize: typography.body.size,
        fontFamily: "Rubik_400Regular",
        color: colors.text.primary,
        backgroundColor: colors.surface.subtle,
    },
});
