import { useEffect, useState, type FC } from "react";
import { useNavigate } from "react-router";
import { animate, motion } from "motion/react";
import { ArrowUpRight, Award01, Diamond01, Globe01, HelpCircle, Home02, Plus, Rocket02, Star01, Trophy01, UserCheck01, UserMinus01, Users01 } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { AppShell, CollapsedTopBar, HeaderAvatar, IconRail, RailBottom, useNavCollapsed } from "@/components/application/icon-rail";
import { ONBOARDING_PHASES, TeamGate } from "@/pages/dashboard-screen";
import { useAuthUser } from "@/hooks/use-auth-user";
import { supabase, type ClientRecord } from "@/lib/supabase";
import { teamPhoto } from "@/utils/team-photos";
import { cx } from "@/utils/cx";

/**
 * /home — "Mission Control": the team's landing view. The whole company at a
 * glance, computed live from the Client List table (`clients`) so it can never
 * drift from the dashboard: KPI counts by status, the onboarding pipeline
 * across Phases 0–5, clients by tier, load per Account Manager, and which
 * website projects the Web Team has in flight. Team-gated (same gate + unlock
 * flag as /dashboard). Opened from the HOME icon at the top of the icon rail.
 */

/* ── Data helpers ────────────────────────────────────────────────── */

/** Lifecycle bucket — anything unset/unknown counts as an existing client. */
const statusOf = (c: ClientRecord): "existing" | "onboarding" | "offboarding" =>
    c.status === "onboarding" || c.status === "offboarding" ? c.status : "existing";

/** Tier rows — ids/labels/icons match the Client List sidebar (dashboard-screen.tsx TIERS). */
const TIER_META: { id: string; label: string; icon: FC<{ className?: string }> }[] = [
    { id: "tier-0", label: "Tier 0", icon: Trophy01 },
    { id: "tier-1", label: "Tier 1", icon: Award01 },
    { id: "tier-2", label: "Tier 2", icon: Star01 },
    { id: "mastermind", label: "Mastermind", icon: Diamond01 },
];

/** Log pages whose open questions feed the header chip (same set as /questions). */
const QUESTION_SLUGS = [
    "roadmap",
    "welcome-email-flow-overview",
    "client-dashboard-overview",
    "chat-widget-overview",
    "owner-guide-overview",
    "homepage-overview",
];

const initialsOf = (name: string) =>
    name
        .split(" ")
        .map((w) => w[0]?.toUpperCase() ?? "")
        .slice(0, 2)
        .join("");

/* ── Small pieces ────────────────────────────────────────────────── */

/** Animated integer — counts up on mount/refresh (kept subtle and fast). */
const CountUp = ({ value }: { value: number }) => {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        const controls = animate(0, value, { duration: 0.8, ease: "easeOut", onUpdate: (v) => setDisplay(Math.round(v)) });
        return () => controls.stop();
    }, [value]);
    return <>{display}</>;
};

const KPI_TINTS = {
    brand: "bg-brand-secondary text-fg-brand-primary",
    success: "bg-success-secondary text-fg-success-primary",
    warning: "bg-warning-secondary text-fg-warning-primary",
    error: "bg-error-secondary text-fg-error-secondary",
};

const StatTile = ({
    label,
    value,
    icon: Icon,
    tint,
    index,
    onClick,
}: {
    label: string;
    value: number;
    icon: FC<{ className?: string }>;
    tint: keyof typeof KPI_TINTS;
    index: number;
    onClick: () => void;
}) => (
    <motion.button
        type="button"
        onClick={onClick}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ y: -3 }}
        className="flex flex-col gap-3 rounded-2xl bg-primary p-5 text-left ring-1 ring-secondary transition duration-100 ease-linear hover:shadow-md"
    >
        <span className="flex items-center gap-2.5">
            <span className={cx("flex size-8 items-center justify-center rounded-lg", KPI_TINTS[tint])}>
                <Icon className="size-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-medium text-tertiary">{label}</span>
        </span>
        <span className="text-display-sm font-semibold text-primary tabular-nums">
            <CountUp value={value} />
        </span>
    </motion.button>
);

/** Shared panel shell for the bottom trio. */
const Panel = ({
    title,
    icon: Icon,
    actionLabel,
    onAction,
    index,
    children,
}: {
    title: string;
    icon: FC<{ className?: string }>;
    actionLabel?: string;
    onAction?: () => void;
    index: number;
    children: React.ReactNode;
}) => (
    <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 + index * 0.05 }}
        className="flex min-h-[220px] flex-col rounded-2xl bg-primary p-5 ring-1 ring-secondary"
    >
        <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Icon className="size-4 text-fg-quaternary" aria-hidden="true" />
                {title}
            </h2>
            {actionLabel && onAction && (
                <button
                    type="button"
                    onClick={onAction}
                    className="flex items-center gap-1 text-xs font-semibold text-brand-secondary transition duration-100 ease-linear hover:underline"
                >
                    {actionLabel}
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </button>
            )}
        </div>
        <div className="mt-4 flex flex-1 flex-col">{children}</div>
    </motion.section>
);

/** Thin proportion bar used in the Tier / AM panels. */
const MiniBar = ({ pct }: { pct: number }) => (
    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-quaternary">
        <motion.div
            className="h-full rounded-full bg-brand-solid"
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(pct, 0)}%` }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
        />
    </div>
);

/* ── Page ────────────────────────────────────────────────────────── */

const HomeContent = () => {
    const navigate = useNavigate();
    const { user } = useAuthUser();
    const { collapsed: navCollapsed, toggle: toggleNav } = useNavCollapsed();
    const [clients, setClients] = useState<ClientRecord[] | null>(null);
    const [openQuestions, setOpenQuestions] = useState<number | null>(null);
    const [rosterCount, setRosterCount] = useState<number | null>(null);

    useEffect(() => {
        supabase
            .from("clients")
            .select("*")
            .then(({ data, error }) => {
                if (!error && data) setClients(data as ClientRecord[]);
                else setClients([]);
            });

        // One query feeds both the open-questions chip and the roster size
        // (the 47-client list recorded on /homepage-overview).
        supabase
            .from("sop_pages")
            .select("slug, data")
            .in("slug", QUESTION_SLUGS)
            .then(({ data, error }) => {
                if (error || !data) return;
                type QA = { answer?: string; resolved?: boolean };
                let open = 0;
                for (const row of data) {
                    const qs = (row.data?.questions ?? []) as QA[];
                    open += qs.filter((q) => !(q.resolved ?? !!(q.answer || "").trim())).length;
                    if (row.slug === "homepage-overview" && Array.isArray(row.data?.clients)) {
                        setRosterCount(row.data.clients.length);
                    }
                }
                setOpenQuestions(open);
            });
    }, []);

    /* Derived stats — everything computes from the Client List rows. */
    const list = clients ?? [];
    const total = list.length;
    const existing = list.filter((c) => statusOf(c) === "existing").length;
    const onboarding = list.filter((c) => statusOf(c) === "onboarding").length;
    const offboarding = list.filter((c) => statusOf(c) === "offboarding").length;

    // Onboarding clients with no phase filed land in Phase 0 (Signing On).
    const phaseClients = (n: number) => list.filter((c) => statusOf(c) === "onboarding" && (c.onboarding_phase ?? 0) === n);

    const tierCounts = TIER_META.map((t) => ({ ...t, count: list.filter((c) => c.tier === t.id).length }));
    const maxTier = Math.max(1, ...tierCounts.map((t) => t.count));

    const amMap = new Map<string, number>();
    for (const c of list) {
        const am = (c.am ?? "").trim() || "Unassigned";
        amMap.set(am, (amMap.get(am) ?? 0) + 1);
    }
    const amRows = [...amMap.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => (a.name === "Unassigned" ? 1 : b.name === "Unassigned" ? -1 : b.count - a.count));
    const maxAm = Math.max(1, ...amRows.map((r) => r.count));

    const webRows = list.filter((c) => (c.web_project ?? "").trim());

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    const firstName = user?.name?.split(" ")[0];
    const dateStr = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

    const goClients = () => navigate("/dashboard?dept=clients");

    return (
        <AppShell
            className="flex flex-col"
            rail={!navCollapsed && <IconRail activeDept="home" bottom={<RailBottom editing={false} onToggleEditing={() => {}} />} />}
            breadcrumb={[{ label: "Home", icon: Home02 }]}
            headerRight={<HeaderAvatar />}
        >
            {navCollapsed && <CollapsedTopBar title="Home" onExpand={toggleNav} />}
            <div className="flex min-h-0 flex-1 bg-secondary p-2">
                <main className="flex-1 overflow-y-auto rounded-lg bg-primary shadow-sm">
                    <div className="mx-auto flex max-w-[1400px] flex-col gap-8 px-6 py-8 md:px-10">
                        {/* Greeting + quick actions */}
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium text-tertiary">{dateStr}</p>
                                <h1 className="mt-1 text-display-xs font-semibold text-primary md:text-display-sm">
                                    {greeting}
                                    {firstName ? `, ${firstName}` : ""} 👋
                                </h1>
                                <p className="mt-1.5 text-md text-tertiary">Here's Hidden Gem Media at a glance.</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                {openQuestions != null && openQuestions > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => navigate("/questions")}
                                        className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-2 text-xs font-semibold text-secondary ring-1 ring-secondary transition duration-100 ease-linear hover:bg-secondary_hover"
                                    >
                                        <HelpCircle className="size-3.5 text-fg-quaternary" aria-hidden="true" />
                                        {openQuestions} open question{openQuestions === 1 ? "" : "s"}
                                    </button>
                                )}
                                {rosterCount != null && clients != null && total < rosterCount && (
                                    <button
                                        type="button"
                                        onClick={goClients}
                                        title="The roster on the Homepage project page lists more clients than the Client List has filed."
                                        className="flex items-center gap-1.5 rounded-full bg-warning-primary px-3 py-2 text-xs font-semibold text-warning-primary ring-1 ring-secondary transition duration-100 ease-linear hover:opacity-80"
                                    >
                                        {total} of {rosterCount} roster clients filed
                                        <ArrowUpRight className="size-3.5" aria-hidden="true" />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={goClients}
                                    className="flex items-center gap-1.5 rounded-lg bg-brand-solid px-3.5 py-2 text-sm font-semibold text-white shadow-xs transition duration-100 ease-linear hover:bg-brand-solid_hover"
                                >
                                    <Plus className="size-4" aria-hidden="true" />
                                    New Client
                                </button>
                            </div>
                        </div>

                        {clients == null ? (
                            /* Loading skeleton */
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {[0, 1, 2, 3].map((i) => (
                                    <div key={i} className="h-28 animate-pulse rounded-2xl bg-secondary" />
                                ))}
                            </div>
                        ) : (
                            <>
                                {/* KPI tiles */}
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    <StatTile label="Total clients" value={total} icon={Users01} tint="brand" index={0} onClick={goClients} />
                                    <StatTile label="Existing" value={existing} icon={UserCheck01} tint="success" index={1} onClick={goClients} />
                                    <StatTile label="Onboarding" value={onboarding} icon={Rocket02} tint="warning" index={2} onClick={goClients} />
                                    <StatTile label="Offboarding" value={offboarding} icon={UserMinus01} tint="error" index={3} onClick={goClients} />
                                </div>

                                {/* Onboarding pipeline */}
                                <section>
                                    <div className="flex items-center justify-between gap-2">
                                        <div>
                                            <h2 className="text-lg font-semibold text-primary">Onboarding pipeline</h2>
                                            <p className="text-sm text-tertiary">Where every onboarding client sits, Phase 0 → 5.</p>
                                        </div>
                                        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-tertiary tabular-nums ring-1 ring-secondary">
                                            {onboarding} onboarding
                                        </span>
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                                        {ONBOARDING_PHASES.map((p, i) => {
                                            const inPhase = phaseClients(i);
                                            return (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.1 + i * 0.05 }}
                                                    className={cx(
                                                        "flex min-h-[150px] flex-col rounded-2xl p-4 ring-1 ring-secondary",
                                                        inPhase.length > 0 ? "bg-primary" : "bg-secondary",
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-lg leading-none">{p.emoji}</span>
                                                        <span
                                                            className={cx(
                                                                "rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                                                                inPhase.length > 0
                                                                    ? "bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"
                                                                    : "bg-primary text-quaternary ring-1 ring-secondary",
                                                            )}
                                                        >
                                                            {inPhase.length}
                                                        </span>
                                                    </div>
                                                    <p className="mt-2.5 text-xs font-semibold uppercase tracking-wide text-quaternary">Phase {i}</p>
                                                    <p className="mt-0.5 text-sm font-semibold text-primary">{p.label}</p>
                                                    <div className="mt-3 flex flex-col gap-1.5">
                                                        {inPhase.length === 0 ? (
                                                            <span className="text-sm text-quaternary">—</span>
                                                        ) : (
                                                            inPhase.map((c) => (
                                                                <button
                                                                    key={c.id}
                                                                    type="button"
                                                                    onClick={goClients}
                                                                    title={c.name}
                                                                    className="truncate rounded-lg bg-secondary px-2 py-1 text-left text-xs font-medium text-secondary transition duration-100 ease-linear hover:bg-secondary_hover hover:text-primary"
                                                                >
                                                                    {c.name}
                                                                </button>
                                                            ))
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </section>

                                {/* Tier / AM / Web Team trio */}
                                <div className="grid gap-3 lg:grid-cols-3">
                                    <Panel title="Clients by Tier" icon={Trophy01} actionLabel="Client List" onAction={goClients} index={0}>
                                        <div className="flex flex-1 flex-col justify-center gap-4">
                                            {tierCounts.map((t) => (
                                                <div key={t.id} className="flex items-center gap-3">
                                                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-fg-quaternary ring-1 ring-secondary">
                                                        <t.icon className="size-4" aria-hidden="true" />
                                                    </span>
                                                    <span className="w-24 shrink-0 text-sm font-medium text-secondary">{t.label}</span>
                                                    <MiniBar pct={(t.count / maxTier) * 100} />
                                                    <span className="w-6 shrink-0 text-right text-sm font-semibold text-primary tabular-nums">{t.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </Panel>

                                    <Panel title="Clients per Account Manager" icon={Users01} actionLabel="By Account Manager" onAction={goClients} index={1}>
                                        {amRows.length === 0 ? (
                                            <p className="m-auto text-sm italic text-quaternary">No clients filed yet.</p>
                                        ) : (
                                            <div className="flex flex-col gap-3 overflow-y-auto">
                                                {amRows.map((r) => (
                                                    <div key={r.name} className="flex items-center gap-3">
                                                        <Avatar size="xs" src={teamPhoto(r.name)} initials={r.name === "Unassigned" ? "–" : initialsOf(r.name)} alt={r.name} />
                                                        <span
                                                            className={cx(
                                                                "w-28 shrink-0 truncate text-sm font-medium",
                                                                r.name === "Unassigned" ? "italic text-quaternary" : "text-secondary",
                                                            )}
                                                            title={r.name}
                                                        >
                                                            {r.name}
                                                        </span>
                                                        <MiniBar pct={(r.count / maxAm) * 100} />
                                                        <span className="w-6 shrink-0 text-right text-sm font-semibold text-primary tabular-nums">{r.count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </Panel>

                                    <Panel
                                        title="Web Team projects"
                                        icon={Globe01}
                                        actionLabel="Website dept"
                                        onAction={() => navigate("/dashboard?dept=website")}
                                        index={2}
                                    >
                                        {webRows.length === 0 ? (
                                            <p className="m-auto px-4 text-center text-sm italic text-quaternary">
                                                No website projects filed yet — set "Web project" on a client (Edit Client) and it shows up here.
                                            </p>
                                        ) : (
                                            <div className="flex flex-col gap-1.5 overflow-y-auto">
                                                {webRows.map((c) => (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        onClick={() => navigate("/dashboard?dept=website")}
                                                        className="flex items-center justify-between gap-3 rounded-xl px-2.5 py-2 text-left transition duration-100 ease-linear hover:bg-secondary"
                                                    >
                                                        <span className="min-w-0">
                                                            <span className="block truncate text-sm font-medium text-primary">{c.web_project}</span>
                                                            <span className="block truncate text-xs text-tertiary">{c.name}</span>
                                                        </span>
                                                        {(c.web_manager ?? "").trim() ? (
                                                            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-secondary py-0.5 pl-0.5 pr-2 ring-1 ring-secondary">
                                                                <Avatar size="xs" src={teamPhoto(c.web_manager)} initials={initialsOf(c.web_manager!)} alt={c.web_manager} />
                                                                <span className="text-xs font-medium text-secondary">{c.web_manager}</span>
                                                            </span>
                                                        ) : (
                                                            <span className="shrink-0 text-xs italic text-quaternary">unassigned</span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </Panel>
                                </div>

                                <p className="pb-2 text-center text-xs text-quaternary">
                                    Live from the Client List — file or edit clients there and these numbers follow.
                                </p>
                            </>
                        )}
                    </div>
                </main>
            </div>
        </AppShell>
    );
};

export const HomeScreen = () => (
    <TeamGate>
        <HomeContent />
    </TeamGate>
);
