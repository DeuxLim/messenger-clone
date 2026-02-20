import { useEffect, useMemo, useState } from "react";
import ThemeContext from "./ThemeContext";

const THEME_STORAGE_KEY = "ping-theme";

function getInitialTheme() {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    if (storedTheme === "light" || storedTheme === "dark") {
        return storedTheme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
}

export default function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        const isDark = theme === "dark";

        document.documentElement.classList.toggle("dark", isDark);
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [theme]);

    const api = useMemo(
        () => ({
            theme,
            isDark: theme === "dark",
            setTheme,
            toggleTheme: () => setTheme((prev) => (prev === "dark" ? "light" : "dark")),
        }),
        [theme],
    );

    return <ThemeContext.Provider value={api}>{children}</ThemeContext.Provider>;
}
