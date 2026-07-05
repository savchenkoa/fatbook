import { Text, TextProps } from "react-native";

type Weight = "regular" | "medium" | "bold" | "extrabold";

const FONT_FAMILY: Record<Weight, string> = {
    regular: "Rubik_400Regular",
    medium: "Rubik_500Medium",
    bold: "Rubik_700Bold",
    extrabold: "Rubik_800ExtraBold",
};

interface AppTextProps extends TextProps {
    weight?: Weight;
}

export function AppText({ style, weight = "regular", ...props }: AppTextProps) {
    return <Text style={[{ fontFamily: FONT_FAMILY[weight] }, style]} {...props} />;
}
