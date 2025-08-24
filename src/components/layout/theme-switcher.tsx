import { useTheme } from "@/context/theme.tsx";
import { Button } from "@/components/ui/button.tsx";
import { LucideMoon, LucideSun } from "lucide-react";

export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(theme === "light" ? "dark" : "light");
    };

    return (
        <Button variant="link" className="text-white hover:bg-gray-700" onClick={toggleTheme}>
            {theme === "light" ? <LucideMoon /> : <LucideSun />}
        </Button>
    );
}
