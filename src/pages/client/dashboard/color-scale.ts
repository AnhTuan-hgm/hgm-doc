/**
 * Tailwind-style shade scale (50–950) generated from one brand hex.
 *
 * The base color is pinned to its nearest lightness stop so the scale passes through the
 * client's EXACT hex — a generated palette whose "500" isn't the brand color would defeat
 * the point. Everything else keeps the base hue/saturation at fixed lightness targets.
 * No React, no storage: scales are derived on render from the saved brand colors.
 */

// ponytail: plain HSL lightness ramp; switch to OKLCH interpolation if tints drift muddy.

export const SCALE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

/** Lightness target per step, roughly matching Tailwind's own palettes. */
const LIGHTNESS = [0.97, 0.94, 0.86, 0.77, 0.66, 0.56, 0.48, 0.4, 0.33, 0.27, 0.14];

export const normHex = (hex: string): string | null => {
    const h = hex.trim().replace("#", "").toLowerCase();
    const full = /^[0-9a-f]{3}$/.test(h)
        ? h
              .split("")
              .map((c) => c + c)
              .join("")
        : h;
    return /^[0-9a-f]{6}$/.test(full) ? `#${full.toUpperCase()}` : null;
};

const hexToHsl = (hex: string): { h: number; s: number; l: number } | null => {
    const n = normHex(hex);
    if (!n) return null;
    const r = parseInt(n.slice(1, 3), 16) / 255;
    const g = parseInt(n.slice(3, 5), 16) / 255;
    const b = parseInt(n.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;
    if (d === 0) return { h: 0, s: 0, l };
    const s = d / (1 - Math.abs(2 * l - 1));
    const h = max === r ? 60 * (((g - b) / d + 6) % 6) : max === g ? 60 * ((b - r) / d + 2) : 60 * ((r - g) / d + 4);
    return { h, s, l };
};

const hslToHex = (h: number, s: number, l: number): string => {
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const to = (v: number) =>
        Math.round(v * 255)
            .toString(16)
            .padStart(2, "0");
    return `#${to(f(0))}${to(f(8))}${to(f(4))}`.toUpperCase();
};

/** `#RRGGBB` → 0–255 channels, or null for anything that isn't a hex colour. */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const n = normHex(hex);
    if (!n) return null;
    return { r: parseInt(n.slice(1, 3), 16), g: parseInt(n.slice(3, 5), 16), b: parseInt(n.slice(5, 7), 16) };
};

/** The `rgb(r g b)` form designers paste into Canva and CSS alike; null for junk. */
export const rgbString = (hex: string): string | null => {
    const c = hexToRgb(hex);
    return c ? `rgb(${c.r} ${c.g} ${c.b})` : null;
};

/* ── contrast (WCAG 2.x relative luminance) ─────────────────────────────── */

const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

const relativeLuminance = (hex: string): number | null => {
    const c = hexToRgb(hex);
    return c ? 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b) : null;
};

/** WCAG contrast ratio between two colours (1–21), or null if either isn't a colour. */
export const contrastRatio = (a: string, b: string): number | null => {
    const la = relativeLuminance(a);
    const lb = relativeLuminance(b);
    if (la === null || lb === null) return null;
    const [hi, lo] = la > lb ? [la, lb] : [lb, la];
    return (hi + 0.05) / (lo + 0.05);
};

/** The two text colours a swatch is judged against — the same white and near-black the
 *  logo tiles use, so "white text" here means the same white there. */
export const WHITE = "#FFFFFF";
export const INK = "#0C111D";

export type Readable = {
    /** The text colour that reads better on the swatch. */
    text: string;
    /** True when that colour is white — i.e. the swatch is a dark ground. */
    light: boolean;
    ratio: number;
};

/** Which of white / near-black text reads better on a colour, and by how much. */
export const readableTextOn = (hex: string): Readable | null => {
    const onWhite = contrastRatio(hex, WHITE);
    const onInk = contrastRatio(hex, INK);
    if (onWhite === null || onInk === null) return null;
    return onWhite >= onInk ? { text: WHITE, light: true, ratio: onWhite } : { text: INK, light: false, ratio: onInk };
};

/** WCAG grade for a body-text contrast ratio. "AA large" passes headings only. */
export const wcagLabel = (ratio: number): "AAA" | "AA" | "AA large" | "Low" => (ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : ratio >= 3 ? "AA large" : "Low");

/** HSL lightness 0–1 of a colour, or null. Used to pick a canvas for the preview. */
export const lightnessOf = (hex: string): number | null => hexToHsl(hex)?.l ?? null;

export type Shade = { step: number; hex: string };

/** The 11-step scale for one hex, or null when the hex isn't a valid color. */
export function makeShadeScale(hex: string): Shade[] | null {
    const norm = normHex(hex);
    const base = hexToHsl(hex);
    if (!norm || !base) return null;
    let nearest = 0;
    LIGHTNESS.forEach((l, i) => {
        if (Math.abs(l - base.l) < Math.abs(LIGHTNESS[nearest] - base.l)) nearest = i;
    });
    return SCALE_STEPS.map((step, i) => ({
        step,
        hex: i === nearest ? norm : hslToHex(base.h, base.s, LIGHTNESS[i]),
    }));
}
