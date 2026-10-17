import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Button } from "../components/Button";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ListItem } from "../components/ListItem";
import { AppText } from "../components/AppText";
import { useAuth } from "../context/auth-context";
import { colors, spacing, radius, typography } from "../theme";
import type { AccountStackParamList } from "../navigation/types";

type NavProp = NativeStackNavigationProp<AccountStackParamList, "AccountHome">;

export function AccountScreen({ authOnly = false }: { authOnly?: boolean }) {
    const navigation = useNavigation<NavProp>();
    const { user, signOut } = useAuth();
    const [confirmLogout, setConfirmLogout] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [logoutError, setLogoutError] = useState<string | null>(null);

    if (!user) {
        return null;
    }

    const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
    const displayName = user.user_metadata?.name
        ? String(user.user_metadata.name).split(" ")[0]
        : user.email;
    const initial = displayName?.[0]?.toUpperCase() ?? "?";

    const handleLogout = async () => {
        setConfirmLogout(false);
        setLoggingOut(true);
        setLogoutError(null);
        try {
            await signOut();
        } catch {
            setLogoutError(
                "Не удалось выйти. Проверьте соединение и повторите попытку.",
            );
        } finally {
            setLoggingOut(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <View style={styles.header}>
                {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <AppText weight="medium" style={styles.avatarInitial}>
                            {initial}
                        </AppText>
                    </View>
                )}
                <View style={styles.headerText}>
                    <AppText weight="medium" style={styles.name}>
                        Привет, {displayName}! 👋
                    </AppText>
                    <AppText style={styles.email}>{user.email}</AppText>
                </View>
            </View>

            {!authOnly && (
                <View style={styles.menu}>
                    <ListItem
                        title="Цели КБЖУ"
                        onPress={() => navigation.navigate("Goals")}
                        leading={
                            <Ionicons
                                name="flag-outline"
                                size={spacing.xl}
                                color={colors.text.secondary}
                            />
                        }
                    />
                </View>
            )}
            <View style={styles.logout}>
                {logoutError && (
                    <AppText style={styles.logoutText}>{logoutError}</AppText>
                )}
                <Button
                    title="Выход"
                    variant="destructive"
                    loading={loggingOut}
                    onPress={() => setConfirmLogout(true)}
                    fullWidth
                />
            </View>
            <ConfirmDialog
                visible={confirmLogout}
                title="Выход"
                message="Вы уверены, что хотите выйти?"
                confirmLabel="Выйти"
                destructive
                onConfirm={() => void handleLogout()}
                onCancel={() => setConfirmLogout(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.surface.card,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing["2xl"],
    },
    avatar: {
        width: spacing["3xl"] + spacing["2xl"],
        height: spacing["3xl"] + spacing["2xl"],
        borderRadius: radius.full,
    },
    avatarPlaceholder: {
        width: spacing["3xl"] + spacing["2xl"],
        height: spacing["3xl"] + spacing["2xl"],
        borderRadius: radius.full,
        backgroundColor: colors.surface.subtle,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarInitial: {
        fontSize: typography.title.size,
        color: colors.text.strong,
    },
    headerText: {
        marginLeft: spacing.lg,
        flex: 1,
    },
    name: {
        fontSize: typography.subtitle.size,
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    email: {
        fontSize: typography.label.size,
        color: colors.text.secondary,
    },
    menu: { marginHorizontal: spacing.lg },
    logout: {
        marginHorizontal: spacing.lg,
        marginTop: spacing["2xl"],
        gap: spacing.md,
    },
    logoutText: { fontSize: typography.body.size, color: colors.destructive },
});
