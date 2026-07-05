import { Alert, Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { AppText } from "../components/AppText";
import { useAuth } from "../context/auth";
import type { AccountStackParamList } from "../navigation/types";

type NavProp = NativeStackNavigationProp<AccountStackParamList, "AccountHome">;

export function AccountScreen() {
    const navigation = useNavigation<NavProp>();
    const { user, signOut } = useAuth();

    if (!user) {
        return null;
    }

    const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
    const displayName = user.user_metadata?.name ? String(user.user_metadata.name).split(" ")[0] : user.email;
    const initial = displayName?.[0]?.toUpperCase() ?? "?";

    const handleLogout = () => {
        Alert.alert("Выход", "Вы уверены, что хотите выйти?", [
            { text: "Отмена", style: "cancel" },
            { text: "Выйти", style: "destructive", onPress: () => signOut() },
        ]);
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <View style={styles.header}>
                {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <AppText weight="medium" style={styles.avatarInitial}>{initial}</AppText>
                    </View>
                )}
                <View style={styles.headerText}>
                    <AppText weight="medium" style={styles.name}>Привет, {displayName}! 👋</AppText>
                    <AppText style={styles.email}>{user.email}</AppText>
                </View>
            </View>

            <View style={styles.menu}>
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate("Goals")}
                    activeOpacity={0.7}
                >
                    <Ionicons name="flag-outline" size={20} color="#6B7280" />
                    <AppText style={styles.menuItemText}>Цели КБЖУ</AppText>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                <AppText style={styles.logoutText}>Выход</AppText>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 24,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    avatarPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
    },
    avatarInitial: {
        fontSize: 22,
        color: "#374151",
    },
    headerText: {
        marginLeft: 16,
        flex: 1,
    },
    name: {
        fontSize: 17,
        color: "#111827",
        marginBottom: 2,
    },
    email: {
        fontSize: 13,
        color: "#6B7280",
    },
    menu: {
        marginHorizontal: 16,
        backgroundColor: "#F9FAFB",
        borderRadius: 16,
        overflow: "hidden",
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    menuItemText: {
        flex: 1,
        fontSize: 15,
        color: "#111827",
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginHorizontal: 16,
        marginTop: 24,
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    logoutText: {
        fontSize: 15,
        color: "#EF4444",
    },
});
