import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../context/auth";

export function LoginScreen() {
    const { signInWithEmailPassword } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) return;
        setLoading(true);
        const { error } = await signInWithEmailPassword(email, password);
        setLoading(false);
        if (error) {
            Alert.alert("Ошибка входа", error.message);
        }
    };

    // TODO: FAT-57 (фаза 2) — заменить заглушки на реальную интеграцию VK ID и Yandex ID
    const handleStubOAuth = () => {
        Alert.alert("Недоступно", "Войти через этот способ можно будет в следующей версии.");
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Fatbook</Text>

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

                <TouchableOpacity
                    style={[styles.button, styles.buttonPrimary, loading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonTextPrimary}>Войти</Text>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>или</Text>
                <View style={styles.dividerLine} />
            </View>

            {/* TODO: FAT-57 — VK ID и Yandex ID (фаза 2, RF-бэкенд) */}
            <TouchableOpacity
                style={[styles.button, styles.buttonOutline, styles.buttonDisabled]}
                onPress={handleStubOAuth}
            >
                <Text style={styles.buttonTextOutline}>Войти через VK ID</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, styles.buttonOutline, styles.buttonDisabled]}
                onPress={handleStubOAuth}
            >
                <Text style={styles.buttonTextOutline}>Войти через Yandex ID</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: "700",
        marginBottom: 40,
        color: "#1a1a1a",
    },
    form: {
        width: "100%",
        gap: 12,
    },
    input: {
        width: "100%",
        height: 48,
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 10,
        paddingHorizontal: 16,
        fontSize: 16,
        color: "#1a1a1a",
        backgroundColor: "#f9fafb",
    },
    button: {
        width: "100%",
        height: 48,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 4,
    },
    buttonPrimary: {
        backgroundColor: "#1a1a1a",
    },
    buttonOutline: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#d1d5db",
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonTextPrimary: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    buttonTextOutline: {
        color: "#1a1a1a",
        fontSize: 16,
        fontWeight: "500",
    },
    divider: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        marginVertical: 20,
        gap: 12,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: "#e5e7eb",
    },
    dividerText: {
        color: "#9ca3af",
        fontSize: 14,
    },
});
