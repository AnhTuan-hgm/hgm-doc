import { type ChangeEvent, type FC, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
// Functional UI icons — Untitled UI PRO, line style (drop-in for the free set).
import {
    AlertTriangle,
    ArrowDown,
    ArrowRight,
    ArrowUp,
    ArrowUpRight,
    Calendar,
    Camera01,
    Check,
    CheckDone01,
    BookOpen01,
    CheckCircle,
    ChevronDown,
    Flag01,
    Lightbulb01,
    MessageTextSquare01,
    Stars02,
    ClipboardCheck,
    Copy01,
    Download01,
    Edit01,
    FileCheck02,
    Folder,
    Globe01,
    HelpCircle,
    Image01,
    LayoutAlt01,
    LinkExternal01,
    Mail01,
    MessageChatCircle,
    Moon01,
    PlayCircle,
    Plus,
    RefreshCw01,
    Repeat01,
    SearchLg,
    Sun,
    Target04,
    Trash01,
    TrendUp01,
    Users01,
    UploadCloud02,
    XClose,
} from "@untitledui-pro/icons/line";
import { AnimatePresence, motion } from "motion/react";
import { useNavigate, useSearchParams } from "react-router";
import { Bar, BarChart, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { ChartTooltipContent } from "@/components/application/charts/charts-base";
import { RecordingPlayer } from "@/components/application/media-answer";
import { SignInBackdrop } from "@/components/application/sign-in-backdrop";
import { VideoAttach, VideoEmbed } from "@/components/application/video-block";
import { WelcomeFlowSection } from "@/components/application/welcome-flow";
import { BadgeWithDot, BadgeWithIcon } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ProgressBarCircle } from "@/components/base/progress-indicators/progress-circles";
import { ProgressBar } from "@/components/base/progress-indicators/progress-indicators";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { Instagram } from "@/components/foundations/social-icons";
import { Reveal } from "@/components/shared-assets/reveal";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useEditShortcuts } from "@/hooks/use-edit-shortcuts";
import { isInFlight, isStalled, listSummariesForPaths, queueSummary, retrySummary, type ScriptLog } from "@/lib/script-logs";
import { type DashboardContent, type HostOnboardingData, type OverviewDoc, supabase } from "@/lib/supabase";
import { useSuppressFloatingThemeToggle, useTheme } from "@/providers/theme-provider";
import { compressImageFile } from "@/utils/compress-image";
import { cx } from "@/utils/cx";
// Type-only: the PDF builder itself is loaded on demand in downloadMasterDocPdf,
// so jsPDF stays out of this page's chunk.
import type { MasterDocSection } from "@/utils/master-document-pdf";
import {
    type ClientOnboardingData,
    ClientOnboardingFormPage,
    type OnboardingAnswerSection,
    clientOnboardingAnswers,
    clientOnboardingProgress,
    ensureClientOnboardingForm,
} from "./client-onboarding-form-page";
import { HostOnboardingFormPage, ensureHostOnboardingForm, hostOnboardingAnswers, hostOnboardingProgress } from "./host-onboarding-form-page";

const PASSWORD = "ANHTUAN";
const SUPPORT_EMAIL = "anhtuan@hiddengem.media";
const CONTACT_SUBJECT = "Client Dashboard — I'd like some help";
const CONTACT_BODY = `Hi HiddenGem Team,

I have a question about my client dashboard.

• What I'd like to know / update:
• Anything else you should know:

Thanks!`;
const CONTACT_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(CONTACT_SUBJECT)}&body=${encodeURIComponent(CONTACT_BODY)}`;

type BrandColor = DashboardContent["brand"]["colors"][number];
type Highlight = DashboardContent["instagram"]["highlights"][number];
type GhlItem = DashboardContent["ghl"]["items"][number];
type RevenueMonth = DashboardContent["revenue"]["months"][number];
type QuickLink = DashboardContent["links"][number];
type VideoGuide = NonNullable<DashboardContent["videos"]>[number];
type FaqItem = NonNullable<DashboardContent["foundation"]>["faqs"][number];

const STATUS_OPTIONS = ["Onboarding", "Active", "Paused"] as const;

const normEmail = (e: string) => e.trim().toLowerCase();

/**
 * Sign-in / no-access screen for a client dashboard.
 *
 * Two states, because they need different words: nobody signed in yet, versus signed in as
 * someone this dashboard isn't shared with. The second is the one people actually hit —
 * Google silently reuses whichever account is already active — so it names the address and
 * offers to switch rather than just refusing.
 *
 * The client's name is deliberately absent: a stranger who lands here learns nothing about
 * whose dashboard it is.
 */
const DashboardAccessGate = ({
    allowedEmails,
    sharePassword,
    onUnlock,
    backgroundUrl,
}: {
    allowedEmails: string[];
    sharePassword: string;
    onUnlock: () => void;
    /** Per-client override (image or video). Falls back to the shared leaf loop. */
    backgroundUrl?: string;
}) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState("");

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const emailOk = allowedEmails.some((a) => normEmail(a) === normEmail(email));
        const pwOk = password === sharePassword;
        // One message for either failure. Saying "that email isn't on the list" would let
        // someone probe which addresses a dashboard is shared with.
        if (!emailOk || !pwOk) {
            setError("That email and password don't match this dashboard.");
            return;
        }
        setError("");
        onUnlock();
    };

    return (
        <SignInBackdrop backgroundUrl={backgroundUrl}>
            <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-primary p-8 shadow-2xl ring-1 ring-secondary">
                <img src="/hgm logo/Favicon ON LIGHT.svg" alt="HiddenGem Media" className="mx-auto size-11" draggable={false} />
                <h1 className="mt-5 text-center text-lg font-semibold text-primary">This dashboard is private</h1>
                <p className="mt-2 text-center text-sm text-tertiary text-pretty">
                    Enter the email and password your HiddenGem team shared with you.
                </p>

                <div className="mt-6 flex flex-col gap-3">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@yourbusiness.com"
                        autoComplete="username"
                        autoFocus
                        className="w-full rounded-lg bg-primary px-3 py-2.5 text-sm text-primary ring-1 ring-secondary outline-none focus:ring-brand"
                    />
                    <div className="flex items-center gap-2">
                        <input
                            type={showPw ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            autoComplete="current-password"
                            className="min-w-0 flex-1 rounded-lg bg-primary px-3 py-2.5 text-sm text-primary ring-1 ring-secondary outline-none focus:ring-brand"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPw((v) => !v)}
                            aria-label={showPw ? "Hide password" : "Show password"}
                            className="shrink-0 rounded-lg px-2 py-2 text-xs font-semibold text-brand-secondary transition duration-100 ease-linear hover:bg-secondary"
                        >
                            {showPw ? "Hide" : "Show"}
                        </button>
                    </div>
                </div>

                {error && (
                    <p className="mt-3 text-sm text-error-primary" role="alert">
                        {error}
                    </p>
                )}

                <Button size="md" type="submit" className="mt-5 w-full" isDisabled={!email.trim() || !password}>
                    Open my dashboard
                </Button>
                <p className="mt-4 text-center text-xs text-quaternary">Lost your details? Reply to your HiddenGem email and we'll resend them.</p>
            </form>
        </SignInBackdrop>
    );
};

/**
 * Status pill colour on the CLIENT dashboard. Local on purpose — the team's Client List
 * keeps its own mapping, where telling Onboarding from Active still matters.
 *
 * Onboarding reads green rather than blue: a client opening their own dashboard shouldn't
 * see a colour that says "not underway yet". Paused stays amber, because that genuinely is
 * a stop and it would be dishonest to paint it as running.
 */
const statusColor = (status: string) => (status === "Paused" ? "warning" : "success");

function slugify(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2)}`);

const DEFAULT_FOUNDATION: NonNullable<DashboardContent["foundation"]> = {
    propertyBasics: "",
    persona: "",
    toneOfVoice: "",
    amenities: "",
    localRecommendations: "",
    bookingLinks: "",
    faqs: [],
};

/**
 * The Client Overview Document's fields, in the order they appear on screen.
 *
 * One list drives the form, the "x of 26 filled" counter and the tool schema the model
 * fills, so a field can't exist in one of those and be missing from another. `long` picks a
 * textarea over a single line; `half` puts two fields side by side.
 */
const OVERVIEW_SECTIONS: {
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
            { key: "short_term_goals", label: "Short-term goals", placeholder: "e.g. increasing bookings, building brand awareness, optimizing listings", long: true },
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

/** The kickoff numbers. Kept out of OVERVIEW_SECTIONS because they render as tiles, not rows. */
const OVERVIEW_BASELINE: { key: keyof OverviewDoc; label: string }[] = [
    { key: "instagram_followers", label: "Instagram followers" },
    { key: "facebook_followers", label: "Facebook followers" },
    { key: "tiktok_followers", label: "TikTok followers" },
    { key: "email_list_size", label: "Email list size" },
];

/** Everything the "x of 26 fields filled" counter looks at. Properties are a list, so they
 *  are deliberately not part of the count — a client with two properties isn't 24/26 done. */
const OVERVIEW_COUNTED_FIELDS: (keyof OverviewDoc)[] = [
    ...OVERVIEW_SECTIONS.flatMap((s) => s.fields.map((f) => f.key)),
    ...OVERVIEW_BASELINE.map((f) => f.key),
    "direct_booking_split",
    "instagram_screenshot",
];

const DEFAULT_OVERVIEW_DOC: OverviewDoc = {
    client_name: "", business_name: "", email: "", business_type: "", locations: "",
    instagram: "", tiktok: "", direct_booking_website: "", airbnb: "",
    properties: [],
    short_term_goals: "", long_term_goals: "", success_metrics: "",
    target_audience: "", unique_selling_points: "", branding: "", competitor_inspiration: "", market_insights: "",
    communication_style: "", concerns: "", other_notes: "",
    instagram_followers: "", facebook_followers: "", tiktok_followers: "", email_list_size: "",
    direct_booking_split: "", instagram_screenshot: "",
};

/** Compile the Master Document the AM reviews — deterministic v1 template assembled
 * from the Foundation fields (per the project-log decision: the client answers the
 * FAQs/forms, we "follow a template and generate for AM so they just review it").
 * Swap for Claude-API generation once the shared server-function decision lands. */
const compileMasterDocument = (
    clientName: string,
    clientWebsite: string,
    f: NonNullable<DashboardContent["foundation"]>,
): { doc: string; missing: string[]; sections: MasterDocSection[]; faqs: FaqItem[]; generatedOn: string } => {
    const sections = [
        { label: "Property basics", value: f.propertyBasics },
        { label: "Ideal guest persona", value: f.persona },
        { label: "Tone of voice", value: f.toneOfVoice },
        { label: "Amenities & house rules", value: f.amenities },
        { label: "Local recommendations", value: f.localRecommendations },
        { label: "Booking & upsell links", value: f.bookingLinks },
    ];
    const faqs = f.faqs.filter((q) => q.question.trim());
    const missing = sections.filter((s) => !s.value.trim()).map((s) => s.label);
    if (!faqs.length) missing.push("FAQ bank");
    const generatedOn = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    const lines: string[] = [
        `# Master Document — ${clientName.trim() || "Client"}`,
        "",
        [clientWebsite.trim() && `Website: ${clientWebsite.trim()}`, `Generated: ${generatedOn}`].filter(Boolean).join("  ·  "),
        "",
    ];
    sections.forEach((s, i) => lines.push(`## ${i + 1}. ${s.label}`, "", s.value.trim() || "_Not provided yet._", ""));
    lines.push(`## ${sections.length + 1}. FAQ bank${faqs.length ? ` (${faqs.length})` : ""}`, "");
    if (!faqs.length) lines.push("_No FAQs yet._", "");
    faqs.forEach((q) => lines.push(`**Q: ${q.question.trim()}**`, `A: ${q.answer.trim() || "_No answer yet._"}`, ""));
    // `sections`/`faqs`/`generatedOn` are returned alongside the markdown so the PDF
    // export can lay the document out properly instead of re-parsing the markdown.
    return { doc: lines.join("\n"), missing, sections, faqs, generatedOn };
};

const DEFAULT_GHL_ITEMS: GhlItem[] = [
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
const defaultLinks = (base: string): QuickLink[] => [
    { title: "Meta Pixel Setup Guide", description: "Install your tracking pixel step by step.", url: `/${base}-metapixel` },
    { title: "Lead Capture Popup", description: "Your website popup & inline form setup.", url: `/${base}-leadcapture` },
    { title: "Chat Widget", description: "Add the website chat widget to your site.", url: `/${base}-chatwidget` },
];

const TEMPLATE_CONTENT: DashboardContent = {
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
const createDefaultContent = (base: string): DashboardContent => ({
    ...TEMPLATE_CONTENT,
    status: "Onboarding",
    revenue: { currency: "USD", months: [] },
    ghl: { ...TEMPLATE_CONTENT.ghl, items: DEFAULT_GHL_ITEMS.map((i) => ({ ...i })) },
    links: defaultLinks(base),
    foundation: { ...DEFAULT_FOUNDATION, faqs: [] },
    videos: [],
    client_visible: [...DEFAULT_CLIENT_VISIBLE],
});

/** Merge a partial jsonb blob from the DB over the defaults so old rows never crash new sections. */
const mergeContent = (partial?: Partial<DashboardContent> | null): DashboardContent => ({
    ...TEMPLATE_CONTENT,
    ...partial,
    brand: { ...TEMPLATE_CONTENT.brand, ...partial?.brand },
    instagram: { ...TEMPLATE_CONTENT.instagram, ...partial?.instagram },
    ghl: { ...TEMPLATE_CONTENT.ghl, ...partial?.ghl },
    revenue: { ...TEMPLATE_CONTENT.revenue, ...partial?.revenue },
    links: partial?.links ?? TEMPLATE_CONTENT.links,
    videos: partial?.videos ?? [],
    foundation: { ...DEFAULT_FOUNDATION, ...partial?.foundation, faqs: partial?.foundation?.faqs ?? [] },
    // Absent ⇒ the intake-forms-only default. An AM who hides everything stores an empty
    // array, which is meaningfully different from "never set" and must survive as [].
    client_visible: partial?.client_visible ?? [...DEFAULT_CLIENT_VISIBLE],
});

/**
 * Side-menu groups — what the client actually needs to see, in the order they meet it:
 * the two forms we need from them, the brand work those produce, the marketing built on
 * top, then the reference material they keep coming back to.
 *
 * `num` is null throughout on purpose. This replaced a numbered Phase 1–5 taxonomy that
 * mirrored the team's Asana project: useful to us, but it asked the client to learn our
 * internal process to find a page. Grouping is now by what a thing IS. The team's phase
 * tracking still lives on /home and the Client List, driven by clients.onboarding_phase —
 * this only changes what the client is shown.
 *
 * `bg`/`text` are kept because SectionEyebrow still renders a group pill above each
 * section body.
 */
const PHASES = {
    // "Your forms", not "Client input": the client reading this dashboard would be looking at a
    // category named after their role in our process. Every label here is read by them first.
    input: { num: null, label: "Your forms", bg: "bg-utility-indigo-50", text: "text-utility-indigo-700" },
    brandwork: { num: null, label: "Brand foundation", bg: "bg-brand-secondary", text: "text-brand-secondary" },
    marketing: { num: null, label: "Marketing", bg: "bg-utility-purple-50", text: "text-utility-purple-700" },
    resources: { num: null, label: "Resources", bg: "bg-success-secondary", text: "text-success-primary" },
} as const;
type PhaseId = keyof typeof PHASES;

/** Funnel model — still how the Overview explains the moving parts, independent of phases. */
/**
 * The client's journey, as Overview presents it — one ordered timeline from the first
 * form to a finished website. Replaced a "Your setup" tracker plus a funnel explainer:
 * the tracker was a subset of these steps, and two of the four funnel cards pointed at
 * Website and GoHighLevel, sections that are no longer on the client's menu.
 *
 * `auto` steps read their real state (submitted forms) and are never ticked by hand, so a
 * tick can't disagree with the answer count shown right next to it. Everything else is an
 * AM tick stored in content.journey_done — calls and reviews happen off-platform and
 * there is nothing to infer them from.
 */
type JourneyStepId = "form" | "kickoff" | "call" | "vision" | "masterdoc" | "brandkit" | "funnel" | "resources" | "website";

/** Dustin's strategy-call booking page, linked from the Kick-off Call step. */
const KICKOFF_CALENDLY = "https://calendly.com/dustin-d-baker/strategy";

const JOURNEY_STEPS: {
    id: JourneyStepId;
    label: string;
    detail: string;
    icon: FC<{ className?: string }>;
    /** Section this step jumps to, when it has one. */
    to?: SectionId;
    /** Derived from real data instead of ticked. */
    auto?: boolean;
    /** External link this step offers (booking pages and the like). */
    href?: string;
    hrefLabel?: string;
    /** Step that must be done before `href` is offered. */
    requires?: JourneyStepId;
}[] = [
    { id: "form", label: "Fill in the Onboarding form", detail: "Your business details and the logins we need.", icon: ClipboardCheck, to: "intake", auto: true },
    {
        id: "kickoff",
        label: "Book the Kick-off Call",
        detail: "Pick a time that suits you and we'll take it from there.",
        icon: Calendar,
        // Booking opens only once the Onboarding form is in — the call is only useful if the
        // team has had time to read the answers, which is why the form says to complete it
        // at least 12 hours beforehand. Until then the step explains what's blocking it
        // rather than offering a link that leads to a wasted call.
        href: KICKOFF_CALENDLY,
        hrefLabel: "Book your call",
        requires: "form",
    },
    { id: "call", label: "Onboarding Call", detail: "With Dustin and your Account Manager.", icon: Users01 },
    { id: "vision", label: "Fill in the Brand Vision Form", detail: "How your brand should look, sound and feel.", icon: FileCheck02, to: "onboarding", auto: true },
    { id: "masterdoc", label: "Review the Master Brand", detail: "Persona, tone, amenities and FAQs — what everything else reads from.", icon: FileCheck02, to: "foundation" },
    { id: "brandkit", label: "Review the Brand Kit", detail: "Colours, fonts and logo.", icon: Image01, to: "brand" },
    {
        id: "funnel",
        label: "Review the marketing funnel",
        detail: "Landing page, Welcome Flow, Repeat Flow, Pinned Posts and example Reels.",
        icon: Mail01,
        to: "flow",
    },
    { id: "resources", label: "Add your resources", detail: "Folder of content, plus the Brand Kit document.", icon: Folder, to: "contentfolder" },
    { id: "website", label: "Set up the website", detail: "If a website is in scope for you.", icon: Globe01, to: "ownerguide" },
];

const SectionEyebrow = ({ section }: { section: SectionId }) => {
    const phase = phaseOfSection(section);
    if (!phase) return null;
    const p = PHASES[phase];
    return (
        <div className="flex items-center gap-3">
            <span
                className={cx("inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide uppercase", p.bg, p.text)}
            >
                {p.num !== null && <span className="tabular-nums opacity-70">Phase {p.num}</span>}
                {p.label}
            </span>
            <span className="h-px flex-1 bg-border-secondary" />
        </div>
    );
};

const SectionHeading = ({ children }: { children: ReactNode }) => (
    <h2 className="mt-4 text-display-xs font-semibold text-primary md:text-display-sm">{children}</h2>
);

const StatTile = ({ label, value, change }: { label: string; value: string; change?: ReactNode }) => (
    <div className="rounded-xl p-5 ring-1 ring-secondary">
        <p className="text-sm font-medium text-tertiary">{label}</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
            <p className="text-display-xs font-semibold text-primary md:text-display-sm">{value}</p>
            {change}
        </div>
    </div>
);

/** Side-menu taxonomy — mirrors the funnel Dustin walks every client through on the
 * onboarding call: Foundation (the Master Document everything else reads from) feeds
 * Top of funnel (get seen) → Middle of funnel (nurture + capture) → Bottom of funnel
 * (convert to a direct booking). Module scope so the array isn't rebuilt every render. */
type SectionId =
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

/** Sits above the funnel groups — not a funnel stage itself, just "home" (hero + the funnel explainer). */
const OVERVIEW_ITEM = { id: "overview" as const, label: "Overview", icon: LayoutAlt01 };

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
const DEFAULT_CLIENT_VISIBLE: SectionId[] = ["intake", "onboarding"];

/* Eye / eye-off, matching the owner guide's per-client step toggle so the gesture reads
   the same in both places. Inline SVG for the same reason it is there: these are 13px
   controls inside a dense row, not icon-set sizes. */
const EyeGlyph = () => (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);
const EyeOffGlyph = () => (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" />
    </svg>
);

/**
 * Side-menu groups: Client Input first, then the five onboarding phases.
 *
 * The phases mirror the team's Asana onboarding project and ONBOARDING_PHASES in
 * dashboard-screen.tsx (which /home tracks per client), so the client now sees the
 * same journey the team runs. Client Input stays pinned above them: those two forms
 * are what every phase is built from, and the client should never hunt for the one
 * thing we need from them.
 *
 * "Signing On" (phase 0) is deliberately absent — by the time this dashboard exists,
 * it's done.
 */
const NAV_GROUPS: {
    label: string;
    phase: PhaseId;
    items: {
        id: SectionId;
        label: string;
        icon: typeof LayoutAlt01;
        soon?: boolean;
        to?: string;
        /**
         * Never rendered for a client — not as a row, not as "Soon", not as anything.
         *
         * Different from the eye-toggle reveal every other row uses. Those are things the
         * client will eventually see and are merely not ready; this is a row whose contents
         * are about the client rather than for them, so there is nothing to reveal later and
         * no eye offered in edit mode.
         */
        teamOnly?: boolean;
    }[];
}[] = [
    {
        label: "Your forms",
        phase: "input",
        items: [
            { id: "intake", label: "Onboarding form", icon: ClipboardCheck },
            { id: "onboarding", label: "Brand Vision Form", icon: FileCheck02 },
        ],
    },
    {
        label: "Brand foundation",
        phase: "brandwork",
        items: [
            { id: "overviewdoc", label: "Overview Document", icon: ClipboardCheck, teamOnly: true },
            { id: "foundation", label: "Master Brand", icon: FileCheck02 },
            { id: "brand", label: "Brand Kit", icon: Image01 },
        ],
    },
    {
        label: "Marketing",
        phase: "marketing",
        items: [
            { id: "landing", label: "Landing page", icon: Globe01, soon: true },
            { id: "flow", label: "Welcome Flow", icon: Mail01 },
            { id: "repeatflow", label: "Repeat Flow", icon: Repeat01, soon: true },
            { id: "pinnedposts", label: "Pinned Posts / Story", icon: Camera01, soon: true },
            { id: "reels", label: "Example Reels", icon: PlayCircle, soon: true },
        ],
    },
    {
        label: "Resources",
        phase: "resources",
        items: [
            // Both are links, not sections: the folder opens the client's own content
            // drive, the owner guide opens THAT client's guide (never the shared
            // template). Each falls back to "Soon" until its target exists.
            { id: "contentfolder", label: "Folder of Content", icon: Folder },
            // Shortened from "Website Setup — Owner guide": that truncated to
            // "Website Setup — Ow…" at the 276px sidebar width.
            { id: "ownerguide", label: "Website Setup Guide", icon: BookOpen01 },
        ],
    },
];

/**
 * Sections that still exist and render, but are deliberately off the side menu.
 *
 * Their data is untouched in Supabase and they stay in SECTIONS, so `#hash` deep links
 * and the sidebar search still reach them, and Overview's funnel cards still jump to
 * them. Moving one back onto the menu is a single line in NAV_GROUPS — nothing here is
 * a one-way door.
 */
const HIDDEN_ITEMS: { id: SectionId; label: string; icon: typeof LayoutAlt01 }[] = [
    { id: "website", label: "Website", icon: Globe01 },
    { id: "instagram", label: "Instagram", icon: Camera01 },
    { id: "chatwidget", label: "Chat Widget", icon: MessageChatCircle },
    { id: "ghl", label: "GoHighLevel Setup", icon: Target04 },
    { id: "videos", label: "Video Guides", icon: PlayCircle },
    { id: "revenue", label: "Revenue & Results", icon: TrendUp01 },
    { id: "comms", label: "Communication Log", icon: MessageChatCircle },
];

/** Which group a section belongs to — drives the eyebrow above each section body. */
const phaseOfSection = (id: SectionId): PhaseId | null => NAV_GROUPS.find((g) => g.items.some((i) => i.id === id))?.phase ?? null;

const SECTIONS = [OVERVIEW_ITEM, ...NAV_GROUPS.flatMap((g) => g.items), ...HIDDEN_ITEMS];

/**
 * Sections a client can never reach, by any route.
 *
 * Derived from the nav rather than hand-listed so adding a `teamOnly` row can't leave the
 * search box or a pasted deep link as a way in that somebody forgot to close.
 */
const TEAM_ONLY_SECTIONS = new Set<SectionId>(NAV_GROUPS.flatMap((g) => g.items.filter((i) => i.teamOnly).map((i) => i.id)));

/** Read from the form itself so the copy never goes stale if a question is added. */
const ONBOARDING_TOTAL_QUESTIONS = hostOnboardingProgress().total;

type SearchHit = { id: SectionId; label: string; sub?: string };

/**
 * Header search — client-scoped, NOT the internal team's sitewide search. It only
 * searches this one client's own sidebar sections, links and FAQs (passed in as
 * `hits`) — never other clients, internal team pages, or admin routes. Purely local
 * filtering over already-loaded props; no network calls.
 */
const ClientSearchBar = ({ hits, onSelect }: { hits: SearchHit[]; onSelect: (id: SectionId) => void }) => {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
        };
        window.addEventListener("mousedown", onDown);
        return () => window.removeEventListener("mousedown", onDown);
    }, [open]);

    const q = query.trim().toLowerCase();
    const results = q ? hits.filter((h) => h.label.toLowerCase().includes(q) || h.sub?.toLowerCase().includes(q)) : hits;

    const go = (id: SectionId) => {
        onSelect(id);
        setQuery("");
        setOpen(false);
        inputRef.current?.blur();
    };

    return (
        <div ref={containerRef} className="relative flex flex-1 items-center justify-center px-1">
            <div
                className={cx(
                    "flex w-full max-w-md items-center gap-2.5 rounded-full border bg-primary px-4 py-2 transition duration-100 ease-linear",
                    open ? "border-brand ring-2 ring-brand/15" : "border-secondary hover:border-primary",
                )}
            >
                <SearchLg
                    className={cx("size-4 shrink-0 transition duration-100 ease-linear", open ? "text-fg-brand-primary" : "text-quaternary")}
                    aria-hidden="true"
                />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && results[0]) go(results[0].id);
                        else if (e.key === "Escape") {
                            setOpen(false);
                            inputRef.current?.blur();
                        }
                    }}
                    placeholder="Search your dashboard…"
                    className="min-w-0 flex-1 bg-transparent text-sm text-primary outline-none placeholder:text-placeholder"
                />
            </div>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.14 }}
                        className="absolute top-full left-1/2 z-30 mt-2 w-full max-w-md -translate-x-1/2 overflow-hidden rounded-2xl bg-primary shadow-2xl ring-1 ring-secondary"
                    >
                        <div className="max-h-[50vh] overflow-y-auto p-2">
                            {results.length === 0 ? (
                                <p className="px-4 py-6 text-center text-sm text-tertiary">No matches for “{query}”</p>
                            ) : (
                                results.map((h, i) => (
                                    <button
                                        key={`${h.id}-${i}`}
                                        type="button"
                                        onClick={() => go(h.id)}
                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-secondary transition duration-100 ease-linear hover:bg-secondary hover:text-primary"
                                    >
                                        <span className="flex-1 truncate">{h.label}</span>
                                        {h.sub && <span className="shrink-0 truncate text-xs text-quaternary">{h.sub}</span>}
                                    </button>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export interface ClientDashboardPageProps {
    /** Page slug — when set, locking persists edits to dashboard_pages (shared). */
    slug?: string;
    initialClientName?: string;
    initialClientWebsite?: string;
    initialData?: Partial<DashboardContent> | null;
    /** Only the template page (/client-dashboard) shows the “+” create button. */
    isTemplate?: boolean;
}

/**
 * Side-menu item. Matches the Untitled UI nav language from
 * components/application/app-navigation (h-9 target, rounded-md, semibold label,
 * focus-visible ring) but renders a real <button>: these switch an in-page
 * section, not a route, and NavItemBase renders an <a role="link"> which would
 * announce navigation that never happens.
 */
const SectionNavItem = ({
    icon: Icon,
    label,
    current,
    disabled,
    badge,
    indent,
    onClick,
    action,
}: {
    icon: FC<{ className?: string }>;
    label: string;
    current: boolean;
    disabled?: boolean;
    /** Real state for this section — a count, "Done", etc. */
    badge?: ReactNode;
    indent?: boolean;
    onClick: () => void;
    /** Edit-mode control (the per-client eye toggle), rendered OUTSIDE the row button:
     *  a <button> nested in a <button> is invalid HTML and its click would bubble into
     *  the row's own handler, switching section on every toggle. */
    action?: ReactNode;
}) => (
    <div className="relative flex items-center">
        <button
            type="button"
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            aria-current={current ? "page" : undefined}
            className={cx(
                "group/item relative flex min-h-9 w-full cursor-pointer items-center rounded-md p-2 text-left outline-focus-ring transition duration-100 ease-linear select-none focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2",
                indent && "pl-4",
                action && "pr-8",
                current ? "bg-secondary hover:bg-secondary_hover" : "hover:bg-primary_hover",
                disabled && "cursor-not-allowed opacity-60 hover:bg-transparent",
            )}
        >
            <Icon
                aria-hidden="true"
                className={cx(
                    "mr-2 size-5 shrink-0 transition-inherit-all",
                    current ? "text-fg-brand-primary" : "text-fg-quaternary group-hover/item:text-fg-quaternary_hover",
                )}
            />
            <span
                className={cx(
                    "flex-1 truncate text-sm font-semibold transition-inherit-all",
                    current ? "text-primary" : "text-secondary group-hover/item:text-secondary_hover",
                )}
            >
                {label}
            </span>
            {badge}
        </button>
        {action && <div className="absolute right-1 flex shrink-0 items-center">{action}</div>}
    </div>
);

/** Signed-URL playback for a recorded answer shown on the dashboard. */
const InlineRecording = ({ path, kind }: { path: string; kind: "audio" | "video" | "" }) => {
    const [url, setUrl] = useState("");
    useEffect(() => {
        let live = true;
        supabase.storage
            .from("recordings")
            .createSignedUrl(path, 60 * 60)
            .then(({ data }) => {
                if (live && data?.signedUrl) setUrl(data.signedUrl);
            });
        return () => {
            live = false;
        };
    }, [path]);
    if (!url) return <p className="mt-1 text-xs text-quaternary">Loading recording…</p>;
    return (
        <div className="mt-2">
            <p className="mb-1 text-xs font-medium text-tertiary">{kind === "video" ? "Video answer" : "Voice answer"}</p>
            <RecordingPlayer src={url} kind={kind} className={kind === "video" ? "aspect-video w-full max-w-sm rounded-lg bg-primary" : "w-full max-w-sm"} />
        </div>
    );
};

/** One labelled list inside a recording summary. Renders nothing when the model had
 *  nothing to put in it, so an empty answer doesn't produce four empty headings. */
const SummaryBullets = ({ title, icon: Icon, items }: { title: string; icon: typeof Flag01; items?: string[] }) => {
    if (!items?.length) return null;
    return (
        <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-secondary">
                <Icon className="size-3.5 shrink-0 text-fg-quaternary" aria-hidden="true" />
                {title}
            </p>
            <ul className="mt-1 flex flex-col gap-1">
                {items.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-tertiary">
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-quaternary" aria-hidden="true" />
                        <span className="text-pretty">{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

/**
 * AI summary of a recorded answer — TEAM ONLY.
 *
 * An AM opening a submitted form shouldn't have to sit through a two-minute video to find
 * out what the client said. This reads the recording back as key points and action items.
 *
 * The client must never see this, so it is gated twice over. The caller renders it only
 * when `isTeamView`, and independently of that the `script_logs` table denies `anon`
 * outright and restricts `authenticated` to @hiddengem.media — so even a bug that rendered
 * this for a client would have no data to show. The visible "Only your team sees this"
 * label is not decoration: an AM needs to know at a glance that a machine's reading of the
 * client's words is not being shown back to the client as if it were their own answer.
 *
 * Summaries that already exist appear on their own; generating a new one takes a click,
 * because transcription is billed per minute and a dashboard that quietly spent money
 * every time someone opened a form would be a bad surprise.
 */
const TeamRecordingSummary = ({ log }: { log?: ScriptLog }) => {
    const shell = "mt-3 rounded-xl bg-secondary p-3 ring-1 ring-secondary";
    const eyebrow = (
        <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-brand-secondary uppercase">
            <Stars02 className="size-3.5 shrink-0" aria-hidden="true" />
            AI summary
            <span className="font-normal tracking-normal text-quaternary normal-case">· only your team sees this</span>
        </p>
    );

    // Nothing generated yet. Deliberately not a per-recording button: the AM presses one
    // control above the answers and every recording on the form is handled, so a form with
    // a dozen recordings isn't a dozen clicks.
    if (!log) {
        return <p className="mt-2 text-xs text-quaternary">Not summarised yet.</p>;
    }

    if (isInFlight(log)) {
        return (
            <div className={shell}>
                {eyebrow}
                <p className="mt-1.5 flex items-center gap-2 text-sm text-tertiary">
                    <span className="size-3.5 animate-spin rounded-full border-2 border-brand border-t-transparent" aria-hidden="true" />
                    {log.status === "transcribing" ? "Transcribing the recording…" : log.status === "summarising" ? "Writing the summary…" : "Waiting to start…"}
                    {isStalled(log) && " — this is taking longer than expected."}
                </p>
            </div>
        );
    }

    if (log.status === "error") {
        return (
            <div className="mt-3 rounded-xl bg-error-primary p-3 ring-1 ring-error_subtle">
                {eyebrow}
                <p className="mt-1.5 flex gap-2 text-sm text-tertiary text-pretty">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-fg-error-secondary" aria-hidden="true" />
                    {log.error || "That didn't work."}
                </p>
                <button
                    type="button"
                    onClick={() => void retrySummary(log.id)}
                    className="mt-2 text-sm font-semibold text-brand-secondary transition duration-100 ease-linear hover:underline"
                >
                    Try again
                </button>
            </div>
        );
    }

    const s = log.summary;
    if (!s) return null;

    return (
        <div className={shell}>
            {eyebrow}
            <p className="mt-1.5 text-sm font-semibold text-primary text-pretty">{s.headline}</p>
            {s.context && <p className="mt-1 text-sm text-tertiary text-pretty">{s.context}</p>}
            <div className="mt-3 flex flex-col gap-3">
                <SummaryBullets title="Key points" icon={Lightbulb01} items={s.key_points} />
                <SummaryBullets title="Action items" icon={CheckDone01} items={s.action_items} />
                <SummaryBullets title="Worth quoting" icon={MessageTextSquare01} items={s.quotes} />
                <SummaryBullets title="Flagged" icon={Flag01} items={s.flags} />
            </div>
            {log.transcript && (
                <details className="mt-3">
                    <summary className="cursor-pointer list-none text-xs font-medium text-quaternary select-none hover:text-tertiary">
                        Read the transcript instead
                    </summary>
                    <p className="mt-2 text-sm whitespace-pre-wrap text-tertiary">{log.transcript}</p>
                </details>
            )}
        </div>
    );
};

/**
 * A submitted form rendered inline, grouped by section.
 *
 * Takes pre-computed sections rather than raw form data so it serves BOTH client-input
 * forms — clientOnboardingAnswers() for the Onboarding Form and hostOnboardingAnswers()
 * for the Brand Vision Form. Their answer shapes are structurally identical, so neither
 * form page has to import from the other.
 *
 * Passwords stay masked behind a per-row reveal: this panel sits open on the dashboard, a
 * weaker place to park a credential than a review screen someone had to deliberately open.
 * (Only the Onboarding Form carries any; Brand Vision has none.)
 */
const OnboardingAnswers = ({
    sections,
    onEdit,
    isTeamView,
    clientName,
}: {
    sections: OnboardingAnswerSection[];
    onEdit: (field: string) => void;
    /**
     * Whose voice to write in. The client reading this panel is looking at their OWN submission,
     * so "Their answers" tells them the site is talking about them to somebody else. False while
     * a team member previews as the client, so the preview shows what the client actually gets.
     */
    isTeamView?: boolean;
    clientName: string;
}) => {
    const [shown, setShown] = useState<Record<string, boolean>>({});
    const answered = sections.flatMap((s) => s.rows).filter((r) => r.lines.length || r.mediaPath).length;

    /* ── Team-only: AI summaries of the recorded answers ────────────────
       Every query below is gated on isTeamView. That is belt-and-braces rather than the
       actual protection — script_logs denies anon and restricts authenticated to
       @hiddengem.media — but a client should not be firing requests that can only 403. */

    const { user: viewer } = useAuthUser();
    const [summaries, setSummaries] = useState<Record<string, ScriptLog>>({});
    const [bulkBusy, setBulkBusy] = useState(false);
    const [summaryError, setSummaryError] = useState("");

    const mediaRows = useMemo(() => sections.flatMap((s) => s.rows).filter((r) => r.mediaPath), [sections]);
    // A stable primitive to depend on: the rows array is rebuilt every render, so depending
    // on it directly would refetch summaries in a loop.
    const pathKey = mediaRows.map((r) => r.mediaPath).join("|");

    const loadSummaries = useCallback(async () => {
        const paths = pathKey ? pathKey.split("|") : [];
        if (!isTeamView || !paths.length) return;
        try {
            setSummaries(await listSummariesForPaths(paths));
        } catch (err) {
            // Non-fatal by design: the answers themselves must still render. A team member
            // who can't reach script_logs sees the recordings exactly as before.
            console.error("[dashboard] could not load recording summaries", err);
        }
    }, [isTeamView, pathKey]);

    useEffect(() => {
        void loadSummaries();
    }, [loadSummaries]);

    // Generation is a background function that can't call back, so the only way to learn it
    // finished is to look again — but only while something is actually running.
    const anyInFlight = Object.values(summaries).some(isInFlight);
    const loadRef = useRef(loadSummaries);
    loadRef.current = loadSummaries;
    useEffect(() => {
        if (!anyInFlight) return;
        const id = window.setInterval(() => void loadRef.current(), 4000);
        return () => window.clearInterval(id);
    }, [anyInFlight]);

    /**
     * Recordings with no summary and nothing already running for them.
     *
     * Anything already `done` is excluded, so pressing the button twice doesn't pay to
     * transcribe the same audio again. A failed row is excluded too — it has its own "Try
     * again" so one broken recording can't make the bulk button re-run the other eleven.
     */
    const pending = mediaRows.filter((r) => !summaries[r.mediaPath]);

    /**
     * One press, every recording on this form.
     *
     * Queued one at a time rather than with Promise.all: each row appears as it's accepted,
     * so a form with a dozen recordings visibly fills in instead of sitting still and then
     * changing all at once. The actual transcription work happens in parallel anyway — these
     * are just the inserts, and each one hands off to a background function that returns
     * immediately.
     */
    const generateAll = async () => {
        if (!pending.length) return;
        setBulkBusy(true);
        setSummaryError("");
        let failed = 0;
        for (const row of pending) {
            try {
                const created = await queueSummary({
                    // Recordings are namespaced by the FORM's slug, not the dashboard's, so
                    // the owning slug comes from the path rather than from this page.
                    clientSlug: row.mediaPath.split("/")[0],
                    clientName,
                    sourcePath: row.mediaPath,
                    sourceLabel: row.label,
                    mediaKind: row.mediaKind,
                    createdBy: viewer?.email ?? "",
                });
                setSummaries((prev) => ({ ...prev, [row.mediaPath]: created }));
            } catch (err) {
                console.error("[dashboard] could not queue a summary for", row.mediaPath, err);
                failed++;
            }
        }
        if (failed) {
            setSummaryError(`Couldn't start ${failed} of ${pending.length} — press again to retry those.`);
            setTimeout(() => setSummaryError(""), 6000);
        }
        setBulkBusy(false);
    };

    return (
        <div className="mt-5 border-t border-secondary pt-5">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <p className="text-sm font-semibold text-primary">
                    {isTeamView ? "Their answers" : "Your answers"}{" "}
                    <span className="font-normal text-tertiary tabular-nums">· {answered} answered</span>
                </p>
                {summaryError && (
                    <span className="text-sm text-error-primary" role="alert">
                        {summaryError}
                    </span>
                )}
                {isTeamView && (
                    <div className="flex flex-wrap items-center gap-3">
                        {/* The one control that reads every recording on this form. Team only —
                            the client never sees it, and never sees what it produces. Hidden
                            once there's nothing left to do rather than sitting there disabled,
                            because a permanently greyed-out button reads as broken. */}
                        {isTeamView && pending.length > 0 && (
                            <Button
                                size="sm"
                                color="secondary"
                                iconLeading={Stars02}
                                isLoading={bulkBusy}
                                showTextWhileLoading
                                onClick={() => void generateAll()}
                            >
                                {bulkBusy
                                    ? "Starting…"
                                    : `Summarise ${pending.length} recording${pending.length === 1 ? "" : "s"}`}
                            </Button>
                        )}
                    </div>
                )}
            </div>
            {/* Double the gap between sections. Now that each section is one card rather than a
                stack of small ones, the run between "Account Setup" and "Billing & Legal" is the
                only thing separating two dense blocks — at gap-6 they read as one continuous wall. */}
            <div className="mt-4 flex flex-col gap-12">
                {sections.map((s) => (
                    <section key={s.id}>
                        {/* Same icon the form showed for this section, so reading the answers back
                            uses the landmarks the client filled them in under. */}
                        <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-brand-secondary uppercase">
                            <s.icon className="size-4 shrink-0" aria-hidden="true" />
                            {s.title}
                        </p>
                        {/* One card per section rather than one per question. A client reading
                            their own answers back is scanning a section as a whole, and a stack of
                            separate cards chops that into unrelated-looking fragments. Dividers
                            keep the rows distinct without breaking the group apart. */}
                        <dl className="mt-3 divide-y divide-secondary overflow-hidden rounded-2xl bg-primary ring-1 ring-secondary">
                            {s.rows.map((row) => {
                                const empty = !row.lines.length && !row.mediaPath;
                                return (
                                    <div
                                        key={row.field}
                                        className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-1 p-4 transition duration-100 ease-linear hover:bg-secondary"
                                    >
                                        <dt className="col-start-1 row-start-1 text-md font-medium text-secondary">{row.label}</dt>
                                        <dd className="col-span-2 col-start-1 row-start-2 min-w-0">
                                            {empty && <span className="text-md text-quaternary italic">Not answered</span>}
                                            {row.lines.map((line, i) =>
                                                line.secret && !shown[row.field] ? (
                                                    <p key={i} className="flex items-center gap-2 text-md text-tertiary">
                                                        <span className="tracking-[0.2em]">••••••••</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShown((v) => ({ ...v, [row.field]: true }))}
                                                            className="text-sm font-semibold text-brand-secondary transition duration-100 ease-linear hover:underline"
                                                        >
                                                            Show
                                                        </button>
                                                    </p>
                                                ) : (
                                                    <p key={i} className="text-md break-words whitespace-pre-wrap text-tertiary">
                                                        {line.text}
                                                    </p>
                                                ),
                                            )}
                                            {row.mediaPath && <InlineRecording path={row.mediaPath} kind={row.mediaKind} />}
                                            {/* Team only. The client keeps seeing exactly what they
                                                recorded and nothing else. */}
                                            {row.mediaPath && isTeamView && <TeamRecordingSummary log={summaries[row.mediaPath]} />}
                                        </dd>
                                        <button
                                            type="button"
                                            onClick={() => onEdit(row.field)}
                                            title={`Edit — ${row.label}`}
                                            aria-label={`Edit ${row.label}`}
                                            // Always visible, not hover-revealed: this panel is read on phones and tablets
                                            // too, where there is no hover and an opacity-0 control is simply invisible.
                                            className="col-start-2 row-start-1 -mt-0.5 flex size-7 shrink-0 items-center justify-center justify-self-end rounded-lg text-fg-quaternary transition duration-100 ease-linear hover:bg-primary hover:text-brand-secondary hover:ring-1 hover:ring-secondary"
                                        >
                                            <Edit01 className="size-3.5" aria-hidden="true" />
                                        </button>
                                    </div>
                                );
                            })}
                        </dl>
                    </section>
                ))}
            </div>
        </div>
    );
};

export const ClientDashboardPage = ({ slug, initialClientName = "", initialClientWebsite = "", initialData, isTemplate = false }: ClientDashboardPageProps) => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { theme, setTheme } = useTheme();
    const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    // This page has its own theme toggle in the side menu (below) — the global
    // floating one would sit at the same top-right corner as the client badge.
    useSuppressFloatingThemeToggle();

    // Team detection — the lock/create controls are only visible to signed-in
    // @hiddengem.media members; clients see a clean read-only dashboard.
    const { user, loading: authLoading } = useAuthUser();

    /* ── "View as client" preview ──
       ?preview=client makes a signed-in team member see exactly what the client sees:
       the same menu, the same SOON rows, no edit mode, none of the team-only controls.
       Every one of those behaviours already reads `isTeam`, so forcing that single value
       false IS the whole feature — nothing downstream needs to know a preview exists. */
    const signedInAsTeam = !!user?.email && user.email.toLowerCase().endsWith("@hiddengem.media");
    const previewAsClient = signedInAsTeam && searchParams.get("preview") === "client";
    const isTeam = signedInAsTeam && !previewAsClient;
    const exitClientPreview = () => {
        const next = new URLSearchParams(searchParams);
        next.delete("preview");
        setSearchParams(next, { replace: true });
    };
    /** Not `replace`, so the browser back button also leaves the preview. */
    const enterClientPreview = () => {
        const next = new URLSearchParams(searchParams);
        next.set("preview", "client");
        setSearchParams(next);
    };

    // Editable content
    const [clientName, setClientName] = useState(initialClientName);
    const [clientWebsite, setClientWebsite] = useState(initialClientWebsite);
    const [content, setContent] = useState<DashboardContent>(() => mergeContent(initialData));

    // Lock state
    const [isLocked, setIsLocked] = useState(true);

    /**
     * Clicking the client's logo or name enters the client preview — but only while locked.
     * In edit mode the logo is the upload target, so hijacking that click would steal one
     * the AM meant for something else. `isTeam` is already false inside a preview, so this
     * can't fire twice; leaving is the banner's job.
     */
    const canEnterPreview = isTeam && isLocked;

    /* ── Who may open this dashboard ──
       Gated on `signedInAsTeam`, NOT `isTeam`: `isTeam` is forced false inside
       ?preview=client, and gating on it would throw a team member out of their own preview.
       Preview should change what you SEE, never whether you're allowed in.

       The template page has no client and no allowlist, so it's team-only. */
    const allowedEmails = content.allowed_emails ?? [];
    const viewerEmail = user?.email ? normEmail(user.email) : "";
    const isAllowedClient = !!viewerEmail && allowedEmails.some((e) => normEmail(e) === viewerEmail);

    /**
     * The gate is armed PER CLIENT, by the AM filling in the allowlist.
     *
     * An empty allowlist means this dashboard behaves exactly as it does today — open by
     * URL. That is deliberate: all 49 existing dashboards start empty, and enforcing on an
     * empty list would black out every live client the moment this deploys. Adding one
     * address arms the gate for that client and nobody else.
     *
     * This is a staged rollout, not the finished state. Once every dashboard has a list,
     * the check becomes unconditional and the read-gating RLS policy lands with it.
     */
    const sharePassword = (content.share_password ?? "").trim();
    /**
     * Armed only when BOTH an allowlist and a password exist. Requiring one without the
     * other would lock the client out of their own dashboard with no way in.
     */
    const gateArmed = allowedEmails.some((e) => e.trim()) && !!sharePassword;

    // Unlock survives navigation within the tab, not a new one — same lifetime as the
    // owner-guide share gate (sessionStorage, keyed per slug).
    const unlockKey = `cd_unlock_${slug ?? ""}`;
    const [clientUnlocked, setClientUnlocked] = useState(() => {
        try {
            return sessionStorage.getItem(unlockKey) === "1";
        } catch {
            return false;
        }
    });
    const unlockDashboard = () => {
        try {
            sessionStorage.setItem(unlockKey, "1");
        } catch {
            /* private browsing — the unlock just won't persist past this render */
        }
        setClientUnlocked(true);
    };

    const hasAccess = signedInAsTeam || isTemplate || !gateArmed || clientUnlocked || isAllowedClient;

    const updateAllowedEmails = (next: string[]) => setContent((c) => ({ ...c, allowed_emails: next }));
    const updateSharePassword = (next: string) => setContent((c) => ({ ...c, share_password: next }));

    // Side-menu logo + background uploads — click-to-upload in edit mode, compressed to WebP.
    const logoFileRef = useRef<HTMLInputElement>(null);
    const sidebarBgFileRef = useRef<HTMLInputElement>(null);
    const onPickLogo = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        try {
            const dataUrl = await compressImageFile(file);
            setContent((c) => ({ ...c, logo_url: dataUrl }));
        } catch {
            /* keep the current logo if compression fails */
        }
    };
    const onPickSidebarBg = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        try {
            const dataUrl = await compressImageFile(file);
            setContent((c) => ({ ...c, sidebar_bg_url: dataUrl }));
        } catch {
            /* keep the current background if compression fails */
        }
    };

    // Side-menu section — grouped by funnel stage (NAV_GROUPS, module scope above).
    // Overview is the client's main dashboard and is pinned at the top of the menu, so it
    // is where the page opens.
    const [activeSection, setActiveSection] = useState<SectionId>("overview");

    // Deep-link support: /client-dashboard#flow (or #overview) opens that side-menu
    // section on load — used by the Welcome Email Flow overview page's "live builder" link.
    useEffect(() => {
        const h = window.location.hash.replace("#", "");
        // "Soon" ids are in SECTIONS but have no section body yet, so honouring a hash
        // for one would render an empty page. Same exclusion the search index uses.
        if (h && SECTIONS.some((s) => s.id === h && !("soon" in s && s.soon))) setActiveSection(h as SectionId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Client Input → Onboarding Form ──
    // Every client's dashboard links to their own copy of the Brand Vision Form at
    // {base}-hostonboarding, derived from this page's own slug ({base}-dashboard).
    // The row is provisioned on first visit to the section, so no one has to create
    // it by hand for each client. The template dashboard points at the master form.
    const clientBase = slug ? slug.replace(/-dashboard$/, "") : "";
    const onboardingSlug = clientBase ? `${clientBase}-hostonboarding` : "";
    const onboardingHref = isTemplate || !onboardingSlug ? "/host-onboarding-form" : `/${onboardingSlug}`;
    const [onboardingStatus, setOnboardingStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
    const [onboardingInfo, setOnboardingInfo] = useState<{ answered: number; total: number; submittedAt?: string }>({ answered: 0, total: 0 });
    const [copiedOnboardingLink, setCopiedOnboardingLink] = useState(false);
    const onboardingFetchRef = useRef(false);
    const onboardingReady = onboardingStatus === "ready";
    const onboardingSubmittedAt = onboardingReady ? onboardingInfo.submittedAt : undefined;
    const onboardingSubmitted = !!onboardingSubmittedAt;
    const onboardingStarted = onboardingReady && onboardingInfo.answered > 0;

    // Two things this has to get right:
    //  • The in-flight guard is a ref, not `status` — StrictMode double-invokes the
    //    effect in dev and both runs close over the same pre-update status, so a
    //    state-only guard fires the request twice. The ref is reset on failure so a
    //    failed attempt can be retried.
    //  • Nothing is cancelled on section change: switching tabs doesn't unmount this
    //    page (a slug change remounts it — client-screen keys on slug), so letting a
    //    mid-flight response land is what stops the card stranding on "Checking…".
    useEffect(() => {
        // Overview's setup panel needs this count too, not just the section itself.
        // Also refreshes while on "intake": that is now the landing section, and the Brand
        // Vision badge has to be right on first paint, not only after a visit to Overview.
        if (!["onboarding", "overview", "intake"].includes(activeSection) || isTemplate || !onboardingSlug) return;
        // "error" waits for the explicit Try again (which resets status to idle).
        if (onboardingFetchRef.current || onboardingStatus === "ready" || onboardingStatus === "error") return;
        onboardingFetchRef.current = true;
        setOnboardingStatus("loading");
        const failed = () => {
            onboardingFetchRef.current = false;
            setOnboardingStatus("error");
        };
        // Hard ceiling on the check: while Supabase is unreachable the request can
        // hang without ever rejecting, which would strand the card on "Checking…".
        const timedOut = new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 10_000));
        Promise.race([ensureHostOnboardingForm({ slug: onboardingSlug, clientName, clientWebsite }), timedOut])
            .then((answers) => {
                if (!answers) {
                    failed();
                    return;
                }
                const p = hostOnboardingProgress(answers);
                setOnboardingInfo({ answered: p.answered, total: p.total, submittedAt: p.submittedAt });
                setBrandData(answers as Partial<HostOnboardingData>);
                setOnboardingStatus("ready");
            })
            .catch(failed);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSection, isTemplate, onboardingSlug, onboardingStatus]);

    // ── Client Input → Onboarding Form (the FIRST form — before Brand Vision) ──
    // Same provision-on-first-visit pattern as the Brand Vision block above,
    // against client_onboarding_pages at {base}-onboarding.
    const intakeSlug = clientBase ? `${clientBase}-onboarding` : "";
    const intakeHref = isTemplate || !intakeSlug ? "/client-onboarding-form" : `/${intakeSlug}`;
    const [intakeStatus, setIntakeStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
    const [intakeInfo, setIntakeInfo] = useState<{ answered: number; total: number; submittedAt?: string }>({ answered: 0, total: 0 });
    const [copiedIntakeLink, setCopiedIntakeLink] = useState(false);
    const intakeFetchRef = useRef(false);
    const intakeReady = intakeStatus === "ready";
    const intakeSubmittedAt = intakeReady ? intakeInfo.submittedAt : undefined;
    const intakeSubmitted = !!intakeSubmittedAt;
    const intakeStarted = intakeReady && intakeInfo.answered > 0;

    useEffect(() => {
        // Overview's setup panel needs this count too, not just the section itself.
        if ((activeSection !== "intake" && activeSection !== "overview") || isTemplate || !intakeSlug) return;
        if (intakeFetchRef.current || intakeStatus === "ready" || intakeStatus === "error") return;
        intakeFetchRef.current = true;
        setIntakeStatus("loading");
        const failed = () => {
            intakeFetchRef.current = false;
            setIntakeStatus("error");
        };
        const timedOut = new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 10_000));
        Promise.race([ensureClientOnboardingForm({ slug: intakeSlug, clientName, clientWebsite }), timedOut])
            .then((answers) => {
                if (!answers) {
                    failed();
                    return;
                }
                const p = clientOnboardingProgress(answers);
                setIntakeInfo({ answered: p.answered, total: p.total, submittedAt: p.submittedAt });
                setIntakeData(answers as Partial<ClientOnboardingData>);
                setIntakeStatus("ready");
            })
            .catch(failed);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSection, isTemplate, intakeSlug, intakeStatus]);

    /* ── Client-input forms open in a modal over the dashboard ──
       Keeps the AM/host in context instead of navigating away to the form page and
       back. The client's own shared link (/{client}-onboarding, -hostonboarding)
       still renders full-page — that's what the "Copy Link" button sends.
       The raw row data is kept so the embedded form hydrates from what we already
       fetched for the progress card, rather than re-querying on open. */
    const [formModal, setFormModal] = useState<null | "intake" | "brand">(null);
    /** When the modal was opened from a specific answer's Edit control, the question to land on. */
    const [formModalField, setFormModalField] = useState("");
    const [intakeData, setIntakeData] = useState<Partial<ClientOnboardingData> | null>(null);
    const [brandData, setBrandData] = useState<Partial<HostOnboardingData> | null>(null);

    // Closing re-runs the progress fetch so the card reflects whatever they just answered.
    const closeFormModal = () => {
        const which = formModal;
        setFormModal(null);
        setFormModalField("");
        if (which === "intake") {
            intakeFetchRef.current = false;
            setIntakeStatus("idle");
        } else if (which === "brand") {
            onboardingFetchRef.current = false;
            setOnboardingStatus("idle");
        }
    };

    /* ── Reset a client-input form ──
       Destructive and team-only: it throws away answers the client already gave,
       including any voice/video they recorded. Two-step by design — the first click
       only arms it — because there is no undo. Writing `{}` is enough to clear the
       row: both forms run their answers through mergeData(), which fills defaults
       from an empty object. */
    const [armedReset, setArmedReset] = useState<null | "intake" | "brand">(null);
    const [resetting, setResetting] = useState(false);

    const resetForm = async (kind: "intake" | "brand") => {
        const slugToClear = kind === "intake" ? intakeSlug : onboardingSlug;
        const table = kind === "intake" ? "client_onboarding_pages" : "host_onboarding_pages";
        if (!slugToClear) return;
        setResetting(true);
        try {
            // Delete the recordings first. Wiping the row would otherwise strand the
            // files in the bucket with nothing referencing them.
            const paths =
                kind === "intake"
                    ? Object.entries(intakeData?.answers ?? {})
                          .filter(([k, v]) => k.endsWith("__media") && (v ?? "").trim())
                          .map(([, v]) => v as string)
                    : Object.values(brandData?.mediaAnswers ?? {})
                          .map((m) => m?.path)
                          .filter((x): x is string => !!x);
            if (paths.length) await supabase.storage.from("recordings").remove(paths);

            const { error } = await supabase.from(table).update({ data: {} }).eq("slug", slugToClear);
            if (error) throw error;

            // Re-run the section's progress fetch so the card reflects the empty form.
            if (kind === "intake") {
                setIntakeData(null);
                intakeFetchRef.current = false;
                setIntakeStatus("idle");
            } else {
                setBrandData(null);
                onboardingFetchRef.current = false;
                setOnboardingStatus("idle");
            }
            setArmedReset(null);
        } catch (e) {
            console.error("[form reset]", e);
        } finally {
            setResetting(false);
        }
    };

    // Plus wizard
    const [showPlusModal, setShowPlusModal] = useState(false);
    const [plusStep, setPlusStep] = useState<"password" | "details">("password");
    const [plusPassword, setPlusPassword] = useState("");
    const [plusPasswordError, setPlusPasswordError] = useState(false);
    const [newClientName, setNewClientName] = useState("");
    const [newClientWebsite, setNewClientWebsite] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState("");

    // Master Document "Generate for AM review" modal (team-only).
    const [showMasterDocModal, setShowMasterDocModal] = useState(false);
    const [bookingOpen, setBookingOpen] = useState(false);
    const [justBooked, setJustBooked] = useState(false);
    // PDF export state: `pdfBusy` covers the dynamic import of jsPDF (a visible
    // pause on a cold cache), `pdfError` surfaces a failure the AM would otherwise
    // read as "the button does nothing".
    const [pdfBusy, setPdfBusy] = useState(false);
    const [pdfError, setPdfError] = useState(false);
    const [masterDocCopied, setMasterDocCopied] = useState(false);

    // Auto-open the create wizard when arriving via "+ New Page" (?create=1).
    useEffect(() => {
        if (searchParams.get("create") === "1") {
            setShowPlusModal(true);
            setPlusStep("details");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Lock background scroll while a modal is open.
    useEffect(() => {
        document.body.style.overflow = showPlusModal || formModal ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [showPlusModal, formModal]);

    /* ── Content updaters ── */
    const patchBrand = (patch: Partial<DashboardContent["brand"]>) => setContent((c) => ({ ...c, brand: { ...c.brand, ...patch } }));
    const patchInstagram = (patch: Partial<DashboardContent["instagram"]>) => setContent((c) => ({ ...c, instagram: { ...c.instagram, ...patch } }));
    const patchGhl = (patch: Partial<DashboardContent["ghl"]>) => setContent((c) => ({ ...c, ghl: { ...c.ghl, ...patch } }));
    const patchRevenue = (patch: Partial<DashboardContent["revenue"]>) => setContent((c) => ({ ...c, revenue: { ...c.revenue, ...patch } }));
    const patchFoundation = (patch: Partial<NonNullable<DashboardContent["foundation"]>>) =>
        setContent((c) => ({ ...c, foundation: { ...DEFAULT_FOUNDATION, ...c.foundation, ...patch } }));

    const foundation = content.foundation ?? DEFAULT_FOUNDATION;

    /* ── Client Overview Document (team only) ── */
    const overviewDoc: OverviewDoc = { ...DEFAULT_OVERVIEW_DOC, ...(content.overview_doc ?? {}) };
    const patchOverviewDoc = (patch: Partial<OverviewDoc>) =>
        setContent((c) => ({ ...c, overview_doc: { ...DEFAULT_OVERVIEW_DOC, ...(c.overview_doc ?? {}), ...patch } }));
    const overviewFilled = OVERVIEW_COUNTED_FIELDS.filter((k) => String(overviewDoc[k] ?? "").trim()).length;
    const [overviewBusy, setOverviewBusy] = useState(false);
    const [overviewError, setOverviewError] = useState("");

    /**
     * Draft the whole document from what the client has already told us.
     *
     * Runs on the server so the client's form answers are read with the service-role key
     * rather than re-fetched here, and so the Anthropic key stays off the browser. It
     * returns the fields; nothing is saved until an AM saves the dashboard, which keeps a
     * bad draft from silently replacing an AM's own notes.
     */
    const generateOverview = async () => {
        if (!slug || isTemplate) return;
        setOverviewBusy(true);
        setOverviewError("");
        try {
            const res = await fetch("/.netlify/functions/generate-overview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slug }),
            });
            /* Read as text and parse by hand. res.json() throws a raw
               "Unexpected end of JSON input" when the reply isn't JSON, and that string then
               lands in front of an account manager as the entire explanation. The two ways it
               happens are the local dev server, which serves no functions at all, and Netlify
               returning an HTML error page — so both get named instead. */
            const body = await res.text();
            let json: { doc?: Partial<OverviewDoc>; error?: string } | null = null;
            try {
                json = body ? JSON.parse(body) : null;
            } catch {
                json = null;
            }
            if (!json) {
                throw new Error(
                    res.status === 404
                        ? "Drafting only runs on the live site — the local dev server doesn't serve it."
                        : `The server didn't send a usable reply (${res.status}). Try again in a moment.`,
                );
            }
            if (!res.ok || json.error) throw new Error(json.error || `Request failed (${res.status})`);
            patchOverviewDoc({
                ...(json.doc as Partial<OverviewDoc>),
                generated_at: new Date().toISOString(),
                generated_by: user?.email ?? "",
            });
        } catch (err) {
            console.error("[overview doc] generation failed", err);
            setOverviewError(err instanceof Error ? err.message : "Couldn't draft the document.");
        } finally {
            setOverviewBusy(false);
        }
    };

    const onPickOverviewShot = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        try {
            patchOverviewDoc({ instagram_screenshot: await compressImageFile(file) });
        } catch {
            /* keep whatever is already there if compression fails */
        }
    };
    const updateFaq = (i: number, patch: Partial<FaqItem>) => patchFoundation({ faqs: foundation.faqs.map((f, j) => (j === i ? { ...f, ...patch } : f)) });

    /* ── Resources group: this client's own owner guide ──
       Resolved by name from owner_guides rather than linked to the bare /owner-guide
       route, which is the SHARED MASTER TEMPLATE — sending a client there is how the
       2026-07-09 content incident happened. No match ⇒ the nav row stays "Soon". */
    const [ownerGuideSlug, setOwnerGuideSlug] = useState("");
    useEffect(() => {
        const name = clientName.trim();
        if (!name) {
            setOwnerGuideSlug("");
            return;
        }
        let cancelled = false;
        supabase
            .from("owner_guides")
            .select("slug,client_name")
            .then(({ data, error }) => {
                if (cancelled || error || !data) return;
                const want = slugify(name);
                const hit = data.find((r) => slugify(String(r.client_name ?? "")) === want);
                setOwnerGuideSlug(hit?.slug ?? "");
            });
        return () => {
            cancelled = true;
        };
    }, [clientName]);

    /** True when a link-type nav row has nowhere to go yet — shown as "Soon". */
    const navTargetMissing = (id: SectionId) =>
        (id === "contentfolder" && !content.brand.folder_link.trim()) || (id === "ownerguide" && !ownerGuideSlug);

    /* ── Per-client section visibility ──
       Two separate ideas, deliberately not conflated:
         • notBuilt      — no section body exists yet. Nobody can open it, team included.
         • hiddenFromClient — the section works, but this client hasn't been shown it.
       The team always sees and can open everything that exists; the client sees "Soon"
       until an AM reveals the row with the eye toggle in edit mode. */
    const clientVisible = content.client_visible ?? DEFAULT_CLIENT_VISIBLE;
    // Overview is the main dashboard — always visible, never hideable, so a client can
    // never end up with nowhere to land. Same reasoning as the owner guide, where the
    // Welcome and Review steps can't be hidden either.
    const revealedToClient = (id: SectionId) =>
        id === "overview" || (!TEAM_ONLY_SECTIONS.has(id) && clientVisible.includes(id));
    const toggleClientVisible = (id: SectionId) =>
        setContent((c) => {
            const cur = c.client_visible ?? DEFAULT_CLIENT_VISIBLE;
            return { ...c, client_visible: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] };
        });

    /**
     * Single choke point: whatever route put a client on a section they can't see —
     * a hand-typed `#brand` hash, an Overview funnel card, state left over from before an
     * AM re-hid a row — bounce them to the landing row.
     *
     * The nav and search already filter, so this is the backstop rather than the primary
     * guard. It waits for `authLoading` because `isTeam` is false until the session
     * resolves, and firing early would bounce a team member off their own deep link.
     */
    useEffect(() => {
        if (authLoading || isTeam || isTemplate) return;
        if (!revealedToClient(activeSection)) setActiveSection("overview");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSection, isTeam, authLoading, isTemplate, clientVisible]);

    type NavItem = (typeof NAV_GROUPS)[number]["items"][number];
    /** Nothing behind this row yet — unopenable for everyone, team included. */
    const navNotBuilt = (s: NavItem) => !!s.soon || navTargetMissing(s.id);
    /** Can this viewer open the row? */
    const navBlocked = (s: NavItem) => navNotBuilt(s) || (!isTeam && !revealedToClient(s.id));
    /**
     * Right-hand state on a nav row.
     *
     * The word depends on WHO is looking, never on why the row is unavailable — the two are
     * never mixed in one menu. "Soon" is the client's word for anything they can't open;
     * "Hidden" is ours for anything the client can't see. A team member therefore never
     * sees "Soon", and a client never sees "Hidden".
     *
     * Whether a row is merely unrevealed or has no section built yet still reads clearly to
     * the team without a second label: unbuilt rows stay dimmed and unopenable and carry no
     * eye, revealed-able ones are full-contrast with an eye in edit mode.
     */
    const navBadge = (s: NavItem) => {
        if (s.teamOnly) {
            return <span className="ml-2 shrink-0 text-[10px] font-bold text-quaternary uppercase">Team</span>;
        }
        const clientCanSee = !navNotBuilt(s) && revealedToClient(s.id);
        if (clientCanSee) return sectionBadge(s.id);
        return (
            <span
                className="ml-2 shrink-0 text-[10px] font-bold text-quaternary uppercase"
                title={isTeam ? "Not shown to this client" : undefined}
            >
                {isTeam ? "Hidden" : "Soon"}
            </span>
        );
    };

    /** Nav rows are mostly section switches; the two Resources rows are links out. */
    const openNavItem = (id: SectionId) => {
        if (id === "contentfolder") {
            const url = content.brand.folder_link.trim();
            if (url) window.open(url, "_blank", "noopener,noreferrer");
            return;
        }
        if (id === "ownerguide") {
            if (ownerGuideSlug) navigate(`/owner-guide/${ownerGuideSlug}`);
            return;
        }
        setActiveSection(id);
    };

    const updateColor = (i: number, patch: Partial<BrandColor>) =>
        patchBrand({ colors: content.brand.colors.map((col, j) => (j === i ? { ...col, ...patch } : col)) });
    const updateHighlight = (i: number, patch: Partial<Highlight>) =>
        patchInstagram({ highlights: content.instagram.highlights.map((h, j) => (j === i ? { ...h, ...patch } : h)) });
    const updateGhlItem = (i: number, patch: Partial<GhlItem>) =>
        patchGhl({ items: content.ghl.items.map((item, j) => (j === i ? { ...item, ...patch } : item)) });
    const updateMonth = (i: number, patch: Partial<RevenueMonth>) =>
        patchRevenue({ months: content.revenue.months.map((m, j) => (j === i ? { ...m, ...patch } : m)) });
    // By object reference, not index — this array now renders as two filtered views
    // (Website / Chat Widget), so a positional index from one view can't safely
    // address the full array.
    const updateLink = (link: QuickLink, patch: Partial<QuickLink>) =>
        setContent((c) => ({ ...c, links: c.links.map((l) => (l === link ? { ...l, ...patch } : l)) }));
    const removeLink = (link: QuickLink) => setContent((c) => ({ ...c, links: c.links.filter((l) => l !== link) }));
    const updateVideo = (i: number, patch: Partial<VideoGuide>) =>
        setContent((c) => ({ ...c, videos: (c.videos ?? []).map((v, j) => (j === i ? { ...v, ...patch } : v)) }));

    /* ── Derived metrics ── */
    const months = content.revenue.months;
    const fmtMoney = (v: number) => {
        try {
            return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: content.revenue.currency || "USD",
                maximumFractionDigits: 0,
            }).format(v);
        } catch {
            return `$${Math.round(v).toLocaleString()}`;
        }
    };
    const fmtCompact = (v: number) => new Intl.NumberFormat("en-US", { notation: "compact" }).format(v);
    const totalRevenue = months.reduce((s, m) => s + (m.revenue || 0), 0);
    const totalLeads = months.reduce((s, m) => s + (m.leads || 0), 0);
    const totalAppointments = months.reduce((s, m) => s + (m.appointments || 0), 0);
    const latest = months[months.length - 1];
    const prev = months[months.length - 2];
    const momChange = latest && prev && prev.revenue > 0 ? ((latest.revenue - prev.revenue) / prev.revenue) * 100 : null;

    const ghlDone = content.ghl.items.filter((i) => i.done).length;
    const ghlTotal = content.ghl.items.length;

    const videoGuides = content.videos ?? [];

    const websiteHref = clientWebsite && (clientWebsite.startsWith("http") ? clientWebsite : `https://${clientWebsite}`);

    // Split the shared `links` array by which funnel section it belongs on. The chat
    // widget's own setup guide is Middle of funnel (it's what nurtures/answers guests);
    // everything else (pixel tracking, lead-capture popup, and any custom link a team
    // member adds) is a Top-of-funnel, on-site tool — same array, two filtered views,
    // so nothing about the underlying data shape needs to change.
    const chatWidgetLinks = content.links.filter((l) => l.url.includes("-chatwidget"));
    const websiteLinks = content.links.filter((l) => !l.url.includes("-chatwidget"));

    // Client-scoped search index — sidebar sections, this client's own links, and their
    // FAQ questions. Nothing here reaches outside this one client's own content.
    const searchHits = useMemo<SearchHit[]>(() => {
        // Search must not be a back door. Every hit is filtered by the same rule the nav
        // rows use — a client can only reach a section revealed to them. Filtering on
        // "not built" alone would let a client search "Brand" (or one of their own FAQs,
        // which resolve to the Master Brand section) straight into a hidden section.
        // Exactly the rule the side menu uses, so search results and the menu can never
        // disagree — a client should be able to find everything they can see and nothing
        // they can't. Using the raw list here left Overview unsearchable despite being
        // pinned in their menu.
        // Goes through revealedToClient rather than reading clientVisible directly, so a
        // team-only section can't be surfaced by search even though it's absent from the menu.
        const canOpen = (id: SectionId) => isTeam || revealedToClient(id);
        const navHits = SECTIONS.filter((s) => !("soon" in s && s.soon) && canOpen(s.id)).map((s) => ({ id: s.id, label: s.label }));
        const linkHits = content.links
            .map((l) => ({
                id: (l.url.includes("-chatwidget") ? "chatwidget" : "website") as SectionId,
                label: l.title || "Untitled link",
                sub: "Link",
            }))
            .filter((h) => canOpen(h.id));
        const faqHits = canOpen("foundation")
            ? foundation.faqs.filter((f) => f.question.trim()).map((f) => ({ id: "foundation" as SectionId, label: f.question, sub: "FAQ" }))
            : [];
        return [...navHits, ...linkHits, ...faqHits];
    }, [content.links, foundation.faqs, isTeam, clientVisible]);

    /* ── Lock / save ── */
    /** Persist edits to the shared dashboard_pages row, then lock. */
    const persistAndLock = async () => {
        if (slug && !isTemplate) {
            const { error } = await supabase
                .from("dashboard_pages")
                .upsert({ slug, client_name: clientName.trim(), client_website: clientWebsite.trim(), data: content }, { onConflict: "slug" });
            if (error) console.error("[client dashboard save] Supabase error:", error);
        }
        setIsLocked(true);
    };

    /* ── Master Document — generate for AM review (team-only) ── */
    const masterDoc = showMasterDocModal ? compileMasterDocument(clientName, clientWebsite, foundation) : null;
    const copyMasterDoc = () => {
        if (!masterDoc) return;
        void navigator.clipboard.writeText(masterDoc.doc).then(() => {
            setMasterDocCopied(true);
            setTimeout(() => setMasterDocCopied(false), 1600);
        });
    };
    const downloadMasterDoc = () => {
        if (!masterDoc) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([masterDoc.doc], { type: "text/markdown" }));
        a.download = `${(clientName.trim() || "client").toLowerCase().replace(/\s+/g, "-")}-master-document.md`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    /**
     * Download the Master Document as a PDF for the AM to share.
     *
     * Compiles on demand rather than reading `masterDoc` — that is only populated
     * while the review modal is open, and this also runs from the section header.
     * jsPDF arrives via dynamic import so it costs nothing until clicked.
     */
    const downloadMasterDocPdf = async () => {
        if (pdfBusy) return;
        setPdfBusy(true);
        try {
            const compiled = compileMasterDocument(clientName, clientWebsite, foundation);
            const { buildMasterDocumentPdf, masterDocumentFileName } = await import("@/utils/master-document-pdf");
            buildMasterDocumentPdf({
                clientName,
                clientWebsite,
                generatedOn: compiled.generatedOn,
                sections: compiled.sections,
                faqs: compiled.faqs.map((q) => ({ question: q.question, answer: q.answer })),
            }).save(masterDocumentFileName(clientName));
        } catch (err) {
            console.error("[master-document] PDF export failed", err);
            setPdfError(true);
            setTimeout(() => setPdfError(false), 3200);
        } finally {
            setPdfBusy(false);
        }
    };

    // Shift+E toggles edit mode, Shift+S saves immediately and locks — team-only
    // (gated by isTeam) since clients also reach this page. No password step here:
    // isTeam already means a signed-in @hiddengem.media session, same precedent as
    // the Plus/create flow below skipping the password gate for signed-in team members.
    useEditShortcuts({
        enabled: isTeam,
        onToggle: () => {
            if (isLocked) setIsLocked(false);
            else void persistAndLock();
        },
        onSave: () => void persistAndLock(),
    });

    /* ── Create flow ── */
    const handlePlusClick = () => {
        setShowPlusModal(true);
        // Signed-in @hiddengem.media users are already authenticated — skip the password gate.
        setPlusStep(isTeam ? "details" : "password");
        setPlusPassword("");
        setPlusPasswordError(false);
        setNewClientName("");
        setNewClientWebsite("");
        setCreateError("");
    };

    const handlePlusPassword = () => {
        if (plusPassword === PASSWORD) {
            setPlusPasswordError(false);
            setPlusStep("details");
        } else {
            setPlusPasswordError(true);
        }
    };

    const handleCreatePage = async () => {
        const base = slugify(newClientName);
        if (!base) return;
        const newSlug = `${base}-dashboard`;
        setIsCreating(true);
        setCreateError("");
        const { error } = await supabase.from("dashboard_pages").upsert({
            slug: newSlug,
            client_name: newClientName.trim(),
            client_website: newClientWebsite.trim(),
            data: createDefaultContent(base),
        });
        setIsCreating(false);
        if (error) {
            setCreateError("Could not save — check your connection and try again.");
            return;
        }
        setShowPlusModal(false);
        navigate(`/${newSlug}`);
    };

    const editInput = (extra?: string) =>
        cx(
            "w-full rounded-lg border border-secondary bg-transparent px-2.5 py-1.5 text-sm text-primary transition duration-100 ease-linear outline-none placeholder:text-placeholder focus:border-brand focus:ring-1 focus:ring-brand",
            extra,
        );

    /* ── The journey timeline on Overview ── */
    /**
     * Calendly posts a message to the parent window as the booking completes. Listening for it is
     * what lets the dashboard react in the moment instead of waiting for an AM to notice.
     *
     * Only bookings made in this modal are seen — book from the confirmation email or another
     * device and nothing arrives here, which is why the AM tick stays available as a backstop.
     *
     * The origin check is not optional: `message` fires for anything any frame posts, so without it
     * any embedded or opener page could mark a client's step done by posting the right string.
     */
    useEffect(() => {
        if (!bookingOpen) return;
        const onMessage = (e: MessageEvent) => {
            if (e.origin !== "https://calendly.com") return;
            if (e.data?.event !== "calendly.event_scheduled") return;
            setJustBooked(true);
            setContent((c) => {
                const done = c.journey_done ?? [];
                return done.includes("kickoff") ? c : { ...c, journey_done: [...done, "kickoff"] };
            });
            // The browser can't write to Supabase itself (anon has no UPDATE grant), so the save
            // goes through the function. A failure here only costs the persisted tick — the client
            // still sees the confirmation, and their booking is real regardless.
            if (slug && !isTemplate) {
                void fetch("/.netlify/functions/mark-booked", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ slug }),
                }).catch((err) => console.error("[mark-booked] request failed", err));
            }
        };
        window.addEventListener("message", onMessage);
        return () => window.removeEventListener("message", onMessage);
    }, [bookingOpen, slug, isTemplate]);

    const journeyDone = content.journey_done ?? [];
    const toggleJourneyStep = (id: JourneyStepId) =>
        setContent((c) => {
            const cur = c.journey_done ?? [];
            return { ...c, journey_done: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] };
        });

    /**
     * Each step with its resolved state. The two form steps read their live answer counts;
     * everything else reflects an AM tick. `progress` is only shown where a real
     * denominator exists — a made-up fraction on "Onboarding Call" would be noise.
     */
    const journeySteps = useMemo(() => {
        return JOURNEY_STEPS.map((step) => {
            if (step.id === "form") {
                return {
                    ...step,
                    done: intakeSubmitted,
                    progress: intakeInfo.total ? { value: intakeInfo.answered, total: intakeInfo.total } : null,
                    detail: intakeSubmitted
                        ? "Submitted — you can still update your answers."
                        : intakeInfo.total
                          ? `${intakeInfo.answered} of ${intakeInfo.total} questions answered.`
                          : step.detail,
                };
            }
            if (step.id === "vision") {
                return {
                    ...step,
                    done: onboardingSubmitted,
                    progress: onboardingInfo.total ? { value: onboardingInfo.answered, total: onboardingInfo.total } : null,
                    detail: onboardingSubmitted
                        ? "Submitted — thank you."
                        : onboardingInfo.total
                          ? `${onboardingInfo.answered} of ${onboardingInfo.total} questions answered.`
                          : step.detail,
                };
            }
            return { ...step, done: journeyDone.includes(step.id), progress: null };
        });
    }, [intakeSubmitted, onboardingSubmitted, intakeInfo, onboardingInfo, journeyDone]);

    const journeyDoneCount = journeySteps.filter((s) => s.done).length;
    /** First unfinished step — highlighted so a client can see what's next at a glance. */
    const journeyCurrentId = journeySteps.find((s) => !s.done)?.id ?? null;

    /* ── Collapsible phase groups ──
       Phases 1–5 start folded and Client Input starts open: the forms are the only
       thing we need from the client, so that group leads, and the five delivery
       phases stay out of the way until they're wanted.

       Two pieces of state on purpose. `collapsedGroups` is the client's explicit
       choice and is what persists. `autoOpenPhase` is transient — opening a section
       from outside the menu (Overview cards, the setup panel, search) unfolds its
       group for that visit without rewriting the saved preference, so the menu
       returns to its folded default next time rather than drifting fully open. */
    const collapseKey = `hgm_dash_nav_collapsed_${slug || "template"}`;
    const DEFAULT_COLLAPSED: Record<string, boolean> = { p1: true, p2: true, p3: true, p4: true, p5: true };
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
        try {
            const saved = localStorage.getItem(collapseKey);
            return saved ? JSON.parse(saved) : DEFAULT_COLLAPSED;
        } catch {
            return DEFAULT_COLLAPSED;
        }
    });
    useEffect(() => {
        try {
            localStorage.setItem(collapseKey, JSON.stringify(collapsedGroups));
        } catch {
            /* private mode — collapsing still works, it just won't persist */
        }
    }, [collapseKey, collapsedGroups]);

    const [autoOpenPhase, setAutoOpenPhase] = useState<PhaseId | null>(null);
    useEffect(() => {
        setAutoOpenPhase(phaseOfSection(activeSection));
    }, [activeSection]);

    /** Folded unless the client opened it, or it holds the section currently on screen. */
    const isGroupCollapsed = (phase: PhaseId) => !!collapsedGroups[phase] && autoOpenPhase !== phase;

    /** Toggle from the group header. Collapsing the group you're currently in has to
        work, so this also clears the transient auto-open. */
    const toggleGroup = (phase: PhaseId) => {
        const collapsing = !isGroupCollapsed(phase);
        if (collapsing && autoOpenPhase === phase) setAutoOpenPhase(null);
        setCollapsedGroups((c) => ({ ...c, [phase]: collapsing }));
    };

    /** Does this group still need something from the client? Collapsing must not hide that. */
    const groupHasTodo = (phase: PhaseId) => {
        const g = NAV_GROUPS.find((x) => x.phase === phase);
        if (!g) return false;
        return g.items.some((i) => {
            if (i.id === "intake") return intakeReady && !intakeSubmitted;
            if (i.id === "onboarding") return onboardingReady && !onboardingSubmitted;
            if (i.id === "foundation") {
                const f = content.foundation;
                if (!f) return false;
                return [f.propertyBasics, f.persona, f.toneOfVoice, f.amenities, f.localRecommendations, f.bookingLinks].some((v) => !(v ?? "").trim());
            }
            return false;
        });
    };

    /** Per-section badge for the side menu — real state, not decoration. Lets a client
        see at a glance what still needs them without opening every section. */
    const sectionBadge = (id: SectionId): ReactNode => {
        const pill = (text: string, tone: "done" | "todo" | "muted") => (
            <span
                className={cx(
                    "ml-2 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                    tone === "done" && "bg-success-secondary text-success-primary",
                    tone === "todo" && "bg-brand-secondary text-brand-secondary",
                    tone === "muted" && "text-quaternary",
                )}
            >
                {text}
            </span>
        );
        if (id === "intake") {
            if (!intakeReady) return null;
            if (intakeSubmitted) return pill("Done", "done");
            return intakeInfo.total ? pill(`${intakeInfo.answered}/${intakeInfo.total}`, "todo") : null;
        }
        if (id === "onboarding") {
            if (!onboardingReady) return null;
            if (onboardingSubmitted) return pill("Done", "done");
            return onboardingInfo.total ? pill(`${onboardingInfo.answered}/${onboardingInfo.total}`, "todo") : null;
        }
        if (id === "foundation") {
            const f = content.foundation;
            if (!f) return null;
            const filled = [f.propertyBasics, f.persona, f.toneOfVoice, f.amenities, f.localRecommendations, f.bookingLinks].filter((v) =>
                (v ?? "").trim(),
            ).length;
            return filled ? pill(`${filled}/6`, filled === 6 ? "done" : "todo") : null;
        }
        if (id === "brand") {
            const n = content.brand?.colors?.length ?? 0;
            return n ? pill(String(n), "muted") : null;
        }
        if (id === "videos") {
            const n = content.videos?.length ?? 0;
            return n ? pill(String(n), "muted") : null;
        }
        return null;
    };

    const removeButton =
        "flex size-8 shrink-0 items-center justify-center rounded-lg text-fg-quaternary transition duration-100 ease-linear hover:bg-error-primary hover:text-fg-error-primary";

    /* ── Access gate ──
       After every hook, so the hook order never changes between renders. Waits for the auth
       lookup rather than flashing a sign-in screen at somebody who turns out to be allowed. */
    if (authLoading) {
        return (
            <main className="flex min-h-dvh items-center justify-center bg-tertiary">
                <div className="size-8 animate-spin rounded-full border-2 border-brand border-t-transparent opacity-60" />
            </main>
        );
    }
    if (!hasAccess)
        return (
            <DashboardAccessGate
                allowedEmails={allowedEmails}
                sharePassword={sharePassword}
                onUnlock={unlockDashboard}
                backgroundUrl={content.login_bg_url}
            />
        );

    return (
        <>
            {/* Nested containers, matching the Client List's AppShell chrome: a page
                canvas, then one rounded "window" holding the whole dashboard, then the
                side menu and body as separate cards inside it. The inner canvas stays
                bg-quaternary (not the barely-off-white bg-secondary) so those white
                cards clearly pop — this is the client's own dashboard. */}
            <div className="flex h-dvh flex-col overflow-hidden bg-tertiary p-2.5 sm:p-3">
                {/* Preview banner — only ever rendered for a signed-in team member, so the
                    client can never see it. Without it the preview is a trap: Shift+E just
                    stops working and every team-only control disappears, which reads as
                    broken permissions rather than a deliberate mode. */}
                {previewAsClient && (
                    <div className="mb-2 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg bg-brand-solid px-3.5 py-2 text-sm text-white shadow-sm">
                        <span className="flex items-center gap-2 font-semibold">
                            <EyeGlyph />
                            Viewing as client
                        </span>
                        <span className="flex-1 text-white/80">
                            This is exactly what {clientName.trim() || "the client"} sees. Editing and team-only controls are off.
                        </span>
                        <button
                            type="button"
                            onClick={exitClientPreview}
                            className="shrink-0 rounded-md bg-white/15 px-2.5 py-1 text-xs font-semibold text-white transition duration-100 ease-linear hover:bg-white/25"
                        >
                            Exit preview
                        </button>
                    </div>
                )}
                <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl shadow-xl ring-1 ring-secondary">
                    <div className="flex min-h-0 w-full flex-col gap-2 overflow-hidden bg-quaternary p-2 md:flex-row">
                        {/* ── Client side menu (no icon rail — client-facing) ── */}
                        <aside // 276px matches MAIN_SIDEBAR_WIDTH in the Untitled UI sidebar kit
                            // (app-navigation/sidebar-navigation). Nothing truncated at 256px, but the
                            // phase groups read better with the extra breathing room, and the body is
                            // capped at 1240px so it gives up nothing on a large screen.
                            className="flex w-full shrink-0 flex-col overflow-hidden rounded-lg bg-primary shadow-sm md:h-full md:w-[276px]"
                        >
                            {/* Client identity */}
                            <div className="flex items-center gap-3 border-b border-secondary px-4 py-4 md:px-5">
                                <button
                                    type="button"
                                    onClick={() => (canEnterPreview ? enterClientPreview() : logoFileRef.current?.click())}
                                    disabled={isLocked && !canEnterPreview}
                                    title={
                                        canEnterPreview
                                            ? "View this dashboard as the client sees it"
                                            : isLocked
                                              ? undefined
                                              : content.logo_url
                                                ? "Replace logo"
                                                : "Upload logo"
                                    }
                                    className={cx(
                                        "group relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary ring-1 ring-secondary",
                                        (!isLocked || canEnterPreview) && "cursor-pointer",
                                        canEnterPreview && "transition duration-100 ease-linear hover:ring-brand",
                                    )}
                                >
                                    {content.logo_url ? (
                                        <img
                                            src={content.logo_url}
                                            alt={`${clientName || "Client"} logo`}
                                            className="size-full object-contain p-1"
                                            draggable={false}
                                        />
                                    ) : (
                                        <Image01 className="size-5 text-fg-quaternary" aria-hidden="true" />
                                    )}
                                    {!isLocked && (
                                        <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition duration-100 ease-linear group-hover:bg-black/50 group-hover:opacity-100">
                                            <Camera01 className="size-4" aria-hidden="true" />
                                        </span>
                                    )}
                                </button>
                                {!isLocked && <input ref={logoFileRef} type="file" accept="image/*" className="hidden" onChange={onPickLogo} />}
                                <div className="min-w-0">
                                    {canEnterPreview ? (
                                        <button
                                            type="button"
                                            onClick={enterClientPreview}
                                            title="View this dashboard as the client sees it"
                                            className="group/name flex max-w-full items-center gap-1.5 text-left"
                                        >
                                            <span className="truncate text-sm font-semibold text-primary transition duration-100 ease-linear group-hover/name:text-brand-secondary">
                                                {clientName || "Client Name"}
                                            </span>
                                            <span
                                                aria-hidden="true"
                                                className="shrink-0 text-fg-quaternary opacity-0 transition duration-100 ease-linear group-hover/name:opacity-100"
                                            >
                                                <EyeGlyph />
                                            </span>
                                        </button>
                                    ) : (
                                        <p className="truncate text-sm font-semibold text-primary">{clientName || "Client Name"}</p>
                                    )}
                                    <BadgeWithDot color={statusColor(content.status)} size="sm" type="pill-color">
                                        {content.status}
                                    </BadgeWithDot>
                                </div>
                            </div>

                            {/* Dashboard search — client-scoped, directly under the identity block */}
                            <div className="px-3 pt-3">
                                <ClientSearchBar hits={searchHits} onSelect={setActiveSection} />
                            </div>

                            {/* Overview — pinned above the groups as the client's main dashboard. Never
                                hideable and never "Soon": it's the landing view, so a client always has
                                somewhere to arrive and somewhere to get back to. */}
                            <div className="p-3 pb-0 md:pb-0">
                                <SectionNavItem
                                    icon={OVERVIEW_ITEM.icon}
                                    label={OVERVIEW_ITEM.label}
                                    current={activeSection === "overview"}
                                    onClick={() => setActiveSection("overview")}
                                />
                            </div>

                            {/* Funnel groups — Foundation → Top → Middle → Bottom, the same mental model
                    Dustin walks every client through on the onboarding call. */}
                            <motion.nav
                                className="flex-1 overflow-y-auto p-3 md:overflow-y-auto"
                                initial="hidden"
                                animate="show"
                                variants={{ show: { transition: { staggerChildren: 0.04 } } }}
                            >
                                {NAV_GROUPS.map((group, gi) => (
                                    <div key={group.label} role="group" aria-labelledby={`nav-group-${group.phase}`} className="mt-2.5 first:mt-1">
                                        {/* Divider between groups (approved template-lab layout) */}
                                        {gi > 0 && <div className="mx-1 mb-2.5 h-px bg-border-secondary" />}
                                        {/* Finder-sidebar heading: small, semibold, secondary gray, sentence
                                            case. No uppercase and no colored number pill — the heading is a
                                            quiet label for the rows under it, not a badge competing with them. */}
                                        <button
                                            type="button"
                                            id={`nav-group-${group.phase}`}
                                            onClick={() => toggleGroup(group.phase)}
                                            aria-expanded={!isGroupCollapsed(group.phase)}
                                            className="mb-0.5 flex w-full items-center gap-1.5 rounded-md px-3 py-1 text-left text-[11.5px] font-semibold text-tertiary transition duration-100 ease-linear hover:bg-primary_hover"
                                        >
                                            <span className="flex-1 truncate">{group.label}</span>
                                            {/* Folded groups still flag outstanding work — otherwise collapsing
                                                could hide the one thing we need from the client. */}
                                            {isGroupCollapsed(group.phase) && groupHasTodo(group.phase) && (
                                                <span className="size-1.5 shrink-0 rounded-full bg-brand-solid" title="Still needs you" />
                                            )}
                                            <ChevronDown
                                                aria-hidden="true"
                                                className={cx(
                                                    "size-3.5 shrink-0 text-fg-quaternary transition-transform duration-150",
                                                    isGroupCollapsed(group.phase) && "-rotate-90",
                                                )}
                                            />
                                        </button>
                                        {!isGroupCollapsed(group.phase) && (
                                            <div className="flex flex-col gap-1">
                                                {group.items.filter((s) => isTeam || !s.teamOnly).map((s) => (
                                                    <motion.div key={s.id} variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}>
                                                        <SectionNavItem
                                                            icon={s.icon}
                                                            label={s.label}
                                                            current={activeSection === s.id}
                                                            // Team can open anything that exists; a client can only
                                                            // open what's been revealed to them.
                                                            disabled={navBlocked(s)}
                                                            indent
                                                            badge={navBadge(s)}
                                                            action={
                                                                // Every row gets the eye while editing, so the whole
                                                                // menu can be set up in one pass. On a row with
                                                                // nothing behind it yet the toggle is an APPROVAL
                                                                // rather than an immediate reveal — the client keeps
                                                                // seeing "Soon" either way — so the tooltip says so
                                                                // instead of implying a change they'd look for.
                                                                !isLocked && isTeam && !s.teamOnly ? (
                                                                    <button
                                                                        type="button"
                                                                        title={
                                                                            navNotBuilt(s)
                                                                                ? revealedToClient(s.id)
                                                                                    ? "Approved for this client — appears as soon as it's ready"
                                                                                    : "Approve for this client — will appear once it's ready"
                                                                                : revealedToClient(s.id)
                                                                                  ? "Hide from this client"
                                                                                  : "Show to this client"
                                                                        }
                                                                        aria-label={
                                                                            revealedToClient(s.id)
                                                                                ? `Hide ${s.label} from this client`
                                                                                : `Show ${s.label} to this client`
                                                                        }
                                                                        aria-pressed={revealedToClient(s.id)}
                                                                        onClick={() => toggleClientVisible(s.id)}
                                                                        className={cx(
                                                                            "flex size-6 items-center justify-center rounded-md transition duration-100 ease-linear hover:bg-secondary",
                                                                            revealedToClient(s.id)
                                                                                ? "text-brand-secondary hover:text-brand-secondary_hover"
                                                                                : "text-quaternary hover:text-primary",
                                                                        )}
                                                                    >
                                                                        {revealedToClient(s.id) ? <EyeGlyph /> : <EyeOffGlyph />}
                                                                    </button>
                                                                ) : undefined
                                                            }
                                                            onClick={() => openNavItem(s.id)}
                                                        />
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </motion.nav>

                            {/* Footer — website link + appearance + background upload. Wrapped so the
                    custom side-menu background (below) starts exactly at its top edge,
                    whatever this block's height ends up being, instead of a fixed guess. */}
                            <div className="relative isolate flex flex-col">
                                {/* Custom side-menu background — optional, uploaded in edit mode below.
                        The current solid color stays the default everywhere above the footer;
                        the image only shows behind the footer itself. */}
                                {content.sidebar_bg_url && (
                                    <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
                                        <img src={content.sidebar_bg_url} alt="" className="size-full object-cover object-bottom" draggable={false} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-primary" />
                                    </div>
                                )}

                                {/* Website link */}
                                {websiteHref && (
                                    <div className="hidden border-t border-secondary p-4 pb-0 md:block">
                                        <Button
                                            href={websiteHref}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            color="secondary"
                                            size="sm"
                                            iconTrailing={LinkExternal01}
                                            className="w-full"
                                        >
                                            Visit website
                                        </Button>
                                    </div>
                                )}

                                {/* Theme toggle — local to this side menu (the global floating toggle is
                        suppressed on client-dashboard pages since it overlapped the client badge). */}
                                <div className="flex items-center gap-3 border-t border-secondary px-5 py-3">
                                    {/* HGM logo — for signed-in team members a shortcut back to the internal
                                /dashboard; for clients (and inside a client preview) a link out to
                                hiddengem.media. New tab, so a client never loses their dashboard. */}
                                    {isTeam ? (
                                        <button
                                            type="button"
                                            onClick={() => navigate("/dashboard")}
                                            title="Go to team dashboard"
                                            className="shrink-0 rounded-lg transition duration-100 ease-linear hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                                        >
                                            <img src="/hgm logo/Favicon ON LIGHT.svg" alt="HiddenGem — team dashboard" className="size-8" draggable={false} />
                                        </button>
                                    ) : (
                                        <a
                                            href="https://hiddengem.media"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title="Visit HiddenGem Media"
                                            className="shrink-0 rounded-lg transition duration-100 ease-linear hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                                        >
                                            <img src="/hgm logo/Favicon ON LIGHT.svg" alt="HiddenGem Media" className="size-8" draggable={false} />
                                        </a>
                                    )}
                                    {/* Same treatment as the client's own name at the top of the sidebar
                                (text-sm / font-semibold / text-primary) so the two lockups read as a
                                matched pair rather than a heading and a footnote. */}
                                    <span className="flex-1 truncate text-sm font-semibold text-primary">HiddenGem Media</span>
                                    <button
                                        type="button"
                                        onClick={() => setTheme(isDark ? "light" : "dark")}
                                        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                                        className="flex size-9 items-center justify-center rounded-full border border-secondary bg-primary text-secondary transition duration-100 ease-linear hover:bg-tertiary hover:text-primary"
                                    >
                                        {isDark ? <Sun className="size-[18px]" /> : <Moon01 className="size-[18px]" />}
                                    </button>
                                </div>

                                {/* Sidebar background upload — edit mode only. The solid color above stays
                        the default until the team sets one; clients see whatever is set. */}
                                {!isLocked && (
                                    <div className="flex items-center justify-between gap-2 border-t border-secondary px-5 py-3">
                                        <span className="text-xs text-quaternary">Sidebar background</span>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => sidebarBgFileRef.current?.click()}
                                                title={content.sidebar_bg_url ? "Replace sidebar background" : "Upload sidebar background"}
                                                className="flex size-9 items-center justify-center rounded-full border border-secondary bg-primary text-secondary transition duration-100 ease-linear hover:bg-tertiary hover:text-primary"
                                            >
                                                <UploadCloud02 className="size-[18px]" />
                                            </button>
                                            {content.sidebar_bg_url && (
                                                <button
                                                    type="button"
                                                    onClick={() => setContent((c) => ({ ...c, sidebar_bg_url: "" }))}
                                                    title="Remove sidebar background"
                                                    className="flex size-9 items-center justify-center rounded-full border border-secondary bg-primary text-secondary transition duration-100 ease-linear hover:bg-error-primary hover:text-fg-error-primary"
                                                >
                                                    <Trash01 className="size-[18px]" />
                                                </button>
                                            )}
                                        </div>
                                        <input ref={sidebarBgFileRef} type="file" accept="image/*" className="hidden" onChange={onPickSidebarBg} />
                                    </div>
                                )}
                            </div>
                        </aside>

                        {/* ── Main (scrolls) ── */}
                        <div className="min-w-0 flex-1 overflow-y-auto">
                            {/* Fluid body — the card fills the canvas. Combined with the grey canvas's
                own p-2 (8px), md:px-6 (24px) yields a 32px gap to the side menu and the
                right edge; zero vertical padding keeps the card's top/bottom flush with
                the side menu's. */}
                            <div className="flex min-h-full w-full flex-col p-0.5 md:p-0.5">
                                {/* flex-1 + min-h-full wrapper: short sections still fill the canvas
                            height, so the card's bottom edge lines up with the side menu's. */}
                                <motion.article
                                    // rounded-lg matches the side menu's corner radius exactly.
                                    className="w-full flex-1 rounded-lg bg-primary shadow-sm ring-1 ring-secondary"
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    {/* Horizontal inset scales with the card (20 → 24 → 32 → 40px) rather
                                        than sitting flat, which looked pinched once the card got wide. The
                                        max-width is the important half: on a 2560px display the card is
                                        ~2200px, and uncapped that ran prose to ~270 characters a line —
                                        roughly four times a comfortable measure. Capping the content (not
                                        the card) keeps the card full-bleed against the canvas while the
                                        reading column stays sane. */}
                                    <div
                                        className={cx(
                                            "mx-auto w-full max-w-[1240px] px-5 py-8 sm:px-6 md:px-8 lg:px-10",
                                            activeSection === "flow" && !isLocked ? "md:py-10" : "md:py-12",
                                        )}
                                    >
                                        {/* ── Template banner — prompts the team to spin up a client copy. ── */}
                                        {isTemplate && (
                                            <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand/40 bg-brand-50 px-4 py-3 dark:bg-brand-950/30">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="inline-flex items-center rounded-full bg-brand-600 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-white uppercase">
                                                        Template
                                                    </span>
                                                    <p className="text-[13px] font-medium text-brand-800 dark:text-brand-200">
                                                        This is the master template. Create a private copy to share with a client.
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handlePlusClick}
                                                    className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-solid px-3.5 py-2 text-[13px] font-semibold text-white transition hover:opacity-90"
                                                >
                                                    <Plus className="size-4" aria-hidden="true" />
                                                    Create dashboard for the client
                                                </button>
                                            </div>
                                        )}

                                        {/* ── Hero (Client Overview only — the side menu carries identity elsewhere) ── */}
                                        {activeSection === "overview" && (
                                            <>
                                                <header className="flex flex-wrap items-center justify-between gap-4">
                                                    {/* Flat header — no logo tile (identity already lives in the side menu). */}
                                                    <div className="flex min-w-0 items-center gap-4">
                                                        <div className="min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2.5">
                                                                {isLocked ? (
                                                                    <h1 className="truncate text-display-xs font-semibold tracking-tight text-primary md:text-display-sm">
                                                                        {clientName || "Client Name"}
                                                                    </h1>
                                                                ) : (
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Client Name"
                                                                        value={clientName}
                                                                        onChange={(e) => setClientName(e.target.value)}
                                                                        className={editInput("max-w-60 text-md font-semibold")}
                                                                    />
                                                                )}
                                                                <BadgeWithDot color={statusColor(content.status)} size="md" type="pill-color">
                                                                    {content.status}
                                                                </BadgeWithDot>
                                                            </div>
                                                            <p className="mt-1 text-sm text-tertiary">Your business hub — prepared by the HiddenGem Team.</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {isLocked ? (
                                                            websiteHref && (
                                                                <Button
                                                                    href={websiteHref}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    color="secondary"
                                                                    size="sm"
                                                                    iconTrailing={LinkExternal01}
                                                                >
                                                                    Visit website
                                                                </Button>
                                                            )
                                                        ) : (
                                                            <input
                                                                type="text"
                                                                placeholder="Client Website"
                                                                value={clientWebsite}
                                                                onChange={(e) => setClientWebsite(e.target.value)}
                                                                className={editInput("max-w-52")}
                                                            />
                                                        )}
                                                    </div>
                                                </header>

                                                {/* Edit-only hero controls: logo URL + status */}
                                                {!isLocked && (
                                                    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-secondary p-3">
                                                        <input
                                                            type="text"
                                                            placeholder="Logo image URL"
                                                            value={content.logo_url}
                                                            onChange={(e) => setContent((c) => ({ ...c, logo_url: e.target.value }))}
                                                            className={editInput("max-w-80")}
                                                        />
                                                        <div className="flex items-center gap-1.5">
                                                            {STATUS_OPTIONS.map((s) => (
                                                                <button
                                                                    key={s}
                                                                    type="button"
                                                                    onClick={() => setContent((c) => ({ ...c, status: s }))}
                                                                    className={cx(
                                                                        "rounded-full px-3 py-1 text-xs font-medium transition duration-100 ease-linear",
                                                                        content.status === s
                                                                            ? "bg-brand-solid text-white"
                                                                            : "bg-primary text-tertiary ring-1 ring-secondary hover:text-secondary",
                                                                    )}
                                                                >
                                                                    {s}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* ── Who can open this dashboard (team, edit mode) ──
                                                    The access allowlist. Without a way to fill this in, turning on the
                                                    sign-in gate would lock every client out, so it lives right at the top
                                                    of Overview where an AM can't miss it. */}
                                                {isTeam && !isLocked && !isTemplate && (
                                                    <div className="mt-8 rounded-xl bg-secondary p-5 ring-1 ring-secondary">
                                                        <p className="text-sm font-semibold text-primary">Who can open this dashboard</p>
                                                        <p className="mt-1 text-sm text-tertiary text-pretty">
                                                            Anyone at @hiddengem.media always has access. Add the client's email addresses here — they'll
                                                            sign in with Google using one of them. An address that isn't listed can sign in but sees nothing.
                                                        </p>
                                                        <div className="mt-4 flex flex-col gap-2">
                                                            {allowedEmails.map((addr, i) => (
                                                                <div key={`${addr}-${i}`} className="flex items-center gap-2">
                                                                    <input
                                                                        type="email"
                                                                        value={addr}
                                                                        placeholder="client@example.com"
                                                                        onChange={(e) =>
                                                                            updateAllowedEmails(allowedEmails.map((x, j) => (j === i ? e.target.value : x)))
                                                                        }
                                                                        className="min-w-0 flex-1 rounded-lg bg-primary px-3 py-2 text-sm text-primary ring-1 ring-secondary outline-none focus:ring-brand"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        aria-label={`Remove ${addr || "this address"}`}
                                                                        onClick={() => updateAllowedEmails(allowedEmails.filter((_, j) => j !== i))}
                                                                        className={removeButton}
                                                                    >
                                                                        <Trash01 className="size-4" aria-hidden="true" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="mt-3">
                                                            <Button size="sm" color="secondary" iconLeading={Plus} onClick={() => updateAllowedEmails([...allowedEmails, ""])}>
                                                                Add an email
                                                            </Button>
                                                        </div>

                                                        <div className="mt-4 border-t border-secondary pt-4">
                                                            <p className="text-sm font-medium text-secondary">Shared password</p>
                                                            <p className="mt-1 text-xs text-tertiary text-pretty">
                                                                The client types this alongside their email. Send it to them separately from the link.
                                                            </p>
                                                            <div className="mt-2 flex items-center gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={content.share_password ?? ""}
                                                                    placeholder="Set a password"
                                                                    onChange={(e) => updateSharePassword(e.target.value)}
                                                                    className="min-w-0 flex-1 rounded-lg bg-primary px-3 py-2 font-mono text-sm text-primary ring-1 ring-secondary outline-none focus:ring-brand"
                                                                />
                                                                <Button
                                                                    size="sm"
                                                                    color="secondary"
                                                                    iconLeading={Copy01}
                                                                    onClick={() => void navigator.clipboard.writeText(content.share_password ?? "")}
                                                                >
                                                                    Copy
                                                                </Button>
                                                            </div>
                                                            {/* The gate needs BOTH halves — say which one is missing rather than
                                                                leaving an AM wondering why nothing is locked. */}
                                                            {!gateArmed && (
                                                                <p className="mt-2 text-xs text-warning-primary">
                                                                    {!allowedEmails.some((e) => e.trim()) && !sharePassword
                                                                        ? "Not locked yet — add an email and a password."
                                                                        : !sharePassword
                                                                          ? "Not locked yet — set a password."
                                                                          : "Not locked yet — add at least one email."}
                                                                </p>
                                                            )}
                                                            {gateArmed && (
                                                                <p className="mt-2 text-xs text-success-primary">
                                                                    Locked. Only the emails above can open this dashboard, with this password.
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div className="mt-4 border-t border-secondary pt-4">
                                                            <p className="text-sm font-medium text-secondary">Sign-in background</p>
                                                            <p className="mt-1 text-xs text-tertiary text-pretty">
                                                                Image or video URL shown behind this client's sign-in card, so each client can look
                                                                different. Leave empty for the default leaf-shadow loop.
                                                            </p>
                                                            <input
                                                                type="text"
                                                                value={content.login_bg_url ?? ""}
                                                                placeholder="https://… .jpg or .webm — empty for the default"
                                                                onChange={(e) => setContent((c) => ({ ...c, login_bg_url: e.target.value }))}
                                                                className="mt-2 w-full rounded-lg bg-primary px-3 py-2 text-sm text-primary ring-1 ring-secondary outline-none focus:ring-brand"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* ── Your journey ──
                                                    One ordered path from the first form to a finished website. Replaced a
                                                    "Your setup" tracker plus a funnel explainer: the tracker was a subset
                                                    of these steps, and two of the funnel cards jumped to Website and
                                                    GoHighLevel, which are no longer on the client's menu.

                                                    Steps 1 and 4 read live form state. The rest are AM ticks — calls and
                                                    reviews happen off-platform, so there is nothing to infer them from. */}
                                                <div className="mt-10">
                                                    <div className="flex flex-wrap items-end justify-between gap-3">
                                                        <div>
                                                            <h2 className="text-lg font-semibold text-primary">Your journey</h2>
                                                            <p className="mt-1 text-sm text-tertiary">
                                                                {journeyDoneCount === journeySteps.length
                                                                    ? "Every step is done — you're fully set up."
                                                                    : "Where you are, and what happens next."}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <ProgressBarCircle value={Math.round((journeyDoneCount / journeySteps.length) * 100)} size="xxs" />
                                                            <span className="text-sm font-semibold text-secondary tabular-nums">
                                                                {journeyDoneCount} of {journeySteps.length}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <ol className="mt-6 grid list-none gap-0 p-0">
                                                        {journeySteps.map((step, i) => {
                                                            const isCurrent = step.id === journeyCurrentId;
                                                            const isLast = i === journeySteps.length - 1;
                                                            // A client must not be offered a jump into a section they
                                                            // can't open — same rule the side menu uses.
                                                            const target = step.to;
                                                            const canJump = !!target && (isTeam || revealedToClient(target));
                                                            return (
                                                                <li key={step.id} className="relative flex gap-4 pb-5 last:pb-0">
                                                                    {/* Rail between nodes. Filled up to the last completed
                                                                        step so progress reads at a glance. */}
                                                                    {!isLast && (
                                                                        <span
                                                                            aria-hidden="true"
                                                                            className={cx(
                                                                                "absolute top-10 left-[17px] h-[calc(100%-2.5rem)] w-0.5 rounded-full",
                                                                                step.done ? "bg-brand-solid" : "bg-border-secondary",
                                                                            )}
                                                                        />
                                                                    )}
                                                                    <span
                                                                        className={cx(
                                                                            "relative z-10 grid size-9 shrink-0 place-items-center rounded-full text-[12px] font-bold tabular-nums transition duration-100 ease-linear",
                                                                            step.done
                                                                                ? "bg-brand-solid text-white"
                                                                                : isCurrent
                                                                                  ? "bg-brand-secondary text-brand-secondary ring-2 ring-brand"
                                                                                  : "bg-secondary text-quaternary",
                                                                        )}
                                                                    >
                                                                        {step.done ? <Check className="size-4" aria-hidden="true" /> : i + 1}
                                                                    </span>

                                                                    <div
                                                                        className={cx(
                                                                            "relative min-w-0 flex-1 rounded-xl bg-primary p-4 shadow-xs ring-1 transition duration-100 ease-linear",
                                                                            // The travelling beam marks where to start. It follows the
                                                                            // first unfinished step rather than being pinned to step 1,
                                                                            // so it's on step 1 for a new client and moves on with them
                                                                            // — a pulsing halo on a step they've already done would be
                                                                            // pointing at nothing.
                                                                            //
                                                                            // The ring stays neutral even here: a brand-coloured beam
                                                                            // travelling over a brand-coloured ring is invisible. The
                                                                            // beam is what carries the colour, and the numbered node and
                                                                            // "Up next" badge still mark the step while it passes.
                                                                            isCurrent ? "step-beam ring-secondary" : "ring-secondary",
                                                                        )}
                                                                    >
                                                                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                                                                            <span className="font-mono text-[11px] text-quaternary">Step {i + 1}</span>
                                                                            <h3 className="text-md font-semibold text-primary">{step.label}</h3>
                                                                            {step.done ? (
                                                                                <BadgeWithDot color="success" size="sm" type="pill-color">
                                                                                    Done
                                                                                </BadgeWithDot>
                                                                            ) : (
                                                                                isCurrent && (
                                                                                    <BadgeWithDot color="brand" size="sm" type="pill-color">
                                                                                        Up next
                                                                                    </BadgeWithDot>
                                                                                )
                                                                            )}
                                                                        </div>
                                                                        <p className="mt-1.5 text-sm text-tertiary text-pretty">{step.detail}</p>

                                                                        {!step.done && step.progress && step.progress.total > 0 && (
                                                                            <div className="mt-3">
                                                                                <ProgressBar value={Math.round((step.progress.value / step.progress.total) * 100)} />
                                                                            </div>
                                                                        )}

                                                                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                                                                            {canJump && target && (
                                                                                <Button size="sm" color="link-color" iconTrailing={ArrowRight} onClick={() => openNavItem(target)}>
                                                                                    Open
                                                                                </Button>
                                                                            )}
                                                                            {/* External action (the Calendly booking link). Held back until
                                                                                its prerequisite step is done, with the reason shown instead
                                                                                of a link that would lead to an unprepared call. */}
                                                                            {step.href &&
                                                                                !step.done &&
                                                                                (step.requires && !journeySteps.find((x) => x.id === step.requires)?.done ? (
                                                                                    <span className="text-xs text-quaternary">
                                                                                        Available once{" "}
                                                                                        {journeySteps.find((x) => x.id === step.requires)?.label ?? "the previous step"} is
                                                                                        done
                                                                                    </span>
                                                                                ) : step.href === KICKOFF_CALENDLY ? (
                                                                                    // Booking opens over the dashboard instead of in a new
                                                                                    // tab. Sending a client to calendly.com mid-journey costs
                                                                                    // them their place in the list and lands them on a page
                                                                                    // with no way back here.
                                                                                    <Button size="sm" iconTrailing={Calendar} onClick={() => setBookingOpen(true)}>
                                                                                        {step.hrefLabel ?? "Book your call"}
                                                                                    </Button>
                                                                                ) : (
                                                                                    <Button
                                                                                        size="sm"
                                                                                        href={step.href}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        iconTrailing={LinkExternal01}
                                                                                    >
                                                                                        {step.hrefLabel ?? "Open link"}
                                                                                    </Button>
                                                                                ))}
                                                                            {/* AM tick, edit mode only. Auto steps get no tick:
                                                                                a manual override could contradict the answer
                                                                                count printed directly above it. */}
                                                                            {!isLocked &&
                                                                                isTeam &&
                                                                                (step.auto ? (
                                                                                    <span className="text-xs text-quaternary">Tracked from the form itself</span>
                                                                                ) : (
                                                                                    <Button
                                                                                        size="sm"
                                                                                        color="secondary"
                                                                                        iconLeading={step.done ? RefreshCw01 : CheckCircle}
                                                                                        onClick={() => toggleJourneyStep(step.id)}
                                                                                    >
                                                                                        {step.done ? "Mark not done" : "Mark done"}
                                                                                    </Button>
                                                                                ))}
                                                                        </div>
                                                                    </div>
                                                                </li>
                                                            );
                                                        })}
                                                    </ol>
                                                </div>
                                            </>
                                        )}

                                        {/* ── Section content (driven by the side menu) ── */}
                                        <div className="mt-10">
                                            <div className="min-w-0">
                                                {activeSection === "flow" && (
                                                    <>
                                                        {/* This section renders its own component, so it was the one
                                                            section without an eyebrow — visible now that they name the
                                                            phase, since its sibling Chat Widget shows "Phase 4". */}
                                                        <SectionEyebrow section={activeSection} />
                                                        <div className="mt-6">
                                                            <WelcomeFlowSection
                                                                slug={slug}
                                                                clientName={clientName}
                                                                isLocked={isLocked}
                                                                isTemplate={isTemplate}
                                                            />
                                                        </div>
                                                    </>
                                                )}

                                                {/* ── Client Input — the Onboarding Form (the client's FIRST form) ── */}
                                                {activeSection === "intake" && (
                                                    <Reveal>
                                                        <SectionEyebrow section={activeSection} />
                                                        <SectionHeading>Onboarding Form</SectionHeading>
                                                        <p className="mt-3 text-md text-tertiary">
                                                            The first step — your business details, goals, and the account logins we need before your Kick-Off
                                                            Call. Completing it at least 12 hours before the call lets our team prepare a customized strategy,
                                                            and it ends with booking your call.
                                                        </p>

                                                        <div className="mt-6 rounded-2xl bg-primary p-5 ring-1 ring-secondary">
                                                            <div className="flex flex-wrap items-center justify-between gap-4">
                                                                <div className="flex items-center gap-3">
                                                                    <FeaturedIcon
                                                                        icon={intakeSubmitted ? CheckCircle : ClipboardCheck}
                                                                        color={intakeSubmitted ? "success" : intakeStarted ? "brand" : "gray"}
                                                                        theme="light"
                                                                        size="lg"
                                                                    />
                                                                    <div>
                                                                        <p className="text-md font-semibold text-primary">
                                                                            {isTemplate
                                                                                ? "Master template"
                                                                                : intakeStatus === "error"
                                                                                  ? "Couldn't load your form"
                                                                                  : !intakeReady
                                                                                    ? "Checking your form…"
                                                                                    : intakeSubmitted
                                                                                      ? "Submitted — thank you!"
                                                                                      : intakeStarted
                                                                                        ? "In progress"
                                                                                        : "Not started yet"}
                                                                        </p>
                                                                        <p className="mt-0.5 text-sm text-tertiary" aria-live="polite">
                                                                            {isTemplate ? (
                                                                                "Preview of the form every client fills in first."
                                                                            ) : intakeStatus === "error" ? (
                                                                                "Check your connection and try again."
                                                                            ) : !intakeReady ? (
                                                                                "One moment…"
                                                                            ) : intakeSubmittedAt ? (
                                                                                <>
                                                                                    Sent{" "}
                                                                                    {new Date(intakeSubmittedAt).toLocaleDateString(undefined, {
                                                                                        month: "long",
                                                                                        day: "numeric",
                                                                                        year: "numeric",
                                                                                    })}{" "}
                                                                                    · you can still update your answers
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    {intakeInfo.answered} of {intakeInfo.total} questions answered
                                                                                </>
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                {intakeReady && !intakeSubmitted && (
                                                                    <ProgressBarCircle
                                                                        value={intakeInfo.answered}
                                                                        max={Math.max(intakeInfo.total, 1)}
                                                                        size="xs"
                                                                        label="Form progress"
                                                                        valueFormatter={(_, pct) => `${pct}%`}
                                                                    />
                                                                )}
                                                            </div>

                                                            <div className="mt-5 flex flex-wrap items-center gap-3">
                                                                {intakeStatus === "error" ? (
                                                                    <Button color="secondary" onClick={() => setIntakeStatus("idle")}>
                                                                        Try again
                                                                    </Button>
                                                                ) : !isTemplate && !intakeReady ? (
                                                                    <Button isDisabled iconTrailing={ArrowRight}>
                                                                        Open the form
                                                                    </Button>
                                                                ) : (
                                                                    <Button
                                                                        iconTrailing={ArrowRight}
                                                                        {...(isTemplate ? { href: intakeHref } : { onClick: () => setFormModal("intake") })}
                                                                    >
                                                                        {intakeSubmitted
                                                                            ? "Review your answers"
                                                                            : intakeStarted
                                                                              ? "Continue the form"
                                                                              : "Start the form"}
                                                                    </Button>
                                                                )}
                                                                {isTeam && !isTemplate && intakeSlug && intakeReady && (
                                                                    <Button
                                                                        color="secondary"
                                                                        iconLeading={Copy01}
                                                                        onClick={() => {
                                                                            void navigator.clipboard.writeText(`${window.location.origin}/${intakeSlug}`);
                                                                            setCopiedIntakeLink(true);
                                                                            window.setTimeout(() => setCopiedIntakeLink(false), 2000);
                                                                        }}
                                                                    >
                                                                        {copiedIntakeLink ? "Link copied" : "Copy Link"}
                                                                    </Button>
                                                                )}
                                                                {/* Reset only appears once there is something to erase. On an
                                                                    untouched form it offered to wipe nothing, which is a
                                                                    destructive-looking button with no purpose. */}
                                                                {isTeam &&
                                                                    !isTemplate &&
                                                                    intakeSlug &&
                                                                    intakeReady &&
                                                                    (intakeStarted || intakeSubmitted) &&
                                                                    (armedReset === "intake" ? (
                                                                        <>
                                                                            <Button
                                                                                color="primary-destructive"
                                                                                isLoading={resetting}
                                                                                showTextWhileLoading
                                                                                onClick={() => void resetForm("intake")}
                                                                            >
                                                                                {resetting ? "Resetting…" : "Yes, erase all answers"}
                                                                            </Button>
                                                                            <Button
                                                                                color="secondary"
                                                                                isDisabled={resetting}
                                                                                onClick={() => setArmedReset(null)}
                                                                            >
                                                                                Cancel
                                                                            </Button>
                                                                        </>
                                                                    ) : (
                                                                        <Button
                                                                            color="tertiary-destructive"
                                                                            iconLeading={RefreshCw01}
                                                                            onClick={() => setArmedReset("intake")}
                                                                        >
                                                                            Reset form
                                                                        </Button>
                                                                    ))}
                                                            </div>

                                                            {isTeam && !isTemplate && intakeSlug && (
                                                                <p className="mt-4 border-t border-secondary pt-3 text-xs text-quaternary">
                                                                    Form page: <span className="font-medium text-tertiary">/{intakeSlug}</span>
                                                                </p>
                                                            )}

                                                            {/* Once it's in, the answers ARE the useful content — showing them
                                                        here saves a trip through the review screen. */}
                                                            {intakeSubmitted && intakeData && (
                                                                <OnboardingAnswers
                                                                    sections={clientOnboardingAnswers(intakeData)}
                                                                    isTeamView={isTeam}
                                                                    clientName={clientName}
                                                                    onEdit={(field) => {
                                                                        setFormModalField(field);
                                                                        setFormModal("intake");
                                                                    }}
                                                                />
                                                            )}
                                                        </div>
                                                    </Reveal>
                                                )}

                                                {/* ── Client Input — the Brand Vision Form the client fills in themselves ── */}
                                                {activeSection === "onboarding" && (
                                                    <Reveal>
                                                        <SectionEyebrow section={activeSection} />
                                                        <SectionHeading>Brand Vision Form</SectionHeading>
                                                        <p className="mt-3 text-md text-tertiary">
                                                            Your Brand Vision Form — {ONBOARDING_TOTAL_QUESTIONS} quick questions about why you built this
                                                            property, who it's for, and how it should feel. It takes 5–10 minutes, and it's what everything
                                                            below is built from: your Master Document, brand kit, emails, and chat widget all start here.
                                                        </p>

                                                        <div className="mt-6 rounded-2xl bg-primary p-5 ring-1 ring-secondary">
                                                            <div className="flex flex-wrap items-center justify-between gap-4">
                                                                <div className="flex items-center gap-3">
                                                                    <FeaturedIcon
                                                                        icon={onboardingSubmitted ? CheckCircle : ClipboardCheck}
                                                                        color={onboardingSubmitted ? "success" : onboardingStarted ? "brand" : "gray"}
                                                                        theme="light"
                                                                        size="lg"
                                                                    />
                                                                    <div>
                                                                        <p className="text-md font-semibold text-primary">
                                                                            {isTemplate
                                                                                ? "Master template"
                                                                                : onboardingStatus === "error"
                                                                                  ? "Couldn't load your form"
                                                                                  : !onboardingReady
                                                                                    ? "Checking your form…"
                                                                                    : onboardingSubmitted
                                                                                      ? "Submitted — thank you!"
                                                                                      : onboardingStarted
                                                                                        ? "In progress"
                                                                                        : "Not started yet"}
                                                                        </p>
                                                                        <p className="mt-0.5 text-sm text-tertiary" aria-live="polite">
                                                                            {isTemplate ? (
                                                                                "Preview of the form every client fills in."
                                                                            ) : onboardingStatus === "error" ? (
                                                                                "Check your connection and try again."
                                                                            ) : !onboardingReady ? (
                                                                                "One moment…"
                                                                            ) : onboardingSubmittedAt ? (
                                                                                <>
                                                                                    Sent{" "}
                                                                                    {new Date(onboardingSubmittedAt).toLocaleDateString(undefined, {
                                                                                        month: "long",
                                                                                        day: "numeric",
                                                                                        year: "numeric",
                                                                                    })}{" "}
                                                                                    · you can still update your answers
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    {onboardingInfo.answered} of {onboardingInfo.total} questions answered
                                                                                </>
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                {onboardingReady && !onboardingSubmitted && (
                                                                    <ProgressBarCircle
                                                                        value={onboardingInfo.answered}
                                                                        max={Math.max(onboardingInfo.total, 1)}
                                                                        size="xs"
                                                                        label="Form progress"
                                                                        valueFormatter={(_, pct) => `${pct}%`}
                                                                    />
                                                                )}
                                                            </div>

                                                            <div className="mt-5 flex flex-wrap items-center gap-3">
                                                                {onboardingStatus === "error" ? (
                                                                    <Button color="secondary" onClick={() => setOnboardingStatus("idle")}>
                                                                        Try again
                                                                    </Button>
                                                                ) : !isTemplate && !onboardingReady ? (
                                                                    // A disabled link renders an empty href — plain button until the check lands.
                                                                    <Button isDisabled iconTrailing={ArrowRight}>
                                                                        Open the form
                                                                    </Button>
                                                                ) : (
                                                                    <Button
                                                                        iconTrailing={ArrowRight}
                                                                        {...(isTemplate ? { href: onboardingHref } : { onClick: () => setFormModal("brand") })}
                                                                    >
                                                                        {onboardingSubmitted
                                                                            ? "Review your answers"
                                                                            : onboardingStarted
                                                                              ? "Continue the form"
                                                                              : "Start the form"}
                                                                    </Button>
                                                                )}
                                                                {isTeam && !isTemplate && onboardingSlug && onboardingReady && (
                                                                    <Button
                                                                        color="secondary"
                                                                        iconLeading={Copy01}
                                                                        onClick={() => {
                                                                            void navigator.clipboard.writeText(`${window.location.origin}/${onboardingSlug}`);
                                                                            setCopiedOnboardingLink(true);
                                                                            window.setTimeout(() => setCopiedOnboardingLink(false), 2000);
                                                                        }}
                                                                    >
                                                                        {copiedOnboardingLink ? "Link copied" : "Copy Link"}
                                                                    </Button>
                                                                )}
                                                                {/* Same rule as the Onboarding Form: nothing answered, nothing
                                                                    to reset, so no button. */}
                                                                {isTeam &&
                                                                    !isTemplate &&
                                                                    onboardingSlug &&
                                                                    onboardingReady &&
                                                                    (onboardingStarted || onboardingSubmitted) &&
                                                                    (armedReset === "brand" ? (
                                                                        <>
                                                                            <Button
                                                                                color="primary-destructive"
                                                                                isLoading={resetting}
                                                                                showTextWhileLoading
                                                                                onClick={() => void resetForm("brand")}
                                                                            >
                                                                                {resetting ? "Resetting…" : "Yes, erase all answers"}
                                                                            </Button>
                                                                            <Button
                                                                                color="secondary"
                                                                                isDisabled={resetting}
                                                                                onClick={() => setArmedReset(null)}
                                                                            >
                                                                                Cancel
                                                                            </Button>
                                                                        </>
                                                                    ) : (
                                                                        <Button
                                                                            color="tertiary-destructive"
                                                                            iconLeading={RefreshCw01}
                                                                            onClick={() => setArmedReset("brand")}
                                                                        >
                                                                            Reset form
                                                                        </Button>
                                                                    ))}
                                                            </div>

                                                            {/* Same inline review the Onboarding Form gets: once it's in, the
                                                        answers ARE the useful content, so don't make anyone open the
                                                        review screen to read them. */}
                                                            {onboardingSubmitted && brandData && (
                                                                <OnboardingAnswers
                                                                    sections={hostOnboardingAnswers(brandData)}
                                                                    isTeamView={isTeam}
                                                                    clientName={clientName}
                                                                    onEdit={(field) => {
                                                                        setFormModalField(field);
                                                                        setFormModal("brand");
                                                                    }}
                                                                />
                                                            )}

                                                            {/* Team-only: the exact form this dashboard is wired to, so a mismatched
                                                        copy created from the form's own wizard is visible instead of silent. */}
                                                            {isTeam && !isTemplate && onboardingSlug && (
                                                                <p className="mt-4 border-t border-secondary pt-3 text-xs text-quaternary">
                                                                    Form page: <span className="font-medium text-tertiary">/{onboardingSlug}</span>
                                                                </p>
                                                            )}
                                                        </div>
                                                    </Reveal>
                                                )}

                                                {/* ── Master Document — the Foundation everything downstream reads from ── */}
                                                {/* ── Client Overview Document — the AM's internal brief ──
                                                    Rendered only for the team. The nav row is filtered out for a
                                                    client and revealedToClient() refuses this id outright, so this
                                                    guard is the third of three rather than the only one. */}
                                                {activeSection === "overviewdoc" && isTeam && (
                                                    <Reveal>
                                                        <SectionEyebrow section={activeSection} />
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <SectionHeading>Client Overview</SectionHeading>
                                                            <BadgeWithDot color="warning" size="sm" type="pill-color">
                                                                Team only
                                                            </BadgeWithDot>
                                                        </div>
                                                        <p className="mt-3 text-md text-tertiary">
                                                            Your working brief on this client — what they sell, who they sell it to, and how they want to be
                                                            handled. The client never sees this section.
                                                        </p>

                                                        <div className="mt-4 flex flex-wrap items-center gap-3">
                                                            {!isTemplate && (
                                                                <Button
                                                                    size="sm"
                                                                    color="secondary"
                                                                    iconLeading={Stars02}
                                                                    isLoading={overviewBusy}
                                                                    showTextWhileLoading
                                                                    onClick={() => void generateOverview()}
                                                                >
                                                                    {overviewBusy ? "Reading their answers…" : "Draft from the onboarding form"}
                                                                </Button>
                                                            )}
                                                            <span className="text-sm text-quaternary tabular-nums">
                                                                {OVERVIEW_SECTIONS.length + 2} sections · {overviewFilled} of {OVERVIEW_COUNTED_FIELDS.length} fields filled
                                                            </span>
                                                            {overviewDoc.generated_at && (
                                                                <span className="text-xs text-quaternary">
                                                                    Drafted {new Date(overviewDoc.generated_at).toLocaleDateString()} — review before relying on it
                                                                </span>
                                                            )}
                                                        </div>
                                                        {overviewError && (
                                                            <p className="mt-2 flex items-start gap-1.5 text-sm text-error-primary" role="alert">
                                                                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                                                {overviewError}
                                                            </p>
                                                        )}
                                                        {isLocked && (
                                                            <p className="mt-2 text-xs text-quaternary">
                                                                Unlock the dashboard to edit these fields.
                                                            </p>
                                                        )}

                                                        <div className="mt-8 flex flex-col gap-10">
                                                            {OVERVIEW_SECTIONS.map((sec) => (
                                                                <section key={sec.id}>
                                                                    <p className="text-xs font-semibold tracking-wide text-brand-secondary uppercase">{sec.title}</p>
                                                                    <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                                                                        {sec.fields.map((f) => (
                                                                            <div key={String(f.key)} className={cx(!f.half && "sm:col-span-2")}>
                                                                                <p className="text-sm font-medium text-secondary">{f.label}</p>
                                                                                {isLocked ? (
                                                                                    <p
                                                                                        className={cx(
                                                                                            "mt-1 text-md whitespace-pre-wrap",
                                                                                            String(overviewDoc[f.key] ?? "").trim() ? "text-tertiary" : "text-quaternary italic",
                                                                                        )}
                                                                                    >
                                                                                        {String(overviewDoc[f.key] ?? "").trim() || "Not filled in"}
                                                                                    </p>
                                                                                ) : f.long ? (
                                                                                    <textarea
                                                                                        rows={2}
                                                                                        placeholder={f.placeholder}
                                                                                        value={String(overviewDoc[f.key] ?? "")}
                                                                                        onChange={(e) => patchOverviewDoc({ [f.key]: e.target.value } as Partial<OverviewDoc>)}
                                                                                        className={cx(editInput(), "mt-1.5 resize-y")}
                                                                                    />
                                                                                ) : (
                                                                                    <input
                                                                                        placeholder={f.placeholder}
                                                                                        value={String(overviewDoc[f.key] ?? "")}
                                                                                        onChange={(e) => patchOverviewDoc({ [f.key]: e.target.value } as Partial<OverviewDoc>)}
                                                                                        className={cx(editInput(), "mt-1.5")}
                                                                                    />
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>

                                                                    {/* Properties sit between Platforms and Goals, matching the brief's order. */}
                                                                    {sec.id === "platforms" && (
                                                                        <div className="mt-10">
                                                                            <div className="flex items-center justify-between gap-3">
                                                                                <p className="text-xs font-semibold tracking-wide text-brand-secondary uppercase">Properties</p>
                                                                                {!isLocked && (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() =>
                                                                                            patchOverviewDoc({
                                                                                                properties: [...overviewDoc.properties, { id: crypto.randomUUID(), name: "", link: "" }],
                                                                                            })
                                                                                        }
                                                                                        className="text-sm font-semibold text-brand-secondary transition duration-100 ease-linear hover:underline"
                                                                                    >
                                                                                        + Add property
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                            <div className="mt-3 flex flex-col gap-2">
                                                                                {overviewDoc.properties.map((prop, i) => (
                                                                                    <div
                                                                                        key={prop.id}
                                                                                        className="grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-primary p-3 ring-1 ring-secondary"
                                                                                    >
                                                                                        <span className="font-mono text-xs text-quaternary tabular-nums">
                                                                                            {String(i + 1).padStart(2, "0")}
                                                                                        </span>
                                                                                        {isLocked ? (
                                                                                            <>
                                                                                                <span className="truncate text-md text-tertiary">{prop.name || "—"}</span>
                                                                                                <span className="truncate text-md text-tertiary">{prop.link || "—"}</span>
                                                                                                <span />
                                                                                            </>
                                                                                        ) : (
                                                                                            <>
                                                                                                <input
                                                                                                    placeholder="Property name"
                                                                                                    value={prop.name}
                                                                                                    onChange={(e) =>
                                                                                                        patchOverviewDoc({
                                                                                                            properties: overviewDoc.properties.map((x) =>
                                                                                                                x.id === prop.id ? { ...x, name: e.target.value } : x,
                                                                                                            ),
                                                                                                        })
                                                                                                    }
                                                                                                    className={editInput()}
                                                                                                />
                                                                                                <input
                                                                                                    placeholder="Listing link"
                                                                                                    value={prop.link}
                                                                                                    onChange={(e) =>
                                                                                                        patchOverviewDoc({
                                                                                                            properties: overviewDoc.properties.map((x) =>
                                                                                                                x.id === prop.id ? { ...x, link: e.target.value } : x,
                                                                                                            ),
                                                                                                        })
                                                                                                    }
                                                                                                    className={editInput()}
                                                                                                />
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() =>
                                                                                                        patchOverviewDoc({
                                                                                                            properties: overviewDoc.properties.filter((x) => x.id !== prop.id),
                                                                                                        })
                                                                                                    }
                                                                                                    title="Remove this property"
                                                                                                    className="flex size-7 items-center justify-center rounded-lg text-fg-quaternary transition duration-100 ease-linear hover:bg-secondary hover:text-error-primary"
                                                                                                >
                                                                                                    <Trash01 className="size-3.5" aria-hidden="true" />
                                                                                                </button>
                                                                                            </>
                                                                                        )}
                                                                                    </div>
                                                                                ))}
                                                                                {!overviewDoc.properties.length && (
                                                                                    <p className="rounded-xl border border-dashed border-secondary px-4 py-3 text-sm text-quaternary italic">
                                                                                        No properties listed yet.
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </section>
                                                            ))}

                                                            {/* Baseline — the numbers as they stood at kickoff, so growth has a zero point. */}
                                                            <section>
                                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                                    <p className="text-xs font-semibold tracking-wide text-brand-secondary uppercase">Baseline (snapshot)</p>
                                                                    <span className="text-xs text-quaternary">Recorded at kickoff</span>
                                                                </div>
                                                                <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                                                                    {OVERVIEW_BASELINE.map((f) => (
                                                                        <div key={String(f.key)} className="rounded-xl bg-primary p-4 ring-1 ring-secondary">
                                                                            <p className="text-sm font-medium text-secondary">{f.label}</p>
                                                                            {isLocked ? (
                                                                                <p className="mt-1 text-md text-tertiary tabular-nums">
                                                                                    {String(overviewDoc[f.key] ?? "").trim() || "—"}
                                                                                </p>
                                                                            ) : (
                                                                                <input
                                                                                    placeholder="—"
                                                                                    value={String(overviewDoc[f.key] ?? "")}
                                                                                    onChange={(e) => patchOverviewDoc({ [f.key]: e.target.value } as Partial<OverviewDoc>)}
                                                                                    className={cx(editInput(), "mt-1.5 tabular-nums")}
                                                                                />
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>

                                                                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-primary p-4 ring-1 ring-secondary">
                                                                    <div>
                                                                        <p className="text-sm font-medium text-secondary">Current direct booking split</p>
                                                                        <p className="mt-0.5 text-xs text-quaternary">Fill out after gaining PMS access</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        {isLocked ? (
                                                                            <span className="text-md text-tertiary tabular-nums">
                                                                                {String(overviewDoc.direct_booking_split ?? "").trim() || "—"}
                                                                            </span>
                                                                        ) : (
                                                                            <input
                                                                                placeholder="—"
                                                                                value={overviewDoc.direct_booking_split}
                                                                                onChange={(e) => patchOverviewDoc({ direct_booking_split: e.target.value })}
                                                                                className={cx(editInput(), "w-20 text-right tabular-nums")}
                                                                            />
                                                                        )}
                                                                        <span className="text-md text-tertiary">%</span>
                                                                    </div>
                                                                </div>

                                                                <div className="mt-3 rounded-xl bg-primary p-4 ring-1 ring-secondary">
                                                                    <p className="text-sm font-medium text-secondary">Instagram profile screenshot</p>
                                                                    {overviewDoc.instagram_screenshot ? (
                                                                        <div className="mt-3 flex flex-wrap items-start gap-3">
                                                                            <img
                                                                                src={overviewDoc.instagram_screenshot}
                                                                                alt="Instagram profile at kickoff"
                                                                                className="max-h-56 rounded-lg ring-1 ring-secondary"
                                                                            />
                                                                            {!isLocked && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => patchOverviewDoc({ instagram_screenshot: "" })}
                                                                                    className="text-sm font-medium text-tertiary transition duration-100 ease-linear hover:text-error-primary"
                                                                                >
                                                                                    Remove
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    ) : isLocked ? (
                                                                        <p className="mt-1 text-md text-quaternary italic">Not added</p>
                                                                    ) : (
                                                                        <label className="mt-3 flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-secondary px-4 py-6 text-sm text-quaternary transition duration-100 ease-linear hover:border-brand hover:text-tertiary">
                                                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => void onPickOverviewShot(e)} />
                                                                            Add an image — it's compressed before saving
                                                                        </label>
                                                                    )}
                                                                </div>
                                                            </section>
                                                        </div>
                                                    </Reveal>
                                                )}

                                                {activeSection === "foundation" && (
                                                    <Reveal>
                                                        <SectionEyebrow section={activeSection} />
                                                        <SectionHeading>Master Document</SectionHeading>
                                                        <p className="mt-3 text-md text-tertiary">
                                                            This is where it starts. Everyone — you, your team, and ours — keeps this updated. It's what your
                                                            Welcome Emails, chat widget, and every future AI feature read from, so the more complete it is, the
                                                            smarter everything downstream gets.
                                                        </p>

                                                        {/* Team-only: compile the answers into the AM-ready doc, or export it. */}
                                                        {isTeam && (
                                                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                                                <Button
                                                                    size="sm"
                                                                    color="secondary"
                                                                    iconLeading={FileCheck02}
                                                                    onClick={() => setShowMasterDocModal(true)}
                                                                >
                                                                    Generate for AM review
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    color="secondary"
                                                                    iconLeading={Download01}
                                                                    isLoading={pdfBusy}
                                                                    showTextWhileLoading
                                                                    onClick={() => void downloadMasterDocPdf()}
                                                                >
                                                                    {pdfBusy ? "Preparing PDF…" : "Download PDF"}
                                                                </Button>
                                                                {pdfError && (
                                                                    <span className="text-sm text-error-primary" role="alert">
                                                                        Couldn't build the PDF. Please try again.
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}

                                                        <div className="mt-6 flex flex-col gap-6">
                                                            {(
                                                                [
                                                                    {
                                                                        key: "propertyBasics",
                                                                        label: "Property basics",
                                                                        hint: "Name, type, location, vibe.",
                                                                        placeholder:
                                                                            "e.g. Oceanview Cottage — a 3-bed boutique rental on the Big Sur coast, rustic-luxury vibe.",
                                                                    },
                                                                    {
                                                                        key: "persona",
                                                                        label: "Ideal guest persona",
                                                                        hint: "Who books, why they come, what they care about.",
                                                                        placeholder:
                                                                            "e.g. Couples celebrating an anniversary, mid-30s to 50s, want privacy + a view, not big groups.",
                                                                    },
                                                                    {
                                                                        key: "toneOfVoice",
                                                                        label: "Tone of voice",
                                                                        hint: "How your brand talks.",
                                                                        placeholder: "e.g. Warm and personal, a little playful — never corporate.",
                                                                    },
                                                                    {
                                                                        key: "amenities",
                                                                        label: "Amenities & house rules",
                                                                        hint: "What's included, what's not allowed.",
                                                                        placeholder:
                                                                            "e.g. Hot tub, full kitchen, pet-friendly. No parties, quiet hours after 10pm.",
                                                                    },
                                                                    {
                                                                        key: "localRecommendations",
                                                                        label: "Local recommendations",
                                                                        hint: "Food, activities, hidden gems.",
                                                                        placeholder:
                                                                            "e.g. Nepenthe for sunset dinner, McWay Falls trail, Big Sur Bakery for breakfast.",
                                                                    },
                                                                    {
                                                                        key: "bookingLinks",
                                                                        label: "Booking & upsell links",
                                                                        hint: "Where guests book, and anything you'd like to upsell.",
                                                                        placeholder:
                                                                            "e.g. Book direct at oceanviewcottage.com/book — ask about our late-checkout add-on.",
                                                                    },
                                                                ] as const
                                                            ).map((f) => (
                                                                <div key={f.key}>
                                                                    <p className="text-sm font-semibold text-primary">{f.label}</p>
                                                                    <p className="mt-0.5 text-xs text-tertiary">{f.hint}</p>
                                                                    {isLocked ? (
                                                                        foundation[f.key] ? (
                                                                            <p className="mt-2 rounded-xl bg-secondary px-4 py-3 text-sm whitespace-pre-wrap text-secondary">
                                                                                {foundation[f.key]}
                                                                            </p>
                                                                        ) : (
                                                                            <p className="mt-2 rounded-xl border border-dashed border-secondary px-4 py-3 text-sm text-quaternary italic">
                                                                                Not filled in yet.
                                                                            </p>
                                                                        )
                                                                    ) : (
                                                                        <textarea
                                                                            rows={2}
                                                                            placeholder={f.placeholder}
                                                                            value={foundation[f.key]}
                                                                            onChange={(e) => patchFoundation({ [f.key]: e.target.value })}
                                                                            className={cx(editInput(), "mt-2 resize-y")}
                                                                        />
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* FAQ bank — client & AM can both add */}
                                                        <div className="mt-8 border-t border-secondary pt-6">
                                                            <div className="flex items-center gap-2">
                                                                <HelpCircle className="size-4 text-fg-quaternary" aria-hidden="true" />
                                                                <p className="text-sm font-semibold text-primary">FAQ bank</p>
                                                            </div>
                                                            <p className="mt-0.5 text-xs text-tertiary">
                                                                Questions guests ask often — the chat widget answers straight from this list.
                                                            </p>

                                                            <div className="mt-4 flex flex-col gap-3">
                                                                {foundation.faqs.length === 0 && isLocked && (
                                                                    <p className="rounded-xl border border-dashed border-secondary px-4 py-3 text-sm text-quaternary italic">
                                                                        No FAQs yet.
                                                                    </p>
                                                                )}
                                                                {foundation.faqs.map((f, i) =>
                                                                    isLocked ? (
                                                                        <div key={f.id} className="rounded-xl p-4 ring-1 ring-secondary">
                                                                            <p className="text-sm font-semibold text-primary">
                                                                                {f.question || "Untitled question"}
                                                                            </p>
                                                                            <p className="mt-1 text-sm text-tertiary">{f.answer || "No answer yet."}</p>
                                                                        </div>
                                                                    ) : (
                                                                        <div key={f.id} className="flex flex-col gap-1.5 rounded-xl p-4 ring-1 ring-secondary">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <input
                                                                                    type="text"
                                                                                    placeholder="Question"
                                                                                    value={f.question}
                                                                                    onChange={(e) => updateFaq(i, { question: e.target.value })}
                                                                                    className={editInput("font-semibold")}
                                                                                />
                                                                                <button
                                                                                    type="button"
                                                                                    title="Remove FAQ"
                                                                                    onClick={() =>
                                                                                        patchFoundation({ faqs: foundation.faqs.filter((_, j) => j !== i) })
                                                                                    }
                                                                                    className={removeButton}
                                                                                >
                                                                                    <Trash01 className="size-4" aria-hidden="true" />
                                                                                </button>
                                                                            </div>
                                                                            <textarea
                                                                                rows={2}
                                                                                placeholder="Answer"
                                                                                value={f.answer}
                                                                                onChange={(e) => updateFaq(i, { answer: e.target.value })}
                                                                                className={cx(editInput(), "resize-y text-xs")}
                                                                            />
                                                                        </div>
                                                                    ),
                                                                )}
                                                                {!isLocked && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            patchFoundation({
                                                                                faqs: [...foundation.faqs, { id: uid(), question: "", answer: "" }],
                                                                            })
                                                                        }
                                                                        className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-tertiary transition duration-100 ease-linear hover:text-brand-secondary"
                                                                    >
                                                                        <Plus className="size-4" aria-hidden="true" />
                                                                        Add FAQ
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </Reveal>
                                                )}

                                                {/* ── Brand Kit ── */}
                                                {activeSection === "brand" && (
                                                    <Reveal>
                                                        <SectionEyebrow section={activeSection} />
                                                        <div className="flex flex-wrap items-end justify-between gap-3">
                                                            <SectionHeading>Brand Kit</SectionHeading>
                                                            {isLocked ? (
                                                                content.brand.folder_link && (
                                                                    <Button
                                                                        href={content.brand.folder_link}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        color="link-color"
                                                                        size="md"
                                                                        iconTrailing={LinkExternal01}
                                                                    >
                                                                        Open brand folder
                                                                    </Button>
                                                                )
                                                            ) : (
                                                                <input
                                                                    type="text"
                                                                    placeholder="Brand folder link (Drive / Canva)"
                                                                    value={content.brand.folder_link}
                                                                    onChange={(e) => patchBrand({ folder_link: e.target.value })}
                                                                    className={editInput("max-w-80")}
                                                                />
                                                            )}
                                                        </div>
                                                        <p className="mt-3 text-md text-tertiary">
                                                            Your official colors and typography. Use these everywhere so your brand stays consistent.
                                                        </p>

                                                        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                                                            {content.brand.colors.map((color, i) => (
                                                                <div key={i} className="overflow-hidden rounded-xl ring-1 ring-secondary">
                                                                    <div className="h-20" style={{ backgroundColor: color.hex }} />
                                                                    <div className="p-3">
                                                                        {isLocked ? (
                                                                            <>
                                                                                <p className="text-sm font-semibold text-primary">{color.name}</p>
                                                                                <p className="mt-0.5 font-mono text-xs text-tertiary uppercase">{color.hex}</p>
                                                                            </>
                                                                        ) : (
                                                                            <div className="flex flex-col gap-1.5">
                                                                                <input
                                                                                    type="text"
                                                                                    placeholder="Name"
                                                                                    value={color.name}
                                                                                    onChange={(e) => updateColor(i, { name: e.target.value })}
                                                                                    className={editInput("px-2 py-1 text-xs")}
                                                                                />
                                                                                <div className="flex items-center gap-1">
                                                                                    <input
                                                                                        type="text"
                                                                                        placeholder="#000000"
                                                                                        value={color.hex}
                                                                                        onChange={(e) => updateColor(i, { hex: e.target.value })}
                                                                                        className={editInput("px-2 py-1 font-mono text-xs")}
                                                                                    />
                                                                                    <button
                                                                                        type="button"
                                                                                        title="Remove color"
                                                                                        onClick={() =>
                                                                                            patchBrand({
                                                                                                colors: content.brand.colors.filter((_, j) => j !== i),
                                                                                            })
                                                                                        }
                                                                                        className={removeButton}
                                                                                    >
                                                                                        <Trash01 className="size-4" aria-hidden="true" />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {!isLocked && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        patchBrand({ colors: [...content.brand.colors, { name: "New color", hex: "#888888" }] })
                                                                    }
                                                                    className="flex min-h-32 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-secondary text-sm font-medium text-tertiary transition duration-100 ease-linear hover:border-brand hover:text-brand-secondary"
                                                                >
                                                                    <Plus className="size-5" aria-hidden="true" />
                                                                    Add color
                                                                </button>
                                                            )}
                                                        </div>

                                                        <div className="mt-4 flex items-center gap-3 rounded-xl bg-secondary px-4 py-3">
                                                            <span className="text-sm font-medium text-secondary">Fonts:</span>
                                                            {isLocked ? (
                                                                <span className="text-sm text-tertiary">{content.brand.fonts || "—"}</span>
                                                            ) : (
                                                                <input
                                                                    type="text"
                                                                    placeholder="e.g. Inter, Playfair Display"
                                                                    value={content.brand.fonts}
                                                                    onChange={(e) => patchBrand({ fonts: e.target.value })}
                                                                    className={editInput("max-w-72")}
                                                                />
                                                            )}
                                                        </div>
                                                    </Reveal>
                                                )}

                                                {/* ── Instagram Highlights ── */}
                                                {activeSection === "instagram" && (
                                                    <Reveal>
                                                        <SectionEyebrow section={activeSection} />
                                                        <div className="flex flex-wrap items-end justify-between gap-3">
                                                            <SectionHeading>Instagram Highlights</SectionHeading>
                                                            {isLocked ? (
                                                                content.instagram.profile_url && (
                                                                    <Button
                                                                        href={content.instagram.profile_url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        color="link-color"
                                                                        size="md"
                                                                        iconTrailing={LinkExternal01}
                                                                    >
                                                                        View profile
                                                                    </Button>
                                                                )
                                                            ) : (
                                                                <input
                                                                    type="text"
                                                                    placeholder="Instagram profile URL"
                                                                    value={content.instagram.profile_url}
                                                                    onChange={(e) => patchInstagram({ profile_url: e.target.value })}
                                                                    className={editInput("max-w-80")}
                                                                />
                                                            )}
                                                        </div>
                                                        <p className="mt-3 text-md text-tertiary">
                                                            Your highlight covers, ready to download and add to your Instagram profile.
                                                        </p>

                                                        {content.instagram.highlights.length === 0 && isLocked ? (
                                                            <div className="mt-6 flex items-center gap-3 rounded-xl bg-secondary px-4 py-5">
                                                                <Instagram className="size-5 shrink-0 text-fg-quaternary" aria-hidden="true" />
                                                                <p className="text-sm text-tertiary">
                                                                    Highlight covers are on the way — the HiddenGem team will add them here.
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <div className="mt-6 flex flex-wrap gap-5">
                                                                {content.instagram.highlights.map((h, i) => (
                                                                    <div key={i} className="flex w-24 flex-col items-center gap-2">
                                                                        <div className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-secondary p-0.5 ring-2 ring-secondary">
                                                                            {h.image_url ? (
                                                                                <img
                                                                                    src={h.image_url}
                                                                                    alt={h.title}
                                                                                    className="size-full rounded-full object-cover"
                                                                                    draggable={false}
                                                                                />
                                                                            ) : (
                                                                                <Image01 className="size-6 text-fg-quaternary" aria-hidden="true" />
                                                                            )}
                                                                        </div>
                                                                        {isLocked ? (
                                                                            <p className="w-full truncate text-center text-xs font-medium text-secondary">
                                                                                {h.title}
                                                                            </p>
                                                                        ) : (
                                                                            <div className="flex w-full flex-col gap-1">
                                                                                <input
                                                                                    type="text"
                                                                                    placeholder="Title"
                                                                                    value={h.title}
                                                                                    onChange={(e) => updateHighlight(i, { title: e.target.value })}
                                                                                    className={editInput("px-2 py-1 text-center text-xs")}
                                                                                />
                                                                                <input
                                                                                    type="text"
                                                                                    placeholder="Image URL"
                                                                                    value={h.image_url}
                                                                                    onChange={(e) => updateHighlight(i, { image_url: e.target.value })}
                                                                                    className={editInput("px-2 py-1 text-xs")}
                                                                                />
                                                                                <button
                                                                                    type="button"
                                                                                    title="Remove highlight"
                                                                                    onClick={() =>
                                                                                        patchInstagram({
                                                                                            highlights: content.instagram.highlights.filter((_, j) => j !== i),
                                                                                        })
                                                                                    }
                                                                                    className={cx(removeButton, "self-center")}
                                                                                >
                                                                                    <Trash01 className="size-4" aria-hidden="true" />
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                                {!isLocked && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            patchInstagram({
                                                                                highlights: [...content.instagram.highlights, { title: "New", image_url: "" }],
                                                                            })
                                                                        }
                                                                        className="flex size-20 items-center justify-center rounded-full border border-dashed border-secondary text-tertiary transition duration-100 ease-linear hover:border-brand hover:text-brand-secondary"
                                                                        title="Add highlight"
                                                                    >
                                                                        <Plus className="size-5" aria-hidden="true" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </Reveal>
                                                )}

                                                {/* ── GoHighLevel Setup ── */}
                                                {activeSection === "ghl" && (
                                                    <Reveal>
                                                        <SectionEyebrow section={activeSection} />
                                                        <div className="flex flex-wrap items-end justify-between gap-3">
                                                            <SectionHeading>GoHighLevel Setup</SectionHeading>
                                                            {isLocked ? (
                                                                content.ghl.login_url && (
                                                                    <Button
                                                                        href={content.ghl.login_url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        color="link-color"
                                                                        size="md"
                                                                        iconTrailing={LinkExternal01}
                                                                    >
                                                                        Log in to GoHighLevel
                                                                    </Button>
                                                                )
                                                            ) : (
                                                                <input
                                                                    type="text"
                                                                    placeholder="GHL login URL"
                                                                    value={content.ghl.login_url}
                                                                    onChange={(e) => patchGhl({ login_url: e.target.value })}
                                                                    className={editInput("max-w-80")}
                                                                />
                                                            )}
                                                        </div>
                                                        <p className="mt-3 text-md text-tertiary">
                                                            Everything we're configuring in your CRM. Ticked items are live.
                                                        </p>

                                                        <div className="mt-6 flex flex-col items-center gap-8 rounded-xl p-6 ring-1 ring-secondary md:flex-row md:items-start">
                                                            <div className="shrink-0 pt-1">
                                                                <ProgressBarCircle
                                                                    value={ghlDone}
                                                                    max={Math.max(ghlTotal, 1)}
                                                                    size="xs"
                                                                    label="Setup progress"
                                                                    valueFormatter={(_, pct) => `${pct}%`}
                                                                />
                                                                <p className="mt-2 text-center text-xs font-medium text-tertiary">
                                                                    {ghlDone} of {ghlTotal} complete
                                                                </p>
                                                            </div>

                                                            <ul className="grid w-full gap-2.5 md:grid-cols-2">
                                                                {content.ghl.items.map((item, i) => (
                                                                    <li key={i} className="flex items-center gap-3">
                                                                        <button
                                                                            type="button"
                                                                            disabled={isLocked}
                                                                            onClick={() => updateGhlItem(i, { done: !item.done })}
                                                                            title={isLocked ? undefined : "Toggle status"}
                                                                            className={cx(
                                                                                "flex size-5 shrink-0 items-center justify-center rounded-full transition duration-100 ease-linear",
                                                                                item.done
                                                                                    ? "bg-brand-solid text-white"
                                                                                    : "text-transparent ring-1 ring-primary ring-inset",
                                                                                isLocked ? "cursor-default" : "cursor-pointer hover:opacity-80",
                                                                            )}
                                                                        >
                                                                            <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                                                                        </button>
                                                                        {isLocked ? (
                                                                            <span className={cx("text-sm", item.done ? "text-primary" : "text-tertiary")}>
                                                                                {item.label}
                                                                            </span>
                                                                        ) : (
                                                                            <>
                                                                                <input
                                                                                    type="text"
                                                                                    value={item.label}
                                                                                    onChange={(e) => updateGhlItem(i, { label: e.target.value })}
                                                                                    className={editInput("px-2 py-1 text-sm")}
                                                                                />
                                                                                <button
                                                                                    type="button"
                                                                                    title="Remove item"
                                                                                    onClick={() =>
                                                                                        patchGhl({ items: content.ghl.items.filter((_, j) => j !== i) })
                                                                                    }
                                                                                    className={removeButton}
                                                                                >
                                                                                    <Trash01 className="size-4" aria-hidden="true" />
                                                                                </button>
                                                                            </>
                                                                        )}
                                                                    </li>
                                                                ))}
                                                                {!isLocked && (
                                                                    <li>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                patchGhl({
                                                                                    items: [...content.ghl.items, { label: "New setup item", done: false }],
                                                                                })
                                                                            }
                                                                            className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-tertiary transition duration-100 ease-linear hover:text-brand-secondary"
                                                                        >
                                                                            <Plus className="size-4" aria-hidden="true" />
                                                                            Add item
                                                                        </button>
                                                                    </li>
                                                                )}
                                                            </ul>
                                                        </div>
                                                    </Reveal>
                                                )}

                                                {/* ── Revenue & Results ── */}
                                                {activeSection === "revenue" && (
                                                    <Reveal>
                                                        <SectionEyebrow section={activeSection} />
                                                        <div className="flex flex-wrap items-end justify-between gap-3">
                                                            <SectionHeading>Revenue &amp; Results</SectionHeading>
                                                            {!isLocked && (
                                                                <input
                                                                    type="text"
                                                                    placeholder="Currency (e.g. USD)"
                                                                    value={content.revenue.currency}
                                                                    onChange={(e) => patchRevenue({ currency: e.target.value.toUpperCase() })}
                                                                    className={editInput("max-w-36 uppercase")}
                                                                />
                                                            )}
                                                        </div>
                                                        <p className="mt-3 text-md text-tertiary">
                                                            Results from your campaigns, updated monthly by the HiddenGem team.
                                                        </p>

                                                        {months.length === 0 && isLocked ? (
                                                            <div className="mt-6 rounded-xl bg-secondary px-4 py-6 text-center">
                                                                <p className="text-sm text-tertiary">
                                                                    No results yet — your first month's numbers will appear here.
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {/* Stat tiles */}
                                                                <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                                                                    <StatTile
                                                                        label="This month"
                                                                        value={latest ? fmtMoney(latest.revenue) : "—"}
                                                                        change={
                                                                            momChange !== null ? (
                                                                                <BadgeWithIcon
                                                                                    iconLeading={momChange >= 0 ? ArrowUp : ArrowDown}
                                                                                    color={momChange >= 0 ? "success" : "error"}
                                                                                    size="md"
                                                                                >
                                                                                    {`${Math.abs(momChange).toFixed(0)}%`}
                                                                                </BadgeWithIcon>
                                                                            ) : undefined
                                                                        }
                                                                    />
                                                                    <StatTile label="Total revenue" value={fmtMoney(totalRevenue)} />
                                                                    <StatTile label="Leads captured" value={totalLeads.toLocaleString()} />
                                                                    <StatTile label="Appointments booked" value={totalAppointments.toLocaleString()} />
                                                                </div>

                                                                {/* Revenue bar chart — single series, brand hue, tooltip on hover */}
                                                                {months.length > 0 && (
                                                                    <div className="mt-6 rounded-xl p-5 ring-1 ring-secondary">
                                                                        <p className="text-sm font-semibold text-primary">Monthly revenue</p>
                                                                        <div className="mt-4 h-72 w-full text-quaternary">
                                                                            <ResponsiveContainer width="100%" height="100%">
                                                                                <BarChart data={months} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                                                                                    <CartesianGrid
                                                                                        vertical={false}
                                                                                        stroke="currentColor"
                                                                                        className="text-border-tertiary"
                                                                                    />
                                                                                    <XAxis
                                                                                        dataKey="month"
                                                                                        axisLine={false}
                                                                                        tickLine={false}
                                                                                        tick={{ fill: "currentColor", fontSize: 12 }}
                                                                                        dy={6}
                                                                                    />
                                                                                    <YAxis
                                                                                        axisLine={false}
                                                                                        tickLine={false}
                                                                                        width={44}
                                                                                        tick={{ fill: "currentColor", fontSize: 12 }}
                                                                                        tickFormatter={(v: number) => fmtCompact(v)}
                                                                                    />
                                                                                    <RechartsTooltip
                                                                                        cursor={{ fill: "currentColor", opacity: 0.06 }}
                                                                                        content={
                                                                                            <ChartTooltipContent
                                                                                                formatter={(value) => fmtMoney(Number(value))}
                                                                                            />
                                                                                        }
                                                                                    />
                                                                                    <Bar
                                                                                        dataKey="revenue"
                                                                                        name="Revenue"
                                                                                        className="fill-utility-brand-600"
                                                                                        radius={[4, 4, 0, 0]}
                                                                                        maxBarSize={32}
                                                                                    />
                                                                                </BarChart>
                                                                            </ResponsiveContainer>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Edit-only data table */}
                                                                {!isLocked && (
                                                                    <div className="mt-6 overflow-x-auto rounded-xl p-4 ring-1 ring-secondary">
                                                                        <div className="grid min-w-120 grid-cols-[1fr_1fr_1fr_1fr_2.5rem] items-center gap-2">
                                                                            {["Month", "Revenue", "Leads", "Appointments", ""].map((h) => (
                                                                                <span key={h} className="px-1 text-xs font-semibold text-quaternary">
                                                                                    {h}
                                                                                </span>
                                                                            ))}
                                                                            {months.map((m, i) => (
                                                                                <div key={i} className="col-span-5 grid grid-cols-subgrid items-center">
                                                                                    <input
                                                                                        type="text"
                                                                                        placeholder="Jul"
                                                                                        value={m.month}
                                                                                        onChange={(e) => updateMonth(i, { month: e.target.value })}
                                                                                        className={editInput()}
                                                                                    />
                                                                                    <input
                                                                                        type="number"
                                                                                        value={m.revenue}
                                                                                        onChange={(e) =>
                                                                                            updateMonth(i, { revenue: Number(e.target.value) || 0 })
                                                                                        }
                                                                                        className={editInput()}
                                                                                    />
                                                                                    <input
                                                                                        type="number"
                                                                                        value={m.leads}
                                                                                        onChange={(e) => updateMonth(i, { leads: Number(e.target.value) || 0 })}
                                                                                        className={editInput()}
                                                                                    />
                                                                                    <input
                                                                                        type="number"
                                                                                        value={m.appointments}
                                                                                        onChange={(e) =>
                                                                                            updateMonth(i, { appointments: Number(e.target.value) || 0 })
                                                                                        }
                                                                                        className={editInput()}
                                                                                    />
                                                                                    <button
                                                                                        type="button"
                                                                                        title="Remove month"
                                                                                        onClick={() =>
                                                                                            patchRevenue({ months: months.filter((_, j) => j !== i) })
                                                                                        }
                                                                                        className={removeButton}
                                                                                    >
                                                                                        <Trash01 className="size-4" aria-hidden="true" />
                                                                                    </button>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                patchRevenue({
                                                                                    months: [...months, { month: "", revenue: 0, leads: 0, appointments: 0 }],
                                                                                })
                                                                            }
                                                                            className="mt-3 flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-tertiary transition duration-100 ease-linear hover:text-brand-secondary"
                                                                        >
                                                                            <Plus className="size-4" aria-hidden="true" />
                                                                            Add month
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </Reveal>
                                                )}

                                                {/* ── Website — top-of-funnel tools embedded on your own site ── */}
                                                {activeSection === "website" && (
                                                    <Reveal>
                                                        <SectionEyebrow section={activeSection} />
                                                        <SectionHeading>Website</SectionHeading>
                                                        <p className="mt-3 text-md text-tertiary">
                                                            Your site is the first real impression — these are the tools we've set up on it to turn visitors
                                                            into leads.
                                                        </p>

                                                        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                                            {websiteLinks.map((link, i) =>
                                                                isLocked ? (
                                                                    <a
                                                                        key={i}
                                                                        href={link.url}
                                                                        target={link.url.startsWith("/") ? undefined : "_blank"}
                                                                        rel={link.url.startsWith("/") ? undefined : "noopener noreferrer"}
                                                                        className="group rounded-xl p-5 ring-1 ring-secondary transition duration-100 ease-linear hover:ring-brand"
                                                                    >
                                                                        <div className="flex items-start justify-between gap-2">
                                                                            <FeaturedIcon icon={ArrowUpRight} size="sm" color="brand" theme="light" />
                                                                            <ArrowUpRight
                                                                                className="size-4 text-fg-quaternary opacity-0 transition duration-100 ease-linear group-hover:opacity-100"
                                                                                aria-hidden="true"
                                                                            />
                                                                        </div>
                                                                        <p className="mt-3 text-sm font-semibold text-primary">{link.title}</p>
                                                                        <p className="mt-1 text-sm text-tertiary">{link.description}</p>
                                                                    </a>
                                                                ) : (
                                                                    <div key={i} className="flex flex-col gap-1.5 rounded-xl p-4 ring-1 ring-secondary">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Title"
                                                                                value={link.title}
                                                                                onChange={(e) => updateLink(link, { title: e.target.value })}
                                                                                className={editInput("font-semibold")}
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                title="Remove link"
                                                                                onClick={() => removeLink(link)}
                                                                                className={removeButton}
                                                                            >
                                                                                <Trash01 className="size-4" aria-hidden="true" />
                                                                            </button>
                                                                        </div>
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Description"
                                                                            value={link.description}
                                                                            onChange={(e) => updateLink(link, { description: e.target.value })}
                                                                            className={editInput("text-xs")}
                                                                        />
                                                                        <input
                                                                            type="text"
                                                                            placeholder="/acme-metapixel or https://…"
                                                                            value={link.url}
                                                                            onChange={(e) => updateLink(link, { url: e.target.value })}
                                                                            className={editInput("font-mono text-xs")}
                                                                        />
                                                                    </div>
                                                                ),
                                                            )}
                                                            {!isLocked && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setContent((c) => ({
                                                                            ...c,
                                                                            links: [...c.links, { title: "New page", description: "", url: "" }],
                                                                        }))
                                                                    }
                                                                    className="flex min-h-28 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-secondary text-sm font-medium text-tertiary transition duration-100 ease-linear hover:border-brand hover:text-brand-secondary"
                                                                >
                                                                    <Plus className="size-5" aria-hidden="true" />
                                                                    Add link
                                                                </button>
                                                            )}
                                                        </div>
                                                    </Reveal>
                                                )}

                                                {/* ── Chat Widget — middle-of-funnel, answers guest questions from the Master Document ── */}
                                                {activeSection === "chatwidget" && (
                                                    <Reveal>
                                                        <SectionEyebrow section={activeSection} />
                                                        <SectionHeading>Chat Widget</SectionHeading>
                                                        <p className="mt-3 text-md text-tertiary">
                                                            An AI chat on your website that answers guest questions instantly, straight from your Master
                                                            Document's FAQ bank — so no question goes unanswered while you're offline.
                                                        </p>

                                                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                                            {chatWidgetLinks.length === 0 && isLocked && (
                                                                <p className="rounded-xl border border-dashed border-secondary px-4 py-5 text-sm text-quaternary italic sm:col-span-2">
                                                                    Your chat widget setup guide will appear here once it's ready.
                                                                </p>
                                                            )}
                                                            {chatWidgetLinks.map((link, i) =>
                                                                isLocked ? (
                                                                    <a
                                                                        key={i}
                                                                        href={link.url}
                                                                        target={link.url.startsWith("/") ? undefined : "_blank"}
                                                                        rel={link.url.startsWith("/") ? undefined : "noopener noreferrer"}
                                                                        className="group rounded-xl p-5 ring-1 ring-secondary transition duration-100 ease-linear hover:ring-brand"
                                                                    >
                                                                        <div className="flex items-start justify-between gap-2">
                                                                            <FeaturedIcon icon={MessageChatCircle} size="sm" color="brand" theme="light" />
                                                                            <ArrowUpRight
                                                                                className="size-4 text-fg-quaternary opacity-0 transition duration-100 ease-linear group-hover:opacity-100"
                                                                                aria-hidden="true"
                                                                            />
                                                                        </div>
                                                                        <p className="mt-3 text-sm font-semibold text-primary">{link.title}</p>
                                                                        <p className="mt-1 text-sm text-tertiary">{link.description}</p>
                                                                    </a>
                                                                ) : (
                                                                    <div key={i} className="flex flex-col gap-1.5 rounded-xl p-4 ring-1 ring-secondary">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Title"
                                                                                value={link.title}
                                                                                onChange={(e) => updateLink(link, { title: e.target.value })}
                                                                                className={editInput("font-semibold")}
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                title="Remove link"
                                                                                onClick={() => removeLink(link)}
                                                                                className={removeButton}
                                                                            >
                                                                                <Trash01 className="size-4" aria-hidden="true" />
                                                                            </button>
                                                                        </div>
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Description"
                                                                            value={link.description}
                                                                            onChange={(e) => updateLink(link, { description: e.target.value })}
                                                                            className={editInput("text-xs")}
                                                                        />
                                                                        <input
                                                                            type="text"
                                                                            placeholder="/acme-chatwidget"
                                                                            value={link.url}
                                                                            onChange={(e) => updateLink(link, { url: e.target.value })}
                                                                            className={editInput("font-mono text-xs")}
                                                                        />
                                                                    </div>
                                                                ),
                                                            )}
                                                            {!isLocked && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setContent((c) => ({
                                                                            ...c,
                                                                            links: [
                                                                                ...c.links,
                                                                                {
                                                                                    title: "Chat Widget",
                                                                                    description: "",
                                                                                    url: slug ? `/${slug}-chatwidget` : "",
                                                                                },
                                                                            ],
                                                                        }))
                                                                    }
                                                                    className="flex min-h-28 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-secondary text-sm font-medium text-tertiary transition duration-100 ease-linear hover:border-brand hover:text-brand-secondary"
                                                                >
                                                                    <Plus className="size-5" aria-hidden="true" />
                                                                    Add link
                                                                </button>
                                                            )}
                                                        </div>
                                                    </Reveal>
                                                )}

                                                {/* ── Video Guides ── */}
                                                {activeSection === "videos" && (
                                                    <Reveal>
                                                        <SectionEyebrow section={activeSection} />
                                                        <SectionHeading>Video Guides</SectionHeading>
                                                        <p className="mt-3 text-md text-tertiary">
                                                            Short walkthrough videos recorded for you by the HiddenGem team.
                                                        </p>

                                                        {isLocked ? (
                                                            videoGuides.some((v) => v.url) ? (
                                                                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                                                                    {videoGuides
                                                                        .filter((v) => v.url)
                                                                        .map((v) => (
                                                                            <div key={v.id}>
                                                                                <p className="text-sm font-semibold text-primary">{v.title}</p>
                                                                                <VideoEmbed url={v.url} className="mt-3" />
                                                                            </div>
                                                                        ))}
                                                                </div>
                                                            ) : (
                                                                <p className="mt-6 rounded-xl border border-dashed border-secondary px-4 py-5 text-sm text-quaternary italic">
                                                                    No videos yet.
                                                                </p>
                                                            )
                                                        ) : (
                                                            <div className="mt-6 flex flex-col gap-4">
                                                                {videoGuides.map((v, i) => (
                                                                    <div key={v.id} className="flex flex-col gap-1.5 rounded-xl p-4 ring-1 ring-secondary">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Video title"
                                                                                value={v.title}
                                                                                onChange={(e) => updateVideo(i, { title: e.target.value })}
                                                                                className={editInput("font-semibold")}
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                title="Remove video"
                                                                                onClick={() =>
                                                                                    setContent((c) => ({
                                                                                        ...c,
                                                                                        videos: (c.videos ?? []).filter((_, j) => j !== i),
                                                                                    }))
                                                                                }
                                                                                className={removeButton}
                                                                            >
                                                                                <Trash01 className="size-4" aria-hidden="true" />
                                                                            </button>
                                                                        </div>
                                                                        <VideoAttach
                                                                            value={v.url || undefined}
                                                                            onChange={(url) => updateVideo(i, { url: url ?? "" })}
                                                                        />
                                                                    </div>
                                                                ))}
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setContent((c) => ({
                                                                            ...c,
                                                                            videos: [...(c.videos ?? []), { id: crypto.randomUUID(), title: "", url: "" }],
                                                                        }))
                                                                    }
                                                                    className="flex min-h-28 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-secondary text-sm font-medium text-tertiary transition duration-100 ease-linear hover:border-brand hover:text-brand-secondary"
                                                                >
                                                                    <Plus className="size-5" aria-hidden="true" />
                                                                    Add video
                                                                </button>
                                                            </div>
                                                        )}
                                                    </Reveal>
                                                )}

                                                {/* ── Communication Log — not built yet, nav item is disabled ── */}
                                                {activeSection === "comms" && (
                                                    <Reveal>
                                                        <SectionEyebrow section={activeSection} />
                                                        <SectionHeading>Communication Log</SectionHeading>
                                                        <p className="mt-3 text-md text-tertiary">
                                                            Coming soon — a shared log of calls and updates between you and your Account Manager.
                                                        </p>
                                                    </Reveal>
                                                )}

                                                {/* ── Still need support? (Overview only) ── */}
                                                {activeSection === "overview" && (
                                                    <Reveal className="mt-16">
                                                        {/* Simple, left-aligned contact panel (approved template-lab layout) */}
                                                        <div className="rounded-2xl bg-secondary px-6 py-8 md:px-10 md:py-10">
                                                            <h2 className="text-display-xs font-semibold text-primary">Questions about your dashboard?</h2>
                                                            <h3 className="mt-3 text-sm font-semibold text-brand-secondary">Contact us</h3>
                                                            <p className="mt-1.5 max-w-xl text-sm text-tertiary">
                                                                Our team is here to help. Reach out to HiddenGem about your brand, setup, or results anytime.
                                                            </p>
                                                            <div className="mt-5">
                                                                <Button href={CONTACT_MAILTO} size="lg" color="primary" iconTrailing={ArrowRight}>
                                                                    Contact HiddenGem Team
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </Reveal>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.article>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════
                Plus Wizard Modal
            ════════════════════════════════════════════════ */}
            {/* Master Document — compiled doc the AM reviews, copies or downloads. */}
            {showMasterDocModal && masterDoc && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
                    onClick={(e) => e.target === e.currentTarget && setShowMasterDocModal(false)}
                >
                    <div className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-primary shadow-2xl ring-1 ring-secondary">
                        <div className="flex items-start justify-between gap-3 border-b border-secondary px-6 py-4">
                            <div>
                                <h3 className="text-md font-semibold text-primary">Master Document — ready for review</h3>
                                <p className="mt-0.5 text-sm text-tertiary">
                                    Compiled from {clientName.trim() || "the client"}'s answers. Review it, then copy or download for welcome emails, the chat
                                    widget, and onboarding.
                                </p>
                            </div>
                            <button
                                type="button"
                                aria-label="Close"
                                onClick={() => setShowMasterDocModal(false)}
                                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-tertiary hover:bg-secondary"
                            >
                                <XClose className="size-4" aria-hidden="true" />
                            </button>
                        </div>

                        {masterDoc.missing.length > 0 && (
                            <div className="mx-6 mt-4 rounded-lg bg-warning-secondary px-3 py-2 text-xs font-medium text-warning-primary">
                                Still empty: {masterDoc.missing.join(", ")} — marked “Not provided yet” below. Ask the client to fill these in.
                            </div>
                        )}

                        <pre className="flex-1 overflow-y-auto px-6 py-4 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap text-secondary">
                            {masterDoc.doc}
                        </pre>

                        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-secondary px-6 py-4">
                            <Button size="sm" color="secondary" iconLeading={Download01} onClick={downloadMasterDoc}>
                                Download .md
                            </Button>
                            <Button
                                size="sm"
                                color="secondary"
                                iconLeading={Download01}
                                isLoading={pdfBusy}
                                showTextWhileLoading
                                onClick={() => void downloadMasterDocPdf()}
                            >
                                {pdfBusy ? "Preparing…" : "Download PDF"}
                            </Button>
                            <Button size="sm" color="primary" iconLeading={masterDocCopied ? Check : Copy01} onClick={copyMasterDoc}>
                                {masterDocCopied ? "Copied!" : "Copy document"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Client-input form modal ──
                The form keeps its own Typeform-style chrome (progress bar, counter,
                Enter-to-advance) and autosaves as normal — the modal only replaces the
                full-page navigation. Backdrop click closes; nothing is lost because the
                answer and the resume position are both already saved. */}
            {formModal && (
                <div
                    // Matches the shared ModalOverlay treatment (modals/modal.tsx): semantic
                    // bg-overlay so it adapts in dark mode, plus a backdrop blur so the
                    // dashboard behind recedes and the question has the room to itself.
                    className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/70 p-4 backdrop-blur-[6px] duration-300 ease-out animate-in fade-in sm:p-8"
                    onClick={(e) => e.target === e.currentTarget && closeFormModal()}
                >
                    <div className="h-full max-h-[900px] w-full max-w-5xl overflow-hidden rounded-2xl shadow-2xl ring-1 ring-secondary">
                        {formModal === "intake" ? (
                            <ClientOnboardingFormPage
                                slug={intakeSlug}
                                initialClientName={clientName}
                                initialData={intakeData}
                                embedded
                                onClose={closeFormModal}
                                startAtField={formModalField}
                            />
                        ) : (
                            <HostOnboardingFormPage
                                slug={onboardingSlug}
                                initialClientName={clientName}
                                initialClientWebsite={clientWebsite}
                                initialData={brandData}
                                embedded
                                onClose={closeFormModal}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Kick-off booking, embedded rather than linked out. Calendly serves this URL with
                x-frame-options: ALLOWALL, so a plain iframe works and no third-party script has to
                run on the dashboard. The escape hatch below covers the case where an extension or
                a locked-down network blocks the frame — without it, a blocked iframe would leave
                the client staring at an empty box with no way to book at all. */}
            {bookingOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/70 p-4 backdrop-blur-[6px] duration-300 ease-out animate-in fade-in sm:p-8"
                    onClick={(e) => e.target === e.currentTarget && setBookingOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Book your Kick-off Call"
                >
                    <div className="flex h-full max-h-[880px] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-primary shadow-2xl ring-1 ring-secondary">
                        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-secondary px-5 py-4">
                            <div className="min-w-0">
                                <h2 className="text-md font-semibold text-primary">Book your Kick-off Call</h2>
                                <p className="mt-0.5 text-sm text-tertiary">With Dustin and your Account Manager.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setBookingOpen(false)}
                                aria-label="Close"
                                className="flex size-9 shrink-0 items-center justify-center rounded-lg text-fg-quaternary transition duration-100 ease-linear hover:bg-secondary hover:text-fg-secondary"
                            >
                                <XClose className="size-5" aria-hidden="true" />
                            </button>
                        </div>
                        <iframe
                            src={`${KICKOFF_CALENDLY}?embed_domain=${encodeURIComponent(window.location.hostname)}&embed_type=Inline&hide_gdpr_banner=1`}
                            title="Calendly booking"
                            className="min-h-0 w-full flex-1 border-0"
                        />
                        {/* Confirmation in our own voice. Calendly shows its own success screen inside
                            the frame, but that screen knows nothing about the journey — this is what
                            tells the client the step is ticked and where they go next. */}
                        {justBooked && (
                            <div className="flex shrink-0 items-start gap-3 border-t border-secondary bg-success-secondary px-5 py-4">
                                <CheckCircle className="mt-0.5 size-5 shrink-0 text-fg-success-secondary" aria-hidden="true" />
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-primary">Booked — that's step 2 done.</p>
                                    <p className="mt-0.5 text-sm text-tertiary text-pretty">
                                        Next up is step 3, the Onboarding Call itself, with Dustin and your Account Manager. Check your email for
                                        the invite.
                                    </p>
                                </div>
                                <Button size="sm" color="secondary" className="ml-auto shrink-0" onClick={() => setBookingOpen(false)}>
                                    Close
                                </Button>
                            </div>
                        )}
                        <div className="shrink-0 border-t border-secondary px-5 py-3">
                            <p className="text-xs text-quaternary">
                                Calendar not loading?{" "}
                                <a
                                    href={KICKOFF_CALENDLY}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-semibold text-brand-secondary transition duration-100 ease-linear hover:underline"
                                >
                                    Open it in a new tab
                                </a>
                                .
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {showPlusModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
                    onClick={(e) => e.target === e.currentTarget && setShowPlusModal(false)}
                >
                    <div className="w-full max-w-sm rounded-2xl bg-primary p-6 shadow-2xl ring-1 ring-secondary">
                        {/* Step 1 — Password */}
                        {plusStep === "password" && (
                            <>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-md font-semibold text-primary">Create Client Dashboard</h3>
                                        <p className="mt-1 text-sm text-tertiary">Enter the admin password to continue.</p>
                                    </div>
                                    <button
                                        type="button"
                                        aria-label="Close"
                                        onClick={() => setShowPlusModal(false)}
                                        className="flex size-8 items-center justify-center rounded-lg text-tertiary hover:bg-secondary"
                                    >
                                        <XClose className="size-4" aria-hidden="true" />
                                    </button>
                                </div>

                                <div className="mt-4">
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={plusPassword}
                                        onChange={(e) => {
                                            setPlusPassword(e.target.value);
                                            setPlusPasswordError(false);
                                        }}
                                        onKeyDown={(e) => e.key === "Enter" && handlePlusPassword()}
                                        ref={(el) => el?.focus({ preventScroll: true })}
                                        className={cx(
                                            "w-full rounded-lg border px-3 py-2 text-sm text-primary transition duration-100 ease-linear outline-none placeholder:text-placeholder",
                                            plusPasswordError
                                                ? "border-error-primary ring-error-primary ring-1"
                                                : "border-secondary focus:border-brand focus:ring-1 focus:ring-brand",
                                        )}
                                    />
                                    {plusPasswordError && <p className="mt-1.5 text-xs text-error-primary">Incorrect password. Please try again.</p>}
                                </div>

                                <div className="mt-4 flex gap-3">
                                    <Button color="secondary" size="sm" className="flex-1" onClick={() => setShowPlusModal(false)}>
                                        Cancel
                                    </Button>
                                    <Button color="primary" size="sm" className="flex-1" onClick={handlePlusPassword}>
                                        Continue
                                    </Button>
                                </div>
                            </>
                        )}

                        {/* Step 2 — Client details */}
                        {plusStep === "details" && (
                            <>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-md font-semibold text-primary">Create Client Dashboard</h3>
                                        <p className="mt-1 text-sm text-tertiary">Enter the client details. Sections can be filled in after.</p>
                                    </div>
                                    <button
                                        type="button"
                                        aria-label="Close"
                                        onClick={() => setShowPlusModal(false)}
                                        className="flex size-8 items-center justify-center rounded-lg text-tertiary hover:bg-secondary"
                                    >
                                        <XClose className="size-4" aria-hidden="true" />
                                    </button>
                                </div>

                                <div className="mt-4 flex flex-col gap-3">
                                    <div>
                                        <label htmlFor="new-dashboard-client-name" className="mb-1.5 block text-sm font-medium text-secondary">
                                            Client Name
                                        </label>
                                        <input
                                            id="new-dashboard-client-name"
                                            type="text"
                                            placeholder="e.g. Acme Corp"
                                            value={newClientName}
                                            onChange={(e) => setNewClientName(e.target.value)}
                                            autoFocus
                                            className="w-full rounded-lg border border-secondary px-3 py-2 text-sm text-primary transition duration-100 ease-linear outline-none placeholder:text-placeholder focus:border-brand focus:ring-1 focus:ring-brand"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="new-dashboard-client-website" className="mb-1.5 block text-sm font-medium text-secondary">
                                            Client Website URL
                                        </label>
                                        <input
                                            id="new-dashboard-client-website"
                                            type="text"
                                            placeholder="e.g. acmecorp.com"
                                            value={newClientWebsite}
                                            onChange={(e) => setNewClientWebsite(e.target.value)}
                                            className="w-full rounded-lg border border-secondary px-3 py-2 text-sm text-primary transition duration-100 ease-linear outline-none placeholder:text-placeholder focus:border-brand focus:ring-1 focus:ring-brand"
                                        />
                                    </div>
                                    {newClientName.trim() && (
                                        <p className="text-xs text-tertiary">
                                            Page URL:{" "}
                                            <span className="font-medium text-brand-secondary">docs-hgm.netlify.app/{slugify(newClientName)}-dashboard</span>
                                        </p>
                                    )}
                                    {createError && <p className="text-xs text-error-primary">{createError}</p>}
                                </div>

                                <div className="mt-4 flex gap-3">
                                    <Button color="secondary" size="sm" className="flex-1" onClick={() => setShowPlusModal(false)} isDisabled={isCreating}>
                                        Cancel
                                    </Button>
                                    <Button
                                        color="primary"
                                        size="sm"
                                        className="flex-1"
                                        onClick={handleCreatePage}
                                        isDisabled={!newClientName.trim()}
                                        isLoading={isCreating}
                                        showTextWhileLoading
                                    >
                                        {isCreating ? "Creating…" : "Create Dashboard"}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};
