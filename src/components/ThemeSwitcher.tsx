import { useTheme } from "@/context/Theme";
import { FaMoon, FaSun } from "react-icons/fa";
import Button from "@/components/ui/Button";

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <Button
      color="dark"
      variant="rounded"
      icon={theme === "light" ? <FaMoon /> : <FaSun />}
      onClick={toggleTheme}
    />
  );
}
