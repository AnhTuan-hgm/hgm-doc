/**
 * The Master Brand Document — the eleven-section brand foundation that the welcome
 * emails, the chat widget and every later AI feature read from.
 *
 * Section metadata, the completion model, the ChatGPT/Gemini working prompt and the
 * compiler that flattens the document for the AM review modal and the PDF export.
 * Data only — the fields that render it are in master-brand-fields.tsx.
 */
import { type Foundation, type LocalFavorite, filled } from "@/pages/client/dashboard/dashboard-model";
import type { MasterDocSection } from "@/utils/master-document-pdf";

/**
 * The Master Brand Document's eleven sections, in reading order.
 *
 * One list drives the in-page rail, the scroll-spy, the "x of 11 sections filled" readout,
 * the compiled AM document and the PDF — so a section can't appear in the rail and be
 * missing from the export. `workflow` marks the four an AM pastes in from the brand
 * messaging workflow rather than asking the client for; those carry a badge and, for the
 * client, no instruction to go and fill them in themselves.
 */
export const FOUNDATION_SECTIONS = [
    { id: "hosts", label: "About the hosts", workflow: false },
    { id: "properties", label: "About the properties", workflow: false },
    { id: "location", label: "Location", workflow: false },
    { id: "audience", label: "Target audience profile", workflow: true },
    { id: "uvp", label: "Unique value proposition", workflow: true },
    { id: "brand", label: "About the brand", workflow: true },
    { id: "personas", label: "Personas", workflow: true },
    { id: "focus", label: "Focus properties", workflow: false },
    { id: "favorites", label: "Local favorites", workflow: false },
    { id: "reviews", label: "Reviews", workflow: false },
    { id: "links", label: "Website links", workflow: false },
] as const;

export type FoundationSectionId = (typeof FOUNDATION_SECTIONS)[number]["id"];

export const WORKFLOW_SECTION_COUNT = FOUNDATION_SECTIONS.filter((s) => s.workflow).length;

/** Which of the eleven sections have any content — drives the rail ticks and the counter. */
export const foundationProgress = (f: Foundation): Record<FoundationSectionId, boolean> => ({
    hosts: filled(f.hosts),
    properties: [f.propertyType, f.structure, f.generalAmenities, f.sharedAmenities].some(filled),
    location: [f.exactLocation, f.proximityCities, f.proximityAirports].some(filled),
    audience: filled(f.targetAudience),
    uvp: filled(f.uvp),
    brand: [f.brandVoice, f.brandBio, ...f.taglines].some(filled),
    personas: f.personas.some((p) => filled(p.name) || filled(p.summary)),
    focus: f.focusProperties.some((p) => filled(p.name) || filled(p.link)),
    favorites: [...f.restaurants, ...f.activities].some((r) => filled(r.name)),
    reviews: [f.corePillars, f.emotionalThemes].some(filled),
    links: f.websiteLinks.some((l) => filled(l.page) || filled(l.url)),
});

/** The ChatGPT/Gemini prompt an AM runs over 30+ guest reviews before filling in Reviews. */
export const REVIEW_WORKING_PROMPT = `You are an expert hospitality marketing analyst and brand strategist. Your task is to analyze raw guest review data for a vacation rental business to uncover deep insights for its marketing and branding.

Here is the raw text of the guest reviews:

[PASTE ALL 30+ GUEST REVIEWS HERE]

Based on this data, please perform the following two analyses:

1. Identify Core Brand Pillars & Key Selling Points:
- List the top 5-7 most frequently mentioned amenities, property features, or design elements that guests consistently praise.
- List the top 5-7 most common emotional or experiential themes guests use to describe their stay (e.g., "peaceful escape," "luxurious comfort," "perfect for families," "attention to detail"). These themes should be the emotional heart of the brand.

2. Generate Marketing Copy Insights:
- For each of the top 3-5 most compelling amenities/features identified in the first step, provide 3-4 actual quotes (or close paraphrases) from the reviews. This raw, emotional language is excellent for social media hooks and email subject lines.
- For the top 3 most common emotional/experiential themes, suggest a short, impactful Brand Tagline (2-6 words) that captures that feeling.

Output your results clearly using bullet points for each section.`;

/** v1 Master Document fields, kept read-only so pre-redesign answers stay visible. */
export const LEGACY_FOUNDATION_FIELDS = [
    { key: "propertyBasics", label: "Property basics" },
    { key: "persona", label: "Ideal guest persona" },
    { key: "toneOfVoice", label: "Tone of voice" },
    { key: "amenities", label: "Amenities & house rules" },
    { key: "localRecommendations", label: "Local recommendations" },
    { key: "bookingLinks", label: "Booking & upsell links" },
] as const;

/** Join a set of sub-fields into one block, keeping the labels of the ones that have an
 * answer and dropping the rest — an export shouldn't be mostly "Not provided yet". */
export const subBlock = (parts: [string, string | undefined][]): string =>
    parts
        .filter(([, v]) => filled(v))
        .map(([label, v]) => `${label}: ${v!.trim()}`)
        .join("\n");

/** Compile the Master Brand Document the AM reviews — a deterministic flattening of the
 * eleven sections into label/value blocks (per the project-log decision: the client fills
 * the document, we "follow a template and generate for AM so they just review it").
 * Swap for Claude-API generation once the shared server-function decision lands. */
export const compileMasterDocument = (
    clientName: string,
    clientWebsite: string,
    f: Foundation,
): { doc: string; missing: string[]; sections: MasterDocSection[]; generatedOn: string } => {
    const personaBlock = f.personas
        .filter((p) => filled(p.name) || filled(p.summary))
        .map((p) =>
            [
                `${p.name.trim() || "Unnamed persona"}${filled(p.rank) ? ` (${p.rank.trim()})` : ""}`,
                p.summary.trim(),
                subBlock([
                    ["Age", p.age],
                    ["Relationship status", p.relationship],
                    ["Location", p.location],
                    ["Interests", p.interests],
                    ["Pain points", p.painPoints],
                    ["What they're seeking", p.seeking],
                    ["How they book", p.howTheyBook],
                    ["Keywords", p.keywords.filter((k) => k.trim()).join(", ")],
                ]),
            ]
                .filter(Boolean)
                .join("\n"),
        )
        .join("\n\n");

    const focusBlock = f.focusProperties
        .filter((p) => filled(p.name) || filled(p.link))
        .map((p) =>
            [
                p.name.trim() || "Unnamed property",
                subBlock([
                    ["Listing", p.link],
                    ["Location", p.location],
                    [
                        "Sleeps",
                        [p.guests && `${p.guests} guests`, p.bedrooms && `${p.bedrooms} bed`, p.beds && `${p.beds} beds`, p.bathrooms && `${p.bathrooms} bath`]
                            .filter(Boolean)
                            .join(" · "),
                    ],
                    ["Listing description", p.description],
                    ["Features & amenities", p.features],
                    ["Terms & rules", p.terms],
                    [
                        "Top reviews",
                        p.reviews
                            .filter((r) => r.trim())
                            .map((r) => `“${r.trim()}”`)
                            .join("\n"),
                    ],
                ]),
            ]
                .filter(Boolean)
                .join("\n"),
        )
        .join("\n\n");

    const favouriteList = (rows: LocalFavorite[]) =>
        rows
            .filter((r) => filled(r.name))
            .map((r) => `${r.name.trim()}${filled(r.description) ? ` — ${r.description.trim()}` : ""}`)
            .join("\n");

    // Order and labels mirror FOUNDATION_SECTIONS so the export reads like the page.
    const sections: MasterDocSection[] = [
        { label: "About the hosts", value: f.hosts },
        {
            label: "About the properties",
            value: subBlock([
                ["Property type", f.propertyType],
                ["Structure", f.structure],
                ["General amenities", f.generalAmenities],
                ["Shared resort amenities", f.sharedAmenities],
            ]),
        },
        {
            label: "Location",
            value: subBlock([
                ["Exact location", f.exactLocation],
                ["Proximity to popular cities", f.proximityCities],
                ["Proximity to airports", f.proximityAirports],
            ]),
        },
        { label: "Target audience profile", value: f.targetAudience },
        { label: "Unique value proposition", value: f.uvp },
        {
            label: "About the brand",
            value: subBlock([
                ["Brand voice", f.brandVoice],
                [
                    "Taglines",
                    f.taglines
                        .filter((t) => t.trim())
                        .map((t, i) => `${String(i + 1).padStart(2, "0")}. ${t.trim()}`)
                        .join("\n"),
                ],
                ["Brand bio", f.brandBio],
            ]),
        },
        {
            label: "Personas",
            value: [personaBlock, filled(f.personaResonance) && `Why the brand resonates: ${f.personaResonance.trim()}`].filter(Boolean).join("\n\n"),
        },
        { label: "Focus properties", value: focusBlock },
        {
            label: "Local favorites",
            value: subBlock([
                ["Restaurants", favouriteList(f.restaurants)],
                ["Activities / attractions", favouriteList(f.activities)],
            ]),
        },
        {
            label: "Reviews",
            value: subBlock([
                ["Core brand pillars & key selling points", f.corePillars],
                ["Emotional & experiential themes", f.emotionalThemes],
            ]),
        },
        {
            label: "Website links",
            value: f.websiteLinks
                .filter((l) => filled(l.page) || filled(l.url))
                .map((l) => `${l.page.trim() || "Untitled page"} — ${l.url.trim() || "no URL"}`)
                .join("\n"),
        },
    ];

    const missing = sections.filter((s) => !filled(s.value)).map((s) => s.label);
    const generatedOn = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    const lines: string[] = [
        `# Master Brand Document — ${clientName.trim() || "Client"}`,
        "",
        [clientWebsite.trim() && `Website: ${clientWebsite.trim()}`, `Generated: ${generatedOn}`].filter(Boolean).join("  ·  "),
        "",
    ];
    sections.forEach((s, i) => lines.push(`## ${i + 1}. ${s.label}`, "", s.value.trim() || "_Not provided yet._", ""));
    // `sections`/`generatedOn` are returned alongside the markdown so the PDF export can
    // lay the document out properly instead of re-parsing the markdown.
    return { doc: lines.join("\n"), missing, sections, generatedOn };
};
