import { ASSET_CAP, NOT_CONFIGURED, PAGE_CAP, assertPublicUrl, asText, callerEmail, grab, isTeamEmail, readAuthEnv } from "../lib/client-sources.mts";

/**
 * Reads a client's own website and returns a first-draft Brand Kit — palette, fonts and
 * logo files — for the account manager to review.
 *
 * Deliberately NOT a model call, unlike generate-overview. A brand kit's value is that the
 * hexes are exactly the client's; a model asked to "find the brand colours" will happily
 * return a plausible navy that appears nowhere in their CSS, and a wrong-but-believable hex
 * gets copied into emails and a website and is very hard to walk back. Everything here is
 * lifted verbatim out of the page's own markup and stylesheets, so a bad result is visibly
 * bad (junk colours) rather than quietly wrong.
 *
 * Like generate-overview it RETURNS the draft rather than writing it — the dashboard merges
 * it into unsaved state so the AM sees it before anything is saved.
 *
 * This function fetches a URL a person typed, from inside our own network, which is the
 * textbook SSRF shape. The assertPublicUrl guard it imports is not optional: without it
 * "http://169.254.169.254/" turns this endpoint into a reader for the cloud metadata
 * service. That guard and the capped fetcher live in netlify/lib/client-sources.mts so this
 * function and the Master Document drafter cannot drift apart on them.
 */

const MAX_COLORS = 6;

/* ── colours ────────────────────────────────────────────────────────────── */

const norm = (hex: string) => {
    const h = hex.replace("#", "").toLowerCase();
    const full =
        h.length === 3
            ? h
                  .split("")
                  .map((c) => c + c)
                  .join("")
            : h.slice(0, 6);
    return `#${full.toUpperCase()}`;
};
const rgbToHex = (r: number, g: number, b: number) =>
    "#" +
    [r, g, b]
        .map((n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase();

/**
 * Rank colours by how much the stylesheet leans on them.
 *
 * Custom properties come first and count double: a site builder that exposes
 * `--brand-primary` has already told us which colours are the brand, which no frequency
 * count can match. Everything else is ranked by raw occurrences.
 */
function extractColors(css: string): { name: string; hex: string }[] {
    const score = new Map<string, number>();
    const named = new Map<string, string>();
    const bump = (hex: string, by: number) => score.set(hex, (score.get(hex) ?? 0) + by);

    // --brand-primary: #214254   /  --accent: rgb(20 40 60)
    const varRe = /--([a-z0-9-]*(?:brand|primary|secondary|accent|theme|colou?r)[a-z0-9-]*)\s*:\s*(#[0-9a-f]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))/gi;
    for (const m of css.matchAll(varRe)) {
        // WordPress/Elementor emit a fixed default palette as --wp--preset--color--vivid-red
        // and friends. They match every keyword above and, scored as brand colours, buried
        // the theme's actual palette under eight stock swatches on every WP site tested.
        if (/preset|wp--|elementor-global/i.test(m[1])) continue;
        const hex = m[2].startsWith("#") ? norm(m[2]) : fromColorFn(m[2]);
        if (!hex) continue;
        bump(hex, 8);
        if (!named.has(hex)) named.set(hex, prettyVarName(m[1]));
    }
    for (const m of css.matchAll(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi)) bump(norm(m[0]), 1);
    for (const m of css.matchAll(/rgba?\([^)]{5,40}\)|hsla?\([^)]{5,40}\)/gi)) {
        const hex = fromColorFn(m[0]);
        if (hex) bump(hex, 1);
    }

    const ROLES = ["Primary", "Secondary", "Accent", "Neutral", "Primary 2", "Accent 2"];
    return (
        [...score.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, MAX_COLORS)
            .map(([hex], i) => ({ name: named.get(hex) ?? ROLES[i] ?? `Colour ${i + 1}`, hex }))
            // Two swatches both labelled "Secondary" reads as a bug; number the repeats.
            .map((c, i, all) => {
                const before = all.slice(0, i).filter((x) => x.name === c.name).length;
                return before ? { ...c, name: `${c.name} ${before + 1}` } : c;
            })
    );
}

/** rgb()/rgba()/hsl()/hsla() -> hex. Returns null for anything else (e.g. oklch(), which
 *  would need the OKLab->sRGB matrix and isn't worth it for a draft palette). */
function fromColorFn(s: string): string | null {
    const n = s.match(/-?[\d.]+/g);
    if (!n || n.length < 3) return null;
    const [a, b, c] = n.map(Number);
    if (/^hsl/i.test(s)) return hslToHex(a, b, c);
    return rgbToHex(a, b, c);
}

function hslToHex(h: number, s: number, l: number): string {
    const sn = s / 100;
    const ln = l / 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = sn * Math.min(ln, 1 - ln);
    const f = (n: number) => ln - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return rgbToHex(Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255));
}

const prettyVarName = (v: string) => {
    const t = v
        .replace(/^-+/, "")
        .replace(/(colou?r|theme)-?/gi, "")
        .replace(/[-_]+/g, " ")
        .trim();
    return t ? t.replace(/\b\w/g, (c) => c.toUpperCase()) : "Brand";
};

/* ── fonts ──────────────────────────────────────────────────────────────── */

const GENERIC =
    /^(inherit|initial|unset|revert|sans-serif|serif|monospace|cursive|fantasy|system-ui|ui-\w+|-apple-system|blinkmacsystemfont|segoe ui|roboto|helvetica( neue)?|arial|apple color emoji|segoe ui emoji|noto color emoji|emoji|math|fangsong)$/i;

/**
 * Only the fonts the site actually LOADS — Google Fonts links and @font-face families.
 *
 * Scanning `font-family:` declarations was the first approach and it was worse than
 * nothing: a declaration is a fallback chain, so it returned "Oxygen-Sans, Ubuntu,
 * Cantarell" (WordPress's stock chain) and "Segoe UI Symbol, Noto Color Emoji" as if they
 * were the brand's typefaces. A loaded font is one the designer chose on purpose.
 */
function extractFonts(html: string, css: string): string {
    const out: string[] = [];
    const push = (f: string) => {
        // "var(--wp--preset--font-family--arvo) !important" is a reference, not a typeface —
        // it was going straight into the Fonts field verbatim.
        const t = f
            .replace(/!important/gi, "")
            .trim()
            .replace(/^["']|["']$/g, "");
        // Reject HTML entities ("Inter &#8211" came out of a page title), generated
        // fallback faces, and player/widget fonts that aren't the brand's.
        if (!t || t.includes("var(") || /["'()]/.test(t) || /&#|&[a-z]+;/i.test(t)) return;
        if (/\b(fallback|videojs|icons?|glyph)\b/i.test(t) || t.length > 40 || GENERIC.test(t)) return;
        if (!out.some((o) => o.toLowerCase() === t.toLowerCase())) out.push(t);
    };

    for (const m of html.matchAll(/fonts\.googleapis\.com\/css2?\?([^"'\s>]+)/gi)) {
        for (const fam of m[1].matchAll(/family=([^&:]+)/gi)) push(decodeURIComponent(fam[1]).replace(/\+/g, " "));
    }
    for (const m of css.matchAll(/@font-face\s*\{[^}]*?font-family\s*:\s*([^;}]+)/gi)) push(m[1].split(",")[0]);
    return out.slice(0, 4).join(", ");
}

/* ── logo ───────────────────────────────────────────────────────────────── */

/** Best-guess logo candidates, most likely first. */
function logoCandidates(html: string, base: URL): string[] {
    const urls: string[] = [];
    const add = (u?: string | null) => {
        if (!u) return;
        try {
            const abs = new URL(u, base).href;
            if (!urls.includes(abs)) urls.push(abs);
        } catch {
            /* skip unparseable src */
        }
    };
    // An <img> the site itself calls a logo is the most reliable signal there is.
    for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
        const tag = m[0];
        if (!/logo|brand|wordmark/i.test(tag)) continue;
        add(tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1]);
    }
    for (const m of html.matchAll(/<link\b[^>]*rel\s*=\s*["'][^"']*(?:apple-touch-icon|icon)[^"']*["'][^>]*>/gi)) {
        add(m[0].match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1]);
    }
    add(html.match(/<meta\b[^>]*property\s*=\s*["']og:image["'][^>]*content\s*=\s*["']([^"']+)["']/i)?.[1]);
    // Vectors first — an SVG mark stays crisp and is what a designer actually wants.
    return urls.sort((a, b) => Number(b.includes(".svg")) - Number(a.includes(".svg"))).slice(0, 4);
}

/** No JPEG: a logo is a flat mark, so it ships as SVG/PNG/ICO essentially always, whereas
 *  a JPEG match is nearly always a photo that happened to sit in a "brand" wrapper — the
 *  getaway.house test pulled two 120KB photos of a bed and a campfire this way. */
const IMG_OK = /^image\/(svg\+xml|png|webp|x-icon|vnd\.microsoft\.icon)$/;
const RASTER_CAP = 250_000;

async function fetchLogos(html: string, base: URL) {
    const out: { name: string; url: string }[] = [];
    for (const cand of logoCandidates(html, base)) {
        if (out.length >= 2) break;
        const got = await grab(cand, ASSET_CAP);
        const mime = got?.type.split(";")[0].trim() ?? "";
        if (!got || !IMG_OK.test(mime)) continue;
        if (mime !== "image/svg+xml" && got.body.byteLength > RASTER_CAP) continue;
        const b64 = Buffer.from(got.body).toString("base64");
        const name =
            decodeURIComponent(cand.split("/").pop() ?? "logo")
                .replace(/\.[^.]+$/, "")
                .slice(0, 60) || "logo";
        out.push({ name, url: `data:${mime};base64,${b64}` });
    }
    return out;
}

/* ── handler ────────────────────────────────────────────────────────────── */

export default async (req: Request) => {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

    // Team-only. Without this, anyone who finds the URL can make our server fetch any public
    // site and hand back its images — an open fetch proxy wearing our IP address.
    const auth = readAuthEnv();
    if (!auth) return Response.json({ error: NOT_CONFIGURED }, { status: 500 });
    if (!isTeamEmail(await callerEmail(req, auth.supabaseUrl, auth.anonKey))) {
        return Response.json({ error: "Team sign-in required." }, { status: 401 });
    }

    let raw: string;
    try {
        raw = String((await req.json()).url ?? "").trim();
    } catch {
        return Response.json({ error: "Bad request." }, { status: 400 });
    }
    if (!raw || raw.length > 500) return Response.json({ error: "Enter the client's website address." }, { status: 400 });

    let site: URL;
    try {
        site = await assertPublicUrl(raw);
    } catch (err) {
        return Response.json({ error: (err as Error).message }, { status: 400 });
    }

    const page = await grab(site.href, PAGE_CAP);
    if (!page) return Response.json({ error: `Couldn't load ${site.hostname}. Is the address right, and the site public?` }, { status: 502 });
    const html = asText(page.body);

    // Inline <style> plus the first few external stylesheets — enough for a theme palette
    // without walking a whole build's worth of CSS on a 10s budget.
    const sheets = [...html.matchAll(/<link\b[^>]*rel\s*=\s*["']stylesheet["'][^>]*>/gi)]
        .map((m) => m[0].match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1])
        .filter((h): h is string => !!h)
        .map((h) => {
            try {
                return new URL(h, site).href;
            } catch {
                return "";
            }
        })
        .filter(Boolean)
        .slice(0, 4);

    const inline = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join("\n");
    const external = (await Promise.all(sheets.map((u) => grab(u, PAGE_CAP)))).map((r) => (r ? asText(r.body) : "")).join("\n");
    const css = `${inline}\n${external}`;

    const colors = extractColors(css);
    const fonts = extractFonts(html, css);
    const logos = await fetchLogos(html, site);

    if (!colors.length && !fonts && !logos.length) {
        return Response.json(
            { error: `Nothing usable found on ${site.hostname} — the site may build its styles in JavaScript. Add the colours by hand.` },
            { status: 422 },
        );
    }

    return Response.json({
        colors,
        fonts,
        logos,
        source: { site: site.href, stylesheets: sheets.length, css_bytes: css.length },
    });
};
