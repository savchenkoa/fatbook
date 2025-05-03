import { useTheme } from "@/context/Theme";
import { FaMoon, FaSun } from "react-icons/fa";
import { Button } from "@/components/ui/button.tsx";

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <Button
      variant="link"
      className="text-accent hover:bg-gray-700"
      onClick={toggleTheme}
    >
      {theme === "light" ? <FaMoon /> : <FaSun />}
    </Button>
  );
}
