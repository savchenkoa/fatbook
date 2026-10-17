import { registerRootComponent } from "expo";
import type { ComponentType } from "react";

// Разные entrypoint-модули: режим Go не инициализирует Supabase и его экраны.
const App = (
    process.env.EXPO_PUBLIC_BACKEND === "go"
        ? require("./GoApp")
        : require("./App")
) as { default: ComponentType };
registerRootComponent(App.default);
