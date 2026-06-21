import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./src/context/auth";
import { LoginScreen } from "./src/screens/LoginScreen";
import { DiaryScreen } from "./src/screens/DiaryScreen";
import { MealDetailScreen } from "./src/screens/MealDetailScreen";
import { AddEatingScreen } from "./src/screens/AddEatingScreen";
import type { HomeStackParamList, TabParamList } from "./src/navigation/types";

const queryClient = new QueryClient();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function PlaceholderScreen({ name }: { name: string }) {
    return (
        <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>{name}</Text>
        </View>
    );
}

function HomeStackNavigator() {
    return (
        <HomeStack.Navigator screenOptions={{ headerShown: false }}>
            <HomeStack.Screen name="Diary" component={DiaryScreen} />
            <HomeStack.Screen
                name="MealDetail"
                component={MealDetailScreen}
                options={{ presentation: "modal" }}
            />
            <HomeStack.Screen name="AddEating" component={AddEatingScreen} />
        </HomeStack.Navigator>
    );
}

function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: "#4ADE80",
                tabBarInactiveTintColor: "#9CA3AF",
                tabBarStyle: styles.tabBar,
                tabBarIcon: ({ focused, color, size }) => {
                    const icons: Record<string, { active: string; inactive: string }> = {
                        Home: { active: "home", inactive: "home-outline" },
                        Dishes: { active: "restaurant", inactive: "restaurant-outline" },
                        Insights: { active: "stats-chart", inactive: "stats-chart-outline" },
                        Account: { active: "person", inactive: "person-outline" },
                    };
                    const icon = icons[route.name];
                    const name = (focused ? icon?.active : icon?.inactive) ?? "help";
                    return <Ionicons name={name as never} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Home" component={HomeStackNavigator} options={{ tabBarLabel: "Home" }} />
            <Tab.Screen
                name="Dishes"
                options={{ tabBarLabel: "Dishes" }}
            >
                {() => <PlaceholderScreen name="Dishes" />}
            </Tab.Screen>
            <Tab.Screen
                name="Insights"
                options={{ tabBarLabel: "Insights" }}
            >
                {() => <PlaceholderScreen name="Insights" />}
            </Tab.Screen>
            <Tab.Screen
                name="Account"
                options={{ tabBarLabel: "Account" }}
            >
                {() => <PlaceholderScreen name="Account" />}
            </Tab.Screen>
        </Tab.Navigator>
    );
}

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

    return <MainTabs />;
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
    tabBar: {
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
        height: 64,
        paddingBottom: 8,
    },
    placeholder: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F3F4F6",
    },
    placeholderText: {
        fontSize: 16,
        color: "#9CA3AF",
    },
});
