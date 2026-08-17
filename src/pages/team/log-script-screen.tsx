import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    AlertTriangle,
    CheckDone01,
    ChevronDown,
    ClipboardCheck,
    Flag01,
    LayoutAlt01,
    Lightbulb01,
    MessageTextSquare01,
    Microphone01,
    RefreshCw01,
    Stars02,
    Trash01,
    Users01,
    VideoRecorder,
    XCircle,
} from "@untitledui/icons";
import { AppShell, CollapsedTopBar, IconRail, RailBottom, useNavCollapsed } from "@/components/application/icon-rail";
import { SignInBackdrop } from "@/components/application/sign-in-backdrop";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Select } from "@/components/base/select/select";
import { useAuthUser } from "@/hooks/use-auth-user";
import { supabase } from "@/lib/supabase";
import {
    deleteScriptLog,
    isInFlight,
    isStalled,
    listRecordingFolders,
    listRecordingsIn,
    listScriptLogs,
    queueSummary,
    retrySummary,
    type RecordingFile,
    type RecordingFolder,
    type ScriptLog,
} from "@/lib/script-logs";
import { cx } from "@/utils/cx";

/**
 * /log-script — the team's log of AI summaries generated from client recordings.
 *
 * Clients record voice and video answers on the onboarding forms (media-answer.tsx). Until
 * this page existed, the only way to know what they said was to sit through playback. An AM
 * picks a recording, presses one button, and gets back a summary with action items.
 *
 * The whole page is built around the fact that generation is asynchronous. The background
 * function answers 202 and reports progress by writing `status` onto the row, so there is
 * no "await the result" path anywhere here — rows appear as `queued` and the list polls
 * until nothing is in flight. See netlify/functions/generate-summary.mts.
 */

const ALLOWED_DOMAIN = "hiddengem.media";
const POLL_MS = 4000;

/* Google "G" mark (official multicolor) — same as the dashboard gate. */
const GoogleIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
        <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
);

/** Supabase rejects with a plain object carrying `message`, not an Error, so the usual
 *  `instanceof Error` check swallows the only useful part — "permission denied for table
 *  script_logs" becomes "something went wrong", which is exactly the case worth naming. */
const msgOf = (err: unknown, fallback: string) => {
    if (err instanceof Error) return err.message;
    if (err && typeof err === "object" && typeof (err as { message?: unknown }).message === "string") {
        return (err as { message: string }).message;
    }
    return fallback;
};

const fmtWhen = (iso: string) =>
    new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const fmtDuration = (secs: number | null) => {
    if (secs == null) return null;
    return `${Math.floor(secs / 60)}:${String(Math.round(secs % 60)).padStart(2, "0")}`;
};

/* ── Sign-in gate ─────────────────────────────────────────────────────
   Stricter than the other internal pages, and intentionally so: these rows hold verbatim
   transcripts of clients speaking. There is no team-password bypass here — the row-level
   security policy checks the session's own email, so a password-unlocked visitor with no
   Supabase session would see an empty list anyway. Better to say why than show nothing. */

const SignInGate = ({ email }: { email?: string }) => {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const signIn = async () => {
        setBusy(true);
        setError("");
        const { error: err } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/log-script`, queryParams: { hd: ALLOWED_DOMAIN } },
        });
        if (err) {
            setError(err.message);
            setBusy(false);
        }
    };

    const wrongAccount = !!email;

    return (
        <SignInBackdrop>
            <div className="w-full max-w-sm rounded-2xl bg-primary p-8 shadow-2xl ring-1 ring-secondary">
                <img src="/hgm logo/Logo ON LIGHT.svg" alt="HiddenGem Media" className="h-14 dark:hidden" draggable={false} />
                <img src="/hgm logo/LOGO ON Dark.svg" alt="HiddenGem Media" className="hidden h-14 dark:block" draggable={false} />

                <h1 className="mt-6 text-lg font-semibold text-primary">Recording summaries</h1>
                <p className="mt-1 text-sm text-tertiary">
                    {wrongAccount ? (
                        <>
                            You're signed in as <span className="font-medium text-secondary">{email}</span>. This page holds recordings of
                            clients speaking, so it's limited to <span className="font-medium text-secondary">@{ALLOWED_DOMAIN}</span> accounts.
                        </>
                    ) : (
                        <>
                            Sign in with your <span className="font-medium text-secondary">@{ALLOWED_DOMAIN}</span> Google account. There's no
                            password option here — these are recordings of clients speaking.
                        </>
                    )}
                </p>

                <button
                    type="button"
                    onClick={signIn}
                    disabled={busy}
                    className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-lg border border-secondary bg-primary px-4 py-2.5 text-sm font-semibold text-secondary transition duration-100 ease-linear hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <GoogleIcon className="size-5" />
                    {busy ? "Redirecting…" : wrongAccount ? "Switch account" : "Continue with Google"}
                </button>
                {error && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-error-primary">
                        <XCircle className="size-3.5 shrink-0" />
                        {error}
                    </p>
                )}
            </div>
        </SignInBackdrop>
    );
};

/* ── Status pill ──────────────────────────────────────────────────── */

const StatusPill = ({ log }: { log: ScriptLog }) => {
    if (isStalled(log)) {
        return (
            <Badge color="warning" size="sm">
                Stalled
            </Badge>
        );
    }
    switch (log.status) {
        case "queued":
            return <Badge color="gray" size="sm">Queued</Badge>;
        case "transcribing":
            return <BadgeWithDot color="blue" size="sm" type="pill-color">Transcribing</BadgeWithDot>;
        case "summarising":
            return <BadgeWithDot color="blue" size="sm" type="pill-color">Summarising</BadgeWithDot>;
        case "done":
            return <Badge color="success" size="sm">Done</Badge>;
        case "error":
            return <Badge color="error" size="sm">Failed</Badge>;
    }
};

/* ── One summary, expanded ────────────────────────────────────────── */

const Bullets = ({ title, icon: Icon, items }: { title: string; icon: typeof Flag01; items: string[] }) => {
    if (!items?.length) return null;
    return (
        <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-brand-secondary uppercase">
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {title}
            </p>
            <ul className="mt-2 flex flex-col gap-1.5">
                {items.map((item, i) => (
                    <li key={i} className="flex gap-2 text-md text-secondary">
                        <span className="mt-2 size-1 shrink-0 rounded-full bg-quaternary" aria-hidden="true" />
                        <span className="text-pretty">{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const LogDetail = ({ log }: { log: ScriptLog }) => {
    if (log.status === "error") {
        return (
            <div className="flex gap-3 rounded-xl bg-error-primary p-4 ring-1 ring-error_subtle">
                <AlertTriangle className="size-5 shrink-0 text-fg-error-secondary" aria-hidden="true" />
                <p className="text-sm text-secondary text-pretty">{log.error || "Something went wrong."}</p>
            </div>
        );
    }

    if (isInFlight(log)) {
        return (
            <p className="text-sm text-tertiary">
                {log.status === "queued" ? "Waiting to start…" : log.status === "transcribing" ? "Transcribing the recording…" : "Writing the summary…"}
                {isStalled(log) && " This has taken longer than expected — try Retry, or delete it and start again."}
            </p>
        );
    }

    const s = log.summary;
    if (!s) return <p className="text-sm text-tertiary">No summary was saved.</p>;

    return (
        <div className="flex flex-col gap-6">
            {s.context && <p className="text-md text-secondary text-pretty">{s.context}</p>}
            <Bullets title="Key points" icon={Lightbulb01} items={s.key_points} />
            <Bullets title="Action items" icon={CheckDone01} items={s.action_items} />
            <Bullets title="Worth quoting" icon={MessageTextSquare01} items={s.quotes} />
            <Bullets title="Flagged" icon={Flag01} items={s.flags} />

            {log.transcript && (
                <details className="rounded-xl bg-secondary p-4">
                    <summary className="cursor-pointer list-none text-sm font-medium text-secondary select-none">
                        Full transcript ({log.transcript.split(/\s+/).length} words)
                    </summary>
                    <p className="mt-3 text-sm whitespace-pre-wrap text-tertiary">{log.transcript}</p>
                </details>
            )}
        </div>
    );
};

/* ── Page ─────────────────────────────────────────────────────────── */

const LogScriptPage = ({ email }: { email: string }) => {
    const { collapsed: navCollapsed, toggle: toggleNav } = useNavCollapsed();
    /** The rail's lock reveals the delete buttons — nothing else on this page is editable. */
    const [unlocked, setUnlocked] = useState(false);

    const [logs, setLogs] = useState<ScriptLog[]>([]);
    const [loadError, setLoadError] = useState("");
    const [loading, setLoading] = useState(true);

    const [folders, setFolders] = useState<RecordingFolder[]>([]);
    const [pickedSlug, setPickedSlug] = useState("");
    const [files, setFiles] = useState<RecordingFile[]>([]);
    const [filesLoading, setFilesLoading] = useState(false);
    const [pickedPath, setPickedPath] = useState("");

    const [generating, setGenerating] = useState(false);
    const [genError, setGenError] = useState("");
    const [expanded, setExpanded] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        try {
            setLogs(await listScriptLogs());
            setLoadError("");
        } catch (err) {
            setLoadError(msgOf(err, "Could not load the log."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void refresh();
        listRecordingFolders()
            .then(setFolders)
            .catch((err) => console.error("[log-script] could not list recordings", err));
    }, [refresh]);

    // Poll only while something is actually running. A background function reports its
    // progress by writing to the row and can't call back, so this is the only way the page
    // learns anything — but an idle log doesn't need to be re-fetched every four seconds.
    const anyInFlight = useMemo(() => logs.some(isInFlight), [logs]);
    const refreshRef = useRef(refresh);
    refreshRef.current = refresh;
    useEffect(() => {
        if (!anyInFlight) return;
        const id = window.setInterval(() => void refreshRef.current(), POLL_MS);
        return () => window.clearInterval(id);
    }, [anyInFlight]);

    // Recordings are listed per client rather than all at once: listing every folder's
    // contents up front is one storage round-trip per client, and there are dozens.
    useEffect(() => {
        if (!pickedSlug) {
            setFiles([]);
            setPickedPath("");
            return;
        }
        let live = true;
        setFilesLoading(true);
        setPickedPath("");
        listRecordingsIn(pickedSlug)
            .then((rows) => live && setFiles(rows))
            .catch((err) => console.error("[log-script] could not list recordings for", pickedSlug, err))
            .finally(() => live && setFilesLoading(false));
        return () => {
            live = false;
        };
    }, [pickedSlug]);

    const picked = files.find((f) => f.path === pickedPath);
    const folder = folders.find((f) => f.slug === pickedSlug);

    const generate = async () => {
        if (!picked || !folder) return;
        setGenerating(true);
        setGenError("");
        try {
            const row = await queueSummary({
                clientSlug: folder.slug,
                clientName: folder.clientName,
                sourcePath: picked.path,
                sourceLabel: picked.label,
                mediaKind: picked.kind,
                createdBy: email,
            });
            setLogs((prev) => [row, ...prev]);
            setExpanded(row.id);
            setPickedPath("");
        } catch (err) {
            setGenError(msgOf(err, "Could not queue that recording."));
        } finally {
            setGenerating(false);
        }
    };

    const remove = async (id: string) => {
        setLogs((prev) => prev.filter((l) => l.id !== id));
        try {
            await deleteScriptLog(id);
        } catch (err) {
            console.error("[log-script] delete failed", err);
            void refresh();
        }
    };

    const folderItems = folders.map((f) => ({ id: f.slug, label: f.clientName, supportingText: f.slug }));
    const fileItems = files.map((f) => ({
        id: f.path,
        label: f.label,
        supportingText: [f.kind === "video" ? "Video" : "Voice", f.createdAt ? fmtWhen(f.createdAt) : null].filter(Boolean).join(" · "),
    }));

    return (
        <AppShell
            className="flex flex-col"
            rail={!navCollapsed && <IconRail activeDept="clients" bottom={<RailBottom editing={unlocked} onToggleEditing={() => setUnlocked((v) => !v)} />} />}
            breadcrumb={[
                { label: "Dashboard", to: "/dashboard", icon: LayoutAlt01 },
                { label: "Clients", to: "/dashboard?dept=clients", icon: Users01 },
                { label: "Recording summaries" },
            ]}
        >
            {navCollapsed && <CollapsedTopBar title="Recording summaries" onExpand={toggleNav} />}

            <div className="min-h-0 flex-1 overflow-y-auto bg-secondary p-2">
                <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
                    <header>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-display-xs font-semibold text-primary">Recording summaries</h1>
                            {unlocked && (
                                <BadgeWithDot color="warning" size="md" type="pill-color">
                                    Delete unlocked
                                </BadgeWithDot>
                            )}
                        </div>
                        <p className="mt-2 max-w-2xl text-sm text-tertiary text-pretty">
                            Clients answer the long onboarding questions by talking instead of typing. Pick one of those recordings and
                            get back the key points, what you need to do next, and quotes worth reusing — plus the full transcript.
                        </p>
                    </header>

                    {/* ── Generate ── */}
                    <section className="mt-6 rounded-2xl bg-primary p-6 ring-1 ring-secondary">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Select
                                label="Client"
                                placeholder={folders.length ? "Select a client" : "No recordings found yet"}
                                items={folderItems}
                                selectedKey={pickedSlug || null}
                                isDisabled={!folders.length}
                                onSelectionChange={(k) => setPickedSlug(String(k ?? ""))}
                            >
                                {(item) => (
                                    <Select.Item id={item.id} supportingText={item.supportingText}>
                                        {item.label}
                                    </Select.Item>
                                )}
                            </Select>

                            <Select
                                label="Recording"
                                placeholder={
                                    !pickedSlug ? "Pick a client first" : filesLoading ? "Loading…" : files.length ? "Select a recording" : "No recordings for this client"
                                }
                                items={fileItems}
                                selectedKey={pickedPath || null}
                                isDisabled={!pickedSlug || filesLoading || !files.length}
                                onSelectionChange={(k) => setPickedPath(String(k ?? ""))}
                            >
                                {(item) => (
                                    <Select.Item id={item.id} supportingText={item.supportingText}>
                                        {item.label}
                                    </Select.Item>
                                )}
                            </Select>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            <Button size="md" iconLeading={Stars02} isDisabled={!picked || generating} isLoading={generating} showTextWhileLoading onClick={generate}>
                                {generating ? "Queueing…" : "Generate summary"}
                            </Button>
                            {picked && (
                                <span className="flex items-center gap-1.5 text-sm text-tertiary">
                                    {picked.kind === "video" ? (
                                        <VideoRecorder className="size-4 text-fg-quaternary" aria-hidden="true" />
                                    ) : (
                                        <Microphone01 className="size-4 text-fg-quaternary" aria-hidden="true" />
                                    )}
                                    {picked.label}
                                </span>
                            )}
                        </div>
                        {genError && (
                            <p className="mt-2 flex items-start gap-1.5 text-sm text-error-primary">
                                <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                {genError}
                            </p>
                        )}
                        <p className="mt-3 text-xs text-quaternary">
                            Transcribing runs in the background and takes roughly a minute. You can leave this page — the result is saved
                            to the log below either way.
                        </p>
                    </section>

                    {/* ── Log ── */}
                    <h2 className="mt-10 flex items-center gap-2 text-md font-semibold text-primary">
                        <ClipboardCheck className="size-4 text-fg-quaternary" aria-hidden="true" />
                        Log
                        {logs.length > 0 && <span className="text-sm font-normal text-quaternary">{logs.length}</span>}
                    </h2>

                    {loadError && (
                        <div className="mt-3 flex gap-3 rounded-2xl bg-error-primary p-4 ring-1 ring-error_subtle">
                            <AlertTriangle className="size-5 shrink-0 text-fg-error-secondary" aria-hidden="true" />
                            <p className="text-sm text-secondary text-pretty">{loadError}</p>
                        </div>
                    )}

                    {!loading && !logs.length && !loadError && (
                        <p className="mt-3 rounded-2xl bg-primary p-6 text-sm text-tertiary ring-1 ring-secondary">
                            Nothing generated yet. Pick a client and one of their recordings above.
                        </p>
                    )}

                    <div className="mt-3 flex flex-col gap-3">
                        {logs.map((log) => {
                            const open = expanded === log.id;
                            return (
                                <article key={log.id} className="overflow-hidden rounded-2xl bg-primary ring-1 ring-secondary">
                                    <div className="flex items-start gap-3 p-4">
                                        <button
                                            type="button"
                                            onClick={() => setExpanded(open ? null : log.id)}
                                            className="flex min-w-0 flex-1 items-start gap-3 text-left"
                                        >
                                            <ChevronDown
                                                className={cx("mt-0.5 size-4 shrink-0 text-fg-quaternary transition duration-100 ease-linear", open && "rotate-180")}
                                                aria-hidden="true"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-md font-medium text-primary">
                                                    {log.summary?.headline || log.source_label || "Untitled recording"}
                                                </p>
                                                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-quaternary">
                                                    <span className="font-medium text-tertiary">{log.client_name || log.client_slug}</span>
                                                    <span aria-hidden="true">·</span>
                                                    <span>{log.source_label}</span>
                                                    {fmtDuration(log.duration_seconds) && (
                                                        <>
                                                            <span aria-hidden="true">·</span>
                                                            <span className="tabular-nums">{fmtDuration(log.duration_seconds)}</span>
                                                        </>
                                                    )}
                                                    <span aria-hidden="true">·</span>
                                                    <span>{fmtWhen(log.created_at)}</span>
                                                    {log.created_by && (
                                                        <>
                                                            <span aria-hidden="true">·</span>
                                                            <span>{log.created_by.split("@")[0]}</span>
                                                        </>
                                                    )}
                                                </p>
                                            </div>
                                        </button>

                                        <div className="flex shrink-0 items-center gap-1.5">
                                            <StatusPill log={log} />
                                            {(isStalled(log) || log.status === "error") && (
                                                <button
                                                    type="button"
                                                    onClick={() => void retrySummary(log.id)}
                                                    title="Try this one again"
                                                    className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-tertiary transition duration-100 ease-linear hover:bg-secondary hover:text-primary"
                                                >
                                                    <RefreshCw01 className="size-3.5" aria-hidden="true" />
                                                    Retry
                                                </button>
                                            )}
                                            {unlocked && (
                                                <button
                                                    type="button"
                                                    onClick={() => void remove(log.id)}
                                                    title="Delete this summary and its transcript"
                                                    className="flex size-8 items-center justify-center rounded-lg text-tertiary transition duration-100 ease-linear hover:bg-secondary hover:text-error-primary"
                                                >
                                                    <Trash01 className="size-4" aria-hidden="true" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {open && (
                                        <div className="border-t border-secondary p-5">
                                            <LogDetail log={log} />
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                </div>
            </div>
        </AppShell>
    );
};

export const LogScriptScreen = () => {
    const { user, loading } = useAuthUser();
    // Render nothing rather than the gate while the session resolves, or a signed-in AM
    // sees a sign-in card flash before their own page every single visit.
    if (loading) return null;
    const isTeam = !!user?.email && user.email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);
    if (!isTeam) return <SignInGate email={user?.email} />;
    return <LogScriptPage email={user!.email} />;
};
