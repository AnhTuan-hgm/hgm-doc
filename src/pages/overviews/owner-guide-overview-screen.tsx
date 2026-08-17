import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ArrowUpRight, BookOpen01, Check, CheckDone01, ChevronDown, ClipboardCheck, Database01, FileCheck02, Flag05, HelpCircle, Hourglass01, LayoutAlt01, Lock01, Plus, Send01, Shield01, Trash01, Users01 } from "@untitledui/icons";
import { MilestonesPanel, type Milestone, type WaitingItem } from "@/components/application/milestones-panel";
import { PageBanner } from "@/components/application/page-banner";
import { AppShell, CollapsedTopBar, IconRail, NavCollapseButton, RailBottom, useNavCollapsed } from "@/components/application/icon-rail";
import { PriorityFlag, type QuestionPriority } from "@/components/application/priority-flag";
import { VideoAttach, VideoEmbed } from "@/components/application/video-block";
import { useEditShortcuts } from "@/hooks/use-edit-shortcuts";
import { supabase } from "@/lib/supabase";
import { cx } from "@/utils/cx";
import { HighlightPen, renderHighlights } from "@/utils/highlight";

/**
 * Living reference page for the Owner Guide project — the client-facing
 * onboarding guide that collects account credentials. Decisions (incl. RULE
 * No.1), safeguards, open questions and build progress live here. Content
 * persists to sop_pages (slug below), mirroring how /roadmap stores its data.
 */
const SLUG = "owner-guide-overview";

/* ── Types ───────────────────────────────────────────────────────── */

type Stage = { label: string; detail: string };
type Todo = { id: string; text: string; done: boolean };
type QA = { id: string; question: string; answer: string; video?: string; resolved?: boolean; priority?: QuestionPriority };
type LogEntry = { id: string; date: string; title: string; description: string; video?: string };

type GuideData = {
    overview: string;
    bannerUrl?: string;
    /** Build milestones + what the project is currently waiting on. */
    milestones: Milestone[];
    waiting: WaitingItem[];
    stages: Stage[];
    steps: string[];
    rules: string[];
    todos: Todo[];
    questions: QA[];
    log: LogEntry[];
};

const uid = () => "id" + Math.random().toString(36).slice(2, 9);

function seed(): GuideData {
    return {
        overview:
            "The Owner Guide is the client-facing onboarding guide that collects the account logins powering each Ai Website — PMS, Netlify, Supabase, Resend, Stripe, the domain registrar, and Cloudflare. " +
            "The team keeps ONE master template (/owner-guide, team sign-in only); each client gets a private copy at /owner-guide/{slug} protected by a share password. " +
            "Clients work through the steps, enter their credentials, and Review & Submit locks the submission. " +
            "Credentials live in owner_onboarding (keyed by the guide slug); step content/instructions are shared from the template row (owner-guide-content in sop_pages).",
        milestones: [
            { id: uid(), label: "M1 · Owner Guide live — master template + private per-client copies", status: "done" },
            { id: uid(), label: "M2 · Safeguards after the 07-09 incident — RULE No.1, per-guide isolation, protected snapshot", status: "done" },
            { id: uid(), label: "M3 · Read-only hardening — viewing a guide never writes content back", status: "done" },
            { id: uid(), label: "M4 · Freeze-at-submission — protected snapshot + server-side submitted state", status: "progress" },
            { id: uid(), label: "M5 · Submit notification email + 30-day share-link expiry", status: "next" },
        ],
        waiting: [
            { id: uid(), text: "RULE No.1 call: does the team's unlock stop working on frozen guides, or keep working with a loud warning?" },
            { id: uid(), text: "Submit email rail — Supabase Edge Function + Resend, or GHL? (sets the pattern for ALL notification emails)" },
            { id: uid(), text: "Real screenshots for the PMS / Domain / Cloudflare steps so they match the rest of the guide" },
        ],
        stages: [
            { label: "Master template", detail: "One shared 9-step guide, team-only" },
            { label: "Client copy", detail: "Private /owner-guide/{slug} + share password" },
            { label: "Client fills in", detail: "Credentials per step, saved to owner_onboarding" },
            { label: "Review & Submit", detail: "Locks the submission — values masked" },
        ],
        steps: [
            "0 — New Ai Website (welcome, roles & what to prepare)",
            "1 — PMS (Property Management System)",
            "2 — Netlify Hosting",
            "3 — Supabase Database",
            "4 — Resend (email)",
            "5 — Stripe Payments (multi-account supported)",
            "6 — Domain Registrar",
            "7 — Cloudflare",
            "8 — Review & Submit",
        ],
        rules: [
            "RULE No.1 — once a client submits (locks) their guide, nothing about it may change again. Not the values, not the visible steps — for anyone, including the HGM team.",
            "The master template is team-only (@hiddengem.media Google sign-in). Clients only ever see their own /owner-guide/{slug} link — entering the share password never grants team powers.",
            "On client guides, steps are HIDDEN per client (eye icon, restorable), never deleted. Real deletion exists only on the template — and asks for confirmation, because it removes the step for every guide.",
            "\"Owner Guide Snapshot\" — a protected backup of the full 9-step template (sop_pages: owner-guide-content-snapshot). The revert button above the lock icon on the template restores it. It does NOT auto-update — refresh it after meaningful template rewrites.",
            "Client credentials (owner_onboarding) are separate from step content — a broken template can hide sections, but the submitted values survive underneath.",
            "Download PDF on Review & Submit is team-only; clients never see it.",
        ],
        todos: [
            { id: uid(), text: "Per-client steps snapshot at submission — the RULE No.1 architecture fix so template edits can never affect already-submitted guides (est. ~2–2.5h)", done: false },
            { id: uid(), text: "Store submitted/locked state server-side — it's currently localStorage per browser, so there's no reliable record of WHICH guides are actually submitted", done: false },
            { id: uid(), text: "Rewrite the Domain & Cloudflare instruction text (reconstructed placeholders since the 2026-07-09 restore), then refresh the Owner Guide Snapshot", done: false },
            { id: uid(), text: "Add real screenshots to the PMS / Domain / Cloudflare steps so they match the quality of the other steps", done: false },
        ],
        questions: [
            {
                id: uid(),
                question: "RULE No.1 scope: should the team's own unlock button stop working once a client submits, or is it only template edits that must never leak through?",
                answer: "",
            },
            {
                id: uid(),
                question: "When should a guide freeze its step structure — at creation (copy of the template that day) or at submission?",
                answer: "",
            },
            {
                id: uid(),
                question: "What should the final Domain and Cloudflare instructions say? (current text is a reconstructed placeholder, not the original wording)",
                answer: "",
            },
            {
                id: uid(),
                question: "Should the team get a notification (email or dashboard badge) when a client completes Review & Submit?",
                answer: "",
            },
            {
                id: uid(),
                question: "Should completed guides archive or expire their share link once the website has launched, so credentials aren't reachable by URL forever?",
                answer: "",
            },
        ],
        log: [
            {
                id: uid(),
                date: "2026-06-20",
                title: "Owner Guide first built",
                description: "Step content, credential forms and reordering shipped; per-client copies with share passwords followed on 2026-06-22.",
            },
            {
                id: uid(),
                date: "2026-07-08",
                title: "Redesign + critical session bug fixed",
                description:
                    "2-column Review & Submit with per-step icons, full-width image lightbox, quick Back/Next in the sticky header, multi-Stripe-account support. Fixed a real data-loss bug: creating a guide then filling it immediately saved credentials under a stray session id instead of the guide's slug. The master template was gated to team sign-in.",
            },
            {
                id: uid(),
                date: "2026-07-09",
                title: "Template incident → RULE No.1 declared",
                description:
                    "Editing the master template accidentally deleted the PMS, Domain and Cloudflare steps — which instantly hid those sections (and already-submitted data) on every live client guide. Credentials were verified intact in owner_onboarding and the steps were restored the same day (Domain/Cloudflare text reconstructed). AnhTuan declared RULE No.1: submitted client documents can never be changed by anyone, including the team.",
            },
            {
                id: uid(),
                date: "2026-07-10",
                title: "Safeguards shipped + project page created",
                description:
                    "Owner Guide Snapshot backup with a one-click revert button on the template, a confirmation dialog before any template step delete, per-client hide-a-step (hidden_steps — hide instead of delete, restorable, renumbers cleanly), and a team-only Download PDF on Review & Submit. This project log page was created.",
            },
        ],
    };
}

/* ── Small editable primitives ───────────────────────────────────── */

const EditArea = ({
    value,
    editing,
    onChange,
    placeholder,
    rows = 4,
    mono = false,
}: {
    value: string;
    editing: boolean;
    onChange: (v: string) => void;
    placeholder?: string;
    rows?: number;
    mono?: boolean;
}) =>
    editing ? (
        <textarea
            value={value}
            rows={rows}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            className={cx(
                "w-full resize-y rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand",
                mono && "font-mono text-xs leading-relaxed",
            )}
        />
    ) : value ? (
        <p className={cx("whitespace-pre-wrap text-sm text-tertiary", mono && "font-mono text-xs leading-relaxed")}>{renderHighlights(value)}</p>
    ) : (
        <p className="text-sm italic text-quaternary">{placeholder ?? "Empty — unlock editing to fill this in."}</p>
    );

const EditLine = ({
    value,
    editing,
    onChange,
    placeholder,
    className,
}: {
    value: string;
    editing: boolean;
    onChange: (v: string) => void;
    placeholder?: string;
    className?: string;
}) =>
    editing ? (
        <input
            type="text"
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            className={cx(
                "w-full rounded-lg border border-secondary bg-primary px-3 py-1.5 text-sm text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand",
                className,
            )}
        />
    ) : (
        <span className={cx("text-sm text-secondary", !value && "italic text-quaternary", className)}>{value ? renderHighlights(value) : placeholder}</span>
    );

const SectionHeader = ({ id, number, title, hint }: { id: string; number: string; title: string; hint?: string }) => (
    <div id={id} className="scroll-mt-6">
        <div className="flex items-center gap-3">
            <span className="flex size-7 items-center justify-center rounded-md bg-brand-solid text-xs font-semibold text-white tabular-nums">{number}</span>
            <span className="h-px flex-1 bg-border-secondary" />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-primary">{title}</h2>
        {hint && <p className="mt-1 text-sm text-tertiary">{hint}</p>}
    </div>
);

/** A single question card — reused for both Open and Resolved/History lists. */
const QuestionCard = ({
    q,
    number,
    editing,
    resolved,
    onQuestion,
    onAnswer,
    onVideo,
    onRemove,
    onToggleResolved,
    onPriority,
}: {
    q: QA;
    /** Position in the full questions array (1-based) — stable across the Open/Resolved
     * split and across new questions appended later, so numbering never gets reused. */
    number: number;
    editing: boolean;
    resolved?: boolean;
    onQuestion: (v: string) => void;
    onAnswer: (v: string) => void;
    onVideo: (v: string | undefined) => void;
    onRemove: () => void;
    /** Explicit resolve toggle — typing an answer no longer auto-resolves, so a
        half-formed idea can sit in Open until it's actually checked off. */
    onToggleResolved: (v: boolean) => void;
    onPriority: (v: QuestionPriority | undefined) => void;
}) => (
    <div className={cx("rounded-2xl p-5 ring-1 ring-secondary", resolved ? "bg-secondary" : "bg-primary")}>
        <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-2">
                <button type="button" title={resolved ? "Mark as unresolved" : "Mark as resolved"}
                    onClick={() => onToggleResolved(!resolved)}
                    className={cx(
                        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition duration-100 ease-linear",
                        resolved ? "border-success bg-success-solid text-white" : "border-secondary bg-primary hover:border-brand",
                    )}>
                    {resolved && <Check className="size-3" aria-hidden="true" />}
                </button>
                <span className="mt-0.5 shrink-0 text-sm font-semibold text-quaternary tabular-nums">{number}.</span>
                <div className="min-w-0 flex-1">
                    <EditLine value={q.question} editing={editing} onChange={onQuestion} placeholder="Question…" className="font-medium text-primary" />
                </div>
            </div>
            <PriorityFlag value={q.priority} onChange={onPriority} />
            {editing && (
                <button type="button" title="Remove question" onClick={onRemove} className="shrink-0 text-fg-quaternary hover:text-fg-error-secondary">
                    <Trash01 className="size-4" />
                </button>
            )}
        </div>
        <div className={cx("mt-3 border-l-2 pl-3", resolved ? "border-success" : "border-brand")}>
            <EditArea value={q.answer} editing={editing} onChange={onAnswer} placeholder="Type your notes/decision here — check the box above when it's actually resolved." rows={2} />
        </div>
        {editing ? <VideoAttach value={q.video} onChange={onVideo} className="mt-3" /> : q.video && <VideoEmbed url={q.video} className="mt-3" />}
    </div>
);

/* ── Page ────────────────────────────────────────────────────────── */

/** Sidebar is grouped (macOS System Settings style) with dividers between groups.
    Order here IS the scroll order — keep it matching the section DOM order below. */
const NAV_GROUPS = [
    [
        { id: "s-overview", label: "Overview", icon: BookOpen01 },
        { id: "s-milestones", label: "Milestones", icon: Flag05 },
        { id: "s-flow", label: "How it works", icon: Send01 },
        { id: "s-steps", label: "The 9 steps", icon: FileCheck02 },
        { id: "s-rules", label: "Rules & Safeguards", icon: Shield01 },
    ],
    [
        { id: "s-todos", label: "Build To-dos", icon: CheckDone01 },
        { id: "s-questions", label: "Open Questions", icon: HelpCircle },
    ],
    [
        { id: "s-log", label: "Timeline", icon: Hourglass01 },
    ],
];
const SECTIONS = NAV_GROUPS.flat();

const STAGE_ICONS = [BookOpen01, Users01, Database01, Lock01];

export const OwnerGuideOverviewScreen = () => {
    const [data, setData] = useState<GuideData>(seed);
    const [editing, setEditing] = useState(false);
    const { collapsed: navCollapsed, toggle: toggleNav } = useNavCollapsed();
    const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
    const [showResolved, setShowResolved] = useState(false);
    const navigate = useNavigate();
    const mainRef = useRef<HTMLElement>(null);
    const hydratedRef = useRef(false);

    // Shift+E toggles edit mode; Shift+S saves immediately and locks — same
    // shortcuts as /roadmap (the hook reads fresh callbacks each render, so
    // `data` here is always current).
    useEditShortcuts({
        onToggle: () => setEditing((e) => !e),
        onSave: () => {
            supabase
                .from("sop_pages")
                .upsert({ slug: SLUG, data, updated_at: new Date().toISOString() }, { onConflict: "slug" })
                .then(({ error }) => {
                    if (error) console.error("[owner-guide-overview save]", error);
                });
            setEditing(false);
        },
    });

    // Load the saved row; fall back to the seed for a fresh page.
    useEffect(() => {
        supabase
            .from("sop_pages")
            .select("data")
            .eq("slug", SLUG)
            .maybeSingle()
            .then(({ data: row, error }) => {
                const d = row?.data as GuideData | undefined;
                // Merge over the seed so rows saved before newer sections existed
                // (e.g. milestones/waiting) still get those sections' defaults.
                if (!error && d && Array.isArray(d.todos)) setData({ ...seed(), ...d });
                hydratedRef.current = true;
            });
    }, []);

    // Debounced autosave so edits are never trapped in one browser.
    useEffect(() => {
        if (!hydratedRef.current) return;
        const t = setTimeout(() => {
            supabase
                .from("sop_pages")
                .upsert({ slug: SLUG, data, updated_at: new Date().toISOString() }, { onConflict: "slug" })
                .then(({ error }) => {
                    if (error) console.error("[owner-guide-overview autosave]", error);
                });
        }, 1000);
        return () => clearTimeout(t);
    }, [data]);

    const update = (mutator: (draft: GuideData) => void) =>
        setData((prev) => {
            const next = JSON.parse(JSON.stringify(prev)) as GuideData;
            mutator(next);
            return next;
        });

    const goTo = (id: string) => {
        setActiveSection(id);
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    // Scroll-spy: as the page scrolls, highlight the table-of-contents item for the
    // section currently in view (the last heading above the top ~40% of the pane;
    // at the very bottom the final section wins so it's reachable even when short).
    useEffect(() => {
        const main = mainRef.current;
        if (!main) return;
        const onScroll = () => {
            let current = SECTIONS[0].id;
            if (main.scrollTop + main.clientHeight >= main.scrollHeight - 8) {
                current = SECTIONS[SECTIONS.length - 1].id;
            } else {
                const mainTop = main.getBoundingClientRect().top;
                for (const s of SECTIONS) {
                    const el = document.getElementById(s.id);
                    if (el && el.getBoundingClientRect().top - mainTop <= main.clientHeight * 0.4) current = s.id;
                }
            }
            setActiveSection(current);
        };
        main.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return () => main.removeEventListener("scroll", onScroll);
    }, []);

    /* list helpers */
    const setLine = (list: "steps" | "rules", i: number, v: string) => update((d) => void (d[list][i] = v));
    const addLine = (list: "steps" | "rules") => update((d) => void d[list].push(""));
    const rmLine = (list: "steps" | "rules", i: number) => update((d) => void d[list].splice(i, 1));

    /* questions — edited by id so the open / resolved split stays stable across renders */
    const setQuestion = (id: string, patch: Partial<QA>) =>
        update((d) => {
            const q = d.questions.find((x) => x.id === id);
            if (q) Object.assign(q, patch);
        });
    const rmQuestion = (id: string) => update((d) => void (d.questions = d.questions.filter((x) => x.id !== id)));
    const addQuestion = () => update((d) => void d.questions.push({ id: uid(), question: "", answer: "", resolved: false }));

    // Explicit `resolved` flag is the source of truth; questions saved before this
    // field existed fall back to "has an answer" so their current Resolved/Open
    // placement doesn't change until someone touches the checkbox.
    const isAnswered = (q: QA) => q.resolved ?? !!(q.answer || "").trim();
    const openQuestions = data.questions.filter((q) => !isAnswered(q));
    const resolvedQuestions = data.questions.filter(isAnswered);

    return (
        <AppShell
            highlightScope
            className="flex flex-col"
            rail={!navCollapsed && <IconRail activeDept="docs" bottom={<RailBottom editing={editing} onToggleEditing={() => setEditing((e) => !e)} />} />}
            breadcrumb={[
                { label: "Dashboard", to: "/dashboard", icon: LayoutAlt01 },
                { label: "Project Logs", to: "/dashboard?dept=docs&tab=project-logs", icon: ClipboardCheck },
                { label: "Owner Guide" },
            ]}
        >
            <HighlightPen enabled={editing} />
            {navCollapsed && <CollapsedTopBar title="Owner Guide" onExpand={toggleNav} />}
            <div className="flex min-h-0 flex-1 gap-2 bg-secondary p-2">

            {/* Section nav */}
            {!navCollapsed && (
            <aside className="hidden h-full w-60 shrink-0 flex-col overflow-hidden rounded-lg bg-primary shadow-sm md:flex">
                <div className="flex h-[73px] shrink-0 items-center justify-between border-b border-secondary px-5">
                    <h2 className="text-md font-semibold text-primary">Owner Guide</h2>
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
                            {/* Divider between groups (macOS System Settings style) */}
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

            {/* Content */}
            <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden rounded-lg bg-primary shadow-sm">
                <PageBanner
                    breadcrumb={[
                        { label: "Dashboard", to: "/dashboard", icon: LayoutAlt01 },
                        { label: "Project Logs", to: "/dashboard?dept=docs&tab=project-logs", icon: ClipboardCheck },
                        { label: "Owner Guide" },
                    ]}
                    title="Owner Guide — Overview"
                    subtitle="Client onboarding & credential collection — project reference"
                    imageUrl={data.bannerUrl}
                    editing={editing}
                    onImageChange={(url) => update((d) => void (d.bannerUrl = url || undefined))}
                    actions={
                        <span
                            className={cx(
                                "inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap backdrop-blur",
                                editing ? "border-white/40 bg-white/15 text-white" : "border-white/25 bg-white/10 text-white/90",
                            )}
                        >
                            {editing ? "Editing — autosaves" : "Locked — read only"}
                        </span>
                    }
                />
                <div className="mx-auto flex max-w-[840px] flex-col gap-14 px-6 py-10 pb-24 md:px-10">
                    {/* Intro */}
                    <div>
                        <p className="text-md text-tertiary">
                            Living reference for the Owner Guide project. Rules (incl. RULE No.1), safeguards, open questions and build progress live
                            here — Claude reads this page when working on the feature.
                        </p>
                        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                            <button
                                type="button"
                                onClick={() => navigate("/owner-guide")}
                                className="inline-flex items-center gap-2 rounded-lg bg-brand-solid px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition duration-100 ease-linear hover:bg-brand-solid_hover"
                            >
                                <BookOpen01 className="size-4" aria-hidden="true" />
                                Open the master template
                                <ArrowUpRight className="size-4" aria-hidden="true" />
                            </button>
                            <span className="text-xs text-tertiary">
                                Team-only. Client guides are managed from Dashboard → Owner Guides.
                            </span>
                        </div>
                    </div>

                    {/* 01 Overview */}
                    <section>
                        <SectionHeader id="s-overview" number="01" title="Overview" hint="What the Owner Guide is and where its data lives." />
                        <div className="mt-4 rounded-2xl bg-primary p-5 ring-1 ring-secondary">
                            <EditArea value={data.overview} editing={editing} onChange={(v) => update((d) => void (d.overview = v))} rows={6} />
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            {[
                                ["Serves", "Clients (owners)"],
                                ["Credentials in", "Supabase (owner_onboarding)"],
                                ["Step content in", "sop_pages (owner-guide-content)"],
                            ].map(([k, v]) => (
                                <div key={k} className="rounded-xl bg-primary px-4 py-3 ring-1 ring-secondary">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-quaternary">{k}</p>
                                    <p className="mt-1 text-sm font-medium text-primary">{v}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 02 Milestones */}
                    <section>
                        <SectionHeader id="s-milestones" number="02" title="Milestones" hint="The build at a glance — what's shipped, in flight, and what it's waiting on." />
                        <div className="mt-4">
                            <MilestonesPanel
                                milestones={data.milestones}
                                waiting={data.waiting}
                                editing={editing}
                                onMilestones={(m) => update((d) => void (d.milestones = m))}
                                onWaiting={(w) => update((d) => void (d.waiting = w))}
                            />
                        </div>
                    </section>

                    {/* 03 How it works */}
                    <section>
                        <SectionHeader id="s-flow" number="03" title="How it works" hint="From the master template to a locked client submission." />
                        <div className="mt-5 flex flex-col items-stretch gap-3 md:flex-row md:items-center">
                            {data.stages.map((s, i) => {
                                const StageIcon = STAGE_ICONS[i % STAGE_ICONS.length];
                                return (
                                    <div key={i} className="flex flex-1 flex-col gap-2 md:contents">
                                        <div className="flex flex-1 flex-col items-center gap-2 rounded-2xl bg-primary px-4 py-5 text-center ring-1 ring-secondary">
                                            <span className="flex size-9 items-center justify-center rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
                                                <StageIcon className="size-4" aria-hidden="true" />
                                            </span>
                                            {editing ? (
                                                <>
                                                    <EditLine
                                                        value={s.label}
                                                        editing={editing}
                                                        onChange={(v) => update((d) => void (d.stages[i].label = v))}
                                                        placeholder="Stage…"
                                                        className="text-center font-semibold"
                                                    />
                                                    <EditLine
                                                        value={s.detail}
                                                        editing={editing}
                                                        onChange={(v) => update((d) => void (d.stages[i].detail = v))}
                                                        placeholder="Detail…"
                                                        className="text-center text-xs"
                                                    />
                                                </>
                                            ) : (
                                                <>
                                                    <p className="text-sm font-semibold text-primary">{renderHighlights(s.label)}</p>
                                                    <p className="text-xs text-tertiary">{renderHighlights(s.detail)}</p>
                                                </>
                                            )}
                                        </div>
                                        {i < data.stages.length - 1 && (
                                            <div className="flex items-center justify-center md:px-1">
                                                <ArrowRight className="size-4 shrink-0 rotate-90 text-fg-quaternary md:rotate-0" aria-hidden="true" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* 04 The 9 steps */}
                    <section>
                        <SectionHeader
                            id="s-steps"
                            number="04"
                            title="The 9 steps"
                            hint="The full template — clients can have steps hidden individually, but the template always keeps all 9."
                        />
                        <div className="mt-4 rounded-2xl bg-primary p-5 ring-1 ring-secondary">
                            <ul className="flex flex-col gap-2">
                                {data.steps.map((item, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <span className="size-1.5 shrink-0 rounded-full bg-brand-solid" />
                                        <div className="min-w-0 flex-1">
                                            <EditLine value={item} editing={editing} onChange={(v) => setLine("steps", i, v)} placeholder="Step…" />
                                        </div>
                                        {editing && (
                                            <button type="button" title="Remove step" onClick={() => rmLine("steps", i)} className="text-fg-quaternary hover:text-fg-error-secondary">
                                                <Trash01 className="size-4" />
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            {editing && (
                                <button type="button" onClick={() => addLine("steps")} className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-brand-secondary hover:underline">
                                    <Plus className="size-4" /> Add step
                                </button>
                            )}
                        </div>
                    </section>

                    {/* 05 Rules & Safeguards */}
                    <section>
                        <SectionHeader id="s-rules" number="05" title="Rules & Safeguards" hint="Hard rules the feature must never violate, and the protections built after the 2026-07-09 template incident." />
                        <div className="mt-4 rounded-2xl bg-primary p-5 ring-1 ring-secondary">
                            <ol className="flex flex-col gap-2.5">
                                {data.rules.map((rule, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-md bg-brand-50 text-xs font-semibold text-brand-700 tabular-nums dark:bg-brand-950/50 dark:text-brand-300">
                                            {i + 1}
                                        </span>
                                        <div className="flex min-w-0 flex-1 items-center gap-2">
                                            <div className="min-w-0 flex-1">
                                                <EditLine value={rule} editing={editing} onChange={(v) => setLine("rules", i, v)} placeholder="Rule…" />
                                            </div>
                                            {editing && (
                                                <button type="button" title="Remove rule" onClick={() => rmLine("rules", i)} className="text-fg-quaternary hover:text-fg-error-secondary">
                                                    <Trash01 className="size-4" />
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </div>
                        {editing && (
                            <button type="button" onClick={() => addLine("rules")} className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-brand-secondary hover:underline">
                                <Plus className="size-4" /> Add rule
                            </button>
                        )}
                    </section>

                    {/* 06 To-dos */}
                    <section>
                        <SectionHeader id="s-todos" number="06" title="Build To-dos" hint="Checklist to finish hardening the feature. Tick items as they land." />
                        <div className="mt-4 flex flex-col gap-1.5">
                            {data.todos.map((t, i) => (
                                <div key={t.id} className="flex items-center gap-3 rounded-xl bg-primary px-4 py-2.5 ring-1 ring-secondary">
                                    <button
                                        type="button"
                                        onClick={() => update((d) => void (d.todos[i].done = !d.todos[i].done))}
                                        className={cx(
                                            "flex size-5 shrink-0 items-center justify-center rounded-md border transition duration-100 ease-linear",
                                            t.done ? "border-brand bg-brand-solid text-white" : "border-primary bg-primary hover:border-brand",
                                        )}
                                        title={t.done ? "Mark not done" : "Mark done"}
                                    >
                                        {t.done && <Check className="size-3.5" />}
                                    </button>
                                    <div className={cx("min-w-0 flex-1", t.done && "opacity-60")}>
                                        <EditLine
                                            value={t.text}
                                            editing={editing}
                                            onChange={(v) => update((d) => void (d.todos[i].text = v))}
                                            placeholder="To-do…"
                                            className={t.done ? "line-through" : undefined}
                                        />
                                    </div>
                                    {editing && (
                                        <button type="button" title="Remove to-do" onClick={() => update((d) => void d.todos.splice(i, 1))} className="text-fg-quaternary hover:text-fg-error-secondary">
                                            <Trash01 className="size-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        {editing && (
                            <button
                                type="button"
                                onClick={() => update((d) => void d.todos.push({ id: uid(), text: "", done: false }))}
                                className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-brand-secondary hover:underline"
                            >
                                <Plus className="size-4" /> Add to-do
                            </button>
                        )}
                    </section>

                    {/* 07 Questions */}
                    <section>
                        <SectionHeader
                            id="s-questions"
                            number="07"
                            title="Open Questions"
                            hint="Answer inline — decisions live here so nothing gets lost in chat. Answered questions move to Resolved / History below (nothing is deleted)."
                        />
                        <div className="mt-4 flex flex-col gap-4">
                            {openQuestions.length === 0 ? (
                                <p className="rounded-2xl bg-primary p-5 text-sm italic text-quaternary ring-1 ring-secondary">
                                    No open questions right now — everything's been answered.
                                </p>
                            ) : (
                                openQuestions.map((q) => (
                                    <QuestionCard
                                        key={q.id}
                                        q={q}
                                        number={data.questions.findIndex((x) => x.id === q.id) + 1}
                                        editing={editing}
                                        onQuestion={(v) => setQuestion(q.id, { question: v })}
                                        onAnswer={(v) => setQuestion(q.id, { answer: v })}
                                        onVideo={(v) => setQuestion(q.id, { video: v })}
                                        onRemove={() => rmQuestion(q.id)}
                                        onToggleResolved={(v) => setQuestion(q.id, { resolved: v })}
                                        onPriority={(v) => setQuestion(q.id, { priority: v })}
                                    />
                                ))
                            )}
                        </div>
                        {editing && (
                            <button
                                type="button"
                                onClick={addQuestion}
                                className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-brand-secondary hover:underline"
                            >
                                <Plus className="size-4" /> Add question
                            </button>
                        )}

                        {/* Resolved / History — answered questions collapse here so the open list stays focused. */}
                        {resolvedQuestions.length > 0 && (
                            <div className="mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowResolved((s) => !s)}
                                    aria-expanded={showResolved || editing}
                                    className="flex w-full items-center gap-2.5 rounded-xl bg-secondary px-4 py-3 text-left text-sm font-semibold text-secondary transition duration-100 ease-linear hover:bg-secondary_hover"
                                >
                                    <ChevronDown
                                        className={cx("size-4 shrink-0 text-fg-quaternary transition-transform duration-200", (showResolved || editing) && "rotate-180")}
                                        aria-hidden="true"
                                    />
                                    <span className="flex-1">Resolved / History</span>
                                    <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-tertiary tabular-nums ring-1 ring-secondary">
                                        {resolvedQuestions.length}
                                    </span>
                                </button>
                                <AnimatePresence initial={false}>
                                    {(showResolved || editing) && (
                                        <motion.div
                                            key="resolved"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                            className="overflow-hidden"
                                        >
                                            <div className="mt-3 flex flex-col gap-4">
                                                {resolvedQuestions.map((q) => (
                                                    <QuestionCard
                                                        key={q.id}
                                                        q={q}
                                                        number={data.questions.findIndex((x) => x.id === q.id) + 1}
                                                        editing={editing}
                                                        resolved
                                                        onQuestion={(v) => setQuestion(q.id, { question: v })}
                                                        onAnswer={(v) => setQuestion(q.id, { answer: v })}
                                                        onVideo={(v) => setQuestion(q.id, { video: v })}
                                                        onRemove={() => rmQuestion(q.id)}
                                                        onToggleResolved={(v) => setQuestion(q.id, { resolved: v })}
                                                        onPriority={(v) => setQuestion(q.id, { priority: v })}
                                                    />
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </section>

                    {/* 08 Timeline */}
                    <section>
                        <SectionHeader id="s-log" number="08" title="Timeline" hint="Build log — updated as the feature progresses." />
                        <div className="mt-4 flex flex-col gap-3">
                            <AnimatePresence>
                                {data.log.map((e) => (
                                    <motion.div key={e.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-primary p-5 ring-1 ring-secondary">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-quaternary">{e.date}</p>
                                        <p className="mt-1 text-sm font-semibold text-primary">{renderHighlights(e.title)}</p>
                                        <p className="mt-1 text-sm text-tertiary">{renderHighlights(e.description)}</p>
                                        {e.video && <VideoEmbed url={e.video} className="mt-3" />}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </section>
                </div>
            </main>
            </div>
        </AppShell>
    );
};
