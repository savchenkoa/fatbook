import { ActivityIndicator, StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./src/context/auth";
import { LoginScreen } from "./src/screens/LoginScreen";
import { DiaryScreen } from "./src/screens/DiaryScreen";
import { AddEatingScreen } from "./src/screens/AddEatingScreen";
import type { RootStackParamList } from "./src/navigation/types";

const queryClient = new QueryClient();
const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
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
        <Stack.Navigator>
            <Stack.Screen
                name="Diary"
                component={DiaryScreen}
                options={{ title: "Дневник" }}
            />
            <Stack.Screen
                name="AddEating"
                component={AddEatingScreen}
                options={{ title: "Добавить блюдо" }}
            />
        </Stack.Navigator>
    );
}

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <NavigationContainer>
                    <AppNavigator />
                </NavigationContainer>
            </AuthProvider>
        </QueryClientProvider>
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
