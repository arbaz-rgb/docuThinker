import { useTheme } from "../../context/ThemeContext.jsx";

const SunIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <path d="M20.5 14.8A8.5 8.5 0 0 1 9.2 3.5a7 7 0 1 0 11.3 11.3Z" />
  </svg>
);

const ThemeToggle = ({ className = "" }) => {
  const { isDark, toggleTheme } = useTheme();
  const nextTheme = isDark ? "light" : "dark";

  return (
    <button
      className={`theme-switch ${isDark ? "dark" : "light"} ${className}`.trim()}
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} mode`}
      aria-pressed={isDark}
      title={`Switch to ${nextTheme} mode`}
    >
      <span className="theme-switch-thumb" aria-hidden="true" />
      <span className={`theme-switch-option ${!isDark ? "active" : ""}`}>
        <SunIcon />
        <span className="sr-only">Light mode</span>
      </span>
      <span className={`theme-switch-option ${isDark ? "active" : ""}`}>
        <MoonIcon />
        <span className="sr-only">Dark mode</span>
      </span>
    </button>
  );
};

export default ThemeToggle;
