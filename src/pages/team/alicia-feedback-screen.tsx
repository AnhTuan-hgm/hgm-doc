import { useEffect, useRef, useState } from "react";
import { Check, Clock, LayoutAlt01, MessageSmileCircle, Plus, Trash01 } from "@untitledui/icons";
import { AppShell, CollapsedTopBar, IconRail, RailBottom, useNavCollapsed } from "@/components/application/icon-rail";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { TextArea } from "@/components/base/textarea/textarea";
import { useAuthUser } from "@/hooks/use-auth-user";
import { readSopPage, writeSopPage } from "@/lib/db-sync";
import { TeamGate } from "@/pages/team/dashboard-screen";
import { cx } from "@/utils/cx";

/**
 * /alicia-feedback — the running record of what Alicia asks for and what we did
 * about it.
 *
 * Alicia works in this page herself — the composer at the top is hers, for the
 * things she remembers after a call. That is why the copy addresses her directly
 * and never refers to her in the third person.
 *
 * Behind TeamGate, which admits any @hiddengem.media Google account, so she
 * needs no separate share link or password of her own. The gate also accepts the
 * team password, for the day sign-in is inconvenient.
 *
 * One `sop_pages` row (slug `alicia-feedback`) holds every entry, saved through
 * the same debounce-the-whole-blob pattern /questions uses. There is no second
 * store — an entry that only lived in this tab would be lost the moment the tab
 * closed, which defeats the point of writing it down.
 */

const SLUG = "alicia-feedback";

type Status = "open" | "done";
type Entry = {
    id: string;
    /** ISO date (YYYY-MM-DD) — the day it was asked, not the day it was recorded. */
    date: string;
    /** What was asked, in her words wherever we have them. */
    ask: string;
    /** What we actually did about it. Empty while it's still open. */
    did: string;
    status: Status;
    /** Email of whoever added it, when they were signed in. Blank for the seeded
     *  entries and for anyone who came through the team password. */
    by?: string;
};
/** Loose row payload: keep any other keys a future version of this page adds. */
type PageData = { entries?: Entry[] } & Record<string, unknown>;

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Seeded on first load only, when the row doesn't exist yet — today's asks, as
 * they were made. Written straight to Supabase so the record survives the tab;
 * after that the row is the source of truth and this constant is never read
 * again, so editing an entry here changes nothing.
 */
const SEED: Entry[] = [
    {
        id: "seed-step4",
        date: "2026-09-02",
        ask: "What should we include in the onboarding dashboard? And add resources — step 4.",
        did: "Journey steps can now carry sub-items. Step 4 asks for the two things the post-Kick-off email asks for: join the Google Chat group, and upload photos/video to the content folder. Step 5 (Onboarding Call) gained a booking button and the pre-call checklist. The three URLs are per-client, edited together in a team-only Onboarding links block in Overview.",
        status: "done",
    },
    {
        id: "seed-facebook",
        date: "2026-09-02",
        ask: "For the client, we need them to be logged into their Facebook page so that they can add us as a user, but we do not want their specific Facebook login. We just need to make sure that they are logged in to their Facebook.",
        did: "The pre-call checklist reads “Logged in to your business page, so you can add us as a user. We never ask for your Facebook password.” The onboarding form's Facebook credential question stays removed — same wording rule applied to Instagram, TikTok and Domain, which say “logged in” rather than asking for a password.",
        status: "done",
    },
    {
        id: "seed-calendly",
        date: "2026-09-02",
        ask: "How should the Onboarding Call booking link be sourced? (Asked for a recommendation.)",
        did: "Recommended and built a per-client field with no shared fallback: the email's link is the AM's own (calendly.com/alicia-hiddengem/onboarding), so one hardcoded URL would route every client to the same person, and deriving it from the `am` column needs a name→URL table maintained forever. Blank is safe — the client reads “Your Account Manager will send you a booking link”, the team reads “No booking link set”.",
        status: "done",
    },
    {
        id: "seed-html",
        date: "2026-09-02",
        ask: "Give me the HTML of step no. 4.",
        did: "Delivered a self-contained HTML preview of the step-4 card (light + dark), matching the shipped component.",
        status: "done",
    },
    {
        id: "seed-thispage",
        date: "2026-09-02",
        ask: "Record whatever I ask today on a page called Alicia-feedback.",
        did: "This page. Entries save to Supabase (sop_pages / alicia-feedback) as you type.",
        status: "done",
    },
];

export const AliciaFeedbackScreen = () => {
    const [entries, setEntries] = useState<Entry[]>([]);
    const [loading, setLoading] = useState(true);
    const [saveState, setSaveState] = useState<"idle" | "saving" | "error">("idle");
    const [draft, setDraft] = useState("");
    const { user } = useAuthUser();
    const { collapsed: navCollapsed, toggle: toggleNav } = useNavCollapsed();
    /** Every other key on the row, preserved so a save never drops what it didn't write. */
    const otherKeys = useRef<Record<string, unknown>>({});
    const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => {
        let alive = true;
        readSopPage(SLUG)
            .then((row) => {
                if (!alive) return;
                const data = (row?.data ?? {}) as PageData;
                const { entries: stored, ...rest } = data;
                otherKeys.current = rest;
                setEntries(Array.isArray(stored) ? stored : SEED);
                setLoading(false);
            })
            .catch(() => {
                // readSopPage throws when the row is missing — that's the first visit.
                // Seed it and write immediately, so today's asks aren't held in a tab.
                if (!alive) return;
                setEntries(SEED);
                setLoading(false);
                void writeSopPage(SLUG, { entries: SEED }).catch(() => setSaveState("error"));
            });
        return () => {
            alive = false;
        };
    }, []);

    /** Whole-blob debounced save, matching /questions. */
    const commit = (next: Entry[]) => {
        setEntries(next);
        setSaveState("saving");
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
            writeSopPage(SLUG, { ...otherKeys.current, entries: next })
                .then(() => setSaveState("idle"))
                .catch(() => setSaveState("error"));
        }, 800);
    };

    const patch = (id: string, p: Partial<Entry>) => commit(entries.map((e) => (e.id === id ? { ...e, ...p } : e)));
    const remove = (id: string) => commit(entries.filter((e) => e.id !== id));
    /** The composer only files an entry that actually says something — a blank row
     *  in a shared log is noise someone else has to clean up. */
    const submitDraft = () => {
        const ask = draft.trim();
        if (!ask) return;
        commit([{ id: crypto.randomUUID(), date: today(), ask, did: "", status: "open", by: user?.email ?? "" }, ...entries]);
        setDraft("");
    };

    const open = entries.filter((e) => e.status === "open").length;
    // Newest first, and a blank new entry always sorts to the top of its day.
    const sorted = [...entries].sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1));

    /* The two per-entry fields. `ring-primary`, not `ring-secondary`, to match the house
       TextArea the composer uses — on a `bg-secondary` card in dark mode a secondary ring
       measures 1.18:1 against it, which is not a visible edge. Primary is the standard
       this design system uses for a field boundary everywhere else. */
    const field =
        "w-full resize-y rounded-lg bg-primary px-3 py-2 text-sm text-primary shadow-xs ring-1 ring-primary outline-none transition duration-100 ease-linear ring-inset placeholder:text-placeholder focus:ring-2 focus:ring-brand";

    return (
        <TeamGate>
            <AppShell
                className="flex flex-col"
                rail={!navCollapsed && <IconRail activeDept="docs" bottom={<RailBottom editing={false} onToggleEditing={() => {}} />} />}
                breadcrumb={[{ label: "Dashboard", to: "/dashboard", icon: LayoutAlt01 }, { label: "Alicia feedback" }]}
            >
                {navCollapsed && <CollapsedTopBar title="Alicia feedback" onExpand={toggleNav} />}
                <div className="flex min-h-0 flex-1 bg-secondary p-2">
                    <main className="flex-1 overflow-x-hidden overflow-y-auto rounded-lg bg-primary shadow-sm">
                        <div className="mx-auto flex max-w-[840px] flex-col gap-8 px-6 py-10 pb-24 md:px-10">
                            <div>
                                <div className="flex items-center gap-3">
                                    <span className="flex size-11 items-center justify-center rounded-xl bg-brand-secondary text-brand-secondary">
                                        <MessageSmileCircle className="size-5" aria-hidden="true" />
                                    </span>
                                    <div className="min-w-0">
                                        <h1 className="text-display-xs font-semibold text-primary">Alicia feedback</h1>
                                        <p className="text-sm text-tertiary">{loading ? "Loading…" : `${entries.length} recorded · ${open} still open`}</p>
                                    </div>
                                </div>
                                <p className="mt-4 text-md text-pretty text-tertiary">
                                    Everything you've asked for, and what we did about it. Remember something later? Add it below — it lands at the top of the
                                    list and we pick it up from there. Everything saves as you type; there is no Save button.
                                </p>
                            </div>

                            {/* Alicia's composer. One box, one button: the thing she does most often
                                is add a request she just remembered, so that is the only thing this
                                asks of her. Date and status are filled in for her, and "what we did"
                                stays empty until we've actually done it. */}
                            <div className="rounded-2xl bg-secondary p-4 ring-1 ring-secondary sm:p-5">
                                <TextArea
                                    label="Remembered something? Add it here."
                                    aria-label="Add a request"
                                    rows={3}
                                    value={draft}
                                    isDisabled={loading}
                                    placeholder="e.g. the Onboarding Call checklist should mention installing Zoom before the call"
                                    onChange={setDraft}
                                    onKeyDown={(ev) => {
                                        // Enter files it, Shift+Enter is a new line. A request is usually
                                        // one sentence, and reaching for the mouse for every one of them
                                        // is how a log stops getting used.
                                        if (ev.key === "Enter" && !ev.shiftKey) {
                                            ev.preventDefault();
                                            submitDraft();
                                        }
                                    }}
                                    textAreaClassName="min-h-24"
                                />
                                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                    <span className="text-xs text-quaternary">Enter to add · Shift + Enter for a new line</span>
                                    <div className="flex items-center gap-3">
                                        <span className={cx("text-xs", saveState === "error" ? "text-error-primary" : "text-quaternary")}>
                                            {saveState === "saving"
                                                ? "Saving…"
                                                : saveState === "error"
                                                  ? "Couldn't save — your last edit is not stored. Check your connection."
                                                  : "Saved"}
                                        </span>
                                        <Button size="sm" iconLeading={Plus} onClick={submitDraft} isDisabled={loading || !draft.trim()}>
                                            Add
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex h-48 items-center justify-center">
                                    <div className="size-6 animate-spin rounded-full border-2 border-brand border-t-transparent opacity-60" />
                                </div>
                            ) : sorted.length === 0 ? (
                                <p className="rounded-2xl bg-secondary px-5 py-8 text-center text-sm text-tertiary ring-1 ring-secondary">
                                    Nothing recorded yet. Add the first one in the box above.
                                </p>
                            ) : (
                                <ul className="grid list-none gap-4 p-0">
                                    {sorted.map((e, i) => (
                                        <li
                                            key={e.id}
                                            className="rounded-2xl bg-primary p-5 shadow-xs ring-1 ring-secondary transition duration-100 ease-linear"
                                        >
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                                {/* Position in the list, so an ask can be pointed at by number in a
                                                    call. The newest sits at 1, which means numbers shift down when
                                                    something new is added — the number names a place in the list,
                                                    not the entry itself. */}
                                                <span className="font-mono text-sm font-semibold text-quaternary tabular-nums">
                                                    {String(i + 1).padStart(2, "0")}
                                                </span>
                                                {e.status === "done" ? (
                                                    <BadgeWithDot color="success" size="sm" type="pill-color">
                                                        Done
                                                    </BadgeWithDot>
                                                ) : (
                                                    <BadgeWithDot color="brand" size="sm" type="pill-color">
                                                        Open
                                                    </BadgeWithDot>
                                                )}
                                                <input
                                                    type="date"
                                                    value={e.date}
                                                    onChange={(ev) => patch(e.id, { date: ev.target.value })}
                                                    className="rounded-lg bg-primary px-2 py-1 font-mono text-xs text-tertiary ring-1 ring-secondary outline-none focus:ring-brand"
                                                />
                                                {e.by && (
                                                    <span className="truncate text-xs text-quaternary" title={e.by}>
                                                        added by {e.by.split("@")[0]}
                                                    </span>
                                                )}
                                                <div className="ml-auto flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        color="secondary"
                                                        iconLeading={e.status === "done" ? Clock : Check}
                                                        onClick={() => patch(e.id, { status: e.status === "done" ? "open" : "done" })}
                                                    >
                                                        {e.status === "done" ? "Reopen" : "Mark done"}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        color="tertiary-destructive"
                                                        iconLeading={Trash01}
                                                        onClick={() => remove(e.id)}
                                                        aria-label="Delete this entry"
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-4 grid gap-4">
                                                <label className="grid gap-1.5">
                                                    <span className="text-xs font-semibold tracking-wide text-quaternary uppercase">The ask</span>
                                                    <textarea
                                                        rows={2}
                                                        value={e.ask}
                                                        placeholder="What was asked, in the words it was asked in"
                                                        onChange={(ev) => patch(e.id, { ask: ev.target.value })}
                                                        className={field}
                                                    />
                                                </label>
                                                <label className="grid gap-1.5">
                                                    <span className="text-xs font-semibold tracking-wide text-quaternary uppercase">What we did</span>
                                                    <textarea
                                                        rows={3}
                                                        value={e.did}
                                                        placeholder="Leave empty while it's still open"
                                                        onChange={(ev) => patch(e.id, { did: ev.target.value })}
                                                        className={field}
                                                    />
                                                </label>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </main>
                </div>
            </AppShell>
        </TeamGate>
    );
};
