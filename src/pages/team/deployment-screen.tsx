import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, BookOpen01, CheckCircle, HelpCircle, LayoutAlt01, LinkExternal01, Rocket01, XCircle } from "@untitledui/icons";
import { AppShell, CollapsedTopBar, IconRail, RailBottom, useNavCollapsed } from "@/components/application/icon-rail";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { useEditShortcuts } from "@/hooks/use-edit-shortcuts";
import { DEPLOY_EPISODES, DEPLOY_HISTORY, type DeployEpisode, deployLogUrl } from "@/lib/deployment-history";
import { readSopPage, writeSopPage } from "@/lib/db-sync";
import { cx } from "@/utils/cx";

const DEPLOYMENT_SLUG = "deployment-log";

/** Only the written-up part is editable — the deploy records themselves come from Netlify. */
interface DeploymentData {
    episodes: DeployEpisode[];
}

const DEFAULT_DATA: DeploymentData = { episodes: DEPLOY_EPISODES };

const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

const StatTile = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
    <div className="flex-1 rounded-2xl bg-primary p-5 ring-1 ring-secondary">
        <p className="text-sm font-medium text-tertiary">{label}</p>
        <p className="mt-1 text-display-sm font-semibold text-primary">{value}</p>
        {hint && <p className="mt-1 text-xs text-quaternary">{hint}</p>}
    </div>
);

/** One failure episode. In edit mode the issue/solution notes become editable and save to Supabase. */
const EpisodeCard = ({
    episode,
    editing,
    onChange,
}: {
    episode: DeployEpisode;
    editing: boolean;
    onChange: (next: DeployEpisode) => void;
}) => {
    const unrecorded = episode.confidence === "unrecorded";
    const field =
        "w-full rounded-lg bg-primary px-3 py-2 text-sm text-primary ring-1 ring-secondary outline-none focus:ring-brand";

    return (
        <article className="rounded-2xl bg-primary p-6 ring-1 ring-secondary">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="text-md font-semibold text-primary">{episode.title}</h3>
                    <p className="mt-1 text-sm text-tertiary">
                        {episode.when} · {episode.failures} failed {episode.failures === 1 ? "deploy" : "deploys"}
                    </p>
                </div>
                {unrecorded ? (
                    <Badge color="warning" size="md">
                        Cause not recorded
                    </Badge>
                ) : (
                    <Badge color="success" size="md">
                        Root cause confirmed
                    </Badge>
                )}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                    <p className="mb-1.5 text-sm font-semibold text-secondary">What went wrong</p>
                    {editing ? (
                        <textarea
                            value={episode.issue}
                            onChange={(e) => onChange({ ...episode, issue: e.target.value })}
                            rows={5}
                            placeholder="Not recorded — add it here if you know what broke."
                            className={field}
                        />
                    ) : episode.issue ? (
                        <p className="text-sm text-tertiary text-pretty">{episode.issue}</p>
                    ) : (
                        <p className="text-sm text-quaternary italic text-pretty">
                            Never written down, and Netlify no longer serves the build log. Turn on edit mode to fill
                            this in if you remember it.
                        </p>
                    )}
                </div>
                <div>
                    <p className="mb-1.5 text-sm font-semibold text-secondary">How it was fixed</p>
                    {editing ? (
                        <textarea
                            value={episode.solution}
                            onChange={(e) => onChange({ ...episode, solution: e.target.value })}
                            rows={5}
                            placeholder="Not recorded — add the fix here."
                            className={field}
                        />
                    ) : episode.solution ? (
                        <p className="text-sm text-tertiary text-pretty">{episode.solution}</p>
                    ) : (
                        <p className="text-sm text-quaternary italic text-pretty">Not recorded.</p>
                    )}
                </div>
            </div>

            {/* The evidence is shown rather than hidden: two of these write-ups are reconstructions,
                and the reader deserves to judge them. */}
            <div className="mt-5 rounded-xl bg-secondary p-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-secondary uppercase">
                    <HelpCircle className="size-3.5 text-fg-quaternary" aria-hidden="true" />
                    How we know
                </p>
                <p className="mt-1.5 text-sm text-tertiary text-pretty">{episode.evidence}</p>
            </div>
        </article>
    );
};

export const DeploymentScreen = () => {
    const { collapsed: navCollapsed, toggle: toggleNav } = useNavCollapsed();
    const [editing, setEditing] = useState(false);
    const [data, setData] = useState<DeploymentData>(DEFAULT_DATA);
    const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dataRef = useRef(data);
    dataRef.current = data;

    useEffect(() => {
        let cancelled = false;
        readSopPage(DEPLOYMENT_SLUG)
            .then((row: any) => {
                const stored = row?.data;
                if (!cancelled && Array.isArray(stored?.episodes)) {
                    // Merge by id so a newly captured episode still appears under previously saved notes.
                    const saved = new Map<string, DeployEpisode>(stored.episodes.map((e: DeployEpisode) => [e.id, e]));
                    setData({ episodes: DEPLOY_EPISODES.map((e) => ({ ...e, ...(saved.get(e.id) ?? {}) })) });
                }
            })
            .catch(() => {
                /* No saved row yet — the seed write-ups stand on their own. */
            });
        return () => {
            cancelled = true;
        };
    }, []);

    useEditShortcuts({
        onToggle: () => setEditing((v) => !v),
        onSave: () => {
            if (saveTimer.current) clearTimeout(saveTimer.current);
            setSaveState("saving");
            writeSopPage(DEPLOYMENT_SLUG, dataRef.current)
                .then(() => setSaveState("saved"))
                .catch(() => setSaveState("error"));
            setEditing(false);
        },
    });

    const persist = (next: DeploymentData) => {
        setData(next);
        setSaveState("saving");
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
            writeSopPage(DEPLOYMENT_SLUG, next)
                .then(() => setSaveState("saved"))
                .catch(() => setSaveState("error"));
        }, 600);
    };

    const stats = useMemo(() => {
        const total = DEPLOY_HISTORY.length;
        const failed = DEPLOY_HISTORY.filter((d) => d.state === "error").length;
        const timed = DEPLOY_HISTORY.filter((d) => d.secs != null);
        return {
            total,
            failed,
            ok: total - failed,
            rate: Math.round(((total - failed) / total) * 100),
            median: timed.length
                ? [...timed].sort((a, b) => (a.secs ?? 0) - (b.secs ?? 0))[Math.floor(timed.length / 2)].secs
                : null,
            from: DEPLOY_HISTORY[0].at,
            to: DEPLOY_HISTORY[DEPLOY_HISTORY.length - 1].at,
        };
    }, []);

    /** Newest first — the reverse of how the snapshot is stored. */
    const newestFirst = useMemo(() => [...DEPLOY_HISTORY].reverse(), []);

    return (
        <AppShell
            className="flex flex-col"
            rail={!navCollapsed && <IconRail activeDept="docs" bottom={<RailBottom editing={editing} onToggleEditing={() => setEditing((e) => !e)} />} />}
            breadcrumb={[
                { label: "Dashboard", to: "/dashboard", icon: LayoutAlt01 },
                { label: "Manual", to: "/manual", icon: BookOpen01 },
                { label: "Deployments" },
            ]}
        >
            {navCollapsed && <CollapsedTopBar title="Deployments" onExpand={toggleNav} />}

            <div className="min-h-0 flex-1 overflow-y-auto bg-secondary p-2">
                <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
                    <header>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-display-xs font-semibold text-primary">Deployments</h1>
                            {editing && (
                                <BadgeWithDot color="warning" size="md" type="pill-color">
                                    Editing
                                </BadgeWithDot>
                            )}
                            {saveState === "saving" && <span className="text-xs text-quaternary">Saving…</span>}
                            {saveState === "saved" && <span className="text-xs text-success-primary">Saved</span>}
                            {saveState === "error" && <span className="text-xs text-error-primary">Save failed</span>}
                        </div>
                        <p className="mt-2 max-w-2xl text-sm text-tertiary text-pretty">
                            Every production deploy of this site, what failed, and what fixed it. Press{" "}
                            <kbd className="rounded bg-secondary px-1.5 py-0.5 text-xs font-semibold text-secondary ring-1 ring-secondary">
                                Shift+E
                            </kbd>{" "}
                            to add notes, <kbd className="rounded bg-secondary px-1.5 py-0.5 text-xs font-semibold text-secondary ring-1 ring-secondary">Shift+S</kbd>{" "}
                            to save.
                        </p>
                    </header>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <StatTile label="Total deploys" value={String(stats.total)} hint={`${fmtDate(stats.from)} – ${fmtDate(stats.to)}`} />
                        <StatTile label="Succeeded" value={String(stats.ok)} hint={`${stats.rate}% success rate`} />
                        <StatTile label="Failed" value={String(stats.failed)} hint={`across ${DEPLOY_EPISODES.length} episodes`} />
                        <StatTile label="Median build" value={stats.median != null ? `${stats.median}s` : "—"} hint="when Netlify reported a time" />
                    </div>

                    {/* The single most important caveat on this page, so it sits above the content
                        rather than in a footnote. */}
                    <div className="mt-6 flex gap-3 rounded-2xl bg-warning-secondary p-4 ring-1 ring-secondary">
                        <AlertTriangle className="size-5 shrink-0 text-fg-warning-secondary" aria-hidden="true" />
                        <p className="text-sm text-tertiary text-pretty">
                            Netlify's API reports the same generic message for every failure ("Build script returned
                            non-zero exit code: 2") and exposes no way to read build logs. The causes below were
                            reconstructed from git history — two are confirmed by the commit that fixed them, two were
                            never recorded and are marked as such rather than guessed at.
                        </p>
                    </div>

                    <section className="mt-10">
                        <h2 className="text-lg font-semibold text-primary">Failure episodes</h2>
                        <p className="mt-1 text-sm text-tertiary">
                            The {stats.failed} failed deploys are {DEPLOY_EPISODES.length} problems, each retried until it was fixed.
                        </p>
                        <div className="mt-4 flex flex-col gap-4">
                            {data.episodes.map((ep) => (
                                <EpisodeCard
                                    key={ep.id}
                                    episode={ep}
                                    editing={editing}
                                    onChange={(next) =>
                                        persist({ episodes: data.episodes.map((e) => (e.id === next.id ? next : e)) })
                                    }
                                />
                            ))}
                        </div>
                    </section>

                    <section className="mt-10 pb-10">
                        <h2 className="text-lg font-semibold text-primary">Full history</h2>
                        <p className="mt-1 text-sm text-tertiary">
                            Snapshot captured 14 Aug 2026. Netlify recorded no commit ref for{" "}
                            {DEPLOY_HISTORY.filter((d) => !d.sha).length} of these.
                        </p>
                        <div className="mt-4 overflow-hidden rounded-2xl bg-primary ring-1 ring-secondary">
                            <div className="max-h-[32rem] overflow-y-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="sticky top-0 bg-secondary">
                                        <tr>
                                            <th className="px-4 py-2.5 font-semibold text-secondary">Status</th>
                                            <th className="px-4 py-2.5 font-semibold text-secondary">Date</th>
                                            <th className="px-4 py-2.5 font-semibold text-secondary">Commit</th>
                                            <th className="px-4 py-2.5 text-right font-semibold text-secondary">Build</th>
                                            <th className="px-4 py-2.5 font-semibold text-secondary">Log</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {newestFirst.map((d) => {
                                            const failed = d.state === "error";
                                            return (
                                                <tr key={d.id} className={cx("border-t border-secondary", failed && "bg-error-primary")}>
                                                    <td className="px-4 py-2.5">
                                                        <span className="flex items-center gap-1.5">
                                                            {failed ? (
                                                                <XCircle className="size-4 text-fg-error-secondary" aria-hidden="true" />
                                                            ) : (
                                                                <CheckCircle className="size-4 text-fg-success-secondary" aria-hidden="true" />
                                                            )}
                                                            <span className={failed ? "text-error-primary" : "text-tertiary"}>
                                                                {failed ? "Failed" : "Live"}
                                                            </span>
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5 whitespace-nowrap text-tertiary">
                                                        {fmtDate(d.at)} <span className="text-quaternary">{fmtTime(d.at)}</span>
                                                    </td>
                                                    <td className="px-4 py-2.5 font-mono text-xs text-tertiary">{d.sha ?? <span className="text-quaternary">—</span>}</td>
                                                    <td className="px-4 py-2.5 text-right text-tertiary">{d.secs != null ? `${d.secs}s` : "—"}</td>
                                                    <td className="px-4 py-2.5">
                                                        <a
                                                            href={deployLogUrl(d.id)}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1 text-brand-secondary transition duration-100 ease-linear hover:text-brand-secondary_hover"
                                                        >
                                                            Netlify
                                                            <LinkExternal01 className="size-3.5" aria-hidden="true" />
                                                        </a>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <p className="mt-3 flex items-center gap-1.5 text-xs text-quaternary">
                            <Rocket01 className="size-3.5" aria-hidden="true" />
                            Refreshing this snapshot means re-capturing from the Netlify API and committing the result —
                            the browser can't read it directly without a secret token.
                        </p>
                    </section>
                </div>
            </div>
        </AppShell>
    );
};
