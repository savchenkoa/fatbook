import { LucideMonitor, LucideMoon, LucideSun } from "lucide-react";
import { useTheme } from "@/context/theme.tsx";

export function MobileThemeSwitcher() {
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        const themeOrder = ["light", "dark", "system"] as const;
        const currentIndex = themeOrder.indexOf(theme);
        const nextIndex = (currentIndex + 1) % themeOrder.length;
        setTheme(themeOrder[nextIndex]);
    };

    const getThemeIcon = () => {
        switch (theme) {
            case "light":
                return <LucideSun className="text-muted-foreground" />;
            case "dark":
                return <LucideMoon className="text-muted-foreground" />;
            case "system":
                return <LucideMonitor className="text-muted-foreground" />;
            default:
                return <LucideMonitor className="text-muted-foreground" />;
        }
    };

    const getThemeLabel = () => {
        switch (theme) {
            case "light":
                return "Light theme";
            case "dark":
                return "Dark theme";
            case "system":
                return "System theme";
            default:
                return "System theme";
        }
    };
    return (
        <button
            className="text-foreground hover:bg-accent active:bg-accent/80 flex gap-2 rounded-xl p-4 sm:hidden"
            onClick={toggleTheme}
        >
            {getThemeIcon()}
            <span>{getThemeLabel()}</span>
        </button>
    );
}
