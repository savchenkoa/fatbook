import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps, NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { fetchDish, createDish, copyDish } from "@fatbook/api-client";
import { AppText } from "../components/AppText";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/auth";
import { useDishMutations } from "../hooks/use-dish-mutations";
import { SHARED_COLLECTION_ID } from "../constants";

const MAX_NAME_LENGTH = 100;

// Registered both under HomeStack and DishesStack - typed against the minimal param list it needs.
type EditDishStackParamList = {
    EditDish: { dishId?: number } | undefined;
    DishDetail: { dishId: number };
};

type Props = NativeStackScreenProps<EditDishStackParamList, "EditDish">;
type NavProp = NativeStackNavigationProp<EditDishStackParamList, "EditDish">;

function toNumberOrNull(value: string): number | null {
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }
    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? null : parsed;
}

export function EditDishScreen({ route }: Props) {
    const dishId = route.params?.dishId;
    const isEditing = dishId != null;
    const navigation = useNavigation<NavProp>();
    const { userCollectionId } = useAuth();
    const { data: existingDish, isLoading } = useQuery({
        queryKey: ["dish", dishId],
        queryFn: () => fetchDish(supabase, dishId!),
        enabled: isEditing,
    });
    const { updateDish } = useDishMutations(dishId ?? 0);

    const [name, setName] = useState("");
    const [icon, setIcon] = useState("");
    const [defaultPortion, setDefaultPortion] = useState("");
    const [calories, setCalories] = useState("");
    const [proteins, setProteins] = useState("");
    const [fats, setFats] = useState("");
    const [carbs, setCarbs] = useState("");
    const [nameError, setNameError] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isCopying, setIsCopying] = useState(false);

    useEffect(() => {
        if (existingDish) {
            setName(existingDish.name);
            setIcon(existingDish.icon ?? "");
            setDefaultPortion(existingDish.defaultPortion != null ? String(existingDish.defaultPortion) : "");
            setCalories(existingDish.calories != null ? String(existingDish.calories) : "");
            setProteins(existingDish.proteins != null ? String(existingDish.proteins) : "");
            setFats(existingDish.fats != null ? String(existingDish.fats) : "");
            setCarbs(existingDish.carbs != null ? String(existingDish.carbs) : "");
        }
    }, [existingDish]);

    if (isEditing && isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <ActivityIndicator style={styles.loader} />
            </SafeAreaView>
        );
    }

    const isDishShared = existingDish?.collectionId === SHARED_COLLECTION_ID;

    const handleCopy = async () => {
        if (!existingDish) {
            return;
        }
        setIsCopying(true);
        const copy = await copyDish(supabase, existingDish, userCollectionId);
        setIsCopying(false);
        if (!copy) {
            Alert.alert("Ошибка", "Не удалось скопировать блюдо");
            return;
        }
        navigation.replace("DishDetail", { dishId: copy.id });
    };

    if (isDishShared) {
        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <View style={styles.content}>
                    <AppText style={styles.sharedText}>
                        Это общее блюдо, редактирование недоступно. Можно сделать копию в свою коллекцию.
                    </AppText>
                    <TouchableOpacity
                        style={[styles.saveButton, isCopying && styles.saveButtonDisabled]}
                        onPress={handleCopy}
                        disabled={isCopying}
                    >
                        <AppText weight="medium" style={styles.saveButtonText}>
                            {isCopying ? "Копирование..." : "Скопировать себе"}
                        </AppText>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const handleSave = async () => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            setNameError("Название обязательно");
            return;
        }
        if (trimmedName.length > MAX_NAME_LENGTH) {
            setNameError(`Название должно быть короче ${MAX_NAME_LENGTH} символов`);
            return;
        }
        setNameError("");

        const dishData = {
            name: trimmedName,
            icon: icon.trim() || null,
            collectionId: userCollectionId,
            defaultPortion: toNumberOrNull(defaultPortion),
            calories: toNumberOrNull(calories),
            proteins: toNumberOrNull(proteins),
            fats: toNumberOrNull(fats),
            carbs: toNumberOrNull(carbs),
        };

        setIsSaving(true);
        try {
            if (isEditing) {
                await updateDish.mutateAsync(dishData);
                navigation.goBack();
            } else {
                const newDish = await createDish(supabase, dishData);
                if (!newDish) {
                    Alert.alert("Ошибка", "Не удалось создать блюдо");
                    return;
                }
                navigation.replace("DishDetail", { dishId: newDish.id });
            }
        } catch {
            Alert.alert("Ошибка", "Не удалось сохранить изменения");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <AppText weight="medium" style={styles.title}>
                    {isEditing ? "Редактировать блюдо" : "Новое блюдо"}
                </AppText>

                <View style={styles.field}>
                    <AppText style={styles.label}>Иконка</AppText>
                    <TextInput
                        value={icon}
                        onChangeText={setIcon}
                        placeholder="🍽️"
                        style={styles.iconInput}
                        maxLength={4}
                    />
                </View>

                <View style={styles.field}>
                    <AppText style={styles.label}>Название</AppText>
                    <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="Название блюда"
                        placeholderTextColor="#9CA3AF"
                        style={styles.input}
                        maxLength={MAX_NAME_LENGTH}
                    />
                    {!!nameError && <AppText style={styles.errorText}>{nameError}</AppText>}
                </View>

                <View style={styles.field}>
                    <AppText style={styles.label}>Порция по умолчанию, г</AppText>
                    <TextInput
                        value={defaultPortion}
                        onChangeText={setDefaultPortion}
                        placeholder="100"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                        style={styles.input}
                    />
                </View>

                <AppText style={styles.label}>КБЖУ на 100 г</AppText>
                <View style={styles.macrosGrid}>
                    <View style={styles.macroField}>
                        <AppText style={styles.macroLabel}>⚡ ккал</AppText>
                        <TextInput
                            value={calories}
                            onChangeText={setCalories}
                            placeholder="0"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            style={styles.input}
                        />
                    </View>
                    <View style={styles.macroField}>
                        <AppText style={styles.macroLabel}>🥩 белки</AppText>
                        <TextInput
                            value={proteins}
                            onChangeText={setProteins}
                            placeholder="0"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            style={styles.input}
                        />
                    </View>
                    <View style={styles.macroField}>
                        <AppText style={styles.macroLabel}>🧈 жиры</AppText>
                        <TextInput
                            value={fats}
                            onChangeText={setFats}
                            placeholder="0"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            style={styles.input}
                        />
                    </View>
                    <View style={styles.macroField}>
                        <AppText style={styles.macroLabel}>🍚 углеводы</AppText>
                        <TextInput
                            value={carbs}
                            onChangeText={setCarbs}
                            placeholder="0"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            style={styles.input}
                        />
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    <AppText weight="medium" style={styles.saveButtonText}>
                        {isSaving ? "Сохранение..." : "Сохранить"}
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
    iconInput: {
        fontSize: 24,
        backgroundColor: "#F3F4F6",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 8,
        width: 64,
        textAlign: "center",
    },
    errorText: {
        fontSize: 12,
        color: "#EF4444",
        marginTop: 4,
    },
    macrosGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 24,
    },
    macroField: {
        width: "47%",
    },
    macroLabel: {
        fontSize: 13,
        color: "#6B7280",
        marginBottom: 6,
    },
    saveButton: {
        backgroundColor: "#4ADE80",
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: "center",
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        fontSize: 16,
        color: "#fff",
    },
    sharedText: {
        fontSize: 14,
        color: "#6B7280",
        marginBottom: 20,
        lineHeight: 20,
    },
});
