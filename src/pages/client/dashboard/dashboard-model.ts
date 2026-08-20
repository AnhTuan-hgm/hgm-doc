/**
 * The client dashboard's data model: the shapes stored in `dashboard_pages.data`, the
 * defaults an older or brand-new row is merged over, and the small pure helpers the
 * rest of the dashboard shares.
 *
 * No JSX and no React, so a test or a script can import it without pulling in the UI.
 */
import type { DashboardContent } from "@/lib/supabase";

export type BrandColor = DashboardContent["brand"]["colors"][number];
export type Highlight = DashboardContent["instagram"]["highlights"][number];
export type GhlItem = DashboardContent["ghl"]["items"][number];
export type RevenueMonth = DashboardContent["revenue"]["months"][number];
export type QuickLink = DashboardContent["links"][number];
export type VideoGuide = NonNullable<DashboardContent["videos"]>[number];
export type Foundation = NonNullable<DashboardContent["foundation"]>;
export type Persona = Foundation["personas"][number];
export type FocusProperty = Foundation["focusProperties"][number];
export type LocalFavorite = Foundation["restaurants"][number];
export type WebsiteLink = Foundation["websiteLinks"][number];

export const STATUS_OPTIONS = ["Onboarding", "Active", "Paused"] as const;

export const normEmail = (e: string) => e.trim().toLowerCase();

/**
 * Status pill colour on the CLIENT dashboard. Local on purpose — the team's Client List
 * keeps its own mapping, where telling Onboarding from Active still matters.
 *
 * Onboarding reads green rather than blue: a client opening their own dashboard shouldn't
 * see a colour that says "not underway yet". Paused stays amber, because that genuinely is
 * a stop and it would be dishonest to paint it as running.
 */
export const statusColor = (status: string) => (status === "Paused" ? "warning" : "success");

export function slugify(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

export const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2)}`);

export const DEFAULT_FOUNDATION: Foundation = {
    hosts: "",
    propertyType: "",
    structure: "",
    generalAmenities: "",
    sharedAmenities: "",
    exactLocation: "",
    proximityCities: "",
    proximityAirports: "",
    targetAudience: "",
    uvp: "",
    brandVoice: "",
    taglines: ["", "", ""],
    brandBio: "",
    personas: [],
    personaResonance: "",
    focusProperties: [],
    restaurants: [],
    activities: [],
    corePillars: "",
    emotionalThemes: "",
    promptHidden: false,
    websiteLinks: [],
};

export const emptyPersona = (rank: string): Persona => ({
    id: uid(),
    name: "",
    summary: "",
    rank,
    age: "",
    relationship: "",
    location: "",
    interests: "",
    painPoints: "",
    seeking: "",
    howTheyBook: "",
    keywords: [],
});

export const emptyFocusProperty = (): FocusProperty => ({
    id: uid(),
    name: "",
    link: "",
    location: "",
    guests: "",
    bedrooms: "",
    beds: "",
    bathrooms: "",
    description: "",
    features: "",
    terms: "",
    reviews: ["", "", ""],
});

export const emptyFavorite = (): LocalFavorite => ({ id: uid(), name: "", description: "" });
export const emptyWebsiteLink = (page = ""): WebsiteLink => ({ id: uid(), page, url: "" });

export const filled = (v: string | undefined) => Boolean(v && v.trim());

export const DEFAULT_GHL_ITEMS: GhlItem[] = [
    { label: "Domain & website connected", done: false },
    { label: "Business phone number", done: false },
    { label: "Calendar & online booking", done: false },
    { label: "Sales pipeline", done: false },
    { label: "Automations & follow-up workflows", done: false },
    { label: "Review requests", done: false },
    { label: "Email & SMS templates", done: false },
    { label: "Mobile app installed", done: false },
];

/** Default page links for a client, derived from the shared slug base. */
export const defaultLinks = (base: string): QuickLink[] => [
    { title: "Meta Pixel Setup Guide", description: "Install your tracking pixel step by step.", url: `/${base}-metapixel` },
    { title: "Lead Capture Popup", description: "Your website popup & inline form setup.", url: `/${base}-leadcapture` },
    { title: "Chat Widget", description: "Add the website chat widget to your site.", url: `/${base}-chatwidget` },
];

export const TEMPLATE_CONTENT: DashboardContent = {
    status: "Active",
    logo_url: "",
    sidebar_bg_url: "",
    brand: {
        colors: [
            { name: "Primary", hex: "#7F56D9" },
            { name: "Secondary", hex: "#101828" },
            { name: "Accent", hex: "#F4EBFF" },
            { name: "Neutral", hex: "#FAFAFA" },
        ],
        fonts: "Inter",
        folder_link: "",
        logos: [],
    },
    instagram: { profile_url: "", highlights: [] },
    ghl: { login_url: "https://app.gohighlevel.com", items: DEFAULT_GHL_ITEMS },
    revenue: {
        currency: "USD",
        months: [
            { month: "Jan", revenue: 8200, leads: 34, appointments: 18 },
            { month: "Feb", revenue: 9400, leads: 41, appointments: 22 },
            { month: "Mar", revenue: 11800, leads: 52, appointments: 27 },
            { month: "Apr", revenue: 10900, leads: 47, appointments: 25 },
            { month: "May", revenue: 13600, leads: 61, appointments: 33 },
            { month: "Jun", revenue: 15200, leads: 68, appointments: 37 },
        ],
    },
    links: defaultLinks("yourclient"),
    videos: [],
    foundation: DEFAULT_FOUNDATION,
};

/** Fresh content for a newly created client copy — no sample numbers. */
export const createDefaultContent = (base: string): DashboardContent => ({
    ...TEMPLATE_CONTENT,
    status: "Onboarding",
    revenue: { currency: "USD", months: [] },
    ghl: { ...TEMPLATE_CONTENT.ghl, items: DEFAULT_GHL_ITEMS.map((i) => ({ ...i })) },
    links: defaultLinks(base),
    // A fresh client copy starts with the scaffolding an AM would otherwise add by hand:
    // two ranked personas, one focus property, and a Home row in the sitemap table.
    foundation: {
        ...DEFAULT_FOUNDATION,
        personas: [emptyPersona("Primary"), emptyPersona("Secondary")],
        focusProperties: [emptyFocusProperty()],
        restaurants: [emptyFavorite(), emptyFavorite(), emptyFavorite()],
        activities: [emptyFavorite(), emptyFavorite(), emptyFavorite()],
        websiteLinks: [emptyWebsiteLink("Home"), emptyWebsiteLink(), emptyWebsiteLink()],
    },
    videos: [],
    client_visible: [...DEFAULT_CLIENT_VISIBLE],
});

/** Merge a partial jsonb blob from the DB over the defaults so old rows never crash new sections. */
export const mergeContent = (partial?: Partial<DashboardContent> | null): DashboardContent => ({
    ...TEMPLATE_CONTENT,
    ...partial,
    brand: { ...TEMPLATE_CONTENT.brand, ...partial?.brand },
    instagram: { ...TEMPLATE_CONTENT.instagram, ...partial?.instagram },
    ghl: { ...TEMPLATE_CONTENT.ghl, ...partial?.ghl },
    revenue: { ...TEMPLATE_CONTENT.revenue, ...partial?.revenue },
    links: partial?.links ?? TEMPLATE_CONTENT.links,
    videos: partial?.videos ?? [],
    // Arrays are spread-hostile: `...partial.foundation` would hand back `undefined` for
    // every list an older row predates, and the section renderers all call .map on them.
    // Each one falls back explicitly. `taglines` is padded to three so the 01/02/03 rail
    // renders even if a row was written with fewer.
    foundation: {
        ...DEFAULT_FOUNDATION,
        ...partial?.foundation,
        taglines: [0, 1, 2].map((i) => partial?.foundation?.taglines?.[i] ?? ""),
        personas: partial?.foundation?.personas ?? [],
        focusProperties: partial?.foundation?.focusProperties ?? [],
        restaurants: partial?.foundation?.restaurants ?? [],
        activities: partial?.foundation?.activities ?? [],
        websiteLinks: partial?.foundation?.websiteLinks ?? [],
        // Deprecated v1 keys — carried through untouched so saving a redesigned document
        // never erases answers a client gave against the old one.
        faqs: partial?.foundation?.faqs ?? [],
    },
    // Absent ⇒ the intake-forms-only default. An AM who hides everything stores an empty
    // array, which is meaningfully different from "never set" and must survive as [].
    client_visible: partial?.client_visible ?? [...DEFAULT_CLIENT_VISIBLE],
});

/** Side-menu taxonomy — mirrors the funnel Dustin walks every client through on the
 * onboarding call: Foundation (the Master Document everything else reads from) feeds
 * Top of funnel (get seen) → Middle of funnel (nurture + capture) → Bottom of funnel
 * (convert to a direct booking). Module scope so the array isn't rebuilt every render. */
export type SectionId =
    | "overview"
    | "intake"
    | "onboarding"
    | "overviewdoc"
    | "foundation"
    | "brand"
    | "videos"
    | "comms"
    | "website"
    | "instagram"
    | "flow"
    | "chatwidget"
    | "ghl"
    | "revenue"
    // Menu entries added with the client-facing side-menu rework. The first four have
    // no section body yet and render with the existing "Soon" treatment; the last two
    // are links out rather than sections.
    | "landing"
    | "repeatflow"
    | "pinnedposts"
    | "reels"
    | "contentfolder"
    | "ownerguide";

/**
 * What a client can see before an AM reveals anything.
 *
 * The two intake forms only. They're what we need FROM the client on day one, so a
 * brand-new dashboard is still actionable — everything else would otherwise present
 * unfinished work as though it were delivered. An AM reveals each remaining section per
 * client with the eye toggle in edit mode, as it actually ships.
 *
 * Stored as an ALLOWLIST rather than a hidden-list on purpose: a section added later
 * defaults to invisible to clients instead of leaking the moment it lands.
 */
export const DEFAULT_CLIENT_VISIBLE: SectionId[] = ["intake", "onboarding"];

/* Eye / eye-off, matching the owner guide's per-client step toggle so the gesture reads
   the same in both places. Inline SVG for the same reason it is there: these are 13px
   controls inside a dense row, not icon-set sizes. */
