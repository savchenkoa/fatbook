import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
    useFonts,
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_700Bold,
    Rubik_800ExtraBold,
} from "@expo-google-fonts/rubik";
import { GoAuthProvider } from "./src/context/go-auth";
import { useAuth } from "./src/context/auth-context";
import { LoginScreen } from "./src/screens/LoginScreen";
import { AccountScreen } from "./src/screens/AccountScreen";
import { AppText } from "./src/components/AppText";
import { colors, spacing } from "./src/theme";
import type { AccountStackParamList } from "./src/navigation/types";

const queryClient = new QueryClient();
const Stack = createNativeStackNavigator<AccountStackParamList>();
const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "";
const validUrl =
    /^https:\/\//.test(apiUrl) || (__DEV__ && /^http:\/\//.test(apiUrl));

function AuthNavigator() {
    const { userId, user } = useAuth();
    return (
        <NavigationContainer key={userId}>
            {user ? (
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="AccountHome">
                        {() => <AccountScreen authOnly />}
                    </Stack.Screen>
                </Stack.Navigator>
            ) : (
                <LoginScreen showOAuth={false} />
            )}
        </NavigationContainer>
    );
}

export default function GoApp() {
    const [fontsLoaded] = useFonts({
        Rubik_400Regular,
        Rubik_500Medium,
        Rubik_700Bold,
        Rubik_800ExtraBold,
    });
    if (!fontsLoaded)
        return (
            <View style={styles.centered}>
                <ActivityIndicator color={colors.brand} />
            </View>
        );
    if (!validUrl)
        return (
            <View style={styles.centered}>
                <AppText>
                    Укажите EXPO_PUBLIC_API_URL с адресом сервера. HTTP разрешён
                    только в режиме разработки.
                </AppText>
            </View>
        );
    return (
        <SafeAreaProvider>
            <QueryClientProvider client={queryClient}>
                <GoAuthProvider>
                    <AuthNavigator />
                </GoAuthProvider>
            </QueryClientProvider>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: spacing["2xl"],
        backgroundColor: colors.surface.screen,
    },
});
