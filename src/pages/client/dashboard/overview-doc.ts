/**
 * The Client Overview Document's field list — the team-only internal brief.
 *
 * One list drives the form on screen, the "x of 26 fields filled" counter and the tool
 * schema the model fills, so a field cannot exist in one and be missing from another.
 * The stored shape is OverviewDoc in @/lib/supabase.
 */
import type { OverviewDoc } from "@/lib/supabase";

/**
 * The Client Overview Document's fields, in the order they appear on screen.
 *
 * One list drives the form, the "x of 26 filled" counter and the tool schema the model
 * fills, so a field can't exist in one of those and be missing from another. `long` picks a
 * textarea over a single line; `half` puts two fields side by side.
 */
export const OVERVIEW_SECTIONS: {
    id: string;
    title: string;
    fields: { key: keyof OverviewDoc; label: string; placeholder?: string; long?: boolean; half?: boolean }[];
}[] = [
    {
        id: "client",
        title: "Client information",
        fields: [
            { key: "client_name", label: "Client name", half: true },
            { key: "business_name", label: "Business name", half: true },
            { key: "email", label: "Email", placeholder: "you@example.com", half: true },
            { key: "business_type", label: "Business type", placeholder: "e.g. cabins, beach houses", half: true },
            { key: "locations", label: "Business location(s)" },
        ],
    },
    {
        id: "platforms",
        title: "Platforms",
        fields: [
            { key: "instagram", label: "Instagram", placeholder: "@handle", half: true },
            { key: "tiktok", label: "TikTok", placeholder: "@handle", half: true },
            { key: "direct_booking_website", label: "Direct booking website", placeholder: "https://", half: true },
            { key: "airbnb", label: "Airbnb", placeholder: "https://", half: true },
        ],
    },
    {
        id: "goals",
        title: "Business goals & objectives",
        fields: [
            {
                key: "short_term_goals",
                label: "Short-term goals",
                placeholder: "e.g. increasing bookings, building brand awareness, optimizing listings",
                long: true,
            },
            { key: "long_term_goals", label: "Long-term goals", placeholder: "e.g. business growth, equity value, direct booking focus", long: true },
            { key: "success_metrics", label: "Key success metrics", placeholder: "e.g. website conversion rate, ADR, occupancy rate", long: true },
        ],
    },
    {
        id: "brand",
        title: "Brand & positioning",
        fields: [
            { key: "target_audience", label: "Target audience", long: true },
            { key: "unique_selling_points", label: "Unique selling points", long: true },
            { key: "branding", label: "Branding", long: true },
            { key: "competitor_inspiration", label: "Competitor inspiration", long: true, half: true },
            { key: "market_insights", label: "Market insights", long: true, half: true },
        ],
    },
    {
        id: "preferences",
        title: "Client preferences & notes",
        fields: [
            { key: "communication_style", label: "Preferred communication style", long: true },
            { key: "concerns", label: "Client's concerns or requests", long: true },
            { key: "other_notes", label: "Other notes", long: true },
        ],
    },
];

/** The section rail's list, in reading order — OVERVIEW_SECTIONS plus the two blocks that
 *  render outside it (Properties sits between Platforms and Goals; Baseline closes the doc). */
export const OVERVIEW_RAIL: { id: string; label: string }[] = [
    ...OVERVIEW_SECTIONS.slice(0, 2).map((s) => ({ id: s.id, label: s.title })),
    { id: "properties", label: "Properties" },
    ...OVERVIEW_SECTIONS.slice(2).map((s) => ({ id: s.id, label: s.title })),
    { id: "baseline", label: "Baseline (snapshot)" },
];

/** 1-based heading number for a rail section, shared by the rail and the headings. */
export const overviewSectionNumber = (id: string) => OVERVIEW_RAIL.findIndex((r) => r.id === id) + 1;

/** The kickoff numbers. Kept out of OVERVIEW_SECTIONS because they render as tiles, not rows. */
export const OVERVIEW_BASELINE: { key: keyof OverviewDoc; label: string }[] = [
    { key: "instagram_followers", label: "Instagram followers" },
    { key: "facebook_followers", label: "Facebook followers" },
    { key: "tiktok_followers", label: "TikTok followers" },
    { key: "email_list_size", label: "Email list size" },
];

/** Everything the "x of 26 fields filled" counter looks at. Properties are a list, so they
 *  are deliberately not part of the count — a client with two properties isn't 24/26 done. */
export const OVERVIEW_COUNTED_FIELDS: (keyof OverviewDoc)[] = [
    ...OVERVIEW_SECTIONS.flatMap((s) => s.fields.map((f) => f.key)),
    ...OVERVIEW_BASELINE.map((f) => f.key),
    "direct_booking_split",
    "instagram_screenshot",
];

export const DEFAULT_OVERVIEW_DOC: OverviewDoc = {
    client_name: "",
    business_name: "",
    email: "",
    business_type: "",
    locations: "",
    instagram: "",
    tiktok: "",
    direct_booking_website: "",
    airbnb: "",
    properties: [],
    short_term_goals: "",
    long_term_goals: "",
    success_metrics: "",
    target_audience: "",
    unique_selling_points: "",
    branding: "",
    competitor_inspiration: "",
    market_insights: "",
    communication_style: "",
    concerns: "",
    other_notes: "",
    instagram_followers: "",
    facebook_followers: "",
    tiktok_followers: "",
    email_list_size: "",
    direct_booking_split: "",
    instagram_screenshot: "",
};
