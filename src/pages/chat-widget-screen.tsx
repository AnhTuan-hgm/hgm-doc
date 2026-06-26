import { type ReactNode, useEffect, useState } from "react";
import { AlertTriangle, Check, Copy01, Globe01, Lock01, LockUnlocked01, Mail01, Plus, XClose } from "@untitledui-pro/icons/line";
import { useNavigate, useSearchParams } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/base/buttons/button";
import { useClipboard } from "@/hooks/use-clipboard";
import { cx } from "@/utils/cx";
import { supabase } from "@/lib/supabase";

const PASSWORD = "ANHTUAN";
const SUPPORT_EMAIL = "leshan@hiddengem.media";
const DEFAULT_WIDGET_ID = "6a3d7d7a8ac627665404ad8b";

function slugify(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

const buildScript = (widgetId: string) =>
    `<script src="https://widgets.leadconnectorhq.com/loader.js" data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js" data-widget-id="${widgetId}"></script>`;

/** Uppercase, brand-tinted section label with a hairline underline. */
const SectionHeading = ({ children }: { children: ReactNode }) => (
    <h2 className="mb-4 border-b border-secondary pb-2.5 text-xs font-semibold tracking-[0.06em] text-brand-secondary uppercase">
        {children}
    </h2>
);

/** Numbered step container with a circular brand badge. */
const StepCard = ({ number, title, children }: { number: number; title: string; children: ReactNode }) => (
    <section className="mb-8">
        <div className="mb-3.5 flex items-center gap-4">
            <span className="flex size-7.5 shrink-0 items-center justify-center rounded-full bg-brand-solid text-sm font-semibold text-white">
                {number}
            </span>
            <h3 className="text-xl font-semibold tracking-tight text-primary">{title}</h3>
        </div>
        <div className="pl-11.5">{children}</div>
    </section>
);

const ChecklistItem = ({ children }: { children: ReactNode }) => (
    <li className="flex items-start gap-3">
        <Check aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-fg-success-primary" strokeWidth={2.2} />
        <span className="text-md leading-relaxed text-secondary">{children}</span>
    </li>
);

const TipRow = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="flex flex-col gap-1.5 px-5 py-4 not-last:border-b not-last:border-secondary sm:flex-row sm:gap-4">
        <div className="text-sm font-semibold text-primary sm:basis-40 sm:shrink-0">{label}</div>
        <div className="flex-1 text-sm leading-relaxed text-tertiary">{children}</div>
    </div>
);

export interface ChatWidgetPageProps {
    /** Page slug — when set, locking persists edits to chatwidget_pages (shared). */
    slug?: string;
    /** Only the master template page (/chat-widget) shows the "+" create button. */
    isTemplate?: boolean;
    initialClientName?: string;
    initialClientWebsite?: string;
    initialWidgetId?: string;
}

export const ChatWidgetScreen = ({
    slug,
    isTemplate = false,
    initialClientName = "",
    initialClientWebsite = "",
    initialWidgetId = DEFAULT_WIDGET_ID,
}: ChatWidgetPageProps) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { copied, copy } = useClipboard();

    const isClientPage = !!slug;

    // Lock / edit state
    const [isLocked, setIsLocked] = useState(true);
    const [showUnlock, setShowUnlock] = useState(false);
    const [unlockPassword, setUnlockPassword] = useState("");
    const [unlockError, setUnlockError] = useState(false);
    const [saving, setSaving] = useState(false);

    // Editable content
    const [clientName, setClientName] = useState(initialClientName);
    const [clientWebsite, setClientWebsite] = useState(initialClientWebsite);
    const [widgetId, setWidgetId] = useState(initialWidgetId || DEFAULT_WIDGET_ID);

    // Create wizard
    const [showCreate, setShowCreate] = useState(false);
    const [newClientName, setNewClientName] = useState("");
    const [newClientWebsite, setNewClientWebsite] = useState("");
    const [newWidgetId, setNewWidgetId] = useState(DEFAULT_WIDGET_ID);
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState("");

    const script = buildScript(widgetId.trim() || DEFAULT_WIDGET_ID);

    const saveToDb = async () => {
        if (!slug) return true;
        const { error } = await supabase.from("chatwidget_pages").upsert(
            { slug, client_name: clientName, client_website: clientWebsite, widget_id: widgetId.trim() },
            { onConflict: "slug" },
        );
        return !error;
    };

    const handleLockClick = async () => {
        if (isLocked) {
            setShowUnlock(true);
            setUnlockPassword("");
            setUnlockError(false);
            return;
        }
        if (isClientPage) {
            setSaving(true);
            await saveToDb();
            setSaving(false);
        }
        setIsLocked(true);
    };

    const handleUnlock = () => {
        if (unlockPassword === PASSWORD) {
            setIsLocked(false);
            setShowUnlock(false);
            setUnlockPassword("");
            setUnlockError(false);
        } else {
            setUnlockError(true);
        }
    };

    const openCreate = () => {
        setShowCreate(true);
        setNewClientName("");
        setNewClientWebsite("");
        setNewWidgetId(DEFAULT_WIDGET_ID);
        setCreateError("");
    };

    const newSlug = newClientName.trim() ? `${slugify(newClientName)}-chatwidget` : "";

    const handleCreate = async () => {
        if (!newSlug) return;
        setIsCreating(true);
        setCreateError("");
        const { error } = await supabase.from("chatwidget_pages").upsert(
            {
                slug: newSlug,
                client_name: newClientName.trim(),
                client_website: newClientWebsite.trim(),
                widget_id: (newWidgetId.trim() || DEFAULT_WIDGET_ID),
            },
            { onConflict: "slug" },
        );
        setIsCreating(false);
        if (error) {
            console.error("[chatwidget create] Supabase error:", error);
            setCreateError(error.message || "Could not save — check your connection and try again.");
            return;
        }
        setShowCreate(false);
        navigate(`/${newSlug}`);
    };

    // Auto-open the create wizard when arriving via "+ New Guide" (?create=1) on the master page.
    useEffect(() => {
        if (!isClientPage && searchParams.get("create") === "1") setShowCreate(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Lock background scroll while a modal is open.
    useEffect(() => {
        const open = showCreate || showUnlock;
        document.body.style.overflow = open ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [showCreate, showUnlock]);

    const editFieldClass = (extra?: string) =>
        cx(
            "rounded-lg border bg-transparent px-3 py-1.5 text-sm text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear",
            isLocked
                ? "pointer-events-none cursor-default border-transparent opacity-60"
                : "border-secondary focus:border-brand focus:ring-1 focus:ring-brand",
            extra,
        );

    return (
        <main className="min-h-dvh bg-secondary py-8 sm:py-12">
            <motion.article
                className="mx-auto max-w-[816px] rounded-2xl border border-secondary bg-primary px-6 py-12 shadow-xs sm:px-12 sm:py-16"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
                {/* Header */}
                <header className="mb-10">
                    {/* Top row: eyebrow (left) + client website (top-right corner of the document) */}
                    <div className="mb-3.5 flex items-start justify-between gap-4">
                        <p className="font-mono text-xs font-semibold tracking-[0.08em] text-brand-secondary uppercase">
                            Installation guide
                        </p>
                        {(clientWebsite || !isLocked) && (
                            <div className="flex shrink-0 items-center gap-1.5">
                                <Globe01 aria-hidden="true" className="size-3.5 text-quaternary" />
                                {isLocked ? (
                                    <a
                                        href={`https://${clientWebsite.replace(/^https?:\/\//, "")}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="font-mono text-xs text-tertiary transition hover:text-brand-secondary"
                                    >
                                        {clientWebsite.replace(/^https?:\/\//, "")}
                                    </a>
                                ) : (
                                    <input
                                        type="text"
                                        value={clientWebsite}
                                        onChange={(e) => setClientWebsite(e.target.value)}
                                        placeholder="client-website.com"
                                        className={editFieldClass("w-44 text-right font-mono text-xs text-tertiary")}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                    <h1 className="mb-3.5 text-display-sm font-semibold tracking-tight text-primary md:text-display-md">
                        Chat widget installation guide
                    </h1>
                    <p className="flex flex-wrap items-center gap-1.5 text-md text-tertiary">
                        Prepared by HiddenGem Media
                        {(clientName || !isLocked) && (
                            <>
                                <span className="text-quaternary">for</span>
                                <input
                                    type="text"
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                    readOnly={isLocked}
                                    placeholder="client name"
                                    className={editFieldClass("min-w-32 font-medium text-secondary")}
                                />
                            </>
                        )}
                    </p>
                </header>

                {/* Overview */}
                <SectionHeading>Overview</SectionHeading>
                <p className="mb-3.5 text-md leading-relaxed text-balance text-secondary">
                    This guide explains how to add a live chat widget to your Wix website. Once installed, a chat bubble
                    will appear on every page of your site, letting visitors start a conversation with your team
                    instantly.
                </p>
                <p className="mb-9 text-md leading-relaxed text-balance text-secondary">
                    No coding experience is needed. The whole process takes about{" "}
                    <strong className="font-semibold text-primary">2 minutes</strong>.
                </p>

                {/* Before you begin */}
                <SectionHeading>Before you begin</SectionHeading>
                <div className="mb-10 rounded-xl border border-secondary bg-secondary p-5">
                    <p className="mb-3.5 text-sm font-semibold text-primary">Make sure you have:</p>
                    <ul className="flex flex-col gap-3">
                        <ChecklistItem>Admin access to your Wix account</ChecklistItem>
                        <ChecklistItem>The widget script code provided in Step 2 below</ChecklistItem>
                    </ul>
                </div>

                {/* Step 1 */}
                <StepCard number={1} title="Open Custom Code settings">
                    <p className="mb-3.5 text-sm text-quaternary italic">
                        Wix lets you add custom scripts site-wide through the Dashboard settings.
                    </p>
                    <ol className="mb-3.5 list-decimal space-y-1 pl-5 text-md leading-relaxed text-secondary">
                        <li>
                            Log in to your Wix account and go to your site{" "}
                            <strong className="font-semibold text-primary">Dashboard</strong>.
                        </li>
                        <li>
                            In the left sidebar, click <strong className="font-semibold text-primary">Settings</strong>.
                        </li>
                        <li>
                            Scroll down and click <strong className="font-semibold text-primary">Custom Code</strong>{" "}
                            (under the Advanced section).
                        </li>
                    </ol>
                    <p className="text-sm text-tertiary">
                        You will see a <strong className="font-semibold text-secondary">Custom Code</strong> page where
                        scripts can be added to your site head, body, or footer.
                    </p>
                </StepCard>

                {/* Step 2 */}
                <StepCard number={2} title="Add the widget script">
                    <p className="mb-4 text-md leading-relaxed text-secondary">
                        Copy the script below, then click{" "}
                        <strong className="font-semibold text-primary">+ Add Custom Code</strong> on the Custom Code page
                        and paste it into the code field. Use the{" "}
                        <strong className="font-semibold text-primary">Copy</strong> button for a clean one-click copy.
                    </p>

                    {/* Widget ID — editable when unlocked */}
                    {!isLocked && (
                        <div className="mb-3.5 flex flex-col gap-1.5 rounded-xl border border-dashed border-brand bg-brand-primary/40 p-3">
                            <label className="text-xs font-semibold text-brand-secondary">
                                Widget ID (client-specific)
                            </label>
                            <input
                                type="text"
                                value={widgetId}
                                onChange={(e) => setWidgetId(e.target.value)}
                                placeholder={DEFAULT_WIDGET_ID}
                                spellCheck={false}
                                className="w-full rounded-lg border border-secondary bg-primary px-3 py-1.5 font-mono text-xs text-primary outline-none transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand"
                            />
                            <p className="text-xs text-tertiary">The script below updates automatically.</p>
                        </div>
                    )}

                    <div className="mb-3.5 overflow-hidden rounded-xl bg-primary-solid">
                        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5">
                            <span className="font-mono text-xs text-white/60">Widget script — paste entire contents</span>
                            <Button
                                size="sm"
                                color="tertiary"
                                iconLeading={copied ? Check : Copy01}
                                onClick={() => copy(script)}
                                className="text-white/80 hover:text-white"
                            >
                                {copied ? "Copied" : "Copy"}
                            </Button>
                        </div>
                        <pre className="overflow-x-auto px-4 py-3.5">
                            <code className="font-mono text-xs leading-relaxed whitespace-pre-wrap text-gray-300">
                                {script.split(widgetId.trim() || DEFAULT_WIDGET_ID).flatMap((part, i) =>
                                    i === 0
                                        ? [part]
                                        : [
                                              <span key={i} className="rounded bg-amber-400/15 px-1 text-amber-300">
                                                  {widgetId.trim() || DEFAULT_WIDGET_ID}
                                              </span>,
                                              part,
                                          ],
                                )}
                            </code>
                        </pre>
                    </div>

                    <p className="mb-4 text-xs leading-relaxed text-quaternary">
                        The widget ID shown is unique to your HiddenGem Media account. Paste the script exactly as
                        copied.
                    </p>
                    <ol className="mb-3.5 list-decimal space-y-1 pl-5 text-md leading-relaxed text-secondary">
                        <li>Paste the widget script into the code field.</li>
                        <li>
                            Set the <strong className="font-semibold text-primary">Name</strong> to{" "}
                            <strong className="font-semibold text-primary">LeadConnector Chat Widget</strong>.
                        </li>
                        <li>
                            Under <strong className="font-semibold text-primary">Place Code in</strong>, select{" "}
                            <strong className="font-semibold text-primary">Head</strong>.
                        </li>
                        <li>
                            Under <strong className="font-semibold text-primary">Add Code to Pages</strong>, select{" "}
                            <strong className="font-semibold text-primary">All Pages</strong>.
                        </li>
                        <li>
                            Click <strong className="font-semibold text-primary">Apply</strong>.
                        </li>
                    </ol>
                    <p className="text-sm text-tertiary">
                        The widget will now load on every page of your site automatically.
                    </p>
                </StepCard>

                {/* Step 3 */}
                <StepCard number={3} title="Publish your site">
                    <ol className="mb-3.5 list-decimal space-y-1 pl-5 text-md leading-relaxed text-secondary">
                        <li>
                            Click <strong className="font-semibold text-primary">Publish</strong> in the top-right corner
                            of the Wix Editor or Dashboard.
                        </li>
                        <li>Wait for the publish to complete.</li>
                    </ol>
                    <p className="text-sm text-tertiary">
                        Custom code changes only go live after you publish. The widget will not appear until this step is
                        done.
                    </p>
                </StepCard>

                {/* Step 4 */}
                <StepCard number={4} title="Confirm it is working">
                    <ol className="mb-4 list-decimal space-y-1 pl-5 text-md leading-relaxed text-secondary">
                        <li>Open your website in a new browser tab, or use a Private / Incognito window.</li>
                        <li>
                            Look for the <strong className="font-semibold text-primary">chat bubble icon</strong> in the
                            bottom-right corner of the page.
                        </li>
                        <li>Click it to open the chat window and confirm it loads correctly.</li>
                    </ol>
                    <div className="flex items-start gap-3 rounded-xl border border-warning bg-warning-primary p-4">
                        <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-fg-warning-primary" />
                        <div>
                            <p className="mb-1 text-sm font-semibold text-primary">Widget not showing?</p>
                            <p className="text-sm leading-relaxed text-tertiary">
                                Try a hard refresh: Ctrl+Shift+R on Windows or Cmd+Shift+R on Mac. Make sure you have
                                published your site after adding the code.
                            </p>
                        </div>
                    </div>
                </StepCard>

                {/* Quick tips */}
                <SectionHeading>Quick tips</SectionHeading>
                <div className="mb-10 overflow-hidden rounded-xl border border-secondary">
                    <TipRow label="Must publish">
                        Custom code changes in Wix do not go live until you click Publish. Always publish after saving
                        your code.
                    </TipRow>
                    <TipRow label="Do not edit the ID">
                        The{" "}
                        <code className="rounded bg-brand-primary px-1.5 py-0.5 font-mono text-xs text-brand-secondary">
                            data-widget-id
                        </code>{" "}
                        value is unique to your account. Changing it will break the widget.
                    </TipRow>
                    <TipRow label="Site-wide by default">
                        Setting Add Code to Pages to All Pages means the widget loads everywhere automatically. No need
                        to add it page by page.
                    </TipRow>
                    <TipRow label="Head placement">
                        Placing the script in the Head ensures it loads early, which is the recommended placement for
                        chat widgets.
                    </TipRow>
                </div>

                {/* Need help */}
                <SectionHeading>Need help?</SectionHeading>
                <div className="rounded-2xl bg-brand-solid px-7 py-6">
                    <p className="mb-4.5 text-md leading-relaxed text-balance text-primary_on-brand">
                        If you run into any issues, the HiddenGem Media team is happy to walk you through it — or handle
                        the installation for you.
                    </p>
                    <div className="flex flex-wrap gap-x-7 gap-y-3">
                        <a
                            href={`mailto:${SUPPORT_EMAIL}`}
                            className="flex items-center gap-2.5 text-sm font-semibold text-primary_on-brand transition hover:opacity-80"
                        >
                            <Mail01 aria-hidden="true" className="size-4.5 text-tertiary_on-brand" />
                            {SUPPORT_EMAIL}
                        </a>
                        <a
                            href="https://www.hiddengemmedia.com"
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2.5 text-sm font-semibold text-primary_on-brand transition hover:opacity-80"
                        >
                            <Globe01 aria-hidden="true" className="size-4.5 text-tertiary_on-brand" />
                            www.hiddengemmedia.com
                        </a>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-11 flex items-center justify-between border-t border-secondary pt-4.5 text-xs text-quaternary">
                    <span className="font-semibold text-tertiary">HiddenGem Media</span>
                    <span className="font-mono tracking-[0.04em]">Confidential</span>
                </div>
            </motion.article>

            {/* ── Fixed bottom-right action buttons ── */}
            <div className="fixed right-5 bottom-5 z-40 flex flex-col items-center gap-2">
                {(isTemplate || !isClientPage) && (
                    <button
                        type="button"
                        onClick={openCreate}
                        title="Create a new client guide"
                        className="flex size-10 items-center justify-center rounded-full bg-primary text-quaternary shadow-lg ring-1 ring-secondary transition duration-100 ease-linear hover:bg-secondary hover:text-secondary"
                    >
                        <Plus className="size-4" aria-hidden="true" />
                    </button>
                )}
                <button
                    type="button"
                    onClick={handleLockClick}
                    title={isLocked ? "Unlock content" : "Lock & save"}
                    disabled={saving}
                    className="flex size-10 items-center justify-center rounded-full bg-primary text-quaternary shadow-lg ring-1 ring-secondary transition duration-100 ease-linear hover:bg-secondary hover:text-secondary disabled:opacity-50"
                >
                    {isLocked ? (
                        <Lock01 className="size-4" aria-hidden="true" />
                    ) : (
                        <LockUnlocked01 className="size-4" aria-hidden="true" />
                    )}
                </button>
            </div>

            {/* ── Unlock modal ── */}
            <AnimatePresence>
                {showUnlock && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                    >
                        <motion.div
                            className="w-full max-w-sm rounded-2xl bg-primary p-6 shadow-2xl ring-1 ring-secondary"
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 8 }}
                            transition={{ type: "spring", stiffness: 320, damping: 26 }}
                        >
                            <h3 className="text-md font-semibold text-primary">Unlock Content</h3>
                            <p className="mt-1 text-sm text-tertiary">Enter the password to edit the guide.</p>
                            <div className="mt-4">
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={unlockPassword}
                                    onChange={(e) => {
                                        setUnlockPassword(e.target.value);
                                        setUnlockError(false);
                                    }}
                                    onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                                    ref={(el) => el?.focus({ preventScroll: true })}
                                    className={cx(
                                        "w-full rounded-lg border px-3 py-2 text-sm text-primary outline-none transition duration-100 ease-linear placeholder:text-placeholder",
                                        unlockError
                                            ? "border-error-primary ring-1 ring-error-primary"
                                            : "border-secondary focus:border-brand focus:ring-1 focus:ring-brand",
                                    )}
                                />
                                {unlockError && (
                                    <p className="mt-1.5 text-xs text-error-primary">Incorrect password. Please try again.</p>
                                )}
                            </div>
                            <div className="mt-4 flex gap-3">
                                <Button color="secondary" size="sm" className="flex-1" onClick={() => setShowUnlock(false)}>
                                    Cancel
                                </Button>
                                <Button color="primary" size="sm" className="flex-1" onClick={handleUnlock}>
                                    Unlock
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Create wizard (no password) ── */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                    >
                        <motion.div
                            className="max-h-full w-full max-w-md overflow-y-auto rounded-2xl bg-primary p-6 shadow-2xl ring-1 ring-secondary"
                            initial={{ opacity: 0, scale: 0.94, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 10 }}
                            transition={{ type: "spring", stiffness: 300, damping: 26 }}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-md font-semibold text-primary">Create Chat Widget Guide</h3>
                                    <p className="mt-1 text-sm text-tertiary">
                                        Fill in the details to generate a new client guide.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="flex size-8 items-center justify-center rounded-lg text-tertiary hover:bg-secondary"
                                >
                                    <XClose className="size-4" />
                                </button>
                            </div>

                            <div className="mt-4 flex flex-col gap-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-secondary">Client Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. The Outpost"
                                        value={newClientName}
                                        onChange={(e) => setNewClientName(e.target.value)}
                                        autoFocus
                                        className="w-full rounded-lg border border-secondary px-3 py-2 text-sm text-primary outline-none transition duration-100 ease-linear placeholder:text-placeholder focus:border-brand focus:ring-1 focus:ring-brand"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-secondary">Client Website</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. theoutpost.com"
                                        value={newClientWebsite}
                                        onChange={(e) => setNewClientWebsite(e.target.value)}
                                        className="w-full rounded-lg border border-secondary px-3 py-2 text-sm text-primary outline-none transition duration-100 ease-linear placeholder:text-placeholder focus:border-brand focus:ring-1 focus:ring-brand"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-secondary">Widget ID</label>
                                    <input
                                        type="text"
                                        value={newWidgetId}
                                        onChange={(e) => setNewWidgetId(e.target.value)}
                                        spellCheck={false}
                                        placeholder={DEFAULT_WIDGET_ID}
                                        className="w-full rounded-lg border border-secondary px-3 py-2 font-mono text-xs text-primary outline-none transition duration-100 ease-linear placeholder:text-placeholder focus:border-brand focus:ring-1 focus:ring-brand"
                                    />
                                    <p className="mt-1 text-xs text-tertiary">
                                        The client-specific LeadConnector widget ID. Drives the script in Step 3.
                                    </p>
                                </div>

                                {newSlug && (
                                    <p className="text-xs text-tertiary">
                                        Page URL:{" "}
                                        <span className="font-medium text-brand-secondary">docs-hgm.netlify.app/{newSlug}</span>
                                    </p>
                                )}
                                {createError && <p className="text-xs text-error-primary">{createError}</p>}
                            </div>

                            <div className="mt-5 flex gap-3">
                                <Button color="secondary" size="sm" className="flex-1" onClick={() => setShowCreate(false)} isDisabled={isCreating}>
                                    Cancel
                                </Button>
                                <Button
                                    color="primary"
                                    size="sm"
                                    className="flex-1"
                                    onClick={handleCreate}
                                    isDisabled={!newSlug}
                                    isLoading={isCreating}
                                    showTextWhileLoading
                                >
                                    {isCreating ? "Creating…" : "Create Guide"}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
};
