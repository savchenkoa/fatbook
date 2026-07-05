import { StyleSheet, View, ViewStyle } from "react-native";
import { colors, spacing } from "../theme";
import { AppText } from "./AppText";

interface Props {
    proteins: number;
    fats: number;
    carbs: number;
    style?: ViewStyle;
}

const MACROS = [
    { key: "P", value: (p: Props) => p.proteins, color: colors.macro.protein },
    { key: "F", value: (p: Props) => p.fats, color: colors.macro.fat },
    { key: "C", value: (p: Props) => p.carbs, color: colors.macro.carbs },
] as const;

/**
 * The one compact P/F/C format for list rows, cards, and meal contents.
 * Figma layout (`P: 23 g`) with the letter tinted in its macro color so the
 * color code is present in lists, not just in rings/tiles.
 */
export function MacroRow({ style, ...values }: Props) {
    return (
        <View style={[styles.row, style]}>
            {MACROS.map((m) => (
                <View key={m.key} style={styles.item}>
                    <AppText weight="medium" style={[styles.letter, { color: m.color }]}>
                        {m.key}
                    </AppText>
                    <AppText style={styles.value}>
                        {Math.round(m.value(values))} g
                    </AppText>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        gap: spacing.md,
    },
    item: {
        flexDirection: "row",
        alignItems: "baseline",
        gap: 4,
    },
    letter: {
        fontSize: 12,
    },
    value: {
        fontSize: 12,
        color: colors.text.secondary,
    },
});
