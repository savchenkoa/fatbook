import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, spacing } from "../theme";
import { AppText } from "./AppText";
import { Card } from "./Card";
import { MacroRow } from "./MacroRow";

type Trailing = "chevron" | "plus" | "none";

interface Props {
    title: string;
    /** Secondary line, e.g. "150 kcal, 40 g". */
    subtitle?: string;
    /** P/F/C values — rendered via MacroRow. */
    macros?: { proteins: number; fats: number; carbs: number };
    /** Optional leading element (emoji string or a node). */
    leading?: ReactNode;
    /** Trailing affordance. `plus` = add/empty target, `chevron` = navigates. */
    trailing?: Trailing;
    onPress?: () => void;
    position?: "single" | "first" | "middle" | "last";
}

/**
 * Row for Dishes / ingredients / meal contents. Composes the shared MacroRow so
 * every list renders macros the same way. Trailing rule (app-wide): `plus` for
 * an empty/addable target, `chevron` for a row that has content and navigates.
 */
export function ListItem({
    title,
    subtitle,
    macros,
    leading,
    trailing = "chevron",
    onPress,
    position = "single",
}: Props) {
    return (
        <Card position={position} onPress={onPress} style={styles.card}>
            <View style={styles.row}>
                {leading != null && (
                    <View style={styles.leading}>
                        {typeof leading === "string" ? (
                            <AppText style={styles.leadingEmoji}>{leading}</AppText>
                        ) : (
                            leading
                        )}
                    </View>
                )}

                <View style={styles.body}>
                    <AppText weight="medium" style={styles.title} numberOfLines={1}>
                        {title}
                    </AppText>
                    {(subtitle || macros) && (
                        <View style={styles.meta}>
                            {subtitle ? (
                                <AppText style={styles.subtitle}>{subtitle}</AppText>
                            ) : (
                                <View />
                            )}
                            {macros && <MacroRow {...macros} />}
                        </View>
                    )}
                </View>

                {trailing !== "none" && (
                    <View style={styles.trailing}>
                        <MaterialCommunityIcons
                            name={trailing === "plus" ? "plus" : "chevron-right"}
                            size={20}
                            color={colors.text.secondary}
                        />
                    </View>
                )}
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        paddingVertical: spacing.xl,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
    },
    leading: {
        marginRight: spacing.md,
    },
    leadingEmoji: {
        fontSize: 24,
        width: 32,
        textAlign: "center",
    },
    body: {
        flex: 1,
        gap: 6,
    },
    title: {
        fontSize: 16,
        color: colors.text.primary,
    },
    meta: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    subtitle: {
        fontSize: 13,
        color: colors.text.secondary,
    },
    trailing: {
        width: 32,
        height: 32,
        borderRadius: radius.md,
        backgroundColor: colors.surface.subtle,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: spacing.sm,
    },
});
