import { lookup } from "node:dns/promises";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Shared readers for the functions that draft a client's documents.
 *
 * Lives in netlify/lib rather than netlify/functions on purpose: Netlify routes every
 * top-level file in the functions directory as its own endpoint, so a helper module put
 * there would be publicly callable. Imported from a function, this is just bundled.
 *
 * Three things are shared here, and the reason is narrow in each case:
 *
 *  1. The form reader and its CREDENTIAL FILTER. The onboarding form's Account Setup
 *     section collects real logins. A copy-pasted password filter that drifts from its
 *     original is exactly how one leaks, so there is one copy and both callers use it.
 *  2. The SSRF guard and capped fetcher. Same argument, higher stakes: these functions
 *     fetch a URL a person typed, from inside our network.
 *  3. The team-auth check, so a new endpoint can't ship without one.
 *
 * Everything model-shaped — prompts, tool schemas, field lists — deliberately stays in the
 * function that owns it. Those differ per document and are not improved by being shared.
 */

/* ── environment ─────────────────────────────────────────────────────────── */

export interface Env {
    supabaseUrl: string;
    serviceKey: string;
    apiKey: string;
}

/** Null when anything is missing, so the caller can answer with one clear message. */
export const readEnv = (): Env | null => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    return supabaseUrl && serviceKey && apiKey ? { supabaseUrl, serviceKey, apiKey } : null;
};

export const NOT_CONFIGURED = "Not configured — ask the web team to check the Netlify environment variables.";

/* ── who is calling ──────────────────────────────────────────────────────── */

/**
 * The signed-in team member behind the request, or null.
 *
 * These endpoints read a client's private onboarding answers and spend money on a model
 * call, so "the button is hidden from clients" is not access control — the button lives in
 * a JavaScript bundle anyone can read. The browser sends its Supabase access token and we
 * verify it here.
 */
export async function callerEmail(req: Request, supabaseUrl: string, serviceKey: string): Promise<string | null> {
    const token = req.headers
        .get("authorization")
        ?.replace(/^Bearer\s+/i, "")
        .trim();
    if (!token) return null;
    const { data, error } = await createClient(supabaseUrl, serviceKey).auth.getUser(token);
    if (error || !data.user?.email) return null;
    return data.user.email.toLowerCase();
}

export const isTeamEmail = (email: string | null): boolean => !!email && email.endsWith("@hiddengem.media");

/** Dashboard slugs only — "acme-dashboard". Bounds the length so a huge string can't be
 *  handed to the database, and pins the shape so this can't be pointed at another table. */
export const isDashboardSlug = (slug: string): boolean => slug.length <= 120 && /^[a-z0-9-]+-dashboard$/.test(slug);

/* ── the client's own answers ────────────────────────────────────────────── */

/**
 * PASSWORDS ARE EXCLUDED, and this is the single copy of that rule.
 *
 * The Onboarding Form's Account Setup section collects real logins — Instagram, TikTok,
 * PriceLabs, StayFi, the client's PMS and their domain host — as `<field>__user` and
 * `<field>__pass`. The team keeps the secrets in their password manager; this app only
 * takes them in. No field in any document we draft is improved by knowing a password,
 * which is what makes sending one a pure loss: third-party exposure that buys nothing.
 *
 * ACCOUNT NAMES ARE KEPT. `<field>__user` is what the client is called on that platform,
 * and for the social accounts it IS the public handle a brief asks for. A name without its
 * password isn't a credential.
 */
export const isCredential = (k: string): boolean => /__pass$/.test(k) || /pass(word)?|secret|credential/i.test(k);

/**
 * Flatten one form's answers into `key: value` lines.
 *
 * Media POINTERS are dropped — "targetGuest__media": "acme/targetGuest-123.webm" tells a
 * model nothing and invites it to treat a filename as content. The transcripts of those
 * recordings are the readable form and go in separately, with their question label.
 */
export const readable = (o: Record<string, unknown>): string =>
    Object.entries(o)
        .filter(
            ([k, v]) =>
                !k.endsWith("__media") && !k.endsWith("__mediaKind") && !isCredential(k) && typeof v !== "object" && String(v ?? "").trim(),
        )
        .map(([k, v]) => `${k}: ${String(v).trim()}`)
        .join("\n");

export interface ClientSources {
    clientName: string;
    clientWebsite: string;
    /** Raw onboarding answers, for callers that need a specific field (e.g. websiteUrl). */
    intakeAnswers: Record<string, unknown>;
    intakeText: string;
    visionText: string;
    spokenText: string;
    /** False when the client has submitted nothing — the caller should say so, not draft. */
    hasAny: boolean;
}

/**
 * Everything a client has told us, read with the service-role key.
 *
 * Both client-input forms plus any transcripts we've made of recorded answers. Nothing is
 * written. The two form tables are named from the dashboard slug: "acme-dashboard" gives
 * "acme", which is how the form pages and recording folders are named.
 */
export async function readClientSources(admin: SupabaseClient, slug: string): Promise<ClientSources> {
    const base = slug.replace(/-dashboard$/, "");

    const [dash, intake, brandVision, transcripts] = await Promise.all([
        admin.from("dashboard_pages").select("client_name,client_website").eq("slug", slug).maybeSingle(),
        admin.from("client_onboarding_pages").select("data").eq("slug", `${base}-onboarding`).maybeSingle(),
        admin.from("host_onboarding_pages").select("data").eq("slug", `${base}-hostonboarding`).maybeSingle(),
        admin
            .from("script_logs")
            .select("source_label,transcript")
            .in("client_slug", [`${base}-onboarding`, `${base}-hostonboarding`])
            .eq("status", "done"),
    ]);

    const intakeAnswers = (intake.data?.data as Record<string, unknown> | undefined) ?? {};
    const visionAnswers = (brandVision.data?.data as Record<string, unknown> | undefined) ?? {};
    const spoken = (transcripts.data ?? []).filter((t) => (t.transcript ?? "").trim());

    const intakeText = readable(intakeAnswers);
    const visionText = readable(visionAnswers);
    const spokenText = spoken.map((t) => `[${t.source_label || "recorded answer"}]\n${t.transcript}`).join("\n\n");

    return {
        clientName: String(dash.data?.client_name ?? "").trim(),
        clientWebsite: String(dash.data?.client_website ?? "").trim(),
        intakeAnswers,
        intakeText,
        visionText,
        spokenText,
        hasAny: !!(intakeText || visionText || spokenText),
    };
}

/** The labelled blocks of source material, ready to head a prompt. */
export const sourceBlocks = (s: ClientSources): string =>
    [
        s.clientName && `Business on file: ${s.clientName}`,
        s.clientWebsite && `Website on file: ${s.clientWebsite}`,
        s.intakeText && `--- ONBOARDING FORM ---\n${s.intakeText}`,
        s.visionText && `--- BRAND VISION FORM ---\n${s.visionText}`,
        s.spokenText && `--- RECORDED ANSWERS (transcribed) ---\n${s.spokenText}`,
    ]
        .filter(Boolean)
        .join("\n\n");

/* ── placeholder scrubbing ───────────────────────────────────────────────── */

/**
 * Turn a stand-in for "I don't know" into an actual empty field.
 *
 * Prompts ask for an empty string when the source material doesn't cover a field, and
 * mostly that is what comes back — but a real run returned the literal `<UNKNOWN>`, which
 * then renders as the value of that field instead of "Not filled in". A prompt can't be
 * relied on to never do this, so the check lives in code.
 *
 * Deliberately whole-value only: a field reading exactly "unknown" carries nothing, while a
 * sentence that merely contains the word ("their target market is unknown to them") is real
 * content someone should see.
 */
const PLACEHOLDER =
    /^[<[(]?\s*(unknown|n\/?a|none|null|tbd|not\s+(stated|provided|given|specified|mentioned|available|filled(\s+in)?)|[-–—?])\s*[>\])]?[.]?$/i;

export const blankIfPlaceholder = (v: unknown): string => {
    const t = String(v ?? "").trim();
    return PLACEHOLDER.test(t) ? "" : t;
};

/* ── reading a website ───────────────────────────────────────────────────── */

const UA = "Mozilla/5.0 (compatible; HiddenGemBrandKit/1.0; +https://hgmportal.com)";
export const PAGE_CAP = 1_500_000; // bytes of HTML/CSS we will read
export const ASSET_CAP = 600_000; // bytes for a logo file
const FETCH_MS = 7000;

const PRIVATE_V4 = [/^127\./, /^10\./, /^192\.168\./, /^169\.254\./, /^0\./, /^172\.(1[6-9]|2\d|3[01])\./];
const isPrivateIp = (ip: string) => PRIVATE_V4.some((r) => r.test(ip)) || /^(::1|::$|fe[89ab]|fc|fd)/i.test(ip);

/**
 * Reject anything that isn't a public http(s) host, checking the RESOLVED ip, not the name.
 *
 * Not optional: these functions fetch a URL a person typed, from inside our own network,
 * which is the textbook SSRF shape. Without this, "http://169.254.169.254/" turns the
 * endpoint into a reader for the cloud metadata service.
 */
export async function assertPublicUrl(raw: string): Promise<URL> {
    let u: URL;
    try {
        // Only bare hosts get a scheme bolted on. Prepending onto anything that already has
        // one turned "file:///etc/passwd" into "https://file///etc/passwd", which was still
        // rejected but by the DNS check — leaving the protocol guard below unreachable.
        const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw);
        u = new URL(hasScheme ? raw : `https://${raw}`);
    } catch {
        throw new Error("That doesn't look like a website address.");
    }
    if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("Only http and https addresses work.");
    const host = u.hostname.toLowerCase();
    if (host === "localhost" || /\.(localhost|local|internal|home|lan)$/.test(host)) {
        throw new Error("That address is on a private network.");
    }
    let address: string;
    try {
        ({ address } = await lookup(host));
    } catch {
        throw new Error("Couldn't find that domain — check the spelling.");
    }
    if (isPrivateIp(address)) throw new Error("That address resolves to a private network.");
    return u;
}

/** Capped, time-bounded fetch. Null on any failure — callers decide what a miss means. */
export async function grab(url: string, cap: number, timeoutMs = FETCH_MS): Promise<{ body: ArrayBuffer; type: string } | null> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(url, { signal: ctrl.signal, redirect: "follow", headers: { "user-agent": UA } });
        if (!res.ok) return null;
        const declared = Number(res.headers.get("content-length") ?? 0);
        if (declared > cap) return null;
        const body = await res.arrayBuffer();
        if (body.byteLength > cap) return null;
        return { body, type: (res.headers.get("content-type") ?? "").toLowerCase() };
    } catch {
        return null;
    } finally {
        clearTimeout(timer);
    }
}

export const asText = (b: ArrayBuffer): string => new TextDecoder("utf-8", { fatal: false }).decode(b);

const ENTITIES: Record<string, string> = { nbsp: " ", amp: "&", quot: '"', apos: "'", "#39": "'", lt: "<", gt: ">", rsquo: "’", ldquo: "“", rdquo: "”" };

/**
 * HTML → the readable text a model should see.
 *
 * Scripts and styles go first, then block-level tags become newlines so paragraphs and list
 * items don't run together into one sentence. Capped, because a long page otherwise crowds
 * out the client's own form answers, which are the better source.
 */
export function stripHtml(html: string, cap = 12_000): string {
    const text = html
        .replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1\s*>/gi, " ")
        // Nav and footer are chrome on every page and crowd out the content the model
        // actually needs. A real read of a hotel site opened with 400 characters of
        // "Sign In or Join / Email or Member Number" before any mention of a cabin.
        // <header> is deliberately NOT removed — on marketing sites it holds the hero.
        .replace(/<(nav|footer)\b[\s\S]*?<\/\1\s*>/gi, " ")
        .replace(/<!--[\s\S]*?-->/g, " ")
        .replace(/<br\b[^>]*>/gi, "\n")
        .replace(/<\/(p|div|li|h[1-6]|tr|section|article|header|footer|blockquote)\s*>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
        .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
        .replace(/&([a-z#0-9]+);/gi, (m, name: string) => ENTITIES[name.toLowerCase()] ?? m)
        .replace(/[ \t ]+/g, " ")
        .replace(/ ?\n ?/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    return text.length > cap ? `${text.slice(0, cap)}\n…[truncated]` : text;
}

export const pageTitle = (html: string): string =>
    stripHtml(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "", 120).replace(/\s+/g, " ").trim();

/**
 * Same-host links, with their anchor text as the page name.
 *
 * Used for the Master Document's sitemap table, and as the ONLY source of URLs anywhere in
 * a drafted document. A model asked for a client's page URLs will produce plausible ones
 * that 404, and a wrong-but-believable link inside a brand document gets copied into emails
 * and is very hard to walk back — the same reasoning that keeps the Brand Kit's hexes
 * verbatim. Anything not found here stays empty.
 */
/**
 * Links that are site plumbing rather than pages a brand document should list.
 *
 * Not a nicety. A real read of a cabin-rental site returned "Join", "Forgot Password",
 * "Clear Remembered Account" and "Points" as its first links, because modern sites put
 * account chrome at the top of the markup. Those went straight into the client's sitemap
 * table, and into the set of URLs the model was allowed to attach to a property.
 */
const LINK_NOISE =
    /(sign[- ]?in|sign[- ]?out|log[- ]?in|log[- ]?out|sign[- ]?up|register|forgot|password|my ?account|account|cart|checkout|basket|wishlist|privacy|terms|cookie|legal|accessibility|sitemap|skip to|careers|press|gift ?cards?|points|rewards|loyalty|newsletter|unsubscribe|search|share|tweet)/i;

/** Pages that plausibly describe the stays, ranked ahead of everything else. */
const LINK_WORTH = /(stay|room|suite|cabin|listing|propert|accommodat|about|amenit|experience|rental|villa|lodge|house|gallery|rates?|book)/i;

export function internalLinks(html: string, base: URL, max = 14): { page: string; url: string }[] {
    const out: { page: string; url: string }[] = [];
    const seen = new Set<string>();
    for (const m of html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
        let abs: URL;
        try {
            abs = new URL(m[1], base);
        } catch {
            continue;
        }
        if (abs.protocol !== "http:" && abs.protocol !== "https:") continue;
        if (abs.hostname.toLowerCase() !== base.hostname.toLowerCase()) continue;
        abs.hash = "";
        const key = abs.href.replace(/\/+$/, "");
        if (seen.has(key)) continue;
        // Icon-only links give an empty label; a whole sentence of anchor text is a body
        // link, not a nav item. Neither belongs in a sitemap table.
        const label = stripHtml(m[2], 80).replace(/\s+/g, " ").trim();
        if (!label || label.length > 40) continue;
        if (LINK_NOISE.test(label) || LINK_NOISE.test(abs.pathname)) continue;
        // A link back to the homepage is never a useful sitemap row — it arrives labelled
        // "Skip to Content" or "English" from a language switcher, and the document's own
        // scaffolding already starts with a Home row.
        if (key === base.href.replace(/\/+$/, "")) continue;
        seen.add(key);
        out.push({ page: label, url: abs.href });
    }
    // Ranked, not filtered, so a site whose pages use none of those words still gets read.
    // Sorted after collection rather than during, so the ranking sees every candidate
    // instead of whichever fourteen happened to appear first in the markup.
    return out.sort((a, b) => Number(LINK_WORTH.test(b.page + b.url)) - Number(LINK_WORTH.test(a.page + a.url))).slice(0, max);
}

export interface SiteRead {
    site: string;
    /** Homepage text plus a few inner pages, each headed by its URL. */
    text: string;
    links: { page: string; url: string }[];
}

/**
 * Fetch a client's site: the homepage, plus a few internal pages for the property detail
 * that a homepage rarely carries.
 *
 * Inner pages are fetched in parallel with a shorter timeout than the homepage. This runs
 * inside a ~10s synchronous budget shared with nothing else — this endpoint's only job is
 * the read, and the model calls that use the text are separate requests.
 */
export async function readWebsite(raw: string, maxPages = 4): Promise<SiteRead> {
    const site = await assertPublicUrl(raw);
    const home = await grab(site.href, PAGE_CAP);
    if (!home) throw new Error(`Couldn't load ${site.hostname}. Is the address right, and the site public?`);
    const html = asText(home.body);
    const links = internalLinks(html, site);
    const homeText = stripHtml(html, 9000);

    /* A single-page app serves an empty shell and renders everything in the browser, so
       there is nothing here to read — hgmportal.com itself returns 58 characters. Saying so
       is the whole point: handing the model an empty page invites it to fill the property
       sections from imagination, which is the one failure this document cannot absorb. */
    if (homeText.length < 400) {
        throw new Error(
            `${site.hostname} returned almost no readable text — it likely builds its pages in JavaScript. Those sections need filling in by hand.`,
        );
    }

    // internalLinks already ranked these; just drop the homepage and take the first few.
    const inner = links.filter((l) => l.url.replace(/\/+$/, "") !== site.href.replace(/\/+$/, "")).slice(0, Math.max(0, maxPages - 1));

    const fetched = await Promise.all(inner.map((l) => grab(l.url, PAGE_CAP, 4500).then((r) => ({ l, r }))));

    const blocks = [`--- ${site.href} (${pageTitle(html) || "home"}) ---\n${homeText}`];
    for (const { l, r } of fetched) {
        if (!r) continue;
        const body = stripHtml(asText(r.body), 5000);
        if (body.length > 200) blocks.push(`--- ${l.url} (${l.page}) ---\n${body}`);
    }

    return { site: site.href, text: blocks.join("\n\n"), links };
}
