import type { ReactNode } from "react";
import { StyleSheet, TouchableOpacity, View, ViewStyle } from "react-native";
import { colors, elevation, radius, spacing } from "../theme";

/** Where the card sits in a stacked group — controls which corners are rounded. */
type Position = "single" | "first" | "middle" | "last";

interface Props {
    children: ReactNode;
    /** Default `single`. Stacked lists use first/middle/last for the 32/8 corner pattern. */
    position?: Position;
    /** Makes the whole card pressable. */
    onPress?: () => void;
    style?: ViewStyle;
}

const OUTER = radius.card;
const INNER = radius.control;

function cornerStyle(position: Position): ViewStyle {
    switch (position) {
        case "first":
            return {
                borderTopLeftRadius: OUTER,
                borderTopRightRadius: OUTER,
                borderBottomLeftRadius: INNER,
                borderBottomRightRadius: INNER,
            };
        case "last":
            return {
                borderTopLeftRadius: INNER,
                borderTopRightRadius: INNER,
                borderBottomLeftRadius: OUTER,
                borderBottomRightRadius: OUTER,
            };
        case "middle":
            return { borderRadius: INNER };
        default:
            return { borderRadius: OUTER };
    }
}

export function Card({ children, position = "single", onPress, style }: Props) {
    const combined = [styles.card, cornerStyle(position), style];

    if (onPress) {
        return (
            <TouchableOpacity style={combined} onPress={onPress} activeOpacity={0.7}>
                {children}
            </TouchableOpacity>
        );
    }

    return <View style={combined}>{children}</View>;
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface.card,
        padding: spacing.lg,
        ...elevation.card,
    },
});
