import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/providers/theme-provider";

const SunIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
);

const MoonIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
);

const CheckIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 6 9 17l-5-5" />
    </svg>
);

type ThemeOption = "light" | "dark" | "system";

const OPTIONS: { value: ThemeOption; label: string }[] = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" },
];

export const ThemeToggle = () => {
    const { theme, setTheme } = useTheme();
    const [menuOpen, setMenuOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const isDark =
        theme === "dark" ||
        (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    const toggle = () => setTheme(isDark ? "light" : "dark");

    const setDefault = (value: ThemeOption) => {
        setTheme(value);
        setMenuOpen(false);
    };

    // Close the menu on outside click or Escape.
    useEffect(() => {
        if (!menuOpen) return;

        const handlePointer = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMenuOpen(false);
        };

        document.addEventListener("mousedown", handlePointer);
        document.addEventListener("keydown", handleKey);
        return () => {
            document.removeEventListener("mousedown", handlePointer);
            document.removeEventListener("keydown", handleKey);
        };
    }, [menuOpen]);

    return (
        <div ref={containerRef} className="fixed right-4 top-4 z-50">
            <button
                type="button"
                onClick={(e) => {
                    // Cmd/Ctrl + click opens the "set default" menu; a plain click toggles.
                    if (e.metaKey || e.ctrlKey) {
                        setMenuOpen((open) => !open);
                        return;
                    }
                    toggle();
                }}
                title={`${isDark ? "Switch to light mode" : "Switch to dark mode"} · ⌘-click to set default`}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex size-9 items-center justify-center rounded-full border border-secondary bg-primary text-secondary shadow-sm transition duration-100 ease-linear hover:bg-secondary hover:text-primary"
            >
                {isDark ? <SunIcon /> : <MoonIcon />}
            </button>

            {menuOpen && (
                <div
                    role="menu"
                    className="absolute right-0 top-11 min-w-44 overflow-hidden rounded-lg border border-secondary_alt bg-primary py-1 shadow-lg"
                >
                    <p className="px-3 pb-1 pt-1.5 text-xs font-medium text-quaternary">Default mode</p>
                    {OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            role="menuitemradio"
                            aria-checked={theme === option.value}
                            onClick={() => setDefault(option.value)}
                            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-secondary transition duration-100 ease-linear hover:bg-secondary hover:text-primary"
                        >
                            {option.label}
                            {theme === option.value && (
                                <span className="text-brand-secondary">
                                    <CheckIcon />
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
