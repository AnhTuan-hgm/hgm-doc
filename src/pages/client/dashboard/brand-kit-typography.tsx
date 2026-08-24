import { useEffect, useMemo, useState } from "react";

/** The comma-separated fonts field, as up-to-4 trimmed family names. */
const splitFamilies = (fonts: string) =>
    fonts
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean)
        .slice(0, 4);

/**
 * Load families from Google Fonts while mounted. A family Google doesn't host simply
 * falls back to sans-serif — no error state needed, since the preview's job is "show me
 * the typeface" and a fallback rendering is visibly not it. Injected <link> tags are
 * removed on unmount so leaving Brand Kit doesn't leave client fonts on other pages.
 */
const useGoogleFonts = (families: string[]) => {
    useEffect(() => {
        const links = families.map((f) => {
            const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@400;600&display=swap`;
            if (document.head.querySelector(`link[href="${href}"]`)) return null;
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = href;
            document.head.appendChild(link);
            return link;
        });
        return () => links.forEach((l) => l?.remove());
    }, [families]);
};

/** Live previews of the brand's typefaces, rendered in the actual fonts. */
export const FontPreviews = ({ fonts }: { fonts: string }) => {
    const families = useMemo(() => splitFamilies(fonts), [fonts]);
    useGoogleFonts(families);

    if (!families.length) return <p className="text-md text-quaternary italic">No fonts added yet.</p>;

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {families.map((f) => (
                <div key={f} className="rounded-2xl bg-primary p-5 ring-1 ring-secondary">
                    <p className="text-sm font-semibold text-primary">{f}</p>
                    <p className="mt-3 text-display-md font-medium text-primary" style={{ fontFamily: `"${f}", sans-serif` }}>
                        Aa Bb Cc
                    </p>
                    <p className="mt-2 truncate text-md text-tertiary" style={{ fontFamily: `"${f}", sans-serif` }}>
                        The quick brown fox jumps over the lazy dog
                    </p>
                    <p className="mt-1 truncate font-mono text-xs text-quaternary" style={{ fontFamily: `"${f}", sans-serif` }}>
                        ABCDEFGHIJKLM abcdefghijklm 0123456789
                    </p>
                </div>
            ))}
        </div>
    );
};

/**
 * The Untitled UI type scale, verbatim from src/styles/theme.css (spacing step = 4px):
 * Text xs→xl, Display xs→2xl, with each step's line-height and letter-spacing.
 * `min` is the mobile size — one display step down, the same `text-display-xs
 * md:text-display-sm` pattern the dashboard's own headings use; text sizes don't shrink.
 */
const TYPE_SCALE: { label: string; px: number; lh: number; ls?: number; min: number; display?: boolean }[] = [
    { label: "Display 2xl", px: 72, lh: 90, ls: -1.44, min: 60, display: true },
    { label: "Display xl", px: 60, lh: 72, ls: -1.2, min: 48, display: true },
    { label: "Display lg", px: 48, lh: 60, ls: -0.96, min: 36, display: true },
    { label: "Display md", px: 36, lh: 44, ls: -0.72, min: 30, display: true },
    { label: "Display sm", px: 30, lh: 38, min: 24, display: true },
    { label: "Display xs", px: 24, lh: 32, min: 20, display: true },
    { label: "Text xl", px: 20, lh: 30, min: 20 },
    { label: "Text lg", px: 18, lh: 28, min: 18 },
    { label: "Text md", px: 16, lh: 24, min: 16 },
    { label: "Text sm", px: 14, lh: 20, min: 14 },
    { label: "Text xs", px: 12, lh: 18, min: 12 },
];

/** Fluid size between a 360px and 1280px viewport; a step that doesn't shrink is just px. */
const clampFor = (min: number, max: number): string => {
    if (min === max) return `${max}px`;
    const slope = (max - min) / (1280 - 360);
    const intercept = min - slope * 360;
    return `clamp(${min}px, ${intercept.toFixed(2)}px + ${(slope * 100).toFixed(2)}vw, ${max}px)`;
};

/**
 * The scale rendered in the brand's own fonts — first family for display sizes, second
 * (when there is one) for text sizes. Each row shows px / line-height and the CSS
 * clamp() for fluid sizing; click the code to copy it.
 */
export const TypeScale = ({ fonts }: { fonts: string }) => {
    const families = useMemo(() => splitFamilies(fonts), [fonts]);
    const [copied, setCopied] = useState("");
    const copy = (label: string, value: string) => {
        void navigator.clipboard.writeText(value).then(() => {
            setCopied(label);
            setTimeout(() => setCopied(""), 1200);
        });
    };

    const heading = families[0] ? `"${families[0]}", sans-serif` : undefined;
    const body = families[1] ? `"${families[1]}", sans-serif` : heading;

    return (
        <div className="flex flex-col">
            {TYPE_SCALE.map((t) => {
                const clamp = clampFor(t.min, t.px);
                return (
                    <div key={t.label} className="flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-secondary py-4 last:border-b-0">
                        <div className="w-44 shrink-0">
                            <p className="text-sm font-semibold text-primary">{t.label}</p>
                            <p className="mt-0.5 text-xs text-quaternary tabular-nums">
                                {t.px}px / {t.lh}px{t.ls ? ` · ${t.ls}px` : ""}
                            </p>
                            <button
                                type="button"
                                title={`Copy ${clamp}`}
                                onClick={() => copy(t.label, clamp)}
                                className="mt-1 block max-w-full truncate font-mono text-[10px] text-tertiary transition duration-100 ease-linear hover:text-brand-secondary"
                            >
                                {copied === t.label ? "Copied!" : clamp}
                            </button>
                        </div>
                        <p
                            className="min-w-0 flex-1 truncate text-primary"
                            style={{
                                fontFamily: t.display ? heading : body,
                                fontSize: t.px,
                                lineHeight: `${t.lh}px`,
                                letterSpacing: t.ls ? `${t.ls}px` : undefined,
                                fontWeight: t.display ? 600 : 400,
                            }}
                        >
                            The quick brown fox
                        </p>
                    </div>
                );
            })}
        </div>
    );
};
