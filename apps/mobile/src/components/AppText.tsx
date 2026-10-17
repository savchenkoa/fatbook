import { Text, TextProps } from "react-native";

import { fontFamily } from "../theme";

type Weight = keyof typeof fontFamily;

interface AppTextProps extends TextProps {
    weight?: Weight;
}

export function AppText({ style, weight = "regular", ...props }: AppTextProps) {
    return (
        <Text style={[{ fontFamily: fontFamily[weight] }, style]} {...props} />
    );
}
