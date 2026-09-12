/**
 * 02 MY REQUESTS - every request this client has raised, filterable, newest first.
 *
 * This file is also where the help centre's shared visual atoms live. That is an import
 * ordering decision, not a naming one: the shell in help-center-screen.tsx WRAPS the other
 * two screens rather than being imported by them, so the dependency graph runs
 * requests-screen -> request-detail -> center-screen in one direction with no cycle. Putting
 * the atoms in the shell instead would have made center-screen import detail and detail
 * import center-screen straight back.
 *
 * ── WHAT THIS SCREEN PROMISES ───────────────────────────────────────────────
 * A withdrawn request STAYS on the list and gets its own filter. Nothing a client raised
 * ever disappears from their own history, because the commonest reason to come looking for
 * a withdrawn request is having withdrawn it by mistake.
 */
import type { ReactNode } from "react";
import { AlertCircle, Inbox01, SlashCircle01 } from "@untitledui-pro/icons/line";
import { Link } from "react-router";
import { BadgeWithDot, BadgeWithIcon } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import {
    FILTERS,
    type RequestFilter,
    STATUS_META,
    type Ticket,
    type TicketCounts,
    type TicketStatus,
    type TicketTopic,
    formatStampShort,
    matchesFilter,
    requestsSummary,
    topicLabel,
} from "@/pages/client/help/help-model";
import { cx } from "@/utils/cx";

/* ── Shared atoms ────────────────────────────────────────────────────────────
   Small enough to inline, repeated often enough that inlining them would let the three
   screens drift apart. Every colour here is a semantic token, so the page follows the
   viewer's theme instead of pinning itself to one. */

/**
 * The page's white card.
 *
 * `ring-1` rather than `border` throughout the help centre, matching the dashboard: a ring
 * does not take part in layout, so a card can sit flush in a grid without its outline
 * nudging its neighbours by a pixel.
 */
export const Panel = ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={cx("rounded-xl bg-primary ring-1 ring-secondary", className)}>{children}</div>
);

/** Small caps label above a block. Uses text-tertiary, never text-quaternary - see Eyebrow's note. */
export const Eyebrow = ({ children }: { children: ReactNode }) => (
    // Measured, not estimated, by resolving the tokens out of the built stylesheet and
    // converting oklch -> sRGB -> relative luminance. text-quaternary (neutral-500) clears
    // AA by 0.03 on the page ground (4.53:1) and by 0.23 on a card (4.73:1). Clearing a
    // threshold by three hundredths is not a margin: it is one palette tweak away from
    // failing, on the smallest type on the page. Every quiet label here is text-tertiary
    // (neutral-600) instead, which measures 7.47:1 on the ground and 7.80:1 on a card in
    // light, 6.91:1 and 7.63:1 in dark. Do not "soften" these.
    <p className="text-xs font-semibold tracking-wide text-tertiary uppercase">{children}</p>
);

/** A reference number. Monospaced so two references are comparable digit by digit. */
export const MonoRef = ({ children, className }: { children: ReactNode; className?: string }) => (
    <span className={cx("font-mono text-xs tracking-tight text-tertiary tabular-nums", className)}>{children}</span>
);

/** Separator between meta items. Hidden from screen readers - it is punctuation, not content. */
export const MetaDot = () => (
    // Full-strength text-tertiary rather than the /60 this started as. At 60% the blended
    // colour is rgb(151 151 151), which measures 2.92:1 on a card - fine to argue as exempt
    // decoration, but the argument is the problem: it puts a visible glyph below AA and
    // leaves the next person to re-derive why that was allowed. A middot reads as a
    // separator from its position, not from being fainter than its neighbours, so nothing
    // is lost by taking the 7.80:1 version.
    <span aria-hidden="true" className="text-tertiary">
        &middot;
    </span>
);

/**
 * The status pill.
 *
 * Withdrawn gets an icon instead of a dot rather than its own colour. Three of the five
 * statuses are already carried by colour, and a sixth hue for "closed at the client's own
 * request" would have to be either red (reads as a failure they caused) or another grey
 * (indistinguishable from Received). A different SHAPE separates it at a glance without
 * either problem, and works for anyone who cannot separate the hues at all.
 */
export const StatusPill = ({ status, size = "md" }: { status: TicketStatus; size?: "sm" | "md" }) => {
    const meta = STATUS_META[status];
    if (status === "withdrawn") {
        return (
            <BadgeWithIcon type="pill-color" color="gray" size={size} iconLeading={SlashCircle01}>
                {meta.label}
            </BadgeWithIcon>
        );
    }
    const color = meta.tone === "brand" ? "brand" : meta.tone === "success" ? "success" : "gray";
    return (
        <BadgeWithDot type="pill-color" color={color} size={size}>
            {meta.label}
        </BadgeWithDot>
    );
};

/** The shared loading state. Announced, so it is not a silent pause for a screen reader. */
export const HelpSpinner = ({ label = "Loading" }: { label?: string }) => (
    <div role="status" aria-live="polite" className="flex items-center justify-center gap-3 py-16 text-sm text-tertiary">
        <span className="size-4 animate-spin rounded-full border-2 border-brand border-t-transparent motion-reduce:animate-none" aria-hidden="true" />
        {label}
    </div>
);

/** A failure the client can act on, with the retry beside it rather than somewhere else. */
export const ErrorNote = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
    <Panel className="p-4 ring-error_subtle sm:p-5">
        <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-error-primary" aria-hidden="true" />
            <div className="min-w-0 flex-1">
                <p className="text-sm text-primary" role="alert">
                    {message}
                </p>
                {onRetry && (
                    <Button size="sm" color="secondary" className="mt-3" onClick={onRetry}>
                        Try again
                    </Button>
                )}
            </div>
        </div>
    </Panel>
);

/** The shared empty state. Never a shrug: every copy passed in says what to do next. */
export const EmptyNote = ({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) => (
    <Panel className="px-5 py-12 text-center">
        <Inbox01 className="mx-auto size-6 text-tertiary" aria-hidden="true" />
        <p className="mt-3 text-md font-semibold text-primary">{title}</p>
        <p className="mx-auto mt-1.5 max-w-[42ch] text-sm text-pretty text-tertiary">{detail}</p>
        {action && <div className="mt-5 flex justify-center">{action}</div>}
    </Panel>
);

/* ── 02 MY REQUESTS ──────────────────────────────────────────────────────── */

/** One row. A whole-row link, so the tap target is the card and not just the title. */
const RequestRow = ({ ticket, topics, slug }: { ticket: Ticket; topics: TicketTopic[]; slug: string }) => {
    const raised = formatStampShort(ticket.created_at);
    return (
        <li>
            <Link
                to={`/${slug}/help/requests/${ticket.reference}`}
                // `block` plus generous padding keeps the touch target well past the 44px
                // minimum at 390px even for a one-line title.
                className="block rounded-xl bg-primary p-4 ring-1 ring-secondary transition duration-100 ease-linear outline-brand hover:bg-primary_hover hover:ring-brand focus-visible:outline-2 focus-visible:outline-offset-2 sm:p-5"
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-md font-semibold text-pretty text-primary">{ticket.title}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-tertiary">
                            <MonoRef>{ticket.reference}</MonoRef>
                            <MetaDot />
                            <span>{topicLabel(topics, ticket.topic)}</span>
                            {raised && (
                                <>
                                    <MetaDot />
                                    <span>Raised {raised}</span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="shrink-0">
                        <StatusPill status={ticket.status} size="sm" />
                    </div>
                </div>
            </Link>
        </li>
    );
};

const emptyCopy: Record<RequestFilter, { title: string; detail: string }> = {
    all: {
        title: "No requests yet",
        detail: "When you raise your first request it will appear here, with the name of the person who owns it.",
    },
    open: {
        title: "Nothing open",
        detail: "Every request you have raised is closed. Raise a new one whenever you need something.",
    },
    completed: {
        title: "Nothing completed yet",
        detail: "Requests move here once the work is finished, and stay for your records.",
    },
    withdrawn: {
        title: "Nothing withdrawn",
        detail: "Requests you withdraw stay on this list rather than disappearing, so you can always find them again.",
    },
};

export const HelpRequestsScreen = ({
    tickets,
    counts,
    topics,
    slug,
    filter,
    onFilterChange,
}: {
    tickets: Ticket[];
    counts: TicketCounts;
    topics: TicketTopic[];
    slug: string;
    filter: RequestFilter;
    onFilterChange: (f: RequestFilter) => void;
}) => {
    const shown = tickets.filter((t) => matchesFilter(t, filter));

    return (
        <div className="flex flex-col gap-6">
            <header>
                <h1 className="text-display-xs font-semibold text-primary sm:text-display-sm">My requests</h1>
                {/* The one line from the approved design. Counts are computed from the rows on
                    screen rather than taken from the server's totals, so withdrawing something
                    cannot leave the heading disagreeing with the list under it for a beat. */}
                <p className="mt-2 text-md text-tertiary">{requestsSummary(counts)}</p>
            </header>

            {/*
                Filters, not tabs. They narrow one list that is already present rather than
                swapping panels, so they are buttons carrying aria-pressed. A tablist here
                would promise a screen reader arrow-key navigation between panels that do
                not exist.
                The row scrolls rather than wrapping: four chips wrap to two ragged lines on a
                narrow phone, which reads as two groups of controls.

                These WRAP rather than scroll sideways, which reverses an earlier decision in
                this file, and the measurements are why.

                As a one-line scroller the row rendered 377px wide starting 16px in, so at a
                real 390px viewport its last chip ended at 393 - three pixels past the edge.
                Three pixels does not read as "there is more to see", it reads as a clipped
                layout, and no amount of trimming padding fixed it at 360 or 320 where the row
                genuinely cannot fit. That left the real question: what happens to the fourth
                chip on a phone?

                The fourth chip is Withdrawn. A client goes looking for that filter for exactly
                one reason - they withdrew something by mistake and want it back - and it is
                the whole reason withdrawn requests stay on this list at all instead of being
                dropped. Putting the recovery path behind a sideways swipe with no scrollbar
                and no affordance is the one place in this screen where a discovery failure
                costs somebody something real. Two slightly ragged lines cost a line of
                vertical space and hide nothing.
            */}
            <div>
                <div role="group" aria-label="Filter requests" className="flex flex-wrap items-center gap-2">
                    {FILTERS.map((f) => {
                        const active = f.key === filter;
                        const n = tickets.filter((t) => matchesFilter(t, f.key)).length;
                        return (
                            <button
                                key={f.key}
                                type="button"
                                aria-pressed={active}
                                onClick={() => onFilterChange(f.key)}
                                className={cx(
                                    // min-h-9 plus the 8px gap keeps these clear of the 44px
                                    // tap-target guidance without making a filter row look
                                    // like four primary buttons.
                                    "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold whitespace-nowrap transition duration-100 ease-linear outline-brand focus-visible:outline-2 focus-visible:outline-offset-2",
                                    active ? "bg-brand-solid text-white" : "bg-primary text-secondary ring-1 ring-secondary hover:bg-primary_hover",
                                )}
                            >
                                {f.label}
                                {/* Solid white, not white/80. The count is content - it is how
                                    many requests that filter holds - and at 12px it needs 4.5:1.
                                    Blended at 80% over bg-brand-solid it resolves to
                                    rgb(204 224 248), which measures 3.94:1 and fails AA; solid
                                    white on the same ground is 5.31:1. Both measured from the
                                    built stylesheet. */}
                                <span className={cx("text-xs tabular-nums", active ? "text-white" : "text-tertiary")}>{n}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {shown.length === 0 ? (
                <EmptyNote title={emptyCopy[filter].title} detail={emptyCopy[filter].detail} />
            ) : (
                <ul className="flex flex-col gap-3">
                    {shown.map((t) => (
                        <RequestRow key={t.id} ticket={t} topics={topics} slug={slug} />
                    ))}
                </ul>
            )}
        </div>
    );
};
