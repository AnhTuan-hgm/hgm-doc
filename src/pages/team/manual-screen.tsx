import { useEffect, useState } from "react";
import { ArrowRight, BookOpen01, ChevronDown, LayoutAlt01 } from "@untitledui/icons";

import { AppShell, CollapsedTopBar, IconRail, useNavCollapsed } from "@/components/application/icon-rail";
import { Badge } from "@/components/base/badges/badges";
import { supabase } from "@/lib/supabase";
import { DocRail, DocSection } from "@/pages/client/dashboard/master-brand-fields";
import { cx } from "@/utils/cx";

/**
 * The site's own manual — every custom command, every page, who can see what, where the
 * data lives, and the rules that keep the portal safe to work on. A static page on
 * purpose: it documents the codebase, so it changes only when the codebase does. Keep it
 * current when routes, tables or skills change.
 */

const SECTIONS = [
    { id: "about", label: "The site in one minute" },
    { id: "access", label: "Who can see what" },
    { id: "commands", label: "Custom commands" },
    { id: "client-pages", label: "Client pages" },
    { id: "dashboard", label: "The client dashboard" },
    { id: "links", label: "All links" },
    { id: "logs", label: "Project logs" },
    { id: "editing", label: "Editing & saving" },
    { id: "data", label: "Database & storage" },
    { id: "ai", label: "AI features" },
    { id: "infra", label: "Deploy & infrastructure" },
    { id: "rules", label: "Rules that never break" },
];
const num = (id: string) => SECTIONS.findIndex((s) => s.id === id) + 1;
const NO_PROGRESS = {} as Record<string, boolean>;

const COMMANDS: { cmd: string; what: string }[] = [
    { cmd: "/startworking", what: "Start of day — syncs the dev branch, checks last night's deploy, starts the dev server, opens /questions and the open-incident page, then proposes today's plan from the live roadmap, requests and project logs." },
    { cmd: "/dev", what: "Starts the local preview server on a clean port (5180) and reports the exact URL — avoids the port-collision trap where localhost serves the wrong project." },
    { cmd: "/ship", what: "Build → commit → push → merge to main → watch Netlify until the deploy is verifiably live. The only sanctioned way to deploy." },
    { cmd: "/wrapup", what: "End of day — logs what shipped to the Project Management timeline and every active project-log page (with snapshots), merges to main, verifies the deploy, signs off." },
    { cmd: "/spend", what: "Shows the dollar spend of Claude Code usage on this project — per model, today, last 7 days, all time." },
];

const CLIENT_PATTERNS: { pattern: string; what: string; template: string }[] = [
    { pattern: "/{client}-dashboard", what: "The client dashboard — onboarding forms, Master Brand, Brand Kit, the whole journey. Table: dashboard_pages.", template: "/client-dashboard" },
    { pattern: "/{client}-metapixel (or any other suffix)", what: "Meta Pixel setup guide for that client. Table: client_pages.", template: "/metapixel" },
    { pattern: "/{client}-leadcapture", what: "Website popup / lead-capture page. Table: leadcapture_pages.", template: "/popup" },
    { pattern: "/{client}-chatwidget", what: "Chat-widget setup page. Table: chatwidget_pages.", template: "/chat-widget" },
];

/** The dashboard's side-menu groups, mirrored from dashboard-navigation.ts. */
const DASHBOARD_GROUPS: { group: string; items: { label: string; note: string }[] }[] = [
    {
        group: "Your forms (client input)",
        items: [
            { label: "Onboarding form", note: "Property facts, links, credentials — autosaves as the client types." },
            { label: "Brand Vision Form", note: "How the brand should look, sound and feel." },
        ],
    },
    {
        group: "Brand foundation",
        items: [
            { label: "Overview Document", note: "Team-only client brief — a client never sees this row, not even as \"Soon\"." },
            { label: "Master Brand", note: "The eleven-section Master Brand Document everything downstream reads from. Clients can suggest edits here." },
            { label: "Brand Kit", note: "Colours, fonts, logos, type scale — with AI drafting from the client's site." },
        ],
    },
    {
        group: "Marketing",
        items: [
            { label: "Welcome Flow", note: "The welcome email sequence, previewed per email. Finished emails from the email pipeline load automatically by client name." },
            { label: "Landing page / Repeat Flow / Pinned Posts / Example Reels", note: "Placeholders marked \"Soon\" until each is built." },
        ],
    },
    {
        group: "Resources",
        items: [
            { label: "Folder of Content", note: "Opens the client's content drive — the link lives in Brand Kit's folder field." },
            { label: "Website Setup Guide", note: "Opens that client's own owner guide (never the shared template)." },
            { label: "Custom links", note: "AMs add any link here in edit mode (e.g. a Claude project). New links start Hidden; the eye toggle reveals them to the client." },
        ],
    },
];

const TABLES: { group: string; rows: { name: string; what: string }[] }[] = [
    {
        group: "Client-facing pages",
        rows: [
            { name: "dashboard_pages", what: "One row per client dashboard — the whole dashboard (Master Brand, Brand Kit, visibility, allowlist) is one JSON blob per client." },
            { name: "dashboard_suggestions", what: "Client-proposed Master Brand edits, one row per suggested field — pending / accepted / declined. Quarantined: never touches the document until an AM accepts and saves." },
            { name: "client_pages", what: "Meta Pixel setup pages ({client}-metapixel and any other suffix)." },
            { name: "leadcapture_pages", what: "Popup / lead-capture pages, incl. before-after images and form options." },
            { name: "chatwidget_pages", what: "Chat-widget setup pages." },
            { name: "owner_guides", what: "Per-client owner guides — slug, share password, hidden steps. Guide content lives in sop_pages." },
            { name: "client_onboarding_pages / host_onboarding_pages", what: "The two intake forms' answers — autosaved (900 ms debounce) while the client types, stamped submittedAt when they submit." },
        ],
    },
    {
        group: "Team pages & operations",
        rows: [
            { name: "sop_pages", what: "Every team jsonb page: /roadmap, /deployment, the five project logs, owner-guide master content + its protected snapshot. Questions live inside each page's data." },
            { name: "clients", what: "The Client List roster — name, tier, AM, status, onboarding phase. Feeds /home Mission Control." },
            { name: "welcome_flows + flow_comments", what: "Welcome email flows per client, plus the comment threads on them." },
            { name: "email_wf_emails", what: "Finished welcome emails from the email pipeline (Pooja), matched to a flow by client name — read-only here." },
            { name: "script_logs", what: "Call-recording transcriptions from /log-script (team-only by policy) — transcripts feed Master Brand drafts." },
            { name: "docs_requests", what: "Feature requests and bug reports filed on /requests." },
            { name: "overview_cards / overview_tabs / template_docs / prompt_library", what: "The /dashboard hub's cards and tabs, document templates, and the prompt library." },
            { name: "ghl_integrations", what: "GHL private tokens — server-only: no browser role can read or write it." },
        ],
    },
    {
        group: "Storage buckets",
        rows: [
            { name: "videos", what: "Uploaded video guides." },
            { name: "brandkits", what: "Brand-kit files (logos, fonts)." },
            { name: "recordings", what: "Call recordings for /log-script (private bucket)." },
        ],
    },
];

const FUNCTIONS: { name: string; what: string }[] = [
    { name: "generate-master-section", what: "Drafts Master Brand Document sections from the client's forms, website and pasted reviews — fills empty fields only." },
    { name: "generate-brand-kit", what: "Drafts the Brand Kit (colours, fonts) from the client's website." },
    { name: "generate-overview", what: "Drafts the team's Client Overview Document." },
    { name: "generate-summary", what: "Transcribes call recordings (Deepgram) and summarises them (Claude) for /log-script." },
    { name: "ai-chat", what: "Answers questions in the dashboard's AI chat using that client's own content." },
    { name: "mark-booked", what: "Lets a client's browser tick exactly one journey step (kick-off call booked) — deliberately can't write anything else." },
    { name: "dashboard-suggestions", what: "Client suggestion traffic: list / send / withdraw. Validates the client's email against that dashboard's allowlist on every call." },
];

/** Every link on (and around) the site, grouped for the collapsible "All links" section. */
const LINK_GROUPS: { group: string; links: { to: string; what: string }[] }[] = [
    {
        group: "Team hub & planning",
        links: [
            { to: "/dashboard", what: "The team hub — departments, docs, project logs" },
            { to: "/home", what: "Mission Control — the whole client roster at a glance" },
            { to: "/roadmap", what: "Project Management — timeline, to-dos, roadmap, questions" },
            { to: "/questions", what: "One inbox for every project page's open questions — answer here each morning" },
            { to: "/requests", what: "Feature requests and bug reports from the team" },
            { to: "/settings", what: "Site settings" },
        ],
    },
    {
        group: "Docs, logs & incidents",
        links: [
            { to: "/manual", what: "This page — the site's manual" },
            { to: "/deployment", what: "Every production deploy, what failed, what fixed it" },
            { to: "/fix", what: "Open-incident record (currently: the Google Safe Browsing flag)" },
            { to: "/master-document-log", what: "Master Brand Document change log" },
            { to: "/log-script", what: "Call-recording transcription — feeds the Master Brand drafts" },
            { to: "/designsystem", what: "The Untitled UI component reference for this site" },
            { to: "/prompt-library", what: "Reusable AI prompts" },
        ],
    },
    {
        group: "Project logs",
        links: [
            { to: "/welcome-email-flow-overview", what: "Welcome email flow" },
            { to: "/client-dashboard-overview", what: "Client dashboard" },
            { to: "/chat-widget-overview", what: "Chat widget" },
            { to: "/owner-guide-overview", what: "Owner guide" },
            { to: "/homepage-overview", what: "Mission Control homepage" },
        ],
    },
    {
        group: "Templates (copy per client, never hold client data)",
        links: [
            { to: "/client-dashboard", what: "Client dashboard template" },
            { to: "/metapixel", what: "Meta Pixel guide template" },
            { to: "/popup", what: "Lead-capture popup template" },
            { to: "/chat-widget", what: "Chat-widget template" },
            { to: "/owner-guide", what: "Owner-guide template (client-facing, shareable)" },
        ],
    },
    {
        group: "Client-facing forms",
        links: [
            { to: "/brand-vision-form", what: "Brand Vision form" },
            { to: "/client-onboarding-form", what: "Client onboarding form" },
            { to: "/host-onboarding-form", what: "Host onboarding form" },
        ],
    },
    {
        group: "Web team",
        links: [
            { to: "/webteam/ai-website-setup", what: "AI website setup guide" },
            { to: "/webteam/component-library-architecture", what: "Component library architecture" },
            { to: "/clients/reading-your-clients", what: "Reading your clients" },
        ],
    },
    {
        group: "External services",
        links: [
            { to: "https://hgmportal.com", what: "The live site" },
            { to: "https://docs-hgm.netlify.app", what: "The same site on Netlify's address (unflagged fallback)" },
            { to: "https://github.com/AnhTuan-hgm/hgm-doc", what: "The code — pushing main deploys" },
            { to: "https://app.netlify.com", what: "Netlify — build & deploy dashboard" },
            { to: "https://supabase.com/dashboard", what: "Supabase — the database behind everything" },
            { to: "https://dcc.godaddy.com/manage/hgmportal.com/dns", what: "GoDaddy — hgmportal.com DNS" },
            { to: "https://search.google.com/search-console", what: "Google Search Console — for the Safe Browsing fix" },
        ],
    },
];

/**
 * The project logs, in the order the Docs → Project Logs tab lists them.
 *
 * These are the six with a real `sop_pages` row behind them — the same set /wrapup writes
 * to and /questions reads from. Keep this list in step with those skills' lists: a log
 * missing here is a log nobody sees the status of.
 */
const LOG_PAGES: { slug: string; label: string; to: string; what: string }[] = [
    { slug: "client-dashboard-overview", label: "Client Dashboard", to: "/client-dashboard-overview", what: "Master Brand Document & the client info hub" },
    { slug: "roadmap", label: "Project Management", to: "/roadmap", what: "Roadmap, to-dos & timeline for the whole site" },
    { slug: "chat-widget-overview", label: "AI Chat Widget", to: "/chat-widget-overview", what: "Claude-answered chat for client websites" },
    { slug: "welcome-email-flow-overview", label: "Welcome Email Flow", to: "/welcome-email-flow-overview", what: "The AM email-flow builder & templates" },
    { slug: "owner-guide-overview", label: "Owner Guide", to: "/owner-guide-overview", what: "Client onboarding & credential collection" },
    { slug: "homepage-overview", label: "Homepage", to: "/homepage-overview", what: "Mission Control — the company-wide home screen" },
];

interface LogStatus {
    entries: number;
    latest?: { date: string; title: string };
    todosOpen: number;
    todosTotal: number;
    questionsOpen: number;
    questionsTotal: number;
}

/** Same rule the notification bell uses, so the two never disagree about what's open. */
const questionIsOpen = (q: { answer?: string; resolved?: boolean }) => !(q.resolved ?? !!(q.answer || "").trim());

const shortDate = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

/**
 * Live status of every project log, read straight from the rows the logs themselves save
 * to. Read-only by design: editing stays on each log page, so there's exactly one place a
 * timeline entry or an answer can be written and no chance of two pages disagreeing.
 */
const ProjectLogs = () => {
    const [status, setStatus] = useState<Record<string, LogStatus> | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        void supabase
            .from("sop_pages")
            .select("slug, data")
            .in(
                "slug",
                LOG_PAGES.map((p) => p.slug),
            )
            .then(({ data, error }) => {
                if (cancelled) return;
                if (error || !data) {
                    setFailed(true);
                    return;
                }
                const next: Record<string, LogStatus> = {};
                for (const row of data) {
                    const d = (row.data ?? {}) as {
                        log?: { date: string; title: string }[];
                        todos?: { done?: boolean }[];
                        questions?: { answer?: string; resolved?: boolean }[];
                    };
                    const entries = [...(d.log ?? [])].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
                    const todos = d.todos ?? [];
                    const questions = d.questions ?? [];
                    next[row.slug as string] = {
                        entries: entries.length,
                        latest: entries.at(-1),
                        todosOpen: todos.filter((t) => !t.done).length,
                        todosTotal: todos.length,
                        questionsOpen: questions.filter(questionIsOpen).length,
                        questionsTotal: questions.length,
                    };
                }
                setStatus(next);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className="flex flex-col gap-2">
            {LOG_PAGES.map((p) => {
                const s = status?.[p.slug];
                return (
                    <a
                        key={p.slug}
                        href={p.to}
                        className="group flex flex-col gap-2 rounded-xl bg-secondary p-4 ring-1 ring-secondary transition duration-100 ease-linear hover:bg-primary_hover sm:flex-row sm:items-center sm:justify-between"
                    >
                        <div className="min-w-0">
                            <p className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                                {p.label}
                                <ArrowRight
                                    className="size-3.5 shrink-0 text-fg-quaternary transition-transform duration-100 ease-linear group-hover:translate-x-0.5"
                                    aria-hidden="true"
                                />
                            </p>
                            <p className="mt-0.5 text-xs text-tertiary">{p.what}</p>
                            <p className="mt-1.5 text-sm text-secondary">
                                {s?.latest ? (
                                    <>
                                        <span className="font-mono text-xs text-quaternary">{shortDate(s.latest.date)}</span> · {s.latest.title}
                                    </>
                                ) : status ? (
                                    <span className="text-quaternary italic">No timeline entries yet</span>
                                ) : (
                                    <span className="text-quaternary">Loading…</span>
                                )}
                            </p>
                        </div>
                        {/* Counts, not badges-for-their-own-sake: open questions block work, so
                            they read as a warning; a drained queue reads as done. */}
                        {s && (
                            <div className="flex shrink-0 flex-wrap items-center gap-2">
                                <Badge color={s.questionsOpen > 0 ? "warning" : "success"} size="sm" type="pill-color">
                                    {s.questionsOpen > 0 ? `${s.questionsOpen} open question${s.questionsOpen === 1 ? "" : "s"}` : "Questions answered"}
                                </Badge>
                                <Badge color="gray" size="sm" type="pill-color">
                                    {s.todosOpen}/{s.todosTotal} to-dos left
                                </Badge>
                                <Badge color="gray" size="sm" type="modern">
                                    {s.entries} entries
                                </Badge>
                            </div>
                        )}
                    </a>
                );
            })}
            {failed && (
                <p className="text-sm text-tertiary">
                    Couldn't load the live status — the logs themselves are unaffected, open any page above to read it directly.
                </p>
            )}
        </div>
    );
};

/** A left-to-right chain of boxes with arrows — the manual's diagram vocabulary.
 *  Scrolls sideways inside its own container on narrow screens instead of wrapping,
 *  so a flow always reads as one line. `accent` marks the step that matters most. */
const Flow = ({ label, steps }: { label: string; steps: { t: string; s?: string; accent?: boolean }[] }) => (
    <div className="mt-4 overflow-x-auto rounded-2xl bg-secondary p-4 ring-1 ring-secondary">
        <p className="mb-3 font-mono text-[11px] font-semibold tracking-[0.08em] text-quaternary uppercase">{label}</p>
        <div className="flex min-w-max items-stretch">
            {steps.map((step, i) => (
                <div key={i} className="flex items-center">
                    {i > 0 && <ArrowRight className="mx-2 size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />}
                    <div
                        className={cx(
                            "flex h-full w-44 flex-col justify-center rounded-xl px-3 py-2.5 ring-1 ring-secondary",
                            step.accent ? "bg-brand-primary" : "bg-primary",
                        )}
                    >
                        <p className="text-sm font-semibold text-primary">{step.t}</p>
                        {step.s && <p className="mt-0.5 text-xs text-tertiary">{step.s}</p>}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const Kbd = ({ children }: { children: string }) => (
    <kbd className="rounded bg-secondary px-1.5 py-0.5 text-xs font-semibold text-secondary ring-1 ring-secondary">{children}</kbd>
);

const Row = ({ left, right, href }: { left: string; right: string; href?: string }) => (
    <div className="flex flex-col gap-0.5 border-b border-secondary py-3 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-4">
        {href ? (
            <a
                href={href}
                {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="w-64 shrink-0 font-mono text-sm font-semibold break-all text-brand-secondary hover:underline"
            >
                {left.replace(/^https:\/\//, "")}
            </a>
        ) : (
            <span className="w-64 shrink-0 font-mono text-sm font-semibold text-primary">{left}</span>
        )}
        <span className="min-w-0 text-md text-tertiary">{right}</span>
    </div>
);

/** A titled group of Rows — used by the table and dashboard-section listings. */
const RowGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="rounded-2xl bg-secondary p-4 ring-1 ring-secondary">
        <p className="font-mono text-[11px] font-semibold tracking-[0.08em] text-quaternary uppercase">{title}</p>
        <div className="mt-1">{children}</div>
    </div>
);

export const ManualScreen = () => {
    const { collapsed: navCollapsed, toggle: toggleNav } = useNavCollapsed();

    return (
        <AppShell
            className="flex flex-col"
            rail={!navCollapsed && <IconRail activeDept="docs" />}
            breadcrumb={[
                { label: "Dashboard", to: "/dashboard", icon: LayoutAlt01 },
                { label: "Manual", icon: BookOpen01 },
            ]}
        >
            {navCollapsed && <CollapsedTopBar title="Manual" onExpand={toggleNav} />}

            <div className="min-h-0 flex-1 overflow-y-auto bg-secondary p-2">
                <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
                    <header>
                        <h1 className="text-display-xs font-semibold text-primary">Manual</h1>
                        <p className="mt-2 max-w-2xl text-sm text-tertiary text-pretty">
                            Everything you need to know about this website in one place — the custom commands, every page and
                            where it lives, who can see what, how editing and deploys work, and the rules that never break.
                        </p>
                    </header>

                    <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
                        <DocRail sections={SECTIONS} progress={NO_PROGRESS} />

                        <div className="flex min-w-0 flex-1 flex-col gap-8 rounded-2xl bg-primary p-6 ring-1 ring-secondary sm:p-8">
                            <DocSection id="about" label="The site in one minute" number={num("about")}>
                                <div className="flex flex-col gap-3 text-md text-tertiary">
                                    <p>
                                        This is HGM's client portal: setup guides, onboarding forms, client dashboards, and the
                                        team's own project-management pages, all in one site. Pages are edited in place
                                        (unlock → edit → save) and everything saves to <strong className="text-secondary">Supabase</strong> — the
                                        single database behind the whole site.
                                    </p>
                                    <Row left="hgmportal.com" right="The live site — this is what clients use." href="https://hgmportal.com" />
                                    <Row left="docs-hgm.netlify.app" right="The same site on Netlify's own address (the deploy target; hgmportal.com points at it)." href="https://docs-hgm.netlify.app" />
                                    <Row left="github.com/AnhTuan-hgm/hgm-doc" right="The code. Pushing the main branch is what deploys." href="https://github.com/AnhTuan-hgm/hgm-doc" />
                                </div>
                                <Flow
                                    label="Where the code lives"
                                    steps={[
                                        { t: "GitHub", s: "the code, main branch" },
                                        { t: "Netlify", s: "builds the site + runs the AI functions" },
                                        { t: "hgmportal.com", s: "what everyone opens", accent: true },
                                    ]}
                                />
                                <Flow
                                    label="Where the content lives"
                                    steps={[
                                        { t: "You edit a page", s: "unlock → type → save" },
                                        { t: "Supabase", s: "one row per page, the only store", accent: true },
                                        { t: "Everyone sees it", s: "teammates and clients read the same row" },
                                    ]}
                                />
                            </DocSection>

                            <DocSection id="access" label="Who can see what" number={num("access")}>
                                <ul className="flex flex-col gap-2 text-md text-tertiary">
                                    <li>
                                        <strong className="text-secondary">Team:</strong> sign in with Google using an{" "}
                                        <span className="font-mono text-sm">@hiddengem.media</span> address. That's the single switch —
                                        it shows every section (including team-only ones), the edit/save controls, the icon rail
                                        and the notification bell.
                                    </li>
                                    <li>
                                        <strong className="text-secondary">Clients (dashboards):</strong> each dashboard has its own gate —
                                        an email allowlist plus a shared password, both set by the AM in edit mode. The gate arms
                                        only once <em>both</em> exist; until then the dashboard opens by URL (the staged rollout for
                                        the 49 dashboards that predate the gate). An unlock lasts the browser tab.
                                    </li>
                                    <li>
                                        <strong className="text-secondary">Clients (owner guides):</strong> a per-guide share password, same
                                        idea, set on the guide itself.
                                    </li>
                                    <li>
                                        <strong className="text-secondary">Preview as client:</strong> add{" "}
                                        <span className="font-mono text-sm">?preview=client</span> to any dashboard (or click the client's
                                        logo while locked) to see exactly what they see — same menu, same "Soon" rows, no edit
                                        controls. The banner exits the preview. The Master Brand suggest controls work here too,
                                        so you can test the whole loop — a suggestion you send from preview is stamped with your
                                        own <span className="font-mono text-sm">@hiddengem.media</span> address, never the
                                        client's, so it's obvious on review that it was a test.
                                    </li>
                                    <li>
                                        <strong className="text-secondary">Everyone else:</strong> an anonymous visitor can read public pages
                                        but can write almost nothing — dashboard writes and the suggestions table are blocked at the
                                        database, and the few client-initiated writes (booking a call, sending suggestions) go
                                        through server functions that validate identity per request.
                                    </li>
                                </ul>
                                <Flow
                                    label="Opening a gated dashboard (client)"
                                    steps={[
                                        { t: "Open /{client}-dashboard", s: "gate shows if armed" },
                                        { t: "Email + password", s: "checked against that row's allowlist" },
                                        { t: "Unlocked", s: "lasts this browser tab", accent: true },
                                    ]}
                                />
                            </DocSection>

                            <DocSection id="commands" label="Custom commands" number={num("commands")}>
                                <p className="mb-2 text-md text-tertiary">
                                    Typed in Claude Code (they're this project's skills). The daily rhythm is{" "}
                                    <span className="font-mono text-sm font-semibold text-primary">/startworking</span> in the morning and{" "}
                                    <span className="font-mono text-sm font-semibold text-primary">/wrapup</span> at night.
                                </p>
                                <div>
                                    {COMMANDS.map((c) => (
                                        <Row key={c.cmd} left={c.cmd} right={c.what} />
                                    ))}
                                </div>
                            </DocSection>

                            <DocSection id="client-pages" label="Client pages" number={num("client-pages")}>
                                <p className="mb-2 text-md text-tertiary">
                                    Every client gets private pages at their own web address — the ending decides which kind of
                                    page it is. The team copies a template, which creates that client's own row in the database;
                                    the template link itself never holds client data.
                                </p>
                                <div>
                                    {CLIENT_PATTERNS.map((p) => (
                                        <Row key={p.pattern} left={p.pattern} right={`${p.what} Template: ${p.template}`} />
                                    ))}
                                </div>
                                <Flow
                                    label="How a client page is born"
                                    steps={[
                                        { t: "Template", s: "e.g. /popup — never holds client data" },
                                        { t: "Copy for client", s: "team fills in name + website" },
                                        { t: "New Supabase row", s: "under the client's own slug" },
                                        { t: "/{client}-…", s: "their private page, edited in place", accent: true },
                                    ]}
                                />
                            </DocSection>

                            <DocSection id="dashboard" label="The client dashboard" number={num("dashboard")}>
                                <p className="mb-3 text-md text-tertiary">
                                    The biggest page on the site — one row in <span className="font-mono text-sm">dashboard_pages</span> holds
                                    a client's entire dashboard. The side menu mirrors the onboarding journey the team runs in
                                    Asana, and the Overview section walks the client through it step by step: fill the onboarding
                                    form → book the kick-off call → onboarding call → Brand Vision form → review the Master Brand →
                                    review the Brand Kit → review the funnel → add resources → website setup.
                                </p>
                                <div className="flex flex-col gap-3">
                                    {DASHBOARD_GROUPS.map((g) => (
                                        <RowGroup key={g.group} title={g.group}>
                                            {g.items.map((i) => (
                                                <Row key={i.label} left={i.label} right={i.note} />
                                            ))}
                                        </RowGroup>
                                    ))}
                                </div>
                                <ul className="mt-4 flex flex-col gap-2 text-md text-tertiary">
                                    <li>
                                        <strong className="text-secondary">The eye toggle:</strong> the team sees every section; a client
                                        only sees what an AM revealed with the eye in edit mode. Until then the row reads{" "}
                                        <em>Soon</em> to the client and <em>Hidden</em> to the team — a client never sees the word
                                        "Hidden", and the team never sees "Soon".
                                    </li>
                                    <li>
                                        <strong className="text-secondary">Suggestion mode:</strong> clients can't edit the Master Brand
                                        Document — they press <em>Suggest edits</em>, type into any field, and send. Each suggestion
                                        shows under its field for the AM with who sent it, when, and a warning if the field changed
                                        since. Accept pulls the value into edit mode (Save makes it real); Decline records the
                                        outcome. Nothing a client does can touch the document directly.
                                    </li>
                                    <li>
                                        <strong className="text-secondary">Custom resources:</strong> in edit mode the Resources group has{" "}
                                        <em>+ Add resource</em> — name, link, eye toggle, remove. New links start hidden so internal
                                        links (a Claude project, a working doc) never leak to a client by accident.
                                    </li>
                                    <li>
                                        <strong className="text-secondary">Test dashboard:</strong>{" "}
                                        <a href="/hgm-test-dashboard" className="font-semibold text-brand-secondary hover:underline">/hgm-test-dashboard</a>{" "}
                                        is the sandbox — every dashboard experiment goes there before a real client sees it.
                                    </li>
                                </ul>
                                <Flow
                                    label="Client suggestions (Master Brand Document)"
                                    steps={[
                                        { t: "Client suggests", s: "types into the fields, presses Send" },
                                        { t: "Identity checked", s: "email must be on that dashboard's list" },
                                        { t: "Suggestions table", s: "quarantined — the document is untouched" },
                                        { t: "AM reviews", s: "accept or decline, field by field" },
                                        { t: "Save applies it", s: "accepted values enter the document", accent: true },
                                    ]}
                                />
                            </DocSection>

                            <DocSection
                                id="links"
                                label="All links"
                                number={num("links")}
                                action={<span className="text-xs text-quaternary">Click a group to open it</span>}
                            >
                                <div className="flex flex-col gap-2">
                                    {LINK_GROUPS.map((g) => (
                                        <details key={g.group} className="group rounded-xl bg-secondary ring-1 ring-secondary open:bg-primary">
                                            <summary className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-4 py-3 transition duration-100 ease-linear hover:bg-primary_hover">
                                                <span className="text-sm font-semibold text-primary">
                                                    {g.group}
                                                    <span className="ml-2 font-normal text-quaternary">{g.links.length}</span>
                                                </span>
                                                <ChevronDown
                                                    className="size-4 shrink-0 text-fg-quaternary transition duration-100 ease-linear group-open:rotate-180"
                                                    aria-hidden="true"
                                                />
                                            </summary>
                                            <div className="px-4 pb-2">
                                                {g.links.map((l) => (
                                                    <Row key={l.to} left={l.to} right={l.what} href={l.to} />
                                                ))}
                                            </div>
                                        </details>
                                    ))}
                                </div>
                            </DocSection>

                            <DocSection
                                id="logs"
                                label="Project logs"
                                number={num("logs")}
                                action={<span className="text-xs text-quaternary">Live from Supabase</span>}
                            >
                                <p className="mb-3 text-md text-tertiary">
                                    Every feature has its own log page: what it is, how it works, a dated timeline, build to-dos, and the
                                    open questions blocking it. Below is each one's live status — the newest timeline entry, how many
                                    to-dos are left, and whether any questions are still waiting on a decision. Editing stays on the log
                                    pages themselves, so a timeline entry or an answer has exactly one place it can be written.{" "}
                                    <a href="/questions" className="font-semibold text-brand-secondary hover:underline">
                                        /questions
                                    </a>{" "}
                                    is the one inbox for answering across all of them, and{" "}
                                    <span className="font-mono text-sm">/wrapup</span> appends the day's entries and snapshots each page
                                    before writing.
                                </p>
                                <ProjectLogs />
                            </DocSection>

                            <DocSection id="editing" label="Editing & saving" number={num("editing")}>
                                <ul className="flex flex-col gap-2 text-md text-tertiary">
                                    <li>
                                        Pages are <strong className="text-secondary">locked</strong> by default. Unlock to edit; nothing is
                                        stored until you press Save. Shortcuts: <Kbd>Shift+E</Kbd> toggles editing, <Kbd>Shift+S</Kbd> saves.
                                    </li>
                                    <li>
                                        Every save writes to Supabase — there is no local-only editing, so what you save is what
                                        every teammate (and the client) sees.
                                    </li>
                                    <li>
                                        <strong className="text-secondary">The conflict guard:</strong> a dashboard save writes the whole
                                        row, so before writing, Save re-reads the row. If someone else saved while your tab was
                                        open, it blocks once and tells you instead of silently overwriting their afternoon — a
                                        second press overwrites deliberately. Team pages (roadmap, logs) autosave with a short
                                        debounce instead; the intake forms autosave as the client types.
                                    </li>
                                    <li>
                                        Image uploads are compressed automatically (WebP, max 1600px) so the database stays fast.
                                        Custom fonts on Brand Kit are capped at 1.5MB — use .woff2 files.
                                    </li>
                                    <li>
                                        "Draft from…" buttons (Overview, Master Brand, Brand Kit) fill <em>empty</em> fields only —
                                        a draft never changes or erases something a person wrote.
                                    </li>
                                    <li>
                                        Clients can't edit — on the Master Brand Document they <strong className="text-secondary">suggest</strong> instead,
                                        and nothing changes until an AM accepts each suggestion and saves.
                                    </li>
                                </ul>
                                <Flow
                                    label="Saving (team)"
                                    steps={[
                                        { t: "Locked page", s: "the default — read-only" },
                                        { t: "Unlock", s: "Shift+E, team only" },
                                        { t: "Edit in place", s: "nothing stored yet" },
                                        { t: "Save", s: "blocks once if someone else saved first" },
                                        { t: "Supabase", s: "the row is updated", accent: true },
                                    ]}
                                />
                            </DocSection>

                            <DocSection id="data" label="Database & storage" number={num("data")}>
                                <p className="mb-3 text-md text-tertiary">
                                    Everything lives in one Supabase project, reached at{" "}
                                    <span className="font-mono text-sm">api.hgmportal.com</span>. Most tables follow the same shape:
                                    a slug, a couple of name fields, and one JSON blob holding the page. Schema changes live in{" "}
                                    <span className="font-mono text-sm">supabase/migrations/</span> and are pushed with the Supabase CLI.
                                </p>
                                <div className="flex flex-col gap-3">
                                    {TABLES.map((g) => (
                                        <RowGroup key={g.group} title={g.group}>
                                            {g.rows.map((r) => (
                                                <Row key={r.name} left={r.name} right={r.what} />
                                            ))}
                                        </RowGroup>
                                    ))}
                                </div>
                            </DocSection>

                            <DocSection id="ai" label="AI features" number={num("ai")}>
                                <p className="mb-2 text-md text-tertiary">
                                    Every AI feature runs as a Netlify Function next to the site — the browser never holds an AI
                                    key or the database's server key. The same functions carry the few writes a client is allowed
                                    to make, because a client's browser deliberately can't write the database directly.
                                </p>
                                <div>
                                    {FUNCTIONS.map((f) => (
                                        <Row key={f.name} left={f.name} right={f.what} />
                                    ))}
                                </div>
                                <Flow
                                    label="Why functions, not the browser"
                                    steps={[
                                        { t: "Browser asks", s: "one narrow request" },
                                        { t: "Function validates", s: "identity + shape, server-side" },
                                        { t: "Does one thing", s: "with keys the browser never sees", accent: true },
                                    ]}
                                />
                            </DocSection>

                            <DocSection id="infra" label="Deploy & infrastructure" number={num("infra")}>
                                <ul className="flex flex-col gap-2 text-md text-tertiary">
                                    <li>
                                        <strong className="text-secondary">Deploys:</strong> pushing the <span className="font-mono text-sm">main</span> branch
                                        on GitHub triggers Netlify to build and publish automatically — nobody deploys by hand.
                                        <span className="font-mono text-sm"> /ship</span> does the whole flow and verifies it's live.
                                    </li>
                                    <li>
                                        <strong className="text-secondary">Database:</strong> Supabase (production project reached via
                                        api.hgmportal.com). Server-side AI features (drafting, brand-kit generation, transcription)
                                        run as Netlify Functions next to the site.
                                    </li>
                                    <li>
                                        <strong className="text-secondary">Domain:</strong> hgmportal.com — DNS managed at GoDaddy.
                                    </li>
                                    <li>
                                        <strong className="text-secondary">Deploy history:</strong> see{" "}
                                        <a href="/deployment" className="font-semibold text-brand-secondary hover:underline">/deployment</a>{" "}
                                        for every deploy and what fixed the failures.
                                    </li>
                                </ul>
                                <Flow
                                    label="A deploy, start to finish (/ship)"
                                    steps={[
                                        { t: "Build", s: "type-check + bundle — fails here, nothing ships" },
                                        { t: "Commit & push", s: "merge to main on GitHub" },
                                        { t: "Netlify builds", s: "triggered by the push, ~1 min" },
                                        { t: "Verify live", s: "the new bundle is confirmed on the domain", accent: true },
                                    ]}
                                />
                            </DocSection>

                            <DocSection
                                id="rules"
                                label="Rules that never break"
                                number={num("rules")}
                                badge={
                                    <Badge color="error" size="sm">
                                        Non-negotiable
                                    </Badge>
                                }
                            >
                                <ol className="flex flex-col gap-2 text-md text-tertiary">
                                    <li>
                                        <strong className="text-secondary">1. Submitted guides are immutable.</strong> Once a client submits/locks
                                        their guide, nothing about it may ever change again — including by the team.
                                    </li>
                                    <li>
                                        <strong className="text-secondary">2. No deploys without saying so.</strong> Nothing goes to production
                                        unless you explicitly ask to ship/deploy.
                                    </li>
                                    <li>
                                        <strong className="text-secondary">3. Supabase is the only store.</strong> Editable content never lives
                                        only in the browser — if it isn't saved to Supabase, it doesn't exist.
                                    </li>
                                    <li>
                                        <strong className="text-secondary">4. Test dashboard first.</strong> Dashboard experiments go to
                                        /hgm-test-dashboard before any real client sees them.
                                    </li>
                                    <li>
                                        <strong className="text-secondary">5. Clients never write documents directly.</strong> A client's edit is
                                        a suggestion until an AM accepts it — and their browser can't write the database at all;
                                        the few client actions there are go through validated server functions.
                                    </li>
                                </ol>
                            </DocSection>
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
};
