import { type ReactNode, useEffect, useRef, useState } from "react";
import {
    AlertTriangle,
    ArrowUpRight,
    CheckDone01,
    Code02,
    Figma,
    GitBranch01,
    LayersThree01,
    LayoutAlt01,
    MagicWand01,
    Package,
    Palette,
    PuzzlePiece01,
    Route,
} from "@untitledui/icons";
import { motion } from "motion/react";
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
    { id: "loop", num: "06", label: "Design → code loop", icon: Figma },
    { id: "variants", num: "07", label: "Variant strategy", icon: PuzzlePiece01 },
    { id: "buildorder", num: "08", label: "Build order", icon: Route },
    { id: "checklist", num: "09", label: "New client checklist", icon: CheckDone01 },
    { id: "open", num: "10", label: "Open items & cautions", icon: AlertTriangle },
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
                Foundation primitives (buttons, inputs, modals, tables) installed as source via the official Untitled UI MCP / CLI. Treated as vendored code —
                never hand-edited.
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
                Composed, STR/hospitality-specific components: <Code>PropertyCard</Code>, <Code>Hero</Code>, <Code>BookingWidget</Code>, <Code>ReviewWall</Code>
                … built from Layer 1. <Term>This is HiddenGem's IP.</Term>
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
                Consume <Code>@hiddengem/ui@x.y.z</Code> from GitHub Packages. Fully rebranded through a single theme file. Own deployment, env vars, and
                upgrade schedule.
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
                A workspace monorepo publishing <Term>@hiddengem/ui</Term>, <Term>core</Term>, and the <Term>pms-*</Term> / <Term>pay-*</Term> adapters (§07) to
                GitHub Packages. Changesets versions each package independently, so a PMS API change is a patch to one adapter and no UI release. GitHub Action
                auto-publishes on merge; <Term>.mcp.json</Term> connects the Untitled UI MCP for Claude Code.
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
        Edit or add components in <Code>src/components/</Code> — fetching any new primitives from Untitled UI via MCP into <Code>src/foundations/</Code>.
    </>,
    <>
        Run <Code>npx changeset</Code> — choose <Term>patch</Term> (fix, safe everywhere), <Term>minor</Term> (new component/prop), or <Term>major</Term>{" "}
        (breaking change).
    </>,
    <>
        Merge to <Code>main</Code> → GitHub Action opens a “Version Packages” PR → merging it publishes to GitHub Packages automatically.
    </>,
    <>
        Client sites upgrade deliberately, per client: <Code>npm install @hiddengem/ui@x.y.z</Code> — ideally during retainer cycles.
    </>,
];

/* ── 06 — Design → code loop ─────────────────────────────────────────── */

const OWNERSHIP = [
    {
        title: "Figma owns",
        items: [
            <>
                <Term>Variables</Term> — the token contract. Names match <Code>theme.css</Code> one-for-one.
            </>,
            <>
                <Term>Specs</Term> — every variant and state (default / hover / disabled / loading) as a real variant property.
            </>,
            <>
                <Term>Layout intent</Term> — what a section looks like, its spacing rhythm, its responsive shape.
            </>,
        ],
    },
    {
        title: "Code owns",
        items: [
            <>
                <Term>The props API</Term> — a public contract. Pinned clients break on a rename, so this is code's call, not a design decision.
            </>,
            <>
                <Term>Behaviour &amp; accessibility</Term> — React Aria semantics, focus order, keyboard handling.
            </>,
            <>
                <Term>Implementation</Term> — how the spec is achieved. Figma never dictates the markup.
            </>,
        ],
    },
];

const LOOP = [
    <>
        <Term>One Figma file</Term>, published as a Team Library. Variables live in collections with light/dark modes and mirror the semantic tokens exactly —{" "}
        <Code>brand-solid</Code>, <Code>fg-primary</Code>, <Code>border-primary</Code>. Any Figma variable without a matching CSS token is where the loop leaks
        and someone hand-codes a hex.
    </>,
    <>
        Design or revise the component in Figma. Model each state as a <Term>variant property</Term> — those become the component's props verbatim, so a sloppy
        variant set becomes a sloppy API.
    </>,
    <>
        Generate into a <Term>branch</Term> of <Code>hiddengem-ui</Code> using Claude Design / Claude Code over the Figma MCP. New component → generate.
        Existing component → <Term>patch it</Term>, never regenerate: regeneration silently rewrites a props API that live client sites depend on.
    </>,
    <>
        Add a <Code>*.figma.tsx</Code> <Term>Code Connect</Term> mapping for every shipped component. This is the step that pays for itself — after it, pulling
        any Figma screen returns <Code>&lt;PropertyCard variant="featured" /&gt;</Code> instead of a tree of divs, so client pages get <Term>assembled</Term>{" "}
        rather than rebuilt.
    </>,
    <>
        Changeset → PR → merge → publish (§03). Regenerate <Code>llms.txt</Code> in the same release so Claude Code in client repos never reads a stale API.
    </>,
];

/* ── 07 — Variant strategy ───────────────────────────────────────────── */

const PACKAGES = [
    {
        pkg: "@hiddengem/core",
        role: (
            <>
                Domain types (<Code>Listing</Code>, <Code>DayRate</Code>, <Code>Quote</Code>, <Code>Reservation</Code>), the provider interfaces, and the
                capability flags. Zero dependencies.
            </>
        ),
    },
    {
        pkg: "@hiddengem/ui",
        role: (
            <>
                Presentation only — <Term>zero network calls</Term>. Receives a provider, renders from its capabilities.
            </>
        ),
    },
    {
        pkg: "pms-hostaway · pms-guesty · pms-hospitable",
        role: (
            <>
                One thin adapter each, mapping that PMS onto the core interface. <Term>Server-side only.</Term>
            </>
        ),
    },
    {
        pkg: "pay-stripe · pay-…",
        role: <>The same shape for checkout, so the payment gateway swaps on identical terms.</>,
    },
];

const VARIANT_RULES = [
    {
        title: "Two adapters before you trust the interface",
        body: (
            <>
                Build Hostaway, then <Term>immediately</Term> Guesty. The second adapter is what exposes a wrong abstraction — and discovering it after five
                clients have shipped is the expensive version of this project.
            </>
        ),
    },
    {
        title: "Keys never reach the browser",
        body: (
            <>
                Adapters run in route handlers / edge functions, reading server env vars. No PMS or gateway secret is ever imported into a client component or
                lands in the browser bundle.
            </>
        ),
    },
];

/* ── 08 — Build order ────────────────────────────────────────────────── */

const PHASES = [
    {
        num: "00",
        title: "Freeze the contracts",
        body: (
            <>
                Before a single component: lock the two name-based contracts that are painful to change later — the <Term>token names</Term> (Figma variables ≡{" "}
                <Code>theme.css</Code>, adopted from Untitled UI's real scale, not an approximation) and the <Term>core domain types</Term>. Nothing renders in
                this phase, and that is the point.
            </>
        ),
        done: (
            <>
                <Code>theme.css</Code> is diffed against the official UUI starter and <Code>@hiddengem/core</Code> types are committed.
            </>
        ),
    },
    {
        num: "01",
        title: "The Figma design-system file",
        body: (
            <>
                One file, published as a Team Library. Scope the component set by <Term>auditing two live client sites</Term> and listing the sections that
                actually exist — not a speculative sixty-component kit that ages before anyone imports it.
            </>
        ),
        done: <>Library is published and every Figma variable resolves to a matching semantic token.</>,
    },
    {
        num: "02",
        title: "Library skeleton + one vertical slice",
        body: (
            <>
                Workspace monorepo, Changesets, release action. Then build <Term>one page end to end</Term> rather than a pile of loose components: property
                detail → <Code>Hero</Code>, <Code>Gallery</Code>, <Code>PropertyCard</Code>, <Code>BookingWidget</Code>, <Code>ReviewWall</Code>. Code Connect
                those five.
            </>
        ),
        done: (
            <>
                <Code>@hiddengem/ui@0.1.0</Code> is published and a scratch app renders that page using nothing but the library.
            </>
        ),
    },
    {
        num: "03",
        title: "Adapters — twice",
        body: (
            <>
                The <Code>@hiddengem/core</Code> interfaces, then <Code>pms-hostaway</Code> (wherever most clients already are), then <Code>pms-guesty</Code>{" "}
                straight after it. Capability flags get their real test here, not in review.
            </>
        ),
        done: (
            <>
                The same <Code>BookingWidget</Code> runs against both, and switching is one line in <Code>providers.ts</Code>.
            </>
        ),
    },
    {
        num: "04",
        title: "Starter + one real client",
        body: (
            <>
                Fill out <Code>client-starter</Code> (theme, providers stub, <Code>.npmrc</Code>, <Code>llms.txt</Code>), then put the next new client on it —
                or migrate one existing site — and <Term>time it</Term>. That number is the template's ROI and the argument for everything above.
            </>
        ),
        done: <>Client is live, and each deviation is logged as either “needs a library prop” or “genuinely bespoke”.</>,
    },
    {
        num: "05",
        title: "Steady state",
        body: (
            <>
                Upgrades ride retainer cycles. <Code>llms.txt</Code> regenerates on every release. A quarterly drift audit diffs Figma variables against{" "}
                <Code>theme.css</Code>. The third adapter (Hospitable) waits until a client actually needs it.
            </>
        ),
        done: <>Recurring, not a milestone — the audit is on the calendar and the upgrade step is in the retainer checklist.</>,
    },
];

const GOLDEN_RULES = [
    "Props are a public API — a rename is a major version.",
    "UI never knows the vendor's name; it branches on capabilities.",
    "Figma owns tokens and specs. Code owns props and behaviour.",
    "Never regenerate an existing component — patch it.",
    "Two adapters before the interface is trustworthy.",
    "Secrets stay server-side, always.",
];

const CHECKLIST = [
    <>
        <Code>npx degit hiddengem-media/client-starter client-&lt;name&gt;</Code> → <Code>git init</Code>
    </>,
    <>
        Set <Code>GITHUB_TOKEN</Code> (PAT with <Code>read:packages</Code>) locally <Term>and</Term> in Vercel/Netlify build env — <Code>.npmrc</Code> reads it
        to install the private package.
    </>,
    <>
        Edit <Code>app/theme.css</Code> (colors, radii) and swap fonts in <Code>app/layout.tsx</Code>.
    </>,
    <>
        Wire the client's PMS and gateway in <Code>lib/providers.ts</Code> — the one file that names a vendor (§07) — and set their keys as{" "}
        <Term>server-side</Term> env vars.
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
                Confirm the Untitled UI PRO tier covers keeping their source in a private package consumed across your own client projects. Registry access
                stays restricted; the package is never public.
            </>
        ),
    },
    {
        title: "Adopt UUI's real theme",
        body: (
            <>
                The scaffold's <Code>theme.css</Code> mimics Untitled UI's semantic token pattern but isn't their actual scale. Diff against their official
                Next.js starter kit and adopt their variable names so MCP-fetched components work without edits.
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
                Replace the placeholder <Code>Button</Code> / <Code>Badge</Code> foundations with the real Untitled UI versions via the MCP, then update imports
                in <Code>property-card.tsx</Code>.
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
                            <p className="font-mono text-[11px] leading-relaxed text-quaternary">layer 1 vendored → layer 2 owned → layer 3 pinned</p>
                        </div>
                    </aside>
                )}

                {/* Content */}
                <main ref={mainRef} className="flex-1 overflow-x-hidden overflow-y-auto rounded-lg bg-primary shadow-sm">
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
                            <p className="max-w-[60ch] text-lg leading-relaxed text-pretty text-tertiary">
                                How HiddenGem's shared component system works: Untitled UI PRO foundations, composed into vertical-specific components,
                                published privately, and pinned per client — so a library release never ripples into a live site uninvited. Sections 06–08 cover
                                how it's actually operated: the Figma → code loop, how a client's PMS and payment gateway swap without forking the template, and
                                the order to build it in.
                            </p>

                            <div className="mt-3 flex w-full items-start gap-3.5 rounded-xl bg-brand-50 p-5 ring-1 ring-brand-200 dark:bg-brand-950/40 dark:ring-brand-800">
                                <span className="w-1 shrink-0 self-stretch rounded-full bg-brand-solid" />
                                <div className="flex flex-col gap-1.5">
                                    <strong className="text-md font-semibold text-primary">The decision</strong>
                                    <p className="text-sm leading-relaxed text-pretty text-secondary">
                                        One versioned library published to GitHub Packages. Each client site is its own repo, pinned to a specific version.
                                        Clients only get library updates when deliberately upgraded — giving safety, clean handoff, and per-client separation of
                                        access, billing, and deployments.
                                    </p>
                                </div>
                            </div>
                        </header>

                        {/* 01 — The three layers */}
                        <section id="section-layers" className="border-t border-secondary py-8">
                            <SectionHeading num="01" title="The three layers" />
                            <p className="mt-3.5 max-w-[66ch] leading-relaxed text-pretty text-tertiary">
                                Untitled UI is copy-paste source (shadcn-style), not an npm dependency — so it lives <Term>once</Term>, inside the library repo,
                                and is never installed directly into client repos.
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
                                            <p className="text-sm leading-relaxed text-pretty text-tertiary">{l.body}</p>
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
                                                <td className="px-4 py-3.5 align-top font-mono text-[13.5px] whitespace-nowrap text-primary">{r.repo}</td>
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
                                        <div className="pt-1 leading-relaxed text-pretty text-tertiary">{step}</div>
                                    </li>
                                ))}
                            </ol>
                        </section>

                        {/* 04 — Theming & CSS strategy */}
                        <section id="section-theming" className="border-t border-secondary py-8">
                            <SectionHeading num="04" title="Theming & CSS strategy" />
                            <p className="mt-3.5 max-w-[66ch] leading-relaxed text-pretty text-tertiary">
                                The library ships a <Term>token contract</Term> (<Code>theme.css</Code>) — a brand scale plus semantic variables registered as
                                Tailwind utilities. All code, library <Term>and</Term> client pages, uses semantic utilities only:{" "}
                                <Term>bg-brand-solid, text-fg-primary, border-border-primary, rounded-hg</Term> — never raw palette classes or hex values. Each
                                client overrides the tokens in one file; editing it rethemes the entire site.
                            </p>
                            <p className="mt-3.5 max-w-[66ch] leading-relaxed text-pretty text-tertiary">
                                The library ships <Term>no compiled utility CSS</Term>. Each client app runs Tailwind v4 and generates the CSS itself. The
                                critical wiring, in this exact order:
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
                                    If library components ever render unstyled, the <Code>@source</Code> line or the import order above it is what's broken.
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
                                            <Code>.mcp.json</Code> gives Claude Code the official Untitled UI MCP (OAuth for PRO access). Ask it to fetch
                                            primitives into <Code>foundations/</Code> instead of hand-writing them.
                                        </li>
                                        <li>
                                            <Code>CLAUDE.md</Code> encodes the repo rules: semantic tokens only, changeset before commit, react as peer dep.
                                        </li>
                                    </ul>
                                </Card>
                                <Card>
                                    <h3 className="mb-2.5 text-md font-semibold text-primary">In client repos</h3>
                                    <ul className="grid list-disc gap-2.5 pl-4.5 text-sm leading-relaxed text-tertiary">
                                        <li>
                                            Point Claude Code at the library's <Code>llms.txt</Code> — a compact reference of every component's props and
                                            theming rules — so it reuses components instead of reinventing them.
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

                        {/* 06 — Design → code loop */}
                        <section id="section-loop" className="border-t border-secondary py-8">
                            <SectionHeading num="06" title="Design → code loop" />
                            <p className="mt-3.5 max-w-[66ch] leading-relaxed text-pretty text-tertiary">
                                Figma and the library are both sources of truth — but not of the same things. Getting that boundary wrong is what turns one
                                design system into two systems that drift.
                            </p>
                            <div className="mt-5 grid gap-3.5 md:grid-cols-2">
                                {OWNERSHIP.map((o) => (
                                    <Card key={o.title}>
                                        <h3 className="mb-2.5 text-md font-semibold text-primary">{o.title}</h3>
                                        <ul className="grid list-disc gap-2.5 pl-4.5 text-sm leading-relaxed text-tertiary">
                                            {o.items.map((item, i) => (
                                                <li key={i} className="text-pretty">
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </Card>
                                ))}
                            </div>
                            <ol className="mt-6 grid list-none gap-4.5 p-0">
                                {LOOP.map((step, i) => (
                                    <li key={i} className="grid grid-cols-[32px_1fr] items-start gap-4">
                                        <span className="grid size-8 place-items-center rounded-lg bg-brand-solid font-mono text-[13px] text-white">
                                            {String(i + 1).padStart(2, "0")}
                                        </span>
                                        <div className="pt-1 leading-relaxed text-pretty text-tertiary">{step}</div>
                                    </li>
                                ))}
                            </ol>
                            <div className="mt-5 flex items-baseline gap-3 border-l-[3px] border-brand py-1.5 pl-3.5 text-sm leading-relaxed text-tertiary">
                                <span>
                                    Figma → code is <Term>generation, not sync</Term>. Nothing writes code back into Figma, and nothing overwrites production
                                    code from Figma. A design change is a request that a human reviews in a PR.
                                </span>
                            </div>
                        </section>

                        {/* 07 — Variant strategy */}
                        <section id="section-variants" className="border-t border-secondary py-8">
                            <SectionHeading num="07" title="Variant strategy — PMS & payments" />
                            <p className="mt-3.5 max-w-[66ch] leading-relaxed text-pretty text-tertiary">
                                One template for every client only survives the second client if the things that differ per client are <Term>declared</Term>{" "}
                                rather than forked. PMS and payment gateway are the two big ones — so they live behind interfaces, and the rule that makes it
                                work is blunt: <Term>UI components never know which vendor they're talking to.</Term>
                            </p>
                            <div className="mt-5 overflow-x-auto rounded-xl bg-primary shadow-xs ring-1 ring-secondary">
                                <table className="w-full min-w-[600px] border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-secondary">
                                            {["Package", "Role"].map((h) => (
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
                                        {PACKAGES.map((p, i) => (
                                            <tr key={p.pkg} className={i < PACKAGES.length - 1 ? "border-b border-tertiary" : undefined}>
                                                <td className="px-4 py-3.5 align-top font-mono text-[13px] text-primary">{p.pkg}</td>
                                                <td className="px-4 py-3.5 align-top leading-relaxed text-tertiary">{p.role}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <pre className="mt-4.5 overflow-x-auto rounded-xl bg-secondary p-5 font-mono text-[13.5px] leading-[1.75] text-primary ring-1 ring-secondary">
                                <span className="text-quaternary">{"/* client-<name>/lib/providers.ts — the only file that names a vendor */"}</span>
                                {"\n"}import {"{ hostaway }"} from <span className="text-brand-secondary">"@hiddengem/pms-hostaway"</span>;{"\n"}
                                import {"{ stripe }"} from <span className="text-brand-secondary">"@hiddengem/pay-stripe"</span>;{"\n\n"}
                                export const pms = hostaway({"{ accountId: env.HOSTAWAY_ACCOUNT, apiKey: env.HOSTAWAY_KEY }"});{"\n"}
                                export const pay = stripe({"{ secretKey: env.STRIPE_SECRET }"});
                            </pre>
                            <p className="mt-4 max-w-[66ch] leading-relaxed text-pretty text-tertiary">
                                Moving that client to Guesty is an edit to this file and nothing else — no page, no component, no template fork.
                            </p>
                            <p className="mt-3.5 max-w-[66ch] leading-relaxed text-pretty text-tertiary">
                                The catch worth planning for: Hostaway, Guesty and Hospitable don't only differ in API shape, they differ in{" "}
                                <Term>what they can do</Term> — direct-booking quotes, instant book, hosted checkout. An interface reduced to their common
                                denominator would be useless. So each adapter declares its capabilities and the UI branches on those:
                            </p>
                            <pre className="mt-4.5 overflow-x-auto rounded-xl bg-secondary p-5 font-mono text-[13.5px] leading-[1.75] text-primary ring-1 ring-secondary">
                                {"if (pms.capabilities.quote)   "}
                                <span className="text-quaternary">{"// → live price breakdown"}</span>
                                {"\n"}
                                {"else                          "}
                                <span className="text-quaternary">{'// → "Request a quote" form'}</span>
                                {"\n\n"}
                                <span className="text-quaternary">{'// never: if (pms.name === "hostaway")'}</span>
                            </pre>
                            <p className="mt-4 max-w-[66ch] leading-relaxed text-pretty text-tertiary">
                                Adapters may still expose vendor-specific extras under <Code>pms.raw</Code> for a client repo to reach into — but library UI
                                never touches it. That keeps the escape hatch from quietly becoming the architecture.
                            </p>
                            <div className="mt-5 grid gap-3.5 md:grid-cols-2">
                                {VARIANT_RULES.map((r) => (
                                    <Card key={r.title} className="ring-brand">
                                        <h3 className="mb-2 text-md font-semibold text-primary">{r.title}</h3>
                                        <p className="text-sm leading-relaxed text-pretty text-tertiary">{r.body}</p>
                                    </Card>
                                ))}
                            </div>
                        </section>

                        {/* 08 — Build order */}
                        <section id="section-buildorder" className="border-t border-secondary py-8">
                            <SectionHeading num="08" title="Build order" />
                            <p className="mt-3.5 max-w-[66ch] leading-relaxed text-pretty text-tertiary">
                                Sequenced so the expensive mistakes are impossible rather than merely discouraged. Each phase has an exit condition — if it
                                isn't met, the next phase makes things worse, not better.
                            </p>
                            <div className="mt-5 grid gap-2.5">
                                {PHASES.map((p) => (
                                    <div key={p.num} className="rounded-xl bg-primary p-5 shadow-xs ring-1 ring-secondary">
                                        <div className="flex items-baseline gap-3.5">
                                            <span className="font-mono text-[13px] text-brand-secondary">{p.num}</span>
                                            <h3 className="text-md font-semibold text-primary">{p.title}</h3>
                                        </div>
                                        <p className="mt-2 text-sm leading-relaxed text-pretty text-tertiary">{p.body}</p>
                                        <p className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-tertiary pt-3 text-sm leading-relaxed text-tertiary">
                                            <span className="font-mono text-[11.5px] tracking-[0.1em] text-quaternary uppercase">Done when</span>
                                            <span className="text-pretty">{p.done}</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 rounded-xl bg-brand-50 p-5 ring-1 ring-brand-200 dark:bg-brand-950/40 dark:ring-brand-800">
                                <strong className="text-md font-semibold text-primary">The rules that keep it from rotting</strong>
                                <ul className="mt-2.5 grid gap-2 sm:grid-cols-2">
                                    {GOLDEN_RULES.map((rule) => (
                                        <li key={rule} className="grid grid-cols-[14px_1fr] gap-2.5 text-sm leading-relaxed text-secondary">
                                            <span className="font-mono text-brand-secondary">→</span>
                                            <span className="text-pretty">{rule}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        {/* 09 — New client checklist */}
                        <section id="section-checklist" className="border-t border-secondary py-8">
                            <SectionHeading num="09" title="New client checklist" />
                            <ul className="mt-4 grid list-none gap-3 p-0">
                                {CHECKLIST.map((item, i) => (
                                    <li key={i} className="grid grid-cols-[18px_1fr] gap-3 leading-relaxed text-tertiary">
                                        <span className="font-mono text-brand-secondary">→</span>
                                        <div className="text-pretty">{item}</div>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        {/* 10 — Open items & cautions */}
                        <section id="section-open" className="border-t border-secondary py-8">
                            <SectionHeading num="10" title="Open items & cautions" />
                            <div className="mt-5 grid gap-3.5 md:grid-cols-2">
                                {OPEN_ITEMS.map((o) => (
                                    <Card key={o.title}>
                                        <h3 className="mb-2 text-md font-semibold text-primary">{o.title}</h3>
                                        <p className="text-sm leading-relaxed text-pretty text-tertiary">{o.body}</p>
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
