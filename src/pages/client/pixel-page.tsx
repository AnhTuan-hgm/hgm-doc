import { type ReactNode, useEffect, useState } from "react";
import type { Key } from "react-aria-components";
// Functional UI icons — Untitled UI PRO, line style (drop-in for the free set).
import {
    ArrowRight,
    Check,
    Copy01,
    Lock01,
    LockUnlocked01,
    MessageChatCircle,
    Plus,
    SearchSm,
    XClose,
} from "@untitledui-pro/icons/line";
// Decorative accent — PRO duotone (two-tone) for the info callout.
import { InfoCircle } from "@untitledui-pro/icons/duotone";
import { useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { Tabs } from "@/components/application/tabs/tabs";
import { useClipboard } from "@/hooks/use-clipboard";
import { cx } from "@/utils/cx";
import { PIXEL_CODE as DEFAULT_PIXEL_CODE, platforms } from "@/data/platforms";
import { Reveal } from "@/components/shared-assets/reveal";
import { ImageLightbox } from "@/components/shared-assets/image-lightbox";
import { supabase } from "@/lib/supabase";

const PASSWORD = "ANHTUAN";
const SUPPORT_EMAIL = "anhtuan@hiddengem.media";
const CONTACT_SUBJECT = "Meta Pixel Setup — I'd like some help";
const CONTACT_BODY = `Hi HiddenGem Team,

I'm following the Meta Pixel Setup Guide and could use a hand.

• My website platform:
• What I'm trying to do / where I'm stuck:
• Anything else you should know:

Thanks!`;
const CONTACT_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(CONTACT_SUBJECT)}&body=${encodeURIComponent(CONTACT_BODY)}`;

function slugify(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

const SectionEyebrow = ({ number }: { number: string }) => (
    <div className="flex items-center gap-3">
        <span className="flex size-7 items-center justify-center rounded-md bg-brand-solid text-xs font-semibold text-white tabular-nums">
            {number}
        </span>
        <span className="h-px flex-1 bg-border-secondary" />
    </div>
);

const SectionHeading = ({ children }: { children: ReactNode }) => (
    <h2 className="mt-4 text-display-xs font-semibold text-primary md:text-display-sm">{children}</h2>
);

const HighlightedCode = ({ code }: { code: string }) => (
    <code className="block font-mono text-xs leading-relaxed whitespace-pre-wrap text-gray-300 md:text-sm">
        {code.split("\n").map((line, i) => {
            const isComment = line.trim().startsWith("<!--");
            return (
                <span key={i} className={cx("block", isComment && "text-emerald-400/80")}>
                    {isComment
                        ? line
                        : line.split(/(YOUR_PIXEL_ID|'[^']*'|"[^"]*")/g).map((part, j) => {
                              if (part === "YOUR_PIXEL_ID")
                                  return (
                                      <span key={j} className="rounded bg-amber-400/15 px-1 text-amber-300">
                                          {part}
                                      </span>
                                  );
                              if (/^['"].*['"]$/.test(part))
                                  return (
                                      <span key={j} className="text-sky-300">
                                          {part}
                                      </span>
                                  );
                              return part;
                          })}
                </span>
            );
        })}
    </code>
);

export interface PixelPageProps {
    /** Page slug — when set, locking persists edits to client_pages (shared). */
    slug?: string;
    initialClientName?: string;
    initialClientWebsite?: string;
    initialPixelCode?: string;
    /** Only the template page (/metapixel) shows the “+” create button. */
    isTemplate?: boolean;
}

export const PixelPage = ({
    slug,
    initialClientName = "",
    initialClientWebsite = "",
    initialPixelCode = DEFAULT_PIXEL_CODE,
    isTemplate = false,
}: PixelPageProps) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { copied, copy } = useClipboard();
    const [selectedPlatform, setSelectedPlatform] = useState<Key>("wordpress");

    // Editable content fields
    const [clientName, setClientName] = useState(initialClientName);
    const [clientWebsite, setClientWebsite] = useState(initialClientWebsite);
    const [pixelCode, setPixelCode] = useState(initialPixelCode);

    // Lock state
    const [isLocked, setIsLocked] = useState(true);

    // Image lightbox (click a screenshot to view it full-size)
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

    // Unlock modal
    const [showUnlockModal, setShowUnlockModal] = useState(false);
    const [unlockPassword, setUnlockPassword] = useState("");
    const [unlockError, setUnlockError] = useState(false);

    // Plus wizard
    const [showPlusModal, setShowPlusModal] = useState(false);
    const [plusStep, setPlusStep] = useState<"password" | "details">("password");
    const [plusPassword, setPlusPassword] = useState("");
    const [plusPasswordError, setPlusPasswordError] = useState(false);
    const [newClientName, setNewClientName] = useState("");
    const [newClientWebsite, setNewClientWebsite] = useState("");
    const [newPixelCode, setNewPixelCode] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState("");

    // Auto-open the create wizard when arriving via "+ New Page" (?create=1).
    // The dashboard is already password-gated, so skip straight to client info.
    useEffect(() => {
        if (searchParams.get("create") === "1") {
            setShowPlusModal(true);
            setPlusStep("details");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Lock background scroll while a modal is open.
    useEffect(() => {
        const open = showPlusModal || showUnlockModal;
        document.body.style.overflow = open ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [showPlusModal, showUnlockModal]);

    const handleLockClick = async () => {
        if (isLocked) {
            setShowUnlockModal(true);
            setUnlockPassword("");
            setUnlockError(false);
            return;
        }
        // Locking → persist edits to the shared client_pages row.
        if (slug) {
            const { error } = await supabase
                .from("client_pages")
                .upsert(
                    { slug, client_name: clientName.trim(), client_website: clientWebsite.trim(), pixel_code: pixelCode },
                    { onConflict: "slug" },
                );
            if (error) console.error("[pixel page save] Supabase error:", error);
        }
        setIsLocked(true);
    };

    const handleUnlock = () => {
        if (unlockPassword === PASSWORD) {
            setIsLocked(false);
            setShowUnlockModal(false);
            setUnlockPassword("");
            setUnlockError(false);
        } else {
            setUnlockError(true);
        }
    };

    const handlePlusClick = () => {
        setShowPlusModal(true);
        setPlusStep("password");
        setPlusPassword("");
        setPlusPasswordError(false);
        setNewClientName("");
        setNewClientWebsite("");
        setNewPixelCode("");
        setCreateError("");
    };

    const handlePlusPassword = () => {
        if (plusPassword === PASSWORD) {
            setPlusPasswordError(false);
            setPlusStep("details");
        } else {
            setPlusPasswordError(true);
        }
    };

    const handleCreatePage = async () => {
        const base = slugify(newClientName);
        if (!base) return;
        const slug = `${base}-metapixel`;
        setIsCreating(true);
        setCreateError("");
        const { error } = await supabase.from("client_pages").upsert({
            slug,
            client_name: newClientName.trim(),
            client_website: newClientWebsite.trim(),
            pixel_code: newPixelCode,
        });
        setIsCreating(false);
        if (error) {
            setCreateError("Could not save — check your connection and try again.");
            return;
        }
        setShowPlusModal(false);
        navigate(`/${slug}`);
    };

    const fieldClass = (extra?: string) =>
        cx(
            "rounded-lg border px-3 py-1.5 text-sm text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear",
            "bg-transparent",
            isLocked
                ? "border-transparent cursor-default opacity-60 pointer-events-none"
                : "border-secondary focus:border-brand focus:ring-1 focus:ring-brand",
            extra,
        );

    return (
        <main className="min-h-dvh bg-secondary px-4 py-8 md:px-8 md:py-14">
            <motion.article className="mx-auto max-w-4xl rounded-2xl bg-primary shadow-xl ring-1 ring-secondary md:rounded-3xl"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
                <div className="px-6 py-8 md:px-14 md:py-12">

                    {/* ── Template banner — prompts the team to spin up a client copy. ── */}
                    {isTemplate && (
                        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand/40 bg-brand-50 px-4 py-3 dark:bg-brand-950/30">
                            <div className="flex items-center gap-2.5">
                                <span className="inline-flex items-center rounded-full bg-brand-600 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">Template</span>
                                <p className="text-[13px] font-medium text-brand-800 dark:text-brand-200">
                                    This is the master template. Create a private copy to share with a client.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handlePlusClick}
                                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-solid px-3.5 py-2 text-[13px] font-semibold text-white transition hover:opacity-90"
                            >
                                <Plus className="size-4" aria-hidden="true" />
                                Create client page for the client
                            </button>
                        </div>
                    )}

                    {/* ── Header ── */}
                    <header className="flex items-center justify-between gap-4">
                        {/* Client name — left-aligned */}
                        <input
                            type="text"
                            placeholder="Client Name"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            readOnly={isLocked}
                            className={fieldClass("min-w-0")}
                        />

                        {/* Client website — right-aligned */}
                        <input
                            type="text"
                            placeholder="Client Website"
                            value={clientWebsite}
                            onChange={(e) => setClientWebsite(e.target.value)}
                            readOnly={isLocked}
                            className={fieldClass("min-w-0 text-right")}
                        />
                    </header>

                    {/* ── Title ── */}
                    <div className="mt-10 md:mt-12">
                        <h1 className="text-display-md font-semibold tracking-tight text-primary md:text-display-lg">
                            Meta Pixel Setup Guide
                        </h1>
                        <p className="mt-3 text-md text-tertiary">
                            A step-by-step implementation manual prepared by the HiddenGem Team.
                        </p>
                    </div>

                    {/* ── Section 01 — What is Meta Pixel? ── */}
                    <Reveal className="mt-14">
                        <SectionEyebrow number="01" />
                        <SectionHeading>What is Meta Pixel?</SectionHeading>
                        <p className="mt-4 text-md text-tertiary">
                            The Meta Pixel is a powerful analytical tool that consists of a small piece of code installed in
                            your website's header. It tracks visitor actions, measures the effectiveness of your advertising,
                            and powers high-conversion retargeting campaigns.
                        </p>

                        <div className="mt-5 flex gap-3 rounded-xl bg-brand-50 p-4 ring-1 ring-brand-200 ring-inset">
                            <InfoCircle className="mt-0.5 size-5 shrink-0 text-fg-brand-primary" aria-hidden="true" />
                            <p className="text-sm text-brand-700">
                                <span className="font-semibold">Important Note:</span> Your unique Pixel ID has been generated
                                and configured by the HiddenGem Team. It is already pre-embedded in the code snippet provided
                                in Section 2.
                            </p>
                        </div>
                    </Reveal>

                    {/* ── Section 02 — Your Meta Pixel Code ── */}
                    <Reveal className="mt-14">
                        <SectionEyebrow number="02" />
                        <SectionHeading>Your Meta Pixel Code</SectionHeading>
                        <p className="mt-4 text-md text-tertiary">
                            Copy the code below and share it with your web developer, or follow this guide in Section 3 to
                            add it yourself.
                        </p>

                        <div className="mt-5 overflow-hidden rounded-xl bg-gray-950 ring-1 ring-gray-800 ring-inset">
                            {/* Toolbar */}
                            <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2.5">
                                <div className="flex items-center gap-1.5">
                                    <span className="size-3 rounded-full bg-[#ff5f57]" />
                                    <span className="size-3 rounded-full bg-[#febc2e]" />
                                    <span className="size-3 rounded-full bg-[#28c840]" />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => copy(pixelCode, "pixel")}
                                    className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-gray-300 transition duration-100 ease-linear hover:bg-white/10 hover:text-white"
                                >
                                    {copied === "pixel" ? <Check className="size-3.5" /> : <Copy01 className="size-3.5" />}
                                    {copied === "pixel" ? "Copied!" : "Copy Code"}
                                </button>
                            </div>

                            {/* Code area — editable textarea when unlocked, syntax-highlighted when locked */}
                            <div className="overflow-x-auto p-4 md:p-5">
                                {isLocked ? (
                                    <HighlightedCode code={pixelCode} />
                                ) : (
                                    <textarea
                                        value={pixelCode}
                                        onChange={(e) => setPixelCode(e.target.value)}
                                        rows={pixelCode.split("\n").length}
                                        spellCheck={false}
                                        className="block w-full resize-none bg-transparent font-mono text-xs leading-relaxed text-gray-300 outline-none md:text-sm"
                                    />
                                )}
                            </div>
                        </div>
                    </Reveal>

                    {/* ── Section 03 — Platform Instructions ── */}
                    <Reveal className="mt-14">
                        <SectionEyebrow number="03" />
                        <SectionHeading>How to Add the Code to Your Website</SectionHeading>

                        <Tabs selectedKey={selectedPlatform} onSelectionChange={setSelectedPlatform} className="mt-6 gap-0">
                            <p className="text-sm font-semibold text-primary">Step 1: Choose your website platform</p>
                            <div className="sticky top-0 z-30 -mx-6 mt-3 border-b border-secondary bg-primary px-6 py-3 md:-mx-14 md:px-14">
                                <Tabs.List type="button-border" size="md" className="flex-wrap">
                                    {platforms.map((platform) => (
                                        <Tabs.Item key={platform.id} id={platform.id} icon={platform.icon}>
                                            {platform.name}
                                        </Tabs.Item>
                                    ))}
                                </Tabs.List>
                            </div>

                            <p className="mt-7 text-sm font-semibold text-primary">Step 2: Follow this instruction</p>

                            {platforms.map((platform) => (
                                <Tabs.Panel key={platform.id} id={platform.id} className="mt-3">
                                    <div className="rounded-xl p-5 ring-1 ring-secondary md:p-6">
                                        <div className="flex items-center gap-2.5">
                                            <FeaturedIcon icon={platform.icon} size="sm" color="brand" theme="light" />
                                            <h3 className="text-md font-semibold text-primary">{platform.name}</h3>
                                        </div>
                                        <ol className="mt-4 flex flex-col gap-2.5">
                                            {platform.steps.map((step, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-md bg-brand-50 text-xs font-semibold text-brand-700 tabular-nums">
                                                        {i + 1}
                                                    </span>
                                                    <span className="text-sm text-tertiary">{step}</span>
                                                </li>
                                            ))}
                                        </ol>
                                        {platform.image && (
                                            <button
                                                type="button"
                                                onClick={() => setLightboxSrc(platform.image!)}
                                                title="Click to view full size"
                                                className="group relative mt-5 block w-full cursor-zoom-in overflow-hidden rounded-lg ring-1 ring-secondary transition duration-100 ease-linear hover:ring-brand"
                                            >
                                                <img
                                                    src={platform.image}
                                                    alt={`${platform.name} pixel setup screenshot`}
                                                    className="w-full object-contain"
                                                    loading="lazy"
                                                />
                                                <span className="pointer-events-none absolute right-2.5 top-2.5 flex items-center gap-1 rounded-md bg-black/55 px-2 py-1 text-xs font-medium text-white opacity-0 backdrop-blur-sm transition duration-100 ease-linear group-hover:opacity-100">
                                                    <SearchSm className="size-3.5" aria-hidden="true" /> View
                                                </span>
                                            </button>
                                        )}
                                    </div>
                                </Tabs.Panel>
                            ))}
                        </Tabs>
                    </Reveal>

                    {/* ── Still need support? ── */}
                    <Reveal className="mt-16">
                        <div className="flex items-center gap-3">
                            <FeaturedIcon icon={MessageChatCircle} size="sm" color="brand" theme="dark" />
                            <span className="h-px flex-1 bg-border-secondary" />
                        </div>
                        <h2 className="mt-4 text-display-xs font-semibold text-primary md:text-display-sm">
                            Still need support?
                        </h2>

                        <div className="mt-5 rounded-2xl bg-secondary px-6 py-8 text-center md:px-10 md:py-10">
                            <h3 className="text-lg font-semibold text-primary">Contact us</h3>
                            <p className="mx-auto mt-2 max-w-md text-sm text-tertiary">
                                Our team is here to help. Reach out to HiddenGem if you have any questions about the process.
                            </p>
                            <div className="mt-5 flex justify-center">
                                <Button href={CONTACT_MAILTO} size="lg" color="primary" iconTrailing={ArrowRight}>
                                    Contact HiddenGem Team
                                </Button>
                            </div>
                        </div>
                    </Reveal>

                    {/* ── Footer ── */}
                    <footer className="mt-14 flex justify-center border-t border-secondary pt-6">
                        <a href="https://hiddengem.media/" target="_blank" rel="noopener noreferrer">
                            <img src="/hgm logo/Logo ON LIGHT.svg" alt="HiddenGem Media" className="h-14 opacity-60 transition duration-100 ease-linear hover:opacity-90 dark:hidden" draggable={false} />
                            <img src="/hgm logo/LOGO ON Dark.svg" alt="HiddenGem Media" className="hidden h-14 opacity-70 transition duration-100 ease-linear hover:opacity-100 dark:block" draggable={false} />
                        </a>
                    </footer>
                </div>
            </motion.article>

            {/* ── Fixed bottom-right action buttons ── */}
            <div className="fixed bottom-5 right-5 z-40 flex flex-col items-center gap-2">
                {/* Plus — only on the template page (/metapixel) */}
                {isTemplate && (
                    <button
                        type="button"
                        onClick={handlePlusClick}
                        title="Create new client page"
                        className="flex size-10 items-center justify-center rounded-full bg-primary shadow-lg ring-1 ring-secondary text-quaternary transition duration-100 ease-linear hover:bg-secondary hover:text-secondary"
                    >
                        <Plus className="size-4" aria-hidden="true" />
                    </button>
                )}

                {/* Lock / Unlock */}
                <button
                    type="button"
                    onClick={handleLockClick}
                    title={isLocked ? "Unlock content" : "Lock content"}
                    className="flex size-10 items-center justify-center rounded-full bg-primary shadow-lg ring-1 ring-secondary text-quaternary transition duration-100 ease-linear hover:bg-secondary hover:text-secondary"
                >
                    {isLocked ? (
                        <Lock01 className="size-4" aria-hidden="true" />
                    ) : (
                        <LockUnlocked01 className="size-4" aria-hidden="true" />
                    )}
                </button>
            </div>

            {/* ═══════════════════════════════════════════════
                Unlock Modal
            ════════════════════════════════════════════════ */}
            {showUnlockModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
                    onClick={(e) => e.target === e.currentTarget && setShowUnlockModal(false)}
                >
                    <div className="w-full max-w-sm rounded-2xl bg-primary p-6 shadow-2xl ring-1 ring-secondary">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-md font-semibold text-primary">Unlock Content</h3>
                                <p className="mt-1 text-sm text-tertiary">Enter the password to edit this document.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowUnlockModal(false)}
                                className="flex size-8 items-center justify-center rounded-lg text-tertiary hover:bg-secondary"
                            >
                                <XClose className="size-4" />
                            </button>
                        </div>

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
                                    "w-full rounded-lg border px-3 py-2 text-sm text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear",
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
                            <Button color="secondary" size="sm" className="flex-1" onClick={() => setShowUnlockModal(false)}>
                                Cancel
                            </Button>
                            <Button color="primary" size="sm" className="flex-1" onClick={handleUnlock}>
                                Unlock
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════
                Plus Wizard Modal
            ════════════════════════════════════════════════ */}
            {showPlusModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
                    onClick={(e) => e.target === e.currentTarget && setShowPlusModal(false)}
                >
                    <div className="w-full max-w-sm rounded-2xl bg-primary p-6 shadow-2xl ring-1 ring-secondary">

                        {/* Step 1 — Password */}
                        {plusStep === "password" && (
                            <>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-md font-semibold text-primary">Create Client Page</h3>
                                        <p className="mt-1 text-sm text-tertiary">Enter the admin password to continue.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowPlusModal(false)}
                                        className="flex size-8 items-center justify-center rounded-lg text-tertiary hover:bg-secondary"
                                    >
                                        <XClose className="size-4" />
                                    </button>
                                </div>

                                <div className="mt-4">
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={plusPassword}
                                        onChange={(e) => {
                                            setPlusPassword(e.target.value);
                                            setPlusPasswordError(false);
                                        }}
                                        onKeyDown={(e) => e.key === "Enter" && handlePlusPassword()}
                                        ref={(el) => el?.focus({ preventScroll: true })}
                                        className={cx(
                                            "w-full rounded-lg border px-3 py-2 text-sm text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear",
                                            plusPasswordError
                                                ? "border-error-primary ring-1 ring-error-primary"
                                                : "border-secondary focus:border-brand focus:ring-1 focus:ring-brand",
                                        )}
                                    />
                                    {plusPasswordError && (
                                        <p className="mt-1.5 text-xs text-error-primary">
                                            Incorrect password. Please try again.
                                        </p>
                                    )}
                                </div>

                                <div className="mt-4 flex gap-3">
                                    <Button color="secondary" size="sm" className="flex-1" onClick={() => setShowPlusModal(false)}>
                                        Cancel
                                    </Button>
                                    <Button color="primary" size="sm" className="flex-1" onClick={handlePlusPassword}>
                                        Continue
                                    </Button>
                                </div>
                            </>
                        )}

                        {/* Step 2 — Client details + pixel code (combined) */}
                        {plusStep === "details" && (
                            <>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-md font-semibold text-primary">Create Client Page</h3>
                                        <p className="mt-1 text-sm text-tertiary">Enter the client details and Meta Pixel code.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowPlusModal(false)}
                                        className="flex size-8 items-center justify-center rounded-lg text-tertiary hover:bg-secondary"
                                    >
                                        <XClose className="size-4" />
                                    </button>
                                </div>

                                <div className="mt-4 flex flex-col gap-3">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-secondary">
                                            Client Name
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Acme Corp"
                                            value={newClientName}
                                            onChange={(e) => setNewClientName(e.target.value)}
                                            autoFocus
                                            className="w-full rounded-lg border border-secondary px-3 py-2 text-sm text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-secondary">
                                            Client Website URL
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. acmecorp.com"
                                            value={newClientWebsite}
                                            onChange={(e) => setNewClientWebsite(e.target.value)}
                                            className="w-full rounded-lg border border-secondary px-3 py-2 text-sm text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-secondary">Meta Pixel Code</label>
                                        <textarea
                                            value={newPixelCode}
                                            onChange={(e) => setNewPixelCode(e.target.value)}
                                            rows={7}
                                            placeholder="Please enter Meta Pixel code"
                                            spellCheck={false}
                                            className="w-full resize-none rounded-lg border border-secondary px-3 py-2 font-mono text-xs text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand"
                                        />
                                    </div>
                                    {newClientName.trim() && (
                                        <p className="text-xs text-tertiary">
                                            Page URL:{" "}
                                            <span className="font-medium text-brand-secondary">
                                                docs-hgm.netlify.app/{slugify(newClientName)}-metapixel
                                            </span>
                                        </p>
                                    )}
                                    {createError && <p className="text-xs text-error-primary">{createError}</p>}
                                </div>

                                <div className="mt-4 flex gap-3">
                                    <Button color="secondary" size="sm" className="flex-1" onClick={() => setShowPlusModal(false)} isDisabled={isCreating}>
                                        Cancel
                                    </Button>
                                    <Button
                                        color="primary"
                                        size="sm"
                                        className="flex-1"
                                        onClick={handleCreatePage}
                                        isDisabled={!newClientName.trim()}
                                        isLoading={isCreating}
                                        showTextWhileLoading
                                    >
                                        {isCreating ? "Creating…" : "Create Page"}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Image lightbox */}
            <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} alt="Setup screenshot — full view" />
        </main>
    );
};
