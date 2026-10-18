import { StyleSheet, View } from "react-native";
import { useData } from "../context/data";
import { colors, spacing } from "../theme";
import { AppText } from "./AppText";

export function FeatureGate({
    feature,
    children,
}: {
    feature: "diary" | "insights";
    children: React.ReactNode;
}) {
    const data = useData();
    return data.features[feature] ? (
        children
    ) : (
        <View style={styles.screen}>
            <AppText>Этот раздел пока недоступен.</AppText>
        </View>
    );
}
const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.surface.screen,
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.lg,
    },
});
