import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveSettings } from "@fatbook/api-client";
import type { UserSettings } from "@fatbook/shared";
import { useNavigation } from "@react-navigation/native";
import { AppText } from "../components/AppText";
import { useAuth } from "../context/auth";
import { useSettings } from "../hooks/use-settings";
import { supabase } from "../lib/supabase";

const FIELDS: { key: keyof UserSettings; label: string; icon: string }[] = [
    { key: "calories", label: "Калории, ккал", icon: "⚡" },
    { key: "proteins", label: "Белки, г", icon: "🥩" },
    { key: "fats", label: "Жиры, г", icon: "🧈" },
    { key: "carbs", label: "Углеводы, г", icon: "🍚" },
];

function toNumberOrZero(value: string): number {
    const trimmed = value.trim();
    if (!trimmed) {
        return 0;
    }
    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? 0 : parsed;
}

export function GoalsScreen() {
    const navigation = useNavigation();
    const { userId } = useAuth();
    const queryClient = useQueryClient();
    const { data: settings, isLoading } = useSettings();
    const [values, setValues] = useState<Record<keyof UserSettings, string>>({
        calories: "",
        proteins: "",
        fats: "",
        carbs: "",
    });

    useEffect(() => {
        if (settings) {
            setValues({
                calories: String(settings.calories),
                proteins: String(settings.proteins),
                fats: String(settings.fats),
                carbs: String(settings.carbs),
            });
        }
    }, [settings]);

    const saveMutation = useMutation({
        mutationFn: (newSettings: UserSettings) => saveSettings(supabase, userId, newSettings),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settings"] });
            navigation.goBack();
        },
    });

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <ActivityIndicator style={styles.loader} />
            </SafeAreaView>
        );
    }

    const handleSave = () => {
        saveMutation.mutate({
            calories: toNumberOrZero(values.calories),
            proteins: toNumberOrZero(values.proteins),
            fats: toNumberOrZero(values.fats),
            carbs: toNumberOrZero(values.carbs),
        });
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <AppText weight="medium" style={styles.title}>Цели КБЖУ</AppText>

                {FIELDS.map(({ key, label, icon }) => (
                    <View key={key} style={styles.field}>
                        <AppText style={styles.label}>{icon} {label}</AppText>
                        <TextInput
                            value={values[key]}
                            onChangeText={(text) => setValues((prev) => ({ ...prev, [key]: text }))}
                            placeholder="0"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            style={styles.input}
                        />
                    </View>
                ))}

                <TouchableOpacity
                    style={[styles.saveButton, saveMutation.isPending && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={saveMutation.isPending}
                >
                    <AppText weight="medium" style={styles.saveButtonText}>
                        {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
                    </AppText>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    loader: {
        marginTop: 32,
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 32,
    },
    title: {
        fontSize: 19,
        color: "#111827",
        marginBottom: 20,
    },
    field: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        color: "#6B7280",
        marginBottom: 6,
    },
    input: {
        fontSize: 15,
        color: "#111827",
        backgroundColor: "#F3F4F6",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    saveButton: {
        backgroundColor: "#4ADE80",
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 8,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        fontSize: 16,
        color: "#fff",
    },
});
