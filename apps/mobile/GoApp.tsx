import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
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
import type { GoDishesStackParamList } from "./src/go/navigation";
import { RecipeProvider } from "./src/go/recipe-context";
import { GoDishesListScreen } from "./src/go/DishesListScreen";
import { GoEditDishScreen } from "./src/go/EditDishScreen";
import { GoAddIngredientsScreen } from "./src/go/AddIngredientsScreen";
import { GoDishDetailScreen } from "./src/go/DishDetailScreen";

const queryClient = new QueryClient();
const Stack = createNativeStackNavigator<GoDishesStackParamList>();
const Tabs = createBottomTabNavigator<{
    Dishes: undefined;
    Account: undefined;
}>();
function DishesNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: colors.surface.screen },
            }}
        >
            <Stack.Screen
                name="DishesList"
                component={GoDishesListScreen}
                options={{ title: "Мои рецепты" }}
            />
            <Stack.Screen
                name="EditDish"
                component={GoEditDishScreen}
                options={{ title: "Новый рецепт" }}
            />
            <Stack.Screen
                name="AddIngredients"
                component={GoAddIngredientsScreen}
                options={{ title: "Ингредиенты" }}
            />
            <Stack.Screen
                name="DishDetail"
                component={GoDishDetailScreen}
                options={{ title: "Рецепт" }}
            />
        </Stack.Navigator>
    );
}
const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "";
const validUrl =
    /^https:\/\//.test(apiUrl) || (__DEV__ && /^http:\/\//.test(apiUrl));

function AuthNavigator() {
    const { userId, user } = useAuth();
    return (
        <NavigationContainer key={userId}>
            {user ? (
                <RecipeProvider key={userId}>
                    <Tabs.Navigator
                        screenOptions={{
                            headerShown: false,
                            tabBarActiveTintColor: colors.text.primary,
                        }}
                    >
                        <Tabs.Screen
                            name="Dishes"
                            component={DishesNavigator}
                            options={{ title: "Блюда" }}
                        />
                        <Tabs.Screen
                            name="Account"
                            options={{ title: "Аккаунт" }}
                        >
                            {() => <AccountScreen authOnly />}
                        </Tabs.Screen>
                    </Tabs.Navigator>
                </RecipeProvider>
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
