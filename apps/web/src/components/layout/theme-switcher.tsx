import { useTheme } from "@/context/theme.tsx";
import { Button } from "@/components/ui/button.tsx";
import { LucideMoon, LucideSun } from "lucide-react";

export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(theme === "light" ? "dark" : "light");
    };

    const getIcon = () => {
        if (theme === "light" || theme === "system") return <LucideMoon />;
        return <LucideSun />;
    };

    return (
        <Button variant="link" className="text-white hover:bg-gray-700" onClick={toggleTheme}>
            {getIcon()}
        </Button>
    );
}
