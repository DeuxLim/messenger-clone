import { MdOutlineDarkMode, MdOutlineLightMode } from "react-icons/md";
import useTheme from "../../contexts/ui/useTheme";

export default function ThemeToggle({ className = "", compact = false }) {
    const { isDark, toggleTheme } = useTheme();

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className={`inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 ${className}`}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
            {isDark ? <MdOutlineLightMode className="text-lg" /> : <MdOutlineDarkMode className="text-lg" />}
            {!compact && <span>{isDark ? "Light" : "Dark"} mode</span>}
        </button>
    );
}
