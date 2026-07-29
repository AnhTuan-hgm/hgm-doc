import { type ReactNode, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { AlertTriangle, ArrowUpRight, CheckDone01, Code02, GitBranch01, LayersThree01, LayoutAlt01, MagicWand01, Package, Palette } from "@untitledui/icons";
import { AppShell, CollapsedTopBar, IconRail, NavCollapseButton, useNavCollapsed } from "@/components/application/icon-rail";
import { cx } from "@/utils/cx";

/**
 * Component Library Architecture (/webteam/component-library-architecture) —
 * read-only internal reference for how the shared @hiddengem/ui component
 * library is structured, published and consumed by client sites.
 *
 * Native page (no Supabase content): the doc is architecture, not client data,
 * so it lives in code and is versioned with the repo. Linked from the
 * Dashboard › Website › Website Design System tab.
 */

const SECTIONS = [
    { id: "layers", num: "01", label: "The three layers", icon: LayersThree01 },
    { id: "repos", num: "02", label: "Repo map", icon: GitBranch01 },
    { id: "pipeline", num: "03", label: "Publishing pipeline", icon: Package },
    { id: "theming", num: "04", label: "Theming & CSS", icon: Palette },
    { id: "ai", num: "05", label: "AI workflow", icon: MagicWand01 },
    { id: "checklist", num: "06", label: "New client checklist", icon: CheckDone01 },
    { id: "open", num: "07", label: "Open items & cautions", icon: AlertTriangle },
];

/* ── Small shared bits ───────────────────────────────────────────────── */

/** Inline code / file path. */
const Code = ({ children }: { children: ReactNode }) => (
    <code className="rounded-[5px] bg-brand-50 px-1.5 py-px font-mono text-[0.86em] text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">{children}</code>
);

/** Emphasised inline term (the design's bold-on-primary). */
const Term = ({ children }: { children: ReactNode }) => <strong className="font-semibold text-primary">{children}</strong>;

const SectionHeading = ({ num, title }: { num: string; title: string }) => (
    <div className="flex items-baseline gap-3.5">
        <span className="font-mono text-[13px] text-brand-secondary">{num}</span>
        <h2 className="text-2xl font-semibold tracking-tight text-primary">{title}</h2>
    </div>
);

const Card = ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={cx("rounded-xl bg-primary p-5 shadow-xs ring-1 ring-secondary", className)}>{children}</div>
);

const LAYERS = [
    {
        badge: "Layer 1",
        indent: "md:ml-9",
        emphasised: false,
        title: (
            <>
                Untitled UI PRO — <Code>src/foundations/</Code>
            </>
        ),
        body: (
            <>
                Foundation primitives (buttons, inputs, modals, tables) installed as source via the official Untitled UI MCP / CLI. Treated as
                vendored code — never hand-edited.
            </>
        ),
    },
    {
        badge: "Layer 2",
        indent: "md:ml-4.5",
        emphasised: true,
        title: (
            <>
                @hiddengem/ui — <Code>src/components/</Code>
            </>
        ),
        body: (
            <>
                Composed, STR/hospitality-specific components: <Code>PropertyCard</Code>, <Code>Hero</Code>, <Code>BookingWidget</Code>,{" "}
                <Code>ReviewWall</Code>… built from Layer 1. <Term>This is HiddenGem's IP.</Term>
            </>
        ),
    },
    {
        badge: "Layer 3",
        indent: "",
        emphasised: false,
        title: <>Client sites — one repo each</>,
        body: (
            <>
                Consume <Code>@hiddengem/ui@x.y.z</Code> from GitHub Packages. Fully rebranded through a single theme file. Own deployment, env
                vars, and upgrade schedule.
            </>
        ),
    },
];

const REPOS = [
    {
        repo: "hiddengem-ui",
        purpose: "The library",
        facts: (
            <>
                Publishes <Term>@hiddengem/ui</Term> to GitHub Packages. Changesets for versioning; GitHub Action auto-publishes on merge.{" "}
                <Term>.mcp.json</Term> connects the Untitled UI MCP for Claude Code.
            </>
        ),
    },
    {
        repo: "client-starter",
        purpose: "Template",
        facts: (
            <>
                Copied (<Term>degit</Term>) for each new client. Next.js 15 + Tailwind v4, library pre-wired.
            </>
        ),
    },
    {
        repo: "client-<name>",
        purpose: "One per client",
        facts: <>Pinned library version, own deployment, own env vars.</>,
    },
];

const PIPELINE = [
    <>
        Edit or add components in <Code>src/components/</Code> — fetching any new primitives from Untitled UI via MCP into{" "}
        <Code>src/foundations/</Code>.
    </>,
    <>
        Run <Code>npx changeset</Code> — choose <Term>patch</Term> (fix, safe everywhere), <Term>minor</Term> (new component/prop), or{" "}
        <Term>major</Term> (breaking change).
    </>,
    <>
        Merge to <Code>main</Code> → GitHub Action opens a “Version Packages” PR → merging it publishes to GitHub Packages automatically.
    </>,
    <>
        Client sites upgrade deliberately, per client: <Code>npm install @hiddengem/ui@x.y.z</Code> — ideally during retainer cycles.
    </>,
];

const CHECKLIST = [
    <>
        <Code>npx degit hiddengem-media/client-starter client-&lt;name&gt;</Code> → <Code>git init</Code>
    </>,
    <>
        Set <Code>GITHUB_TOKEN</Code> (PAT with <Code>read:packages</Code>) locally <Term>and</Term> in Vercel/Netlify build env —{" "}
        <Code>.npmrc</Code> reads it to install the private package.
    </>,
    <>
        Edit <Code>app/theme.css</Code> (colors, radii) and swap fonts in <Code>app/layout.tsx</Code>.
    </>,
    <>
        Build pages with library components — reference <Code>llms.txt</Code> in Claude Code.
    </>,
    <>Deploy. The client is now pinned to the library version installed at setup.</>,
];

const OPEN_ITEMS = [
    {
        title: "License check",
        body: (
            <>
                Confirm the Untitled UI PRO tier covers keeping their source in a private package consumed across your own client projects.
                Registry access stays restricted; the package is never public.
            </>
        ),
    },
    {
        title: "Adopt UUI's real theme",
        body: (
            <>
                The scaffold's <Code>theme.css</Code> mimics Untitled UI's semantic token pattern but isn't their actual scale. Diff against
                their official Next.js starter kit and adopt their variable names so MCP-fetched components work without edits.
            </>
        ),
    },
    {
        title: "Scope naming",
        body: (
            <>
                The <Code>@hiddengem</Code> npm scope must match the GitHub org name in lowercase — rename across <Code>package.json</Code>,{" "}
                <Code>release.yml</Code>, and both <Code>.npmrc</Code> files if the org differs.
            </>
        ),
    },
    {
        title: "First task in the library",
        body: (
            <>
                Replace the placeholder <Code>Button</Code> / <Code>Badge</Code> foundations with the real Untitled UI versions via the MCP,
                then update imports in <Code>property-card.tsx</Code>.
            </>
        ),
    },
];

/* ── Page ────────────────────────────────────────────────────────────── */

export const ComponentLibraryArchitectureScreen = () => {
    const { collapsed: navCollapsed, toggle: toggleNav } = useNavCollapsed();
    const mainRef = useRef<HTMLElement>(null);
    const [activeSection, setActiveSection] = useState(SECTIONS[0].id);

    const goTo = (id: string) => {
        const el = document.getElementById(`section-${id}`);
        if (!el || !mainRef.current) return;
        mainRef.current.scrollTo({ top: el.offsetTop - 24, behavior: "smooth" });
        setActiveSection(id);
    };

    // Scroll-spy: highlight the section nearest the top of the scroll container.
    useEffect(() => {
        const main = mainRef.current;
        if (!main) return;
        const onScroll = () => {
            let current = SECTIONS[0].id;
            for (const s of SECTIONS) {
                const el = document.getElementById(`section-${s.id}`);
                if (el && el.offsetTop - 120 <= main.scrollTop) current = s.id;
            }
            setActiveSection(current);
        };
        main.addEventListener("scroll", onScroll, { passive: true });
        return () => main.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <AppShell
            className="flex flex-col"
            rail={!navCollapsed && <IconRail activeDept="website" />}
            breadcrumb={[
                { label: "Dashboard", to: "/dashboard", icon: LayoutAlt01 },
                { label: "Website Design System", to: "/dashboard?dept=website&tab=8b5b3fee-b7fe-4ca5-a2eb-c7ef80431b00", icon: Code02 },
                { label: "Component Library Architecture" },
            ]}
        >
            {navCollapsed && <CollapsedTopBar title="Component Library Architecture" onExpand={toggleNav} />}
            <div className="flex min-h-0 flex-1 gap-2 bg-secondary p-2">
                {/* Section nav */}
                {!navCollapsed && (
                    <aside className="hidden h-full w-60 shrink-0 flex-col overflow-hidden rounded-lg bg-primary shadow-sm md:flex">
                        <div className="flex h-[73px] shrink-0 items-center justify-between gap-2 border-b border-secondary px-5">
                            <h2 className="text-md font-semibold text-primary">Architecture</h2>
                            <NavCollapseButton onClick={toggleNav} />
                        </div>
                        <motion.nav
                            className="flex-1 overflow-y-auto px-3 py-4"
                            initial="hidden"
                            animate="show"
                            variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                        >
                            <div className="space-y-1">
                                {SECTIONS.map((s) => (
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
                        </motion.nav>
                        <div className="shrink-0 border-t border-secondary px-5 py-4">
                            <p className="font-mono text-[11px] leading-relaxed text-quaternary">
                                layer 1 vendored → layer 2 owned → layer 3 pinned
                            </p>
                        </div>
                    </aside>
                )}

                {/* Content */}
                <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden rounded-lg bg-primary shadow-sm">
                    <div className="mx-auto flex max-w-[860px] flex-col px-6 py-12 pb-28 md:px-10">
                        {/* Header */}
                        <header className="flex flex-col items-start gap-4 pb-8">
                            <span className="inline-flex items-center gap-2.5 text-xs font-semibold tracking-[0.12em] text-brand-secondary uppercase">
                                <span className="h-0.5 w-7 bg-brand-solid" />
                                HiddenGem Media · Internal architecture
                            </span>
                            <h1 className="max-w-[22ch] text-4xl leading-[1.08] font-semibold tracking-tight text-primary md:text-[44px]">
                                One library. <span className="text-brand-secondary">Every client site.</span> Zero surprise breakage.
                            </h1>
                            <p className="max-w-[60ch] text-lg leading-relaxed text-tertiary text-pretty">
                                How HiddenGem's shared component system works: Untitled UI PRO foundations, composed into vertical-specific
                                components, published privately, and pinned per client — so a library release never ripples into a live site
                                uninvited.
                            </p>

                            <div className="mt-3 flex w-full items-start gap-3.5 rounded-xl bg-brand-50 p-5 ring-1 ring-brand-200 dark:bg-brand-950/40 dark:ring-brand-800">
                                <span className="w-1 shrink-0 self-stretch rounded-full bg-brand-solid" />
                                <div className="flex flex-col gap-1.5">
                                    <strong className="text-md font-semibold text-primary">The decision</strong>
                                    <p className="text-sm leading-relaxed text-secondary text-pretty">
                                        One versioned library published to GitHub Packages. Each client site is its own repo, pinned to a
                                        specific version. Clients only get library updates when deliberately upgraded — giving safety, clean
                                        handoff, and per-client separation of access, billing, and deployments.
                                    </p>
                                </div>
                            </div>
                        </header>

                        {/* 01 — The three layers */}
                        <section id="section-layers" className="border-t border-secondary py-8">
                            <SectionHeading num="01" title="The three layers" />
                            <p className="mt-3.5 max-w-[66ch] leading-relaxed text-tertiary text-pretty">
                                Untitled UI is copy-paste source (shadcn-style), not an npm dependency — so it lives <Term>once</Term>, inside
                                the library repo, and is never installed directly into client repos.
                            </p>
                            <div className="mt-5 grid gap-2.5">
                                {LAYERS.map((l) => (
                                    <div
                                        key={l.badge}
                                        className={cx(
                                            "grid grid-cols-[auto_1fr] items-start gap-4 rounded-xl bg-primary p-5 shadow-xs ring-1",
                                            l.emphasised ? "ring-brand" : "ring-secondary",
                                            l.indent,
                                        )}
                                    >
                                        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
                                            {l.badge}
                                        </span>
                                        <div className="flex flex-col gap-1">
                                            <h3 className="text-md font-semibold text-primary">{l.title}</h3>
                                            <p className="text-sm leading-relaxed text-tertiary text-pretty">{l.body}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="mt-3.5 text-center font-mono text-[12.5px] text-quaternary">
                                ↑ narrow &amp; vendored&nbsp;&nbsp;·&nbsp;&nbsp;↓ wide &amp; client-facing
                            </p>
                        </section>

                        {/* 02 — Repo map */}
                        <section id="section-repos" className="border-t border-secondary py-8">
                            <SectionHeading num="02" title="Repo map" />
                            <div className="mt-5 overflow-x-auto rounded-xl bg-primary shadow-xs ring-1 ring-secondary">
                                <table className="w-full min-w-[600px] border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-secondary">
                                            {["Repo", "Purpose", "Key facts"].map((h) => (
                                                <th
                                                    key={h}
                                                    className="border-b border-secondary px-4 py-2.5 text-left font-mono text-[11.5px] font-medium tracking-[0.1em] text-quaternary uppercase"
                                                >
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {REPOS.map((r, i) => (
                                            <tr key={r.repo} className={i < REPOS.length - 1 ? "border-b border-tertiary" : undefined}>
                                                <td className="px-4 py-3.5 align-top font-mono text-[13.5px] whitespace-nowrap text-primary">
                                                    {r.repo}
                                                </td>
                                                <td className="px-4 py-3.5 align-top text-secondary">{r.purpose}</td>
                                                <td className="px-4 py-3.5 align-top leading-relaxed text-tertiary">{r.facts}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* 03 — Publishing pipeline */}
                        <section id="section-pipeline" className="border-t border-secondary py-8">
                            <SectionHeading num="03" title="Publishing pipeline" />
                            <ol className="mt-5 grid list-none gap-4.5 p-0">
                                {PIPELINE.map((step, i) => (
                                    <li key={i} className="grid grid-cols-[32px_1fr] items-start gap-4">
                                        <span className="grid size-8 place-items-center rounded-lg bg-brand-solid font-mono text-[13px] text-white">
                                            {String(i + 1).padStart(2, "0")}
                                        </span>
                                        <div className="pt-1 leading-relaxed text-tertiary text-pretty">{step}</div>
                                    </li>
                                ))}
                            </ol>
                        </section>

                        {/* 04 — Theming & CSS strategy */}
                        <section id="section-theming" className="border-t border-secondary py-8">
                            <SectionHeading num="04" title="Theming & CSS strategy" />
                            <p className="mt-3.5 max-w-[66ch] leading-relaxed text-tertiary text-pretty">
                                The library ships a <Term>token contract</Term> (<Code>theme.css</Code>) — a brand scale plus semantic variables
                                registered as Tailwind utilities. All code, library <Term>and</Term> client pages, uses semantic utilities only:{" "}
                                <Term>bg-brand-solid, text-fg-primary, border-border-primary, rounded-hg</Term> — never raw palette classes or
                                hex values. Each client overrides the tokens in one file; editing it rethemes the entire site.
                            </p>
                            <p className="mt-3.5 max-w-[66ch] leading-relaxed text-tertiary text-pretty">
                                The library ships <Term>no compiled utility CSS</Term>. Each client app runs Tailwind v4 and generates the CSS
                                itself. The critical wiring, in this exact order:
                            </p>
                            <pre className="mt-4.5 overflow-x-auto rounded-xl bg-secondary p-5 font-mono text-[13.5px] leading-[1.75] text-primary ring-1 ring-secondary">
                                <span className="text-quaternary">{"/* app/globals.css */"}</span>
                                {"\n"}@import <span className="text-brand-secondary">"tailwindcss"</span>;{"\n"}@import{" "}
                                <span className="text-brand-secondary">"@hiddengem/ui/theme.css"</span>;{"   "}
                                <span className="text-quaternary">{"/* token contract + defaults */"}</span>
                                {"\n"}@import <span className="text-brand-secondary">"./theme.css"</span>;{"               "}
                                <span className="text-quaternary">{"/* client brand overrides    */"}</span>
                                {"\n\n"}@source <span className="text-brand-secondary">"../node_modules/@hiddengem/ui"</span>;{"   "}
                                <span className="text-quaternary">{"/* Tailwind scans the library */"}</span>
                            </pre>
                            <div className="mt-4 flex items-baseline gap-3 border-l-[3px] border-brand py-1.5 pl-3.5 text-sm leading-relaxed text-tertiary">
                                <span>
                                    If library components ever render unstyled, the <Code>@source</Code> line or the import order above it is
                                    what's broken.
                                </span>
                            </div>
                        </section>

                        {/* 05 — AI workflow */}
                        <section id="section-ai" className="border-t border-secondary py-8">
                            <SectionHeading num="05" title="AI workflow" />
                            <div className="mt-5 grid gap-3.5 md:grid-cols-2">
                                <Card>
                                    <h3 className="mb-2.5 text-md font-semibold text-primary">In the library repo</h3>
                                    <ul className="grid list-disc gap-2.5 pl-4.5 text-sm leading-relaxed text-tertiary">
                                        <li>
                                            <Code>.mcp.json</Code> gives Claude Code the official Untitled UI MCP (OAuth for PRO access). Ask it
                                            to fetch primitives into <Code>foundations/</Code> instead of hand-writing them.
                                        </li>
                                        <li>
                                            <Code>CLAUDE.md</Code> encodes the repo rules: semantic tokens only, changeset before commit, react
                                            as peer dep.
                                        </li>
                                    </ul>
                                </Card>
                                <Card>
                                    <h3 className="mb-2.5 text-md font-semibold text-primary">In client repos</h3>
                                    <ul className="grid list-disc gap-2.5 pl-4.5 text-sm leading-relaxed text-tertiary">
                                        <li>
                                            Point Claude Code at the library's <Code>llms.txt</Code> — a compact reference of every component's
                                            props and theming rules — so it reuses components instead of reinventing them.
                                        </li>
                                        <li>
                                            Foundation components are React Aria: use <Code>onPress</Code>, not <Code>onClick</Code>.
                                        </li>
                                        <li>
                                            Keep <Code>llms.txt</Code> updated whenever a public API changes.
                                        </li>
                                    </ul>
                                </Card>
                            </div>
                        </section>

                        {/* 06 — New client checklist */}
                        <section id="section-checklist" className="border-t border-secondary py-8">
                            <SectionHeading num="06" title="New client checklist" />
                            <ul className="mt-4 grid list-none gap-3 p-0">
                                {CHECKLIST.map((item, i) => (
                                    <li key={i} className="grid grid-cols-[18px_1fr] gap-3 leading-relaxed text-tertiary">
                                        <span className="font-mono text-brand-secondary">→</span>
                                        <div className="text-pretty">{item}</div>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        {/* 07 — Open items & cautions */}
                        <section id="section-open" className="border-t border-secondary py-8">
                            <SectionHeading num="07" title="Open items & cautions" />
                            <div className="mt-5 grid gap-3.5 md:grid-cols-2">
                                {OPEN_ITEMS.map((o) => (
                                    <Card key={o.title}>
                                        <h3 className="mb-2 text-md font-semibold text-primary">{o.title}</h3>
                                        <p className="text-sm leading-relaxed text-tertiary text-pretty">{o.body}</p>
                                    </Card>
                                ))}
                            </div>
                        </section>

                        {/* Footer */}
                        <footer className="mt-3 flex flex-wrap justify-between gap-4 border-t border-secondary pt-5.5 pb-2 font-mono text-xs text-quaternary">
                            <span>hiddengem-ui · architecture reference</span>
                            <a
                                href="/dashboard?dept=website&tab=8b5b3fee-b7fe-4ca5-a2eb-c7ef80431b00"
                                className="inline-flex items-center gap-1 text-brand-secondary hover:underline"
                            >
                                Website Design System
                                <ArrowUpRight className="size-3.5" aria-hidden="true" />
                            </a>
                        </footer>
                    </div>
                </main>
            </div>
        </AppShell>
    );
};

export default ComponentLibraryArchitectureScreen;
