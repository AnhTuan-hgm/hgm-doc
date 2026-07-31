import { type ReactNode, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
    AlertTriangle,
    BookOpen01,
    Check,
    Eye,
    Grid01,
    LayoutAlt01,
    MessageChatCircle,
    Lightbulb02,
    Star01,
    Target04,
    Users01,
    Zap,
} from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { AppShell, CollapsedTopBar, IconRail, NavCollapseButton, useNavCollapsed } from "@/components/application/icon-rail";
import { TeamGate } from "@/pages/dashboard-screen";
import { cx } from "@/utils/cx";

/**
 * Reading your clients (/clients/reading-your-clients) — the AM training deck
 * "Reading your clients: the 4 personality types", ported from the shared
 * Claude design (SituationSlide.dc.html, 36 slides) into a scrollable guide.
 *
 * Behind TeamGate: the client-example sections name real owners and assess
 * their communication style, so this must never be reachable without the
 * @hiddengem.media / team-password unlock.
 *
 * The two workshop activities are click-to-reveal rather than "next slide",
 * so the page still works as a live exercise in a meeting.
 */

type TypeKey = "D" | "E" | "R" | "A";
type BadgeColor = "blue" | "orange" | "success" | "indigo";

const TYPE_COLOR: Record<TypeKey, BadgeColor> = { D: "blue", E: "orange", R: "success", A: "indigo" };
const TYPE_NAME: Record<TypeKey, string> = { D: "Driver", E: "Expressive", R: "Relater", A: "Analyzer" };

/** Letter chip — the deck's D/E/R/A marker. */
const TypeChip = ({ t, label }: { t: TypeKey; label?: string }) => (
    <span className="inline-flex items-center gap-2">
        <Badge color={TYPE_COLOR[t]} size="sm" type="pill-color">
            {t}
        </Badge>
        {label !== undefined && <span className="text-sm font-semibold text-primary">{label || TYPE_NAME[t]}</span>}
    </span>
);

const SectionHeading = ({ eyebrow, title }: { eyebrow?: string; title: string }) => (
    <div className="flex flex-col gap-1.5">
        {eyebrow && <span className="text-xs font-semibold tracking-[0.1em] text-brand-secondary uppercase">{eyebrow}</span>}
        <h2 className="text-2xl font-semibold tracking-tight text-primary">{title}</h2>
    </div>
);

const Card = ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={cx("rounded-xl bg-primary p-5 shadow-xs ring-1 ring-secondary", className)}>{children}</div>
);

/** Part divider — the deck's full-bleed "Part n of 3" slides. */
const PartDivider = ({ n, title, blurb }: { n: number; title: string; blurb: string }) => (
    <div className="rounded-2xl bg-brand-50 p-7 ring-1 ring-brand-200 dark:bg-brand-950/40 dark:ring-brand-800">
        <span className="text-xs font-semibold tracking-[0.12em] text-brand-secondary uppercase">Part {n} of 3</span>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-primary">{title}</h2>
        <p className="mt-2 max-w-[62ch] leading-relaxed text-tertiary text-pretty">{blurb}</p>
    </div>
);

/* ── Content ─────────────────────────────────────────────────────────── */

const TYPES: { key: TypeKey; map: string; question: string; driven: string; summary: string; spot: string; adapt: string; avoid: string }[] = [
    {
        key: "D",
        map: "Fast + task",
        question: "“What?” (results)",
        driven: "Control & winning",
        summary: "Direct, fast-paced, decisive, results-obsessed. Speaks in short sentences and wants control.",
        spot: "Fast pace, interrupts, cuts to outcomes, asks “what's the bottom line?” In chat: blunt, bulleted, little small talk.",
        adapt: "Be concise and results-first. Lead with outcomes and ROI. Give options and let them decide. Keep a fast pace.",
        avoid: "Over-explaining, small talk, hedging, or looking indecisive. Don't take bluntness personally.",
    },
    {
        key: "E",
        map: "Fast + people",
        question: "“Who?” (recognition)",
        driven: "Feelings & status",
        summary: "Enthusiastic, talkative, charismatic. Decides on feelings, loves ideas and being recognized.",
        spot: "Energetic, tells stories, big-picture. In chat: casual, emojis, exclamation points, warm tone.",
        adapt: "Match their energy. Use stories, excitement, and the brand vision. Give recognition. Keep detail light and follow up in writing.",
        avoid: "Drowning them in data, a cold or transactional tone, or failing to follow up — they forget specifics.",
    },
    {
        key: "R",
        map: "Measured + people",
        question: "“Why?” (relationships)",
        driven: "Security & harmony",
        summary: "Warm, loyal, harmony-seeking, conflict-averse. Builds rapport before business; decides slowly.",
        spot: "Friendly, asks about you, cautious about change, seeks reassurance. In chat: pleasantries first, kind, even-keeled.",
        adapt: "Invest in the relationship first. Reassure, be patient, don't rush. Emphasize stability and low-risk change.",
        avoid: "High pressure or sudden change — they go quiet instead of pushing back, then churn.",
    },
    {
        key: "A",
        map: "Measured + task",
        question: "“How?” (evidence)",
        driven: "Accuracy & being right",
        summary: "Detail-oriented, logical, cautious, precise. Decides on facts and wants proof before committing.",
        spot: "Methodical, probing questions, wants specifics. In chat: thorough, well-structured, spell-checked, data-referencing.",
        adapt: "Be precise and prepared. Bring data and documentation. Explain the “how.” Put things in writing; never guess.",
        avoid: "Hype, vague claims, emotional selling, rushing, or errors — sloppiness erodes trust instantly.",
    },
];

const FUNNEL = [
    {
        n: 1,
        title: "Dustin's sales call",
        blurb: "Review the Firefly notes — what they asked shows the type.",
        tells: [["D", "ROI"], ["A", "How it works"], ["E", "Vision"], ["R", "“What's it like to work with you?”"]] as [TypeKey, string][],
    },
    {
        n: 2,
        title: "Onboarding form",
        blurb: "How they fill it out is the tell.",
        tells: [["D", "Bare-bones"], ["A", "Detailed & thorough"], ["E", "Big-picture / vision"], ["R", "Warm & personal"]] as [TypeKey, string][],
    },
    {
        n: 3,
        title: "Kickoff call",
        blurb: "Your first live read — confirm the type. Ask “What does success look like?”",
        tells: [["D", "A number"], ["A", "The mechanics"], ["E", "The feeling"], ["R", "The partnership"]] as [TypeKey, string][],
    },
    {
        n: 4,
        title: "Google Chat",
        blurb: "Your daily signal — speed, length & warmth.",
        tells: [["D", "Blunt / bulleted"], ["A", "Thorough"], ["R", "Pleasantries"], ["E", "Emojis / energy"]] as [TypeKey, string][],
    },
];

const ONE_QUESTION: [TypeKey, string, string][] = [
    ["D", "“Get to 80% direct bookings.”", "A number"],
    ["A", "“I want to understand how attribution works.”", "The mechanics"],
    ["E", "“I want people to see how special this place is.”", "The feeling"],
    ["R", "“I just want to know I'm in good hands.”", "The partnership"],
];

const CHEAT_ROWS: { label: string; cells: Record<TypeKey, string> }[] = [
    { label: "Cares about", cells: { D: "Results & control", E: "Recognition & status", R: "Relationship & security", A: "Accuracy & being right" } },
    { label: "Spot them by", cells: { D: "Short, blunt, bulleted", E: "Emojis, energy, ideas", R: "Pleasantries, warm, “no rush”", A: "Detailed, precise, data questions" } },
    { label: "Do this", cells: { D: "Be brief, lead with results, offer choices", E: "Warm & upbeat, tell the story, recognize them", R: "Build rapport, reassure, go at their pace", A: "Bring data, be precise, put it in writing" } },
    { label: "Avoid", cells: { D: "Small talk, fluff, indecision", E: "Dense data, cold tone", R: "Pressure, abrupt change", A: "Hype, vagueness, errors" } },
    { label: "When unhappy", cells: { D: "Blunt, impatient, escalates", E: "Goes cool, disengages", R: "Goes quiet — churns silently", A: "Nitpicks, loses trust fast" } },
    { label: "Open with", cells: { D: "“Bottom line: …”", E: "“Exciting update — …”", R: "“Hope you're well — …”", A: "“Here are the numbers …”" } },
];

const RAPPORT: { key: TypeKey; formula: string; opener: string; trust: string; how: string[]; avoid: string }[] = [
    {
        key: "D",
        formula: "Respect their time & prove you deliver.",
        opener: "“Bottom line: here's where we are and what's next.”",
        trust: "Reliability and results — they trust you when you're efficient, decisive, and do exactly what you said you would.",
        how: [
            "Lead with the outcome or number; keep it short and skimmable.",
            "Give options plus your recommendation, then let them decide.",
            "Land an early, visible win and follow through every time.",
        ],
        avoid: "Small talk, long build-ups, hedging, or looking indecisive. Don't take their bluntness personally.",
    },
    {
        key: "E",
        formula: "Match their energy, recognize them, celebrate the vision.",
        opener: "“Exciting update — wait till you see this!”",
        trust: "Warmth and recognition — they trust you when you're enthusiastic, personable, and make them feel seen.",
        how: [
            "Match their energy; leave room for real conversation before business.",
            "Celebrate wins and make them the hero — feature their brand.",
            "Sell the vision and big picture; keep detail light and recap in writing.",
        ],
        avoid: "A cold, transactional tone, burying them in data, or failing to follow up in writing — they forget specifics.",
    },
    {
        key: "R",
        formula: "Consistency, reassurance & a genuine relationship.",
        opener: "“Hope you're well! Just checking in…”",
        trust: "Consistency and care — they trust you when you're warm, patient, reliable, and never leave them in the dark.",
        how: [
            "Invest in the relationship first — personal check-ins, ask about them.",
            "Reassure, go at their pace, and be a steady, reliable presence.",
            "Introduce change gently and explain the why; never go silent.",
        ],
        avoid: "High pressure, rushing decisions, or abrupt change — they retreat and go quiet rather than push back.",
    },
    {
        key: "A",
        formula: "Competence, precision & evidence.",
        opener: "“Here are the numbers and the detail behind them.”",
        trust: "Accuracy and expertise — they trust you when you're prepared, precise, and back everything with evidence.",
        how: [
            "Come prepared with data, documentation, and the “how.”",
            "Put things in writing and keep a predictable, consistent rhythm.",
            "Explain your reasoning; if you don't know, say so and follow up accurately.",
        ],
        avoid: "Hype, vague claims, rushing, or errors — sloppiness erodes their trust instantly.",
    },
];

const PRACTICE: { title: string; scenario: string; rows: [TypeKey, string][] }[] = [
    {
        title: "Calls & meetings",
        scenario: "You're heading into a monthly strategy call to review performance and agree on next steps.",
        rows: [
            ["D", "Keep it short and agenda-driven. Open with the headline results, bring 1–2 decisions, close with clear next steps. Respect the clock."],
            ["E", "Leave room for energy — let them talk vision and share ideas. Celebrate a win, then recap the decisions in writing afterward."],
            ["R", "Invest in rapport first; ask how they're doing. Go at their pace with no pressure — the relationship is what keeps them."],
            ["A", "Come prepared with data and specifics. Expect detailed questions; if you don't know, say so and follow up in writing."],
        ],
    },
    {
        title: "Delivering bad news",
        scenario: "An ad set underperformed this month, or a launch slipped — you need to tell the client.",
        rows: [
            ["D", "Be upfront and brief: what happened, the impact, and your fix. No long build-up — own it, then move straight to the plan."],
            ["E", "Stay warm and honest. Reassure the relationship first, then refocus the conversation on the exciting path forward."],
            ["R", "Lead with empathy and reassurance. Emphasize stability and that you've got it handled — they really dislike surprises."],
            ["A", "Give the full, accurate picture: the cause, what you've verified, and the corrective steps. Precision is what rebuilds their trust."],
        ],
    },
];

const GUARDRAILS = [
    { title: "People are blends", body: "Most clients have a primary style with a secondary. Read for the dominant, and watch the mix." },
    { title: "Style ≠ worth", body: "No type is “better.” Each has strengths — your job is to meet them where they are." },
    { title: "Context shifts behavior", body: "Stress and deadlines can push anyone. Re-read the room each interaction." },
    { title: "It's flexing, not faking", body: "Adapt tone and pace; keep your message and values intact." },
    { title: "Don't diagnose out loud", body: "This is an internal lens to serve the client — never label a client to their face." },
];

const QUIZ: { msg: string; key: TypeKey; why: string }[] = [
    { msg: "“Hey!! Just saw the reel — obsessed 😍 this is SO us. Can we do more like this?? 🙌”", key: "E", why: "Energy, emojis, wants more and wants vision" },
    { msg: "“Bottom line — what's our direct-booking % this month vs last? Keep it short, I'm slammed.”", key: "D", why: "Bottom line, brevity, time-pressed" },
    { msg: "“Can you share the methodology behind the attribution? I'd like the numbers and how the pixel tracks it before we proceed.”", key: "A", why: "Methodology, data, proof before proceeding" },
    { msg: "“Hi! Hope you had a lovely weekend 😊 No rush at all — just wanted to check in and make sure we're still on track. Thank you for everything!”", key: "R", why: "Pleasantries, warmth, reassurance, “no rush”" },
];

type Owner = { name: string; key: TypeKey; clues: { label: string; quote: string }[]; adapt: string[] };
const EXAMPLES: { id: string; account: string; intro: string; reveal: string; owners: Owner[]; footer: string }[] = [
    {
        id: "taberg",
        account: "Tàberg Falls",
        intro: "One account, two owners — what personality type is each?",
        reveal: "Two owners, two personalities — you have to flex to both, sometimes in the same chat.",
        owners: [
            {
                name: "Denver Brenizer",
                key: "A",
                clues: [
                    { label: "Caution", quote: "“How can we make sure there are no loose ends… I want to ensure we don't run into any more surprises.”" },
                    { label: "Warmth", quote: "“Thank you for all your hard work… I appreciate it!”" },
                ],
                adapt: [
                    "Give thorough, written explanations of the how and why. Be precise and patient — and stay warm. He needs to understand the system and feel looked after.",
                ],
            },
            {
                name: "Matt Kilgore",
                key: "D",
                clues: [
                    { label: "Accountability", quote: "“Whose responsibility was this? Was the ball dropped on our end, Hostaway's, or yours?”" },
                    { label: "Urgency", quote: "“What can we do to increase the momentum?!” · “It's very important we get the ad live today!”" },
                ],
                adapt: [
                    "Be concise, lead with ROI and numbers, own accountability directly, respect urgency. Note: he escalates big ad-spend calls straight to Dustin.",
                ],
            },
        ],
        footer: "One account, two types — read and serve each decision-maker differently.",
    },
    {
        id: "hiawassee",
        account: "Hiawassee Glamping",
        intro: "What personality type is Bryan?",
        reveal: "Bryan — a Relater with an Expressive streak. Warm, loyal, endlessly enthusiastic, and full of ideas.",
        owners: [
            {
                name: "Bryan Hoover",
                key: "R",
                clues: [
                    { label: "Warmth", quote: "“You ROCK!!! It has been a huge help and blessing to have teamed up with you guys!”" },
                    { label: "Ideas", quote: "“Let's do 2 giveaways!” — constantly brings new ideas: pre-booking, local events, new units, creators." },
                    { label: "Trust", quote: "Readily agrees to recommendations and defers to the team's expertise." },
                ],
                adapt: [
                    "Match his warmth and celebrate wins together — keep it personal. The relationship is the retention strategy.",
                    "He trusts the process — gently steer his many ideas toward what performs (we moved him from pricey influencers to AI plus ads; he happily agreed).",
                    "Your best advocate: he left a review and refers people. Ask for testimonials and referrals freely.",
                ],
            },
        ],
        footer: "The warm, trusting client: with rapport and clear expectations he becomes your best advocate and referral source.",
    },
    {
        id: "staydifferent",
        account: "Stay Different",
        intro: "What personality type is Amy?",
        reveal: "Amy — an Expressive with a Driver edge and a brand-detail eye. Warm, idea-driven, business-savvy, value-conscious.",
        owners: [
            {
                name: "Amy Corbett",
                key: "E",
                clues: [
                    { label: "Energy & ideas", quote: "“Wow, you guys! Bravo! … Can you reach out to Dwell or Apartment Therapy to get us more ‘discovered’?” — plus a flood of content and ideas." },
                    { label: "Brand eye", quote: "“The logo still isn't correct… take out the swing clip and the industrial factory view.”" },
                    { label: "Business / ROI", quote: "“The guarantee is what really sold me — you'd have skin in the game. What's the incentive to drive results?”" },
                ],
                adapt: [
                    "Co-create: she's a content engine and idea generator — channel it, credit her, cross-promote. Say yes, or explain warmly why not.",
                    "Nail brand details the first time — repeated logo and photo errors chip away at her confidence.",
                    "Protect the value story and respect the budget. She pauses and negotiates rather than churning — that's your window to make it right.",
                ],
            },
        ],
        footer: "The guarantee that “sold” her — then got walked back in month 3 — triggered a pause and near-churn. The lesson: never oversell at the sale.",
    },
    {
        id: "tuxedo",
        account: "Tuxedo Falls",
        intro: "What personality type is Lark?",
        reveal: "Lark — an Analyzer with a brand-perfectionist's eye, plus real Relater warmth when things are right.",
        owners: [
            {
                name: "Lark Elliott",
                key: "A",
                clues: [
                    { label: "Brand & aesthetic", quote: "“It's trending a bit too dark and moody… I don't see any waterfalls — that's our distinguishing feature. ‘Discounts’ written everywhere looks a bit cheezy.”" },
                    { label: "Precision", quote: "“Please fix the drive times — 40 min to Asheville, 2 hrs to Charlotte. What is the dome icon for Asheville on the map?”" },
                    { label: "Under pressure", quote: "“I just saw the grid… omg, horrible. We are about waterfalls. Please remove all but one, ASAP — I'm so upset.”" },
                ],
                adapt: [
                    "Lock brand guardrails and get explicit sign-off before anything goes live — especially on her grid.",
                    "Lead with precision and on-brand imagery — accurate maps, no errors, nothing that reads “cheezy” or sales-forward.",
                    "When she's upset, don't over-explain — acknowledge, fix it fast, then confirm. Her warmth returns the moment the brand looks right.",
                ],
            },
        ],
        footer: "Her non-negotiable is the look and feel. Lock brand approvals before anything goes live, and her warmth follows.",
    },
    {
        id: "bigmoon",
        account: "Big Moon Ranch",
        intro: "Another account with two owners — what personality type is each?",
        reveal: "A results-first partner and a warm, idea-driven operator — you flex to both.",
        owners: [
            {
                name: "Kurt",
                key: "D",
                clues: [
                    { label: "Urgency", quote: "“Time is money on that project.” · “Any update on the timing of the website launch?”" },
                    { label: "Benchmarks", quote: "“Do we have analytics on views and followers to see how posts are gaining traction? How does this compare to other properties?”" },
                ],
                adapt: [
                    "Lead with results, numbers, and timelines; keep it brief. Give him benchmarks vs. other properties. He delegates the day-to-day, so bring him the high-level ROI.",
                ],
            },
            {
                name: "Bo",
                key: "R",
                clues: [
                    { label: "Deference", quote: "“I'm so sorry! That's why we hired you — I have no idea what I'm doing 🙃”" },
                    { label: "Ideas", quote: "“My friend's an influencer in Round Top — I think a collab makes sense!” — plus a steady stream of ideas and local partners." },
                ],
                adapt: [
                    "Warm, trusting, and idea-driven with an Expressive streak. Reassure him, keep it personal, celebrate wins — and gently steer his ideas toward what performs. Reduce his overwhelm, don't add to it.",
                ],
            },
        ],
        footer: "Like Tàberg — one account, two types. Kurt wants the bottom line; Bo wants the relationship.",
    },
];

const SPECTRUM: Record<TypeKey, string[]> = {
    A: ["Denver (Tàberg)", "Lark"],
    D: ["Matt (Tàberg)", "Kurt (Big Moon)"],
    R: ["Bryan", "Bo (Big Moon)"],
    E: ["Amy"],
};

const STICK = [
    { title: "Tag the type", body: "Add a “Client style” field in your CRM so every AM adapts consistently." },
    { title: "Build rapport to match", body: "Once you've assessed a client, use the rapport-by-type playbook — and these examples — to adapt how you show up." },
    { title: "Note it at handoff", body: "If a client is ever passed to a new account manager, note their style so nothing is lost." },
    { title: "Read the chat", body: "Google Chat tone is your fastest daily signal — blunt vs. detailed vs. warm vs. emoji-heavy." },
];

const NAV_GROUPS: { id: string; label: string; icon: typeof Target04 }[][] = [
    [
        { id: "why", label: "Why it matters", icon: Star01 },
        { id: "model", label: "The model", icon: Grid01 },
        { id: "types", label: "The four types", icon: Users01 },
    ],
    [
        { id: "funnel", label: "Spot across the funnel", icon: Target04 },
        { id: "question", label: "The one question", icon: MessageChatCircle },
        { id: "cheatsheet", label: "Cheat sheet", icon: Zap },
        { id: "rapport", label: "Rapport by type", icon: BookOpen01 },
        { id: "practice", label: "In practice", icon: Check },
    ],
    [
        { id: "guardrails", label: "Use it well", icon: AlertTriangle },
        { id: "activity", label: "Activity: spot the type", icon: Eye },
        { id: "clients", label: "Real client examples", icon: Users01 },
        { id: "spectrum", label: "The spectrum", icon: Grid01 },
        { id: "stick", label: "Make it stick", icon: Lightbulb02 },
    ],
];

/** The 2×2 map used by both "The model" and "The spectrum". */
const Quadrant = ({ render }: { render: (t: TypeKey) => ReactNode }) => (
    <div className="mt-5">
        <p className="mb-2 text-center text-xs font-semibold tracking-wide text-quaternary uppercase">Task-focused</p>
        <div className="grid gap-2.5 sm:grid-cols-2">
            {(["A", "D", "R", "E"] as TypeKey[]).map((t) => (
                <div key={t} className="rounded-xl bg-primary p-4 shadow-xs ring-1 ring-secondary">
                    {render(t)}
                </div>
            ))}
        </div>
        <p className="mt-2 text-center text-xs font-semibold tracking-wide text-quaternary uppercase">People-focused</p>
        <div className="mt-2 flex justify-between text-xs text-quaternary">
            <span>← Measured / reserved</span>
            <span>Fast / assertive →</span>
        </div>
    </div>
);

/* ── Page ────────────────────────────────────────────────────────────── */

const ReadingYourClientsContent = () => {
    const { collapsed: navCollapsed, toggle: toggleNav } = useNavCollapsed();
    const mainRef = useRef<HTMLElement>(null);
    const [activeSection, setActiveSection] = useState("why");
    const [revealed, setRevealed] = useState<Record<string, boolean>>({});
    const toggle = (id: string) => setRevealed((r) => ({ ...r, [id]: !r[id] }));

    const goTo = (id: string) => {
        const el = document.getElementById(`section-${id}`);
        if (!el || !mainRef.current) return;
        mainRef.current.scrollTo({ top: el.offsetTop - 24, behavior: "smooth" });
        setActiveSection(id);
    };

    useEffect(() => {
        const main = mainRef.current;
        if (!main) return;
        const ids = NAV_GROUPS.flat().map((s) => s.id);
        const onScroll = () => {
            let current = ids[0];
            for (const id of ids) {
                const el = document.getElementById(`section-${id}`);
                if (el && el.offsetTop - 120 <= main.scrollTop) current = id;
            }
            setActiveSection(current);
        };
        main.addEventListener("scroll", onScroll, { passive: true });
        return () => main.removeEventListener("scroll", onScroll);
    }, []);

    const RevealButton = ({ id, label = "Reveal the type" }: { id: string; label?: string }) => (
        <button
            type="button"
            onClick={() => toggle(id)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-solid px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition duration-100 ease-linear hover:bg-brand-solid_hover"
        >
            <Eye className="size-4" aria-hidden="true" />
            {revealed[id] ? "Hide the answer" : label}
        </button>
    );

    return (
        <AppShell
            className="flex flex-col"
            rail={!navCollapsed && <IconRail activeDept="clients" />}
            breadcrumb={[
                { label: "Dashboard", to: "/dashboard", icon: LayoutAlt01 },
                { label: "Clients", to: "/dashboard?dept=clients", icon: Users01 },
                { label: "Reading your clients" },
            ]}
        >
            {navCollapsed && <CollapsedTopBar title="Reading your clients" onExpand={toggleNav} />}
            <div className="flex min-h-0 flex-1 gap-2 bg-secondary p-2">
                {!navCollapsed && (
                    <aside className="hidden h-full w-64 shrink-0 flex-col overflow-hidden rounded-lg bg-primary shadow-sm md:flex">
                        <div className="flex h-[73px] shrink-0 items-center justify-between gap-2 border-b border-secondary px-5">
                            <h2 className="text-md font-semibold text-primary">Field guide</h2>
                            <NavCollapseButton onClick={toggleNav} />
                        </div>
                        <motion.nav
                            className="flex-1 overflow-y-auto px-3 py-4"
                            initial="hidden"
                            animate="show"
                            variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                        >
                            {NAV_GROUPS.map((group, gi) => (
                                <div key={gi} className="space-y-1">
                                    {gi > 0 && <div className="mx-3 my-3 h-px bg-border-secondary" />}
                                    {group.map((s) => (
                                        <motion.button
                                            key={s.id}
                                            type="button"
                                            onClick={() => goTo(s.id)}
                                            variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
                                            className={cx(
                                                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition duration-100 ease-linear",
                                                activeSection === s.id
                                                    ? "bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"
                                                    : "text-secondary hover:bg-secondary_hover hover:text-primary",
                                            )}
                                        >
                                            <s.icon className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                                            {s.label}
                                        </motion.button>
                                    ))}
                                </div>
                            ))}
                        </motion.nav>
                    </aside>
                )}

                <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden rounded-lg bg-primary shadow-sm">
                    <div className="mx-auto flex max-w-[900px] flex-col gap-12 px-6 py-12 pb-28 md:px-10">
                        {/* Header */}
                        <header className="flex flex-col items-start gap-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge color="brand" size="md">
                                    Client Experience & Retention
                                </Badge>
                                <Badge color="gray" size="md">
                                    AM training · Phase 1
                                </Badge>
                            </div>
                            <h1 className="text-4xl leading-[1.08] font-semibold tracking-tight text-primary md:text-[44px]">
                                Reading your clients <span className="text-brand-secondary">— the 4 personality types</span>
                            </h1>
                            <p className="max-w-[62ch] text-lg leading-relaxed text-tertiary text-pretty">
                                An account manager's field guide — turning research into everyday client rapport. By the end you should be able
                                to place any client in about ten seconds.
                            </p>
                        </header>

                        {/* Why it matters */}
                        <section id="section-why" className="flex flex-col gap-5 border-t border-secondary pt-10">
                            <SectionHeading eyebrow="The foundation" title="Why reading your clients matters" />
                            <p className="max-w-[66ch] leading-relaxed text-tertiary text-pretty">
                                Clients don't stay for results alone — they stay for how the relationship feels. Two clients can get identical
                                results and rate the experience completely differently, based on whether they felt understood, in control, and
                                reassured in the way they personally need.
                            </p>
                            <div className="rounded-xl bg-brand-50 p-5 ring-1 ring-brand-200 dark:bg-brand-950/40 dark:ring-brand-800">
                                <strong className="text-md font-semibold text-primary">Rapport is a retention strategy.</strong>
                                <p className="mt-1.5 text-sm leading-relaxed text-secondary text-pretty">
                                    Reading how each client thinks, decides, and prefers to communicate — then adapting to match — is what makes
                                    them feel understood. The result: higher satisfaction, stronger retention, and more referrals. Think of it as
                                    being multilingual, not two-faced.
                                </p>
                            </div>
                            <div className="grid gap-3.5 sm:grid-cols-2">
                                <Card>
                                    <p className="text-4xl font-semibold tracking-tight text-brand-secondary">68%</p>
                                    <p className="mt-2 text-sm leading-relaxed text-tertiary">
                                        of clients leave because they feel a company is indifferent to them. Rapport is the antidote.
                                    </p>
                                    <p className="mt-2 text-xs text-quaternary">The Rockefeller Corporation</p>
                                </Card>
                                <Card>
                                    <p className="text-4xl font-semibold tracking-tight text-brand-secondary">5×</p>
                                    <p className="mt-2 text-sm leading-relaxed text-tertiary">
                                        more expensive to win a new client than to keep one you already have.
                                    </p>
                                    <p className="mt-2 text-xs text-quaternary">Harvard Business Review</p>
                                </Card>
                            </div>
                        </section>

                        <PartDivider n={1} title="The four types" blurb="Two questions, four types — and how to recognize each one." />

                        {/* The model */}
                        <section id="section-model" className="flex flex-col gap-3">
                            <SectionHeading eyebrow="The model" title="Two questions place every client" />
                            <p className="max-w-[66ch] leading-relaxed text-tertiary text-pretty">
                                Read <strong className="font-semibold text-primary">pace</strong> (how fast they respond and decide — measured
                                vs. fast) and <strong className="font-semibold text-primary">priority</strong> (what they focus on — the task and
                                results, or the people and relationship).
                            </p>
                            <Quadrant
                                render={(t) => {
                                    const def = TYPES.find((x) => x.key === t)!;
                                    return (
                                        <>
                                            <TypeChip t={t} label="" />
                                            <p className="mt-2 text-sm font-semibold text-primary">{def.question}</p>
                                            <p className="mt-1 text-sm leading-relaxed text-tertiary">{def.map} — {def.summary.split(".")[0]}.</p>
                                        </>
                                    );
                                }}
                            />
                            <p className="mt-1 text-xs text-quaternary">
                                Grounded in established communication-style research used across sales and client management.
                            </p>
                        </section>

                        {/* The four types */}
                        <section id="section-types" className="flex flex-col gap-5">
                            <SectionHeading eyebrow="One at a time" title="The four types" />
                            <div className="grid gap-3.5">
                                {TYPES.map((t) => (
                                    <Card key={t.key}>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                            <TypeChip t={t.key} />
                                            <span className="text-xs text-quaternary">
                                                {t.map} · {t.question} · driven by {t.driven}
                                            </span>
                                        </div>
                                        <p className="mt-3 text-sm leading-relaxed text-secondary text-pretty">{t.summary}</p>
                                        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                                            {[
                                                ["How to spot them", t.spot],
                                                ["How to adapt", t.adapt],
                                                ["Avoid", t.avoid],
                                            ].map(([label, body]) => (
                                                <div key={label}>
                                                    <dt className="text-xs font-semibold tracking-wide text-quaternary uppercase">{label}</dt>
                                                    <dd className="mt-1 text-sm leading-relaxed text-tertiary text-pretty">{body}</dd>
                                                </div>
                                            ))}
                                        </dl>
                                    </Card>
                                ))}
                            </div>
                        </section>

                        <PartDivider
                            n={2}
                            title="Spot it & build rapport"
                            blurb="Where to read the type across your workflow — and how to adapt your rapport to match."
                        />

                        {/* Funnel */}
                        <section id="section-funnel" className="flex flex-col gap-5">
                            <SectionHeading eyebrow="The workflow" title="Spotting the type across the funnel" />
                            <p className="max-w-[66ch] leading-relaxed text-tertiary text-pretty">
                                Four touchpoints to read the client's type — from Dustin's sales notes through to everyday chat. You get four
                                free reads before you ever have to guess.
                            </p>
                            <div className="grid gap-3.5 sm:grid-cols-2">
                                {FUNNEL.map((f) => (
                                    <Card key={f.n}>
                                        <div className="flex items-center gap-3">
                                            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand-solid text-xs font-semibold text-white">
                                                {f.n}
                                            </span>
                                            <h3 className="text-md font-semibold text-primary">{f.title}</h3>
                                        </div>
                                        <p className="mt-2 text-sm leading-relaxed text-tertiary">{f.blurb}</p>
                                        <ul className="mt-3 grid gap-1.5">
                                            {f.tells.map(([k, tell]) => (
                                                <li key={k} className="flex items-center gap-2 text-sm text-secondary">
                                                    <Badge color={TYPE_COLOR[k]} size="sm" type="pill-color">
                                                        {k}
                                                    </Badge>
                                                    {tell}
                                                </li>
                                            ))}
                                        </ul>
                                    </Card>
                                ))}
                            </div>
                        </section>

                        {/* One question */}
                        <section id="section-question" className="flex flex-col gap-4">
                            <SectionHeading eyebrow="The one question" title="“What does success look like for you 6–12 months from now?”" />
                            <p className="leading-relaxed text-tertiary">
                                Listen to <em className="text-primary not-italic">how</em> they answer — the shape of the answer reveals the
                                type, not its content.
                            </p>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {ONE_QUESTION.map(([k, quote, tell]) => (
                                    <Card key={k}>
                                        <TypeChip t={k} />
                                        <p className="mt-2.5 text-sm leading-relaxed text-secondary">{quote}</p>
                                        <p className="mt-2 text-xs font-medium text-quaternary">
                                            {tell} → {TYPE_NAME[k]}
                                        </p>
                                    </Card>
                                ))}
                            </div>
                        </section>

                        {/* Cheat sheet */}
                        <section id="section-cheatsheet" className="flex flex-col gap-4">
                            <SectionHeading eyebrow="Quick-read cheat sheet" title="Keep this open before calls & chats" />
                            <div className="overflow-x-auto rounded-xl bg-primary shadow-xs ring-1 ring-secondary">
                                <table className="w-full min-w-[760px] border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-secondary">
                                            <th className="border-b border-secondary px-4 py-2.5 text-left text-xs font-medium tracking-wide text-quaternary uppercase">
                                                &nbsp;
                                            </th>
                                            {(["D", "E", "R", "A"] as TypeKey[]).map((k) => (
                                                <th key={k} className="border-b border-secondary px-4 py-2.5 text-left">
                                                    <TypeChip t={k} />
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {CHEAT_ROWS.map((row, i) => (
                                            <tr key={row.label} className={i < CHEAT_ROWS.length - 1 ? "border-b border-tertiary" : undefined}>
                                                <th className="px-4 py-3 text-left align-top text-xs font-semibold tracking-wide text-quaternary uppercase">
                                                    {row.label}
                                                </th>
                                                {(["D", "E", "R", "A"] as TypeKey[]).map((k) => (
                                                    <td key={k} className="px-4 py-3 align-top leading-relaxed text-tertiary">
                                                        {row.cells[k]}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-sm font-medium text-secondary">
                                The 10-second read: 1) Fast or measured? 2) Task or people? → that lands the type.
                            </p>
                        </section>

                        {/* Rapport */}
                        <section id="section-rapport" className="flex flex-col gap-5">
                            <SectionHeading eyebrow="Flex your style, keep your message" title="Building rapport by type" />
                            <div className="grid gap-3.5">
                                {RAPPORT.map((r) => (
                                    <Card key={r.key}>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                            <TypeChip t={r.key} />
                                            <span className="text-sm font-medium text-secondary">Rapport = {r.formula}</span>
                                        </div>
                                        <p className="mt-3 rounded-lg bg-secondary px-3.5 py-2.5 text-sm text-secondary italic">{r.opener}</p>
                                        <p className="mt-3 text-sm leading-relaxed text-tertiary text-pretty">
                                            <span className="font-semibold text-primary">What builds trust — </span>
                                            {r.trust}
                                        </p>
                                        <ul className="mt-3 grid gap-1.5">
                                            {r.how.map((h) => (
                                                <li key={h} className="flex gap-2.5 text-sm leading-relaxed text-tertiary">
                                                    <Check className="mt-0.5 size-4 shrink-0 text-fg-success-secondary" aria-hidden="true" />
                                                    <span className="text-pretty">{h}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <p className="mt-3 text-sm leading-relaxed text-tertiary text-pretty">
                                            <span className="font-semibold text-primary">Avoid — </span>
                                            {r.avoid}
                                        </p>
                                    </Card>
                                ))}
                            </div>
                        </section>

                        {/* Practice */}
                        <section id="section-practice" className="flex flex-col gap-5">
                            <SectionHeading eyebrow="Applying it" title="Rapport in practice" />
                            {PRACTICE.map((p) => (
                                <div key={p.title} className="flex flex-col gap-3">
                                    <h3 className="text-md font-semibold text-primary">{p.title}</h3>
                                    <p className="rounded-lg bg-secondary px-3.5 py-2.5 text-sm text-tertiary">
                                        <span className="font-semibold text-secondary">Real scenario — </span>
                                        {p.scenario}
                                    </p>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {p.rows.map(([k, body]) => (
                                            <Card key={k}>
                                                <TypeChip t={k} />
                                                <p className="mt-2 text-sm leading-relaxed text-tertiary text-pretty">{body}</p>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </section>

                        <PartDivider
                            n={3}
                            title="Reading real clients"
                            blurb="Guess the type from real client chats — then reveal it together. Internal only: never label a client to their face."
                        />

                        {/* Guardrails */}
                        <section id="section-guardrails" className="flex flex-col gap-4">
                            <SectionHeading eyebrow="Read this before you start labeling clients" title="Use it well — not rigidly" />
                            <div className="grid gap-3 sm:grid-cols-2">
                                {GUARDRAILS.map((g, i) => (
                                    <Card key={g.title}>
                                        <div className="flex items-center gap-3">
                                            <span className="grid size-6 shrink-0 place-items-center rounded-md bg-brand-50 text-xs font-semibold text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
                                                {i + 1}
                                            </span>
                                            <h3 className="text-sm font-semibold text-primary">{g.title}</h3>
                                        </div>
                                        <p className="mt-2 text-sm leading-relaxed text-tertiary text-pretty">{g.body}</p>
                                    </Card>
                                ))}
                            </div>
                        </section>

                        {/* Activity */}
                        <section id="section-activity" className="flex flex-col gap-4">
                            <SectionHeading eyebrow="Review — discuss as a team" title="Activity: spot the type" />
                            <p className="leading-relaxed text-tertiary">
                                Read each message. Which type wrote it? Take a guess, then reveal.
                            </p>
                            <div className="grid gap-3">
                                {QUIZ.map((q, i) => (
                                    <Card key={i}>
                                        <div className="flex items-start gap-3">
                                            <span className="grid size-6 shrink-0 place-items-center rounded-md bg-secondary text-xs font-semibold text-secondary">
                                                {i + 1}
                                            </span>
                                            <p className="text-sm leading-relaxed text-secondary text-pretty">{q.msg}</p>
                                        </div>
                                        {revealed["quiz"] && (
                                            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-secondary pt-3">
                                                <TypeChip t={q.key} />
                                                <span className="text-sm text-tertiary">{q.why}</span>
                                            </div>
                                        )}
                                    </Card>
                                ))}
                            </div>
                            <div>
                                <RevealButton id="quiz" label="Reveal all four" />
                            </div>
                            <p className="text-sm text-quaternary">
                                The tells are structural, not topical — length, warmth, and whether they ask for proof.
                            </p>
                        </section>

                        {/* Real clients */}
                        <section id="section-clients" className="flex flex-col gap-6">
                            <SectionHeading eyebrow="Client examples" title="Reading real accounts" />
                            {EXAMPLES.map((ex) => (
                                <div key={ex.id} className="flex flex-col gap-3.5 rounded-2xl bg-secondary p-5">
                                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                                        <h3 className="text-lg font-semibold text-primary">{ex.account}</h3>
                                        <span className="text-sm text-tertiary">{ex.intro}</span>
                                    </div>
                                    <div className={cx("grid gap-3.5", ex.owners.length > 1 && "md:grid-cols-2")}>
                                        {ex.owners.map((o) => (
                                            <Card key={o.name}>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                                    {revealed[ex.id] ? (
                                                        <TypeChip t={o.key} label={o.name} />
                                                    ) : (
                                                        <span className="text-sm font-semibold text-primary">{o.name}</span>
                                                    )}
                                                    {revealed[ex.id] && (
                                                        <span className="text-xs font-medium text-quaternary">{TYPE_NAME[o.key]}</span>
                                                    )}
                                                </div>
                                                <ul className="mt-3 grid gap-2.5">
                                                    {o.clues.map((c) => (
                                                        <li key={c.label}>
                                                            <span className="text-xs font-semibold tracking-wide text-quaternary uppercase">
                                                                {c.label}
                                                            </span>
                                                            <p className="mt-0.5 text-sm leading-relaxed text-tertiary text-pretty">{c.quote}</p>
                                                        </li>
                                                    ))}
                                                </ul>
                                                {revealed[ex.id] && (
                                                    <div className="mt-3.5 border-t border-secondary pt-3.5">
                                                        <span className="text-xs font-semibold tracking-wide text-quaternary uppercase">
                                                            How to adapt
                                                        </span>
                                                        <ul className="mt-1.5 grid gap-1.5">
                                                            {o.adapt.map((a) => (
                                                                <li key={a} className="text-sm leading-relaxed text-tertiary text-pretty">
                                                                    {a}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </Card>
                                        ))}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <RevealButton id={ex.id} />
                                        {revealed[ex.id] && <span className="text-sm text-tertiary text-pretty">{ex.reveal}</span>}
                                    </div>
                                    {revealed[ex.id] && (
                                        <p className="border-l-[3px] border-brand py-1 pl-3.5 text-sm leading-relaxed text-secondary text-pretty">
                                            {ex.footer}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </section>

                        {/* Spectrum */}
                        <section id="section-spectrum" className="flex flex-col gap-3">
                            <SectionHeading eyebrow="The spectrum" title="Where these clients land" />
                            <p className="max-w-[66ch] leading-relaxed text-tertiary text-pretty">
                                Even a sample of five accounts spans all four types — and most owners are a blend, sitting near a border rather
                                than dead-center.
                            </p>
                            <Quadrant
                                render={(t) => (
                                    <>
                                        <TypeChip t={t} />
                                        <ul className="mt-2.5 flex flex-wrap gap-1.5">
                                            {SPECTRUM[t].map((n) => (
                                                <li
                                                    key={n}
                                                    className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary"
                                                >
                                                    {n}
                                                </li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                            />
                        </section>

                        {/* Make it stick */}
                        <section id="section-stick" className="flex flex-col gap-4">
                            <SectionHeading eyebrow="Make it stick" title="Turning this into everyday practice" />
                            <div className="grid gap-3 sm:grid-cols-2">
                                {STICK.map((s, i) => (
                                    <Card key={s.title}>
                                        <div className="flex items-center gap-3">
                                            <span className="grid size-6 shrink-0 place-items-center rounded-md bg-brand-solid text-xs font-semibold text-white">
                                                {i + 1}
                                            </span>
                                            <h3 className="text-sm font-semibold text-primary">{s.title}</h3>
                                        </div>
                                        <p className="mt-2 text-sm leading-relaxed text-tertiary text-pretty">{s.body}</p>
                                    </Card>
                                ))}
                            </div>
                            <p className="text-sm text-quaternary">
                                Full detail lives in the Client Experience &amp; Retention Strategy folder — Docs 1–5.
                            </p>
                        </section>

                        <footer className="flex flex-wrap justify-between gap-4 border-t border-secondary pt-5 text-xs text-quaternary">
                            <span>Reading your clients · AM training, Phase 1</span>
                            <span>Internal lens — never label a client to their face.</span>
                        </footer>
                    </div>
                </main>
            </div>
        </AppShell>
    );
};

export const ReadingYourClientsScreen = () => (
    <TeamGate>
        <ReadingYourClientsContent />
    </TeamGate>
);

export default ReadingYourClientsScreen;
