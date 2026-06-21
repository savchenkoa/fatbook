import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { AuthProvider, useAuth } from "./src/context/auth";
import { LoginScreen } from "./src/screens/LoginScreen";

function AppContent() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!user) {
        return <LoginScreen />;
    }

    return (
        <View style={styles.centered}>
            <Text>Fatbook — в разработке</Text>
        </View>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },
});
