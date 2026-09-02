/**
 * The dashboard's side-menu taxonomy and the onboarding journey.
 *
 * NAV_GROUPS mirrors the funnel walked on the onboarding call — Brand foundation feeds
 * Top of funnel, then Middle, then Bottom — and is the single source for the menu, the
 * phase eyebrow above each section heading, and which sections are team-only.
 */
import type { FC } from "react";
import {
    Announcement02,
    BookOpen01,
    Calendar,
    Camera01,
    ClipboardCheck,
    FileCheck02,
    Folder,
    Globe01,
    Image01,
    LayoutAlt01,
    Mail01,
    MessageChatCircle,
    PlayCircle,
    Repeat01,
    Target04,
    TrendUp01,
    Users01,
} from "@untitledui-pro/icons/line";
import type { SectionId } from "@/pages/client/dashboard/dashboard-model";

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
export const PHASES = {
    // "Your forms", not "Client input": the client reading this dashboard would be looking at a
    // category named after their role in our process. Every label here is read by them first.
    input: { num: null, label: "Your forms", bg: "bg-utility-indigo-50", text: "text-utility-indigo-700" },
    brandwork: { num: null, label: "Brand foundation", bg: "bg-brand-secondary", text: "text-brand-secondary" },
    marketing: { num: null, label: "Marketing", bg: "bg-utility-purple-50", text: "text-utility-purple-700" },
    resources: { num: null, label: "Resources", bg: "bg-success-secondary", text: "text-success-primary" },
} as const;
export type PhaseId = keyof typeof PHASES;

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
export type JourneyStepId = "form" | "kickoff" | "call" | "vision" | "masterdoc" | "brandkit" | "funnel" | "resources" | "website";

/** Dustin's strategy-call booking page, linked from the Kick-off Call step. */
export const KICKOFF_CALENDLY = "https://calendly.com/dustin-d-baker/strategy";

/**
 * A per-client URL a journey step points at, named rather than embedded so one step
 * definition serves every client. The dashboard resolves these from the row:
 * `chat` → content.chat_link, `folder` → content.brand.folder_link,
 * `onboarding_call` → content.onboarding_call_url.
 *
 * Unset resolves to "", and the step renders its line WITHOUT a button rather than a
 * button that goes nowhere. The Onboarding Call has no shared fallback on purpose: the
 * booking page belongs to the client's own Account Manager, so one hardcoded URL would
 * send every client to the same person.
 */
export type JourneyLink = "chat" | "folder" | "onboarding_call";

export const JOURNEY_STEPS: {
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
    /** Per-client booking URL for this step's own button — see JourneyLink. */
    hrefFrom?: JourneyLink;
    hrefLabel?: string;
    /** Step that must be done before `href` is offered. */
    requires?: JourneyStepId;
    /**
     * Sub-items: the several separate things one step actually asks for. Deliberately
     * NOT tickable — none of these are states the app can observe, and an empty box
     * against a job the client already did reads as a failure.
     */
    items?: { label: string; note?: string; link?: JourneyLink; action?: string }[];
    /** Heading above `items`, when the list needs naming. */
    itemsTitle?: string;
}[] = [
    {
        id: "form",
        label: "Fill in the Onboarding form",
        detail: "Your business details and the logins we need.",
        icon: ClipboardCheck,
        to: "intake",
        auto: true,
    },
    {
        id: "kickoff",
        label: "Kick-off Call",
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
    {
        id: "vision",
        label: "Fill in the Brand Vision Form",
        detail: "How your brand should look, sound and feel.",
        icon: FileCheck02,
        to: "onboarding",
        auto: true,
    },
    {
        // The two things the post-Kick-off email asks for. The old detail line read
        // "Folder of content, plus the Brand Kit document" — but no Brand Kit document
        // link exists, and at this point in the journey the Brand Kit hasn't been built.
        //
        // No `to: "contentfolder"` any more: the folder is one of the items below, and a
        // step-level "Open" button pointing at the same URL just asks the client which of
        // two identical buttons to press.
        id: "resources",
        label: "Add your resources",
        detail: "Two things to send us after the Kick-off Call, so your Account Manager can start building.",
        icon: Folder,
        items: [
            {
                label: "Join the Google Chat group",
                note: "Where we post updates and ask quick questions.",
                link: "chat",
                action: "Open chat",
            },
            {
                label: "Upload your photos and video",
                note: "Everything you already have: listing photos, phone clips, drone footage. Send too much rather than too little, we'll pick.",
                link: "folder",
                action: "Open your folder",
            },
        ],
    },
    {
        id: "call",
        label: "Onboarding Call",
        detail: "With Dustin and your Account Manager. Book it once your Brand Vision Form is in.",
        icon: Users01,
        hrefFrom: "onboarding_call",
        hrefLabel: "Book your onboarding call",
        requires: "vision",
        itemsTitle: "Have these ready before the call",
        // Every login here is already asked for by the Onboarding form, so the wording is
        // "logged in", not "have your password". Facebook especially: we need the client
        // signed in to their own business page so they can add us as a user on the call —
        // we never ask for their Facebook password, and the form no longer asks either.
        items: [
            { label: "Instagram", note: "Logged in on the laptop you'll join from." },
            { label: "TikTok", note: "Logged in, if you use it." },
            {
                label: "Facebook",
                note: "Logged in to your business page, so you can add us as a user. We never ask for your Facebook password.",
            },
            { label: "Domain", note: "Logged in wherever your domain is registered." },
            { label: "Credit card", note: "We set up your Facebook Ad account during the call." },
            { label: "Zoom", note: "Installed on your computer, so we can ask to share your screen." },
        ],
    },
    {
        id: "masterdoc",
        label: "Review the Master Brand",
        detail: "Hosts, personas, properties and brand voice — what everything else reads from.",
        icon: FileCheck02,
        to: "foundation",
    },
    { id: "brandkit", label: "Review the Brand Kit", detail: "Colours, fonts and logo.", icon: Image01, to: "brand" },
    {
        id: "funnel",
        label: "Review the marketing funnel",
        detail: "Landing page, Welcome Flow, Repeat Flow, Pinned Posts and example Reels.",
        icon: Mail01,
        to: "flow",
    },
    { id: "website", label: "Set up the website", detail: "If a website is in scope for you.", icon: Globe01, to: "ownerguide" },
];

/** Sits above the funnel groups — not a funnel stage itself, just "home" (hero + the funnel explainer). */
export const OVERVIEW_ITEM = { id: "overview" as const, label: "Overview", icon: LayoutAlt01 };

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
export const NAV_GROUPS: {
    label: string;
    phase: PhaseId;
    /** Shown on the group row, so a collapsed menu still says what each group is. */
    icon?: typeof LayoutAlt01;
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
        icon: ClipboardCheck,
        items: [
            { id: "intake", label: "Onboarding form", icon: ClipboardCheck },
            { id: "onboarding", label: "Brand Vision Form", icon: FileCheck02 },
        ],
    },
    {
        label: "Brand foundation",
        phase: "brandwork",
        icon: FileCheck02,
        items: [
            { id: "overviewdoc", label: "Overview Document", icon: ClipboardCheck, teamOnly: true },
            { id: "foundation", label: "Master Brand", icon: FileCheck02 },
            { id: "brand", label: "Brand Kit", icon: Image01 },
        ],
    },
    {
        label: "Marketing",
        phase: "marketing",
        icon: Announcement02,
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
        icon: Folder,
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
export const HIDDEN_ITEMS: { id: SectionId; label: string; icon: typeof LayoutAlt01 }[] = [
    { id: "website", label: "Website", icon: Globe01 },
    { id: "instagram", label: "Instagram", icon: Camera01 },
    { id: "chatwidget", label: "Chat Widget", icon: MessageChatCircle },
    { id: "ghl", label: "GoHighLevel Setup", icon: Target04 },
    { id: "videos", label: "Video Guides", icon: PlayCircle },
    { id: "revenue", label: "Revenue & Results", icon: TrendUp01 },
    { id: "comms", label: "Communication Log", icon: MessageChatCircle },
];

/** Which group a section belongs to — drives the eyebrow above each section body. */
export const phaseOfSection = (id: SectionId): PhaseId | null => NAV_GROUPS.find((g) => g.items.some((i) => i.id === id))?.phase ?? null;

export const SECTIONS = [OVERVIEW_ITEM, ...NAV_GROUPS.flatMap((g) => g.items), ...HIDDEN_ITEMS];

/**
 * Sections a client can never reach, by any route.
 *
 * Derived from the nav rather than hand-listed so adding a `teamOnly` row can't leave the
 * search box or a pasted deep link as a way in that somebody forgot to close.
 */
export const TEAM_ONLY_SECTIONS = new Set<SectionId>(NAV_GROUPS.flatMap((g) => g.items.filter((i) => i.teamOnly).map((i) => i.id)));

export type SearchHit = { id: SectionId; label: string; sub?: string };
