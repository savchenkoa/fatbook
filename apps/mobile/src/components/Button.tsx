import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    TextStyle,
    View,
    ViewStyle,
} from "react-native";
import { colors, radius, spacing } from "../theme";
import { AppText } from "./AppText";

type Variant = "primary" | "secondary" | "destructive" | "ghost";
type Size = "lg" | "md" | "sm";

interface Props {
    title: string;
    onPress: () => void;
    /** No default — force an explicit choice (primary CTA vs destructive vs …). */
    variant: Variant;
    /** Default `md`. Use `lg` for full-width bottom-bar CTAs. */
    size?: Size;
    disabled?: boolean;
    loading?: boolean;
    /** Stretch to fill the parent width (bottom action bars). */
    fullWidth?: boolean;
    style?: ViewStyle;
}

const HEIGHT: Record<Size, number> = { lg: 48, md: 40, sm: 32 };
const FONT_SIZE: Record<Size, number> = { lg: 16, md: 15, sm: 13 };

const FILL: Record<Variant, string> = {
    primary: colors.brand,
    secondary: colors.surface.subtle,
    destructive: colors.destructive,
    ghost: "transparent",
};
const PRESSED_FILL: Record<Variant, string> = {
    primary: colors.brandPressed,
    secondary: colors.surface.track,
    destructive: colors.destructive,
    ghost: colors.surface.subtle,
};
const LABEL: Record<Variant, string> = {
    primary: colors.onBrand,
    secondary: colors.text.primary,
    destructive: colors.onDestructive,
    ghost: colors.brand,
};

export function Button({
    title,
    onPress,
    variant,
    size = "md",
    disabled,
    loading,
    fullWidth,
    style,
}: Props) {
    const isDisabled = disabled || loading;

    return (
        <Pressable
            onPress={onPress}
            disabled={isDisabled}
            style={({ pressed }) => [
                styles.base,
                { height: HEIGHT[size], backgroundColor: FILL[variant] },
                pressed && !isDisabled && { backgroundColor: PRESSED_FILL[variant] },
                fullWidth && styles.fullWidth,
                isDisabled && styles.disabled,
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={LABEL[variant]} />
            ) : (
                <View style={styles.content}>
                    <AppText
                        weight="medium"
                        style={[{ color: LABEL[variant], fontSize: FONT_SIZE[size] } as TextStyle]}
                    >
                        {title}
                    </AppText>
                </View>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    base: {
        borderRadius: radius.md,
        paddingHorizontal: spacing.lg,
        alignItems: "center",
        justifyContent: "center",
    },
    content: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    fullWidth: {
        alignSelf: "stretch",
    },
    disabled: {
        opacity: 0.5,
    },
});
