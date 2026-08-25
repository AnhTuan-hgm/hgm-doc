import { BookOpen01, ChevronDown, LayoutAlt01 } from "@untitledui/icons";

import { AppShell, CollapsedTopBar, IconRail, useNavCollapsed } from "@/components/application/icon-rail";
import { Badge } from "@/components/base/badges/badges";
import { DocRail, DocSection } from "@/pages/client/dashboard/master-brand-fields";

/**
 * The site's own manual — every custom command, every page, and the rules that keep the
 * portal safe to work on. A static page on purpose: it documents the codebase, so it
 * changes only when the codebase does. Keep it current when routes or skills change.
 */

const SECTIONS = [
    { id: "about", label: "The site in one minute" },
    { id: "commands", label: "Custom commands" },
    { id: "client-pages", label: "Client pages" },
    { id: "links", label: "All links" },
    { id: "editing", label: "Editing & saving" },
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
            { to: "/wiki", what: "This page — the site's manual" },
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

export const WikiScreen = () => {
    const { collapsed: navCollapsed, toggle: toggleNav } = useNavCollapsed();

    return (
        <AppShell
            className="flex flex-col"
            rail={!navCollapsed && <IconRail activeDept="docs" />}
            breadcrumb={[
                { label: "Dashboard", to: "/dashboard", icon: LayoutAlt01 },
                { label: "Wiki", icon: BookOpen01 },
            ]}
        >
            {navCollapsed && <CollapsedTopBar title="Wiki" onExpand={toggleNav} />}

            <div className="min-h-0 flex-1 overflow-y-auto bg-secondary p-2">
                <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
                    <header>
                        <h1 className="text-display-xs font-semibold text-primary">Wiki</h1>
                        <p className="mt-2 max-w-2xl text-sm text-tertiary text-pretty">
                            Everything you need to know about this website in one place — the custom commands, every page and
                            where it lives, how editing and deploys work, and the rules that never break.
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
                                        If someone else saved the same dashboard while your tab was open, Save blocks once and
                                        tells you instead of silently overwriting their afternoon — a second press overwrites
                                        deliberately.
                                    </li>
                                    <li>
                                        Image uploads are compressed automatically (WebP, max 1600px) so the database stays fast.
                                        Custom fonts on Brand Kit are capped at 1.5MB — use .woff2 files.
                                    </li>
                                    <li>
                                        "Draft from…" buttons (Overview, Master Brand, Brand Kit) fill <em>empty</em> fields only —
                                        a draft never changes or erases something a person wrote.
                                    </li>
                                </ul>
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
                                </ol>
                            </DocSection>
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
};
