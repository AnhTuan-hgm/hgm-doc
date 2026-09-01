/**
 * Shared chrome for the client dashboard: the sign-in gate, the section heading and its
 * phase eyebrow, the side-menu row, the search bar and the small shared primitives.
 *
 * These draw the frame around a section rather than any section's own content, so they
 * take plain props and hold none of the dashboard's state.
 */
import { type FC, type ReactNode, useEffect, useRef, useState } from "react";
import { SearchLg } from "@untitledui-pro/icons/line";
import { AnimatePresence, motion } from "motion/react";
import { SignInBackdrop } from "@/components/application/sign-in-backdrop";
import { Button } from "@/components/base/buttons/button";
import { type SectionId, normEmail } from "@/pages/client/dashboard/dashboard-model";
import { PHASES, type SearchHit, phaseOfSection } from "@/pages/client/dashboard/dashboard-navigation";
import { cx } from "@/utils/cx";

/**
 * Sign-in / no-access screen for a client dashboard.
 *
 * Two states, because they need different words: nobody signed in yet, versus signed in as
 * someone this dashboard isn't shared with. The second is the one people actually hit —
 * Google silently reuses whichever account is already active — so it names the address and
 * offers to switch rather than just refusing.
 *
 * The client's name is deliberately absent: a stranger who lands here learns nothing about
 * whose dashboard it is.
 */
export const DashboardAccessGate = ({
    allowedEmails,
    sharePassword,
    onUnlock,
    backgroundUrl,
}: {
    allowedEmails: string[];
    sharePassword: string;
    /** Receives the (normalized) email that cleared the gate — the client's identity
     *  for the suggestion feature, since to Supabase they are just `anon`. */
    onUnlock: (email: string) => void;
    /** Per-client override (image or video). Falls back to the shared leaf loop. */
    backgroundUrl?: string;
}) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState("");

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const emailOk = allowedEmails.some((a) => normEmail(a) === normEmail(email));
        const pwOk = password === sharePassword;
        // One message for either failure. Saying "that email isn't on the list" would let
        // someone probe which addresses a dashboard is shared with.
        if (!emailOk || !pwOk) {
            setError("That email and password don't match this dashboard.");
            return;
        }
        setError("");
        onUnlock(normEmail(email));
    };

    return (
        <SignInBackdrop backgroundUrl={backgroundUrl}>
            <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-primary p-8 shadow-2xl ring-1 ring-secondary">
                <img src="/hgm logo/Favicon ON LIGHT.svg" alt="HiddenGem Media" className="mx-auto size-11" draggable={false} />
                <h1 className="mt-5 text-center text-lg font-semibold text-primary">This dashboard is private</h1>
                <p className="mt-2 text-center text-sm text-pretty text-tertiary">Enter the email and password your HiddenGem team shared with you.</p>

                <div className="mt-6 flex flex-col gap-3">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@yourbusiness.com"
                        autoComplete="username"
                        autoFocus
                        className="w-full rounded-lg bg-primary px-3 py-2.5 text-sm text-primary ring-1 ring-secondary outline-none focus:ring-brand"
                    />
                    <div className="flex items-center gap-2">
                        <input
                            type={showPw ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            autoComplete="current-password"
                            className="min-w-0 flex-1 rounded-lg bg-primary px-3 py-2.5 text-sm text-primary ring-1 ring-secondary outline-none focus:ring-brand"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPw((v) => !v)}
                            aria-label={showPw ? "Hide password" : "Show password"}
                            className="shrink-0 rounded-lg px-2 py-2 text-xs font-semibold text-brand-secondary transition duration-100 ease-linear hover:bg-secondary"
                        >
                            {showPw ? "Hide" : "Show"}
                        </button>
                    </div>
                </div>

                {error && (
                    <p className="mt-3 text-sm text-error-primary" role="alert">
                        {error}
                    </p>
                )}

                <Button size="md" type="submit" className="mt-5 w-full" isDisabled={!email.trim() || !password}>
                    Open my dashboard
                </Button>
                <p className="mt-4 text-center text-xs text-quaternary">Lost your details? Reply to your HiddenGem email and we'll resend them.</p>
            </form>
        </SignInBackdrop>
    );
};

export const SectionEyebrow = ({ section }: { section: SectionId }) => {
    const phase = phaseOfSection(section);
    if (!phase) return null;
    const p = PHASES[phase];
    return (
        <div className="flex items-center gap-3">
            <span
                className={cx("inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide uppercase", p.bg, p.text)}
            >
                {p.num !== null && <span className="tabular-nums opacity-70">Phase {p.num}</span>}
                {p.label}
            </span>
            <span className="h-px flex-1 bg-border-secondary" />
        </div>
    );
};

export const SectionHeading = ({ children }: { children: ReactNode }) => (
    <h2 className="mt-4 text-xl font-semibold text-primary md:text-display-xs">{children}</h2>
);

/** Shared chrome for every editable field on the dashboard. Module scope (it closes over
 *  nothing) so the Master Brand Document's sub-components below can reach it too. */
export const editInput = (extra?: string) =>
    cx(
        "w-full rounded-lg border border-secondary bg-transparent px-2.5 py-1.5 text-sm text-primary transition duration-100 ease-linear outline-none placeholder:text-placeholder focus:border-brand focus:ring-1 focus:ring-brand",
        extra,
    );

/* ═══════════════════════════════════════════════════════════════════════
   Master Brand Document — the eleven-section brand foundation.
   Small presentational pieces, kept at module scope so the section's JSX
   below reads as the document it renders rather than as nested divs.
   ═══════════════════════════════════════════════════════════════════════ */

export const StatTile = ({ label, value, change }: { label: string; value: string; change?: ReactNode }) => (
    <div className="rounded-xl p-5 ring-1 ring-secondary">
        <p className="text-sm font-medium text-tertiary">{label}</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
            <p className="text-display-xs font-semibold text-primary md:text-display-sm">{value}</p>
            {change}
        </div>
    </div>
);

export const EyeGlyph = () => (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);
export const EyeOffGlyph = () => (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" />
    </svg>
);

/**
 * Header search — client-scoped, NOT the internal team's sitewide search. It only
 * searches this one client's own sidebar sections, links and FAQs (passed in as
 * `hits`) — never other clients, internal team pages, or admin routes. Purely local
 * filtering over already-loaded props; no network calls.
 */
export const ClientSearchBar = ({ hits, onSelect }: { hits: SearchHit[]; onSelect: (id: SectionId) => void }) => {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
        };
        window.addEventListener("mousedown", onDown);
        return () => window.removeEventListener("mousedown", onDown);
    }, [open]);

    const q = query.trim().toLowerCase();
    const results = q ? hits.filter((h) => h.label.toLowerCase().includes(q) || h.sub?.toLowerCase().includes(q)) : hits;

    const go = (id: SectionId) => {
        onSelect(id);
        setQuery("");
        setOpen(false);
        inputRef.current?.blur();
    };

    return (
        <div ref={containerRef} className="relative flex flex-1 items-center justify-center px-1">
            <div
                className={cx(
                    "flex w-full max-w-md items-center gap-2.5 rounded-full border bg-primary px-4 py-2 transition duration-100 ease-linear",
                    open ? "border-brand ring-2 ring-brand/15" : "border-secondary hover:border-primary",
                )}
            >
                <SearchLg
                    className={cx("size-4 shrink-0 transition duration-100 ease-linear", open ? "text-fg-brand-primary" : "text-quaternary")}
                    aria-hidden="true"
                />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && results[0]) go(results[0].id);
                        else if (e.key === "Escape") {
                            setOpen(false);
                            inputRef.current?.blur();
                        }
                    }}
                    placeholder="Search your dashboard…"
                    className="min-w-0 flex-1 bg-transparent text-sm text-primary outline-none placeholder:text-placeholder"
                />
            </div>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.14 }}
                        className="absolute top-full left-1/2 z-30 mt-2 w-full max-w-md -translate-x-1/2 overflow-hidden rounded-2xl bg-primary shadow-2xl ring-1 ring-secondary"
                    >
                        <div className="max-h-[50vh] overflow-y-auto p-2">
                            {results.length === 0 ? (
                                <p className="px-4 py-6 text-center text-sm text-tertiary">No matches for “{query}”</p>
                            ) : (
                                results.map((h, i) => (
                                    <button
                                        key={`${h.id}-${i}`}
                                        type="button"
                                        onClick={() => go(h.id)}
                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-secondary transition duration-100 ease-linear hover:bg-secondary hover:text-primary"
                                    >
                                        <span className="flex-1 truncate">{h.label}</span>
                                        {h.sub && <span className="shrink-0 truncate text-xs text-quaternary">{h.sub}</span>}
                                    </button>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/**
 * Side-menu item. Matches the Untitled UI nav language from
 * components/application/app-navigation (h-9 target, rounded-md, semibold label,
 * focus-visible ring) but renders a real <button>: these switch an in-page
 * section, not a route, and NavItemBase renders an <a role="link"> which would
 * announce navigation that never happens.
 */
export const SectionNavItem = ({
    icon: Icon,
    label,
    current,
    disabled,
    badge,
    indent,
    onClick,
    action,
}: {
    /** Optional: numbered rows in the funnel groups carry a number instead, and an
     *  icon beside it is one redundant marker too many. */
    icon?: FC<{ className?: string }>;
    label: string;
    current: boolean;
    disabled?: boolean;
    /** Real state for this section — a count, "Done", etc. */
    badge?: ReactNode;
    indent?: boolean;
    onClick: () => void;
    /** Edit-mode control (the per-client eye toggle), rendered OUTSIDE the row button:
     *  a <button> nested in a <button> is invalid HTML and its click would bubble into
     *  the row's own handler, switching section on every toggle. */
    action?: ReactNode;
}) => (
    <div className="relative flex items-center">
        <button
            type="button"
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            aria-current={current ? "page" : undefined}
            className={cx(
                "group/item relative flex min-h-9 w-full cursor-pointer items-center rounded-md p-2 text-left outline-focus-ring transition duration-100 ease-linear select-none focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2",
                indent && "pl-4",
                action && "pr-8",
                // The rail sits on bg-secondary, so a row lifts by moving TOWARD the
                // content colour. bg-secondary here would be invisible — same value as
                // the rail — which is what it was before the rail was darkened.
                current ? "bg-primary" : "hover:bg-primary",
                disabled && "cursor-not-allowed opacity-60 hover:bg-transparent",
            )}
        >
            {Icon && (
                <Icon
                    aria-hidden="true"
                    className={cx(
                        "mr-2 size-5 shrink-0 transition-inherit-all",
                        current ? "text-fg-brand-primary" : "text-fg-quaternary group-hover/item:text-fg-quaternary_hover",
                    )}
                />
            )}
            <span
                className={cx(
                    // Weight carries the state, not just colour: only the open row is
                    // semibold. Everything semibold means nothing is emphasised.
                    "flex-1 truncate text-sm transition-inherit-all",
                    current ? "font-semibold text-primary" : "font-normal text-secondary group-hover/item:text-secondary_hover",
                )}
            >
                {label}
            </span>
            {badge}
        </button>
        {action && <div className="absolute right-1 flex shrink-0 items-center">{action}</div>}
    </div>
);
