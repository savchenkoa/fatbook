import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, spacing } from "../theme";
import { AppText } from "./AppText";
import { Card } from "./Card";
import { MacroRow } from "./MacroRow";

type Trailing = "chevron" | "plus" | "none";

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

interface Props {
    title: string;
    /** Secondary line, e.g. "150 kcal, 40 g". */
    subtitle?: string;
    /** P/F/C values — rendered via MacroRow. */
    macros?: { proteins: number; fats: number; carbs: number };
    /** Optional leading element (emoji string or a node). */
    leading?: ReactNode;
    /** Optional element rendered on the secondary line, before the subtitle (e.g. an ownership marker). */
    subtitleLeading?: ReactNode;
    /** Trailing affordance. `plus` = add/empty target, `chevron` = navigates. Ignored when `toggle` is set. */
    trailing?: Trailing;
    /** Independent add/remove affordance (e.g. dish picker quick-add) — its own tap target, separate from `onPress`. */
    toggle?: { selected: boolean; onToggle: () => void };
    onPress?: () => void;
    position?: "single" | "first" | "middle" | "last";
}

/**
 * Row for Dishes / ingredients / meal contents. Composes the shared MacroRow so
 * every list renders macros the same way. Trailing rule (app-wide): `plus` for
 * an empty/addable target, `chevron` for a row that has content and navigates,
 * `toggle` for a row with its own quick add/remove action.
 */
export function ListItem({
    title,
    subtitle,
    macros,
    leading,
    subtitleLeading,
    trailing = "chevron",
    toggle,
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
                    <AppText style={styles.title} numberOfLines={1}>
                        {title}
                    </AppText>
                    {(subtitle || macros || subtitleLeading) && (
                        <View style={styles.meta}>
                            {subtitle || subtitleLeading ? (
                                <View style={styles.subtitleRow}>
                                    {subtitleLeading}
                                    {subtitle ? (
                                        <AppText style={styles.subtitle}>{subtitle}</AppText>
                                    ) : null}
                                </View>
                            ) : (
                                <View />
                            )}
                            {macros && <MacroRow {...macros} />}
                        </View>
                    )}
                </View>

                {toggle ? (
                    <Pressable onPress={toggle.onToggle} hitSlop={HIT_SLOP} style={styles.toggle}>
                        <MaterialCommunityIcons
                            name={toggle.selected ? "check-circle" : "plus-circle-outline"}
                            size={26}
                            color={toggle.selected ? colors.brand : colors.text.muted}
                        />
                    </Pressable>
                ) : (
                    trailing !== "none" && (
                        <View style={styles.trailing}>
                            <MaterialCommunityIcons
                                name={trailing === "plus" ? "plus" : "chevron-right"}
                                size={20}
                                color={colors.text.secondary}
                            />
                        </View>
                    )
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
    subtitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
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
    toggle: {
        marginLeft: spacing.sm,
    },
});
