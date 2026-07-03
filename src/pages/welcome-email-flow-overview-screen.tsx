import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, Copy01, Mail01, Plus, Trash01 } from "@untitledui/icons";
import { CollapsedTopBar, IconRail, NavCollapseButton, RailBottom, useNavCollapsed } from "@/components/application/icon-rail";
import { supabase } from "@/lib/supabase";
import { cx } from "@/utils/cx";

/**
 * Living reference page for the Welcome Email Flow builder project.
 * AnhTuan + Claude use it to track decisions, the 3 master email templates,
 * open questions and build progress. Content persists to sop_pages (slug below),
 * mirroring how /roadmap stores its data.
 */
const SLUG = "welcome-email-flow-overview";

/* ── Types ───────────────────────────────────────────────────────── */

type EmailTpl = { label: string; goal: string; subject: string; body: string };
type Todo = { id: string; text: string; done: boolean };
type QA = { id: string; question: string; answer: string };
type LogEntry = { id: string; date: string; title: string; description: string };

type FlowData = {
    overview: string;
    waits: string[]; // timing chips between the 3 emails
    emails: EmailTpl[];
    workflow: string[];
    sidemenu: string[];
    todos: Todo[];
    questions: QA[];
    log: LogEntry[];
};

const uid = () => "id" + Math.random().toString(36).slice(2, 9);

function seed(): FlowData {
    return {
        overview:
            "An internal tool for Account Managers to draft a client's 3-email welcome flow — Promotion, Reminder, Last Chance — in one place, per client. " +
            "It is a drafting tool: AMs copy the finished subject and body of each email into GoHighLevel, which does the actual sending. " +
            "The builder will live inside each client's dashboard (a side-menu section), is created automatically with the client dashboard, and each flow is shareable with the client.",
        waits: ["wait — days?", "wait — days?"],
        emails: [
            {
                label: "Email 1 · Promotion",
                goal: "Introduce the offer and get the first click.",
                subject: "",
                body: "",
            },
            {
                label: "Email 2 · Reminder",
                goal: "Nudge people who didn't open or click Email 1.",
                subject: "",
                body: "",
            },
            {
                label: "Email 3 · Last Chance",
                goal: "Urgency — the offer is about to end.",
                subject: "",
                body: "",
            },
        ],
        workflow: [
            "Open the client's dashboard and pick “Welcome Flow Email” in the side menu.",
            "Fill in the offer details for this client (promotion, deadline, links).",
            "Adjust the 3 pre-loaded templates — subject and body per email.",
            "Copy each finished email into GoHighLevel and schedule the flow there.",
            "Share the flow page with the client for review if needed.",
        ],
        sidemenu: ["Client Overview — general information about the client", "Welcome Flow Email — this builder", "Communication Log", "… (not finalized)"],
        todos: [
            { id: uid(), text: "AnhTuan: paste the 3 existing email templates below (Content for Email 1/2/3)", done: false },
            { id: uid(), text: "Finalize the client-dashboard side menu sections", done: false },
            { id: uid(), text: "Decide the timing between emails (wait days)", done: false },
            { id: uid(), text: "Data model: where flows are stored (extend dashboard_pages.data vs. new welcome_flows table)", done: false },
            { id: uid(), text: "Build the side-menu layout into the client dashboard page", done: false },
            { id: uid(), text: "Build the Welcome Flow builder section (3 editable emails + copy buttons)", done: false },
            { id: uid(), text: "Client-facing shareable view of the flow", done: false },
        ],
        questions: [
            {
                id: uid(),
                question: "When the client views a shared flow, is it read-only (review/approve) or can they edit anything?",
                answer: "",
            },
            {
                id: uid(),
                question: "What are the final side-menu sections for the client dashboard? (Client Overview / Welcome Flow Email / Communication Log / …)",
                answer: "",
            },
            {
                id: uid(),
                question: "How many days between Email 1 → 2 and Email 2 → 3? Fixed for everyone or set per client?",
                answer: "",
            },
            {
                id: uid(),
                question: "Do the templates use placeholders (e.g. {client}, {offer}, {deadline}) the AM fills once, or does the AM edit the full text directly?",
                answer: "",
            },
        ],
        log: [
            {
                id: uid(),
                date: "2026-07-03",
                title: "Project page created",
                description:
                    "Captured the concept: AM drafting tool for a 3-email welcome flow (Promotion → Reminder → Last Chance), copy-to-GoHighLevel output, lives in the client dashboard side menu, shareable per client.",
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
        <p className={cx("whitespace-pre-wrap text-sm text-tertiary", mono && "font-mono text-xs leading-relaxed")}>{value}</p>
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
        <span className={cx("text-sm text-secondary", !value && "italic text-quaternary", className)}>{value || placeholder}</span>
    );

const CopyBtn = ({ text, label = "Copy" }: { text: string; label?: string }) => {
    const [copied, setCopied] = useState(false);
    return (
        <button
            type="button"
            disabled={!text}
            onClick={() => {
                navigator.clipboard.writeText(text).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                });
            }}
            className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-brand-secondary transition duration-100 ease-linear hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-brand-950/40"
        >
            {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy01 className="size-3.5" aria-hidden="true" />}
            {copied ? "Copied!" : label}
        </button>
    );
};

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

/* ── Page ────────────────────────────────────────────────────────── */

const SECTIONS = [
    { id: "s-overview", label: "Overview" },
    { id: "s-flow", label: "The Flow" },
    { id: "s-emails", label: "Email Templates" },
    { id: "s-workflow", label: "How AMs use it" },
    { id: "s-sidemenu", label: "Dashboard side menu" },
    { id: "s-todos", label: "Build To-dos" },
    { id: "s-questions", label: "Open Questions" },
    { id: "s-log", label: "Timeline" },
];

export const WelcomeEmailFlowOverviewScreen = () => {
    const [data, setData] = useState<FlowData>(seed);
    const [editing, setEditing] = useState(false);
    const { collapsed: navCollapsed, toggle: toggleNav } = useNavCollapsed();
    const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
    const mainRef = useRef<HTMLElement>(null);
    const hydratedRef = useRef(false);

    // Load the saved row; fall back to the seed for a fresh page.
    useEffect(() => {
        supabase
            .from("sop_pages")
            .select("data")
            .eq("slug", SLUG)
            .maybeSingle()
            .then(({ data: row, error }) => {
                const d = row?.data as FlowData | undefined;
                if (!error && d && Array.isArray(d.emails)) setData(d);
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
                    if (error) console.error("[welcome-flow autosave]", error);
                });
        }, 1000);
        return () => clearTimeout(t);
    }, [data]);

    const update = (mutator: (draft: FlowData) => void) =>
        setData((prev) => {
            const next = JSON.parse(JSON.stringify(prev)) as FlowData;
            mutator(next);
            return next;
        });

    const goTo = (id: string) => {
        setActiveSection(id);
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    /* list helpers */
    const setLine = (list: "workflow" | "sidemenu", i: number, v: string) => update((d) => void (d[list][i] = v));
    const addLine = (list: "workflow" | "sidemenu") => update((d) => void d[list].push(""));
    const rmLine = (list: "workflow" | "sidemenu", i: number) => update((d) => void d[list].splice(i, 1));

    return (
        <div className="flex h-dvh flex-col overflow-hidden bg-secondary">
            {navCollapsed && <CollapsedTopBar title="Welcome Email Flow" onExpand={toggleNav} />}
            <div className="flex min-h-0 flex-1">
            {!navCollapsed && <IconRail activeDept="am" bottom={<RailBottom editing={editing} onToggleEditing={() => setEditing((e) => !e)} />} />}

            {/* Section nav */}
            {!navCollapsed && (
            <aside className="hidden h-full w-60 shrink-0 flex-col border-r border-secondary bg-primary md:flex">
                <div className="flex h-[73px] shrink-0 items-center justify-between border-b border-secondary px-5">
                    <h2 className="text-md font-semibold text-primary">Welcome Email Flow</h2>
                    <NavCollapseButton onClick={toggleNav} />
                </div>
                <motion.nav
                    className="flex-1 overflow-y-auto px-3 py-4"
                    initial="hidden"
                    animate="show"
                    variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                >
                    <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-quaternary">Project reference</p>
                    {SECTIONS.map((s) => (
                        <motion.button
                            key={s.id}
                            type="button"
                            onClick={() => goTo(s.id)}
                            variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
                            className={cx(
                                "flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium transition duration-100 ease-linear",
                                activeSection === s.id
                                    ? "bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"
                                    : "text-secondary hover:bg-secondary_hover hover:text-primary",
                            )}
                        >
                            {s.label}
                        </motion.button>
                    ))}
                </motion.nav>
            </aside>
            )}

            {/* Content */}
            <main ref={mainRef} className="flex-1 overflow-y-auto">
                <div className="mx-auto flex max-w-[840px] flex-col gap-14 px-6 py-10 pb-24 md:px-10">
                    {/* Title */}
                    <div>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h1 className="text-display-sm font-semibold tracking-tight text-primary md:text-display-md">Welcome Email Flow — Overview</h1>
                                <p className="mt-2 text-md text-tertiary">
                                    Living reference for the AM email-flow builder. Decisions, templates and progress live here — Claude reads this page when
                                    working on the feature.
                                </p>
                            </div>
                            <span
                                className={cx(
                                    "mt-1 inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap",
                                    editing ? "border-brand bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300" : "border-secondary bg-secondary text-tertiary",
                                )}
                            >
                                {editing ? "Editing — autosaves" : "Locked — read only"}
                            </span>
                        </div>
                    </div>

                    {/* 01 Overview */}
                    <section>
                        <SectionHeader id="s-overview" number="01" title="Overview" hint="What this tool is and the decisions made so far." />
                        <div className="mt-4 rounded-2xl bg-primary p-5 ring-1 ring-secondary">
                            <EditArea value={data.overview} editing={editing} onChange={(v) => update((d) => void (d.overview = v))} rows={6} />
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            {[
                                ["Serves", "Account Managers"],
                                ["Output", "Copy into GoHighLevel"],
                                ["Lives in", "Client dashboard side menu"],
                            ].map(([k, v]) => (
                                <div key={k} className="rounded-xl bg-primary px-4 py-3 ring-1 ring-secondary">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-quaternary">{k}</p>
                                    <p className="mt-1 text-sm font-medium text-primary">{v}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 02 The Flow */}
                    <section>
                        <SectionHeader id="s-flow" number="02" title="The Flow" hint="Three emails, in order, with a wait between each." />
                        <div className="mt-5 flex flex-col items-stretch gap-3 md:flex-row md:items-center">
                            {data.emails.map((e, i) => (
                                <div key={e.label} className="flex flex-1 flex-col gap-2 md:contents">
                                    <div className="flex flex-1 flex-col items-center gap-2 rounded-2xl bg-primary px-4 py-5 text-center ring-1 ring-secondary">
                                        <span className="flex size-9 items-center justify-center rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
                                            <Mail01 className="size-4" aria-hidden="true" />
                                        </span>
                                        <p className="text-sm font-semibold text-primary">{e.label}</p>
                                        <p className="text-xs text-tertiary">{e.goal}</p>
                                    </div>
                                    {i < data.waits.length && (
                                        <div className="flex items-center justify-center gap-1 md:flex-col md:px-1">
                                            <ArrowRight className="size-4 shrink-0 rotate-90 text-fg-quaternary md:rotate-0" aria-hidden="true" />
                                            {editing ? (
                                                <input
                                                    type="text"
                                                    value={data.waits[i]}
                                                    onChange={(ev) => update((d) => void (d.waits[i] = ev.target.value))}
                                                    className="w-24 rounded-md border border-secondary bg-primary px-1.5 py-0.5 text-center text-[11px] text-secondary outline-none focus:border-brand"
                                                />
                                            ) : (
                                                <span className="whitespace-nowrap rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-tertiary">{data.waits[i]}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 03 Email templates */}
                    <section>
                        <SectionHeader
                            id="s-emails"
                            number="03"
                            title="Email Templates"
                            hint="The 3 master templates. AnhTuan: unlock editing and paste the existing templates here — Claude reviews and updates from this."
                        />
                        <div className="mt-5 flex flex-col gap-6">
                            {data.emails.map((e, i) => (
                                <div key={e.label} className="rounded-2xl bg-primary p-5 ring-1 ring-secondary">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
                                            {e.label}
                                        </span>
                                        <CopyBtn text={e.subject && e.body ? `Subject: ${e.subject}\n\n${e.body}` : ""} label="Copy email" />
                                    </div>

                                    <div className="mt-4">
                                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-quaternary">Goal</p>
                                        <EditLine value={e.goal} editing={editing} onChange={(v) => update((d) => void (d.emails[i].goal = v))} />
                                    </div>

                                    <div className="mt-4">
                                        <div className="mb-1 flex items-center justify-between">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-quaternary">Subject</p>
                                            <CopyBtn text={e.subject} />
                                        </div>
                                        <EditLine
                                            value={e.subject}
                                            editing={editing}
                                            onChange={(v) => update((d) => void (d.emails[i].subject = v))}
                                            placeholder="Subject line — paste here"
                                        />
                                    </div>

                                    <div className="mt-4">
                                        <div className="mb-1 flex items-center justify-between">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-quaternary">Content for Email {i + 1}</p>
                                            <CopyBtn text={e.body} />
                                        </div>
                                        <EditArea
                                            value={e.body}
                                            editing={editing}
                                            onChange={(v) => update((d) => void (d.emails[i].body = v))}
                                            placeholder={`Content for Email ${i + 1}: paste the existing template here.`}
                                            rows={8}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 04 Workflow */}
                    <section>
                        <SectionHeader id="s-workflow" number="04" title="How AMs use it" hint="The intended end-to-end workflow once the builder ships." />
                        <ol className="mt-5 flex flex-col gap-2.5">
                            {data.workflow.map((step, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-md bg-brand-50 text-xs font-semibold text-brand-700 tabular-nums dark:bg-brand-950/50 dark:text-brand-300">
                                        {i + 1}
                                    </span>
                                    <div className="flex min-w-0 flex-1 items-center gap-2">
                                        <div className="min-w-0 flex-1">
                                            <EditLine value={step} editing={editing} onChange={(v) => setLine("workflow", i, v)} placeholder="Step…" />
                                        </div>
                                        {editing && (
                                            <button type="button" title="Remove step" onClick={() => rmLine("workflow", i)} className="text-fg-quaternary hover:text-fg-error-secondary">
                                                <Trash01 className="size-4" />
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ol>
                        {editing && (
                            <button type="button" onClick={() => addLine("workflow")} className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-brand-secondary hover:underline">
                                <Plus className="size-4" /> Add step
                            </button>
                        )}
                    </section>

                    {/* 05 Side menu proposal */}
                    <section>
                        <SectionHeader
                            id="s-sidemenu"
                            number="05"
                            title="Client dashboard side menu"
                            hint="Proposed sections for the per-client dashboard. NOT finalized — edit freely."
                        />
                        <div className="mt-4 rounded-2xl bg-primary p-5 ring-1 ring-secondary">
                            <ul className="flex flex-col gap-2">
                                {data.sidemenu.map((item, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <span className="size-1.5 shrink-0 rounded-full bg-brand-solid" />
                                        <div className="min-w-0 flex-1">
                                            <EditLine value={item} editing={editing} onChange={(v) => setLine("sidemenu", i, v)} placeholder="Menu item…" />
                                        </div>
                                        {editing && (
                                            <button type="button" title="Remove item" onClick={() => rmLine("sidemenu", i)} className="text-fg-quaternary hover:text-fg-error-secondary">
                                                <Trash01 className="size-4" />
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            {editing && (
                                <button type="button" onClick={() => addLine("sidemenu")} className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-brand-secondary hover:underline">
                                    <Plus className="size-4" /> Add item
                                </button>
                            )}
                        </div>
                    </section>

                    {/* 06 To-dos */}
                    <section>
                        <SectionHeader id="s-todos" number="06" title="Build To-dos" hint="Checklist to ship the feature. Tick items as they land." />
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
                        <SectionHeader id="s-questions" number="07" title="Open Questions" hint="Answer inline — decisions live here so nothing gets lost in chat." />
                        <div className="mt-4 flex flex-col gap-4">
                            {data.questions.map((q, i) => (
                                <div key={q.id} className="rounded-2xl bg-primary p-5 ring-1 ring-secondary">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <EditLine value={q.question} editing={editing} onChange={(v) => update((d) => void (d.questions[i].question = v))} placeholder="Question…" className="font-medium text-primary" />
                                        </div>
                                        {editing && (
                                            <button type="button" title="Remove question" onClick={() => update((d) => void d.questions.splice(i, 1))} className="shrink-0 text-fg-quaternary hover:text-fg-error-secondary">
                                                <Trash01 className="size-4" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="mt-3 border-l-2 border-brand pl-3">
                                        <EditArea value={q.answer} editing={editing} onChange={(v) => update((d) => void (d.questions[i].answer = v))} placeholder="Unanswered — type the decision here." rows={2} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        {editing && (
                            <button
                                type="button"
                                onClick={() => update((d) => void d.questions.push({ id: uid(), question: "", answer: "" }))}
                                className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-brand-secondary hover:underline"
                            >
                                <Plus className="size-4" /> Add question
                            </button>
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
                                        <p className="mt-1 text-sm font-semibold text-primary">{e.title}</p>
                                        <p className="mt-1 text-sm text-tertiary">{e.description}</p>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </section>
                </div>
            </main>
            </div>
        </div>
    );
};
