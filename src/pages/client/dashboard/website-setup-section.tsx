/**
 * The Website Setup Guide section body.
 *
 * Two cards. The first asks every client for a Netlify account — required, because Netlify
 * is where we host whatever we build for them. The second offers the AI-built direct booking
 * website: a short pitch and a yes/no. A yes swaps the pitch for the list of accounts the
 * site needs them to own (Supabase, Resend, Stripe, PMS, registrar, Cloudflare) plus the
 * web address and notes; a no folds it down to one line they can reopen.
 *
 * Who can type: the client always (their answers save through the website-setup function),
 * the team only in edit mode (saved with the ordinary Save button). A team member viewing a
 * locked dashboard sees the client's answers as read-only prose, like every other section.
 *
 * What is NOT asked for here, on purpose: passwords and API keys. The dashboard row is
 * readable with the public anon key, so the section collects account emails only and sends
 * the client to their own password-gated owner guide for the logins themselves.
 */
import type { ReactNode } from "react";
import { CheckCircle, LinkExternal01, Lock01 } from "@untitledui-pro/icons/line";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { ProgressBar } from "@/components/base/progress-indicators/progress-indicators";
import { editInput } from "@/pages/client/dashboard/dashboard-chrome";
import { filled } from "@/pages/client/dashboard/dashboard-model";
import {
    NETLIFY_SIGNUP_URL,
    OWNER_GUIDE_TEMPLATE_URL,
    SETUP_ACCOUNTS,
    type WebsiteSetup,
    type WebsiteSetupAccountId,
    accountState,
    websiteSetupProgress,
} from "@/pages/client/dashboard/website-setup";
import { cx } from "@/utils/cx";

export type WebsiteSetupSaveState = "idle" | "saving" | "saved" | "error";

/** A labelled value: an input when the viewer may type, prose when they may not. */
const Field = ({
    label,
    hint,
    value,
    placeholder,
    rows,
    editable,
    onChange,
    className,
}: {
    label: string;
    hint?: string;
    value: string;
    placeholder?: string;
    rows?: number;
    editable: boolean;
    onChange: (v: string) => void;
    className?: string;
}) => (
    <div className={className}>
        <p className="text-sm font-medium text-secondary">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-quaternary">{hint}</p>}
        {!editable ? (
            <p className={cx("mt-1 text-md whitespace-pre-wrap", filled(value) ? "text-tertiary" : "text-quaternary italic")}>
                {filled(value) ? value : "Not filled in"}
            </p>
        ) : rows ? (
            <textarea
                rows={rows}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={cx(editInput(), "mt-1.5 resize-y")}
            />
        ) : (
            <input type="text" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className={cx(editInput(), "mt-1.5")} />
        )}
    </div>
);

const Card = ({ title, badge, children }: { title: string; badge: ReactNode; children: ReactNode }) => (
    <section className="rounded-2xl bg-primary p-5 shadow-xs ring-1 ring-secondary md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <h3 className="text-lg font-semibold text-primary">{title}</h3>
            {badge}
        </div>
        {children}
    </section>
);

const DoneBadge = ({ done, todo = "To do" }: { done: boolean; todo?: string }) =>
    done ? (
        <BadgeWithDot color="success" size="sm" type="pill-color">
            Done
        </BadgeWithDot>
    ) : (
        <BadgeWithDot color="brand" size="sm" type="pill-color">
            {todo}
        </BadgeWithDot>
    );

export const WebsiteSetupSection = ({
    setup,
    onChange,
    editable,
    isTeam,
    ownerGuideSlug,
    saveState,
    saveError,
}: {
    setup: WebsiteSetup;
    onChange: (patch: Partial<WebsiteSetup>) => void;
    /** The viewer may type: a client always, the team only in edit mode. */
    editable: boolean;
    isTeam: boolean;
    /** This client's own owner guide, once the team has created it. Empty ⇒ not yet. */
    ownerGuideSlug: string;
    /** The client's save-through-the-function state. Ignored for the team. */
    saveState: WebsiteSetupSaveState;
    saveError?: string;
}) => {
    const progress = websiteSetupProgress(setup);
    const setAccount = (id: WebsiteSetupAccountId, patch: Partial<{ value: string; done: boolean }>) =>
        onChange({ accounts: { ...setup.accounts, [id]: { ...accountState(setup, id), ...patch } } });

    const ownGuideUrl = ownerGuideSlug ? `/owner-guide/${ownerGuideSlug}` : "";

    return (
        <div className="mt-3 flex flex-col gap-6">
            <p className="max-w-prose text-md text-tertiary">
                A few accounts need to be in your own name before we can put your website live. Work through this page in your own time — every answer saves as
                you go.
            </p>

            {/* Progress — derived, so it always agrees with the cards below. */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="min-w-48 flex-1">
                    <ProgressBar value={Math.round((progress.done / progress.total) * 100)} />
                </div>
                <span className="text-sm font-semibold text-secondary tabular-nums">
                    {progress.done} of {progress.total} done
                </span>
            </div>

            {/* ── 1. Netlify — required of every client ── */}
            <Card
                title="Netlify hosting account"
                badge={
                    <div className="flex items-center gap-2">
                        <Badge color="warning" size="sm" type="pill-color">
                            Required
                        </Badge>
                        <DoneBadge done={setup.netlify_done} />
                    </div>
                }
            >
                <p className="mt-2 max-w-prose text-sm text-tertiary">
                    Netlify is where your website lives on the internet. The account has to be yours — registered under your own business email — so you own
                    your site outright and we only ever work inside it.
                </p>
                <ol className="mt-4 grid list-none gap-2.5 p-0">
                    {[
                        "Open Netlify and choose Sign up with email — not GitHub, GitLab or Bitbucket.",
                        "Use your business email address and a password of your own. Netlify's free plan is all you need.",
                        "Come back here, enter the email you used, and tick the box.",
                    ].map((step, i) => (
                        <li key={step} className="flex gap-3 text-sm text-secondary">
                            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-[11px] font-bold text-quaternary tabular-nums">
                                {i + 1}
                            </span>
                            <span className="pt-0.5">{step}</span>
                        </li>
                    ))}
                </ol>
                <div className="mt-4">
                    <Button size="sm" color="secondary" href={NETLIFY_SIGNUP_URL} target="_blank" rel="noopener noreferrer" iconTrailing={LinkExternal01}>
                        Open Netlify
                    </Button>
                </div>
                <div className="mt-5 grid gap-4 border-t border-secondary pt-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                    <Field
                        label="Netlify account email"
                        value={setup.netlify_email}
                        placeholder="you@yourbusiness.com"
                        editable={editable}
                        onChange={(v) => onChange({ netlify_email: v })}
                    />
                    <Checkbox
                        size="sm"
                        className="md:pb-2"
                        isSelected={setup.netlify_done}
                        isDisabled={!editable}
                        onChange={(v) => onChange({ netlify_done: v })}
                        label="I've created my Netlify account"
                    />
                </div>
            </Card>

            {/* ── 2. The AI website — opt-in ── */}
            <Card
                title="AI-built direct booking website"
                badge={
                    setup.ai_website === "yes" ? (
                        <DoneBadge
                            done={progress.complete && setup.netlify_done}
                            todo={`${SETUP_ACCOUNTS.filter((a) => accountState(setup, a.id).done).length}/${SETUP_ACCOUNTS.length} accounts`}
                        />
                    ) : setup.ai_website === "no" ? (
                        <Badge color="gray" size="sm" type="pill-color">
                            Not right now
                        </Badge>
                    ) : (
                        <Badge color="gray" size="sm" type="pill-color">
                            Optional
                        </Badge>
                    )
                }
            >
                {setup.ai_website !== "yes" && (
                    <>
                        <p className="mt-2 max-w-prose text-sm text-tertiary">
                            Your own booking website, built by our web team with AI and connected to your property management system. Guests book and pay you
                            directly, with no platform fee in between.
                        </p>
                        <ul className="mt-4 grid list-none gap-2 p-0 sm:grid-cols-2">
                            {[
                                "Live availability and rates from your PMS",
                                "Card payments straight to your Stripe account",
                                "Booking confirmations sent from your own domain",
                                "Every account stays in your name — no lock-in",
                            ].map((line) => (
                                <li key={line} className="flex items-start gap-2 text-sm text-secondary">
                                    <CheckCircle className="mt-0.5 size-4 shrink-0 text-fg-brand-secondary" aria-hidden="true" />
                                    {line}
                                </li>
                            ))}
                        </ul>
                        {/* The template is team-gated, so the preview link is only ever shown to the team. */}
                        {isTeam && (
                            <div className="mt-4">
                                <Button
                                    size="sm"
                                    color="link-color"
                                    href={OWNER_GUIDE_TEMPLATE_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    iconTrailing={LinkExternal01}
                                >
                                    Open the master owner guide (team)
                                </Button>
                            </div>
                        )}
                    </>
                )}

                {setup.ai_website === "" && (
                    <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-secondary pt-5">
                        <p className="mr-auto text-sm font-medium text-secondary">Would you like us to build one for you?</p>
                        <Button size="sm" color="secondary" isDisabled={!editable} onClick={() => onChange({ ai_website: "no" })}>
                            Not right now
                        </Button>
                        <Button size="sm" isDisabled={!editable} onClick={() => onChange({ ai_website: "yes" })}>
                            Yes, I'd like one
                        </Button>
                    </div>
                )}

                {setup.ai_website === "no" && (
                    <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-secondary pt-5">
                        <p className="mr-auto text-sm text-tertiary">
                            No problem — nothing else is needed from you on this page. You can change your mind any time.
                        </p>
                        <Button size="sm" color="secondary" isDisabled={!editable} onClick={() => onChange({ ai_website: "yes" })}>
                            Actually, I'd like one
                        </Button>
                    </div>
                )}

                {setup.ai_website === "yes" && (
                    <>
                        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
                            <p className="max-w-prose text-sm text-tertiary">
                                Great. Your site runs on a handful of services, and each one needs an account in your name so you own it. Create each account
                                below, enter the email you used, and tick it off. Existing accounts are fine — just tell us which.
                            </p>
                            {editable && (
                                <button
                                    type="button"
                                    onClick={() => onChange({ ai_website: "no" })}
                                    className="shrink-0 text-xs font-semibold text-tertiary transition duration-100 ease-linear hover:text-primary"
                                >
                                    Changed your mind?
                                </button>
                            )}
                        </div>

                        <ol className="mt-5 grid list-none gap-0 p-0">
                            {SETUP_ACCOUNTS.map((acct, i) => {
                                const state = accountState(setup, acct.id);
                                return (
                                    <li
                                        key={acct.id}
                                        className="grid gap-4 border-t border-secondary py-5 first:border-t-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
                                    >
                                        <div className="flex gap-3">
                                            <span
                                                className={cx(
                                                    "grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-bold tabular-nums",
                                                    state.done ? "bg-brand-solid text-white" : "bg-secondary text-quaternary",
                                                )}
                                            >
                                                {state.done ? <CheckCircle className="size-4" aria-hidden="true" /> : i + 1}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-primary">{acct.name}</p>
                                                <p className="mt-1 text-sm text-tertiary">{acct.what}</p>
                                                {acct.signupUrl && (
                                                    <div className="mt-2.5">
                                                        <Button
                                                            size="sm"
                                                            color="link-color"
                                                            href={acct.signupUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            iconTrailing={LinkExternal01}
                                                        >
                                                            {acct.signupLabel}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-3 md:pl-2">
                                            <Field
                                                label={acct.valueLabel}
                                                value={state.value}
                                                placeholder={acct.valuePlaceholder}
                                                editable={editable}
                                                onChange={(v) => setAccount(acct.id, { value: v })}
                                            />
                                            <Checkbox
                                                size="sm"
                                                isSelected={state.done}
                                                isDisabled={!editable}
                                                onChange={(v) => setAccount(acct.id, { done: v })}
                                                label={`${acct.name} account is ready`}
                                            />
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>

                        <div className="grid gap-4 border-t border-secondary pt-5">
                            <Field
                                label="Web address for the site"
                                hint="The domain you'd like guests to type — one you already own, or one you'd like us to help register."
                                value={setup.domain}
                                placeholder="www.yourproperty.com"
                                editable={editable}
                                onChange={(v) => onChange({ domain: v })}
                            />
                            <Field
                                label="Anything else the web team should know"
                                hint="Existing website to replace, several properties or brands, a second Stripe account, a launch date you're working to."
                                value={setup.notes}
                                rows={3}
                                editable={editable}
                                onChange={(v) => onChange({ notes: v })}
                            />
                        </div>

                        {/* Hand-over of the logins themselves — in the gated guide, never here. */}
                        <div className="mt-5 flex flex-col gap-3 rounded-xl bg-secondary p-4 sm:flex-row sm:items-center">
                            <Lock01 className="size-5 shrink-0 text-fg-quaternary" aria-hidden="true" />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-secondary">Never type a password on this page.</p>
                                <p className="mt-0.5 text-sm text-tertiary">
                                    {ownGuideUrl
                                        ? "The logins themselves are handed over in your private Website Setup Guide, which only opens with the password your Account Manager gave you."
                                        : isTeam
                                          ? "No owner guide exists for this client yet — create one from the master template so they have somewhere to hand over the logins."
                                          : "Once your accounts are ready, your Account Manager will send you a private, password-protected link for handing over the logins."}
                                </p>
                            </div>
                            {ownGuideUrl ? (
                                <Button size="sm" color="secondary" href={ownGuideUrl} iconTrailing={LinkExternal01}>
                                    Open my Website Setup Guide
                                </Button>
                            ) : (
                                isTeam && (
                                    <Button
                                        size="sm"
                                        color="secondary"
                                        href={`${OWNER_GUIDE_TEMPLATE_URL}?create=1`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        iconTrailing={LinkExternal01}
                                    >
                                        Create their guide
                                    </Button>
                                )
                            )}
                        </div>
                    </>
                )}
            </Card>

            {/* Save state — only the client saves from here; the team saves the whole dashboard. */}
            {!isTeam && saveState !== "idle" && (
                <p className={cx("text-xs", saveState === "error" ? "text-error-primary" : "text-quaternary")} role="status">
                    {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : `Couldn't save — ${saveError ?? "please try again."}`}
                </p>
            )}
            {isTeam && editable && (
                <p className="text-xs text-quaternary">Answers here are saved with the dashboard's Save button, like every other section.</p>
            )}
        </div>
    );
};
