import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";
const themes: Theme[] = ["light", "dark", "system"];
type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState<Theme>("system");

  const contextValue: ThemeContextType = {
    theme,
    setTheme: (theme: Theme) => {
      setTheme(theme);
      localStorage.setItem("fatbook_theme", theme);
      if (theme === "system") {
        document.querySelector("html")?.removeAttribute("data-theme");
      } else {
        document.querySelector("html")?.setAttribute("data-theme", theme);
      }
    },
  };

  useEffect(() => {
    const storedTheme = (localStorage.getItem("fatbook_theme") ??
      "system") as Theme;
    if (themes.includes(storedTheme)) {
      contextValue.setTheme(storedTheme);
    }
  }, []);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
