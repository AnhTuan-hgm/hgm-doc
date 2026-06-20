import { type ReactNode, useState } from "react";
import type { Key } from "react-aria-components";
import {
    ArrowRight,
    Check,
    Copy01,
    InfoCircle,
    Lock01,
    LockUnlocked01,
    MessageChatCircle,
    Plus,
    XClose,
} from "@untitledui/icons";
import { useNavigate } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { Tabs } from "@/components/application/tabs/tabs";
import { useClipboard } from "@/hooks/use-clipboard";
import { cx } from "@/utils/cx";
import { PIXEL_CODE as DEFAULT_PIXEL_CODE, platforms } from "@/data/platforms";
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
    initialClientName?: string;
    initialClientWebsite?: string;
    initialPixelCode?: string;
}

export const PixelPage = ({
    initialClientName = "",
    initialClientWebsite = "",
    initialPixelCode = DEFAULT_PIXEL_CODE,
}: PixelPageProps) => {
    const navigate = useNavigate();
    const { copied, copy } = useClipboard();
    const [selectedPlatform, setSelectedPlatform] = useState<Key>("wordpress");

    // Editable content fields
    const [clientName, setClientName] = useState(initialClientName);
    const [clientWebsite, setClientWebsite] = useState(initialClientWebsite);
    const [pixelCode, setPixelCode] = useState(initialPixelCode);

    // Lock state
    const [isLocked, setIsLocked] = useState(true);

    // Unlock modal
    const [showUnlockModal, setShowUnlockModal] = useState(false);
    const [unlockPassword, setUnlockPassword] = useState("");
    const [unlockError, setUnlockError] = useState(false);

    // Plus wizard
    const [showPlusModal, setShowPlusModal] = useState(false);
    const [plusStep, setPlusStep] = useState<"password" | "client-info" | "pixel-code">("password");
    const [plusPassword, setPlusPassword] = useState("");
    const [plusPasswordError, setPlusPasswordError] = useState(false);
    const [newClientName, setNewClientName] = useState("");
    const [newClientWebsite, setNewClientWebsite] = useState("");
    const [newPixelCode, setNewPixelCode] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState("");

    const handleLockClick = () => {
        if (isLocked) {
            setShowUnlockModal(true);
            setUnlockPassword("");
            setUnlockError(false);
        } else {
            setIsLocked(true);
        }
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
            setPlusStep("client-info");
        } else {
            setPlusPasswordError(true);
        }
    };

    const handlePlusClientInfo = () => {
        if (newClientName.trim()) {
            setPlusStep("pixel-code");
        }
    };

    const handleCreatePage = async () => {
        const slug = slugify(newClientName);
        if (!slug) return;
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
            <article className="mx-auto max-w-4xl overflow-hidden rounded-2xl bg-primary shadow-xl ring-1 ring-secondary md:rounded-3xl">
                <div className="px-6 py-8 md:px-14 md:py-12">

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
                    <section className="mt-14">
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
                    </section>

                    {/* ── Section 02 — Your Meta Pixel Code ── */}
                    <section className="mt-14">
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
                    </section>

                    {/* ── Section 03 — Platform Instructions ── */}
                    <section className="mt-14">
                        <SectionEyebrow number="03" />
                        <SectionHeading>How to Add the Code to Your Website</SectionHeading>

                        <Tabs selectedKey={selectedPlatform} onSelectionChange={setSelectedPlatform} className="mt-6 gap-0">
                            <p className="text-sm font-semibold text-primary">Step 1: Choose your website platform</p>
                            <Tabs.List type="button-border" size="md" className="mt-3 flex-wrap">
                                {platforms.map((platform) => (
                                    <Tabs.Item key={platform.id} id={platform.id} icon={platform.icon}>
                                        {platform.name}
                                    </Tabs.Item>
                                ))}
                            </Tabs.List>

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
                                            <div className="mt-5 overflow-hidden rounded-lg ring-1 ring-secondary">
                                                <img
                                                    src={platform.image}
                                                    alt={`${platform.name} pixel setup screenshot`}
                                                    className="w-full object-contain"
                                                    loading="lazy"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </Tabs.Panel>
                            ))}
                        </Tabs>
                    </section>

                    {/* ── Still need support? ── */}
                    <section className="mt-16">
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
                            <p className="mx-auto mt-5 max-w-md text-xs text-quaternary">
                                We're happy to install the pixel for you if you prefer — just send us your login credentials
                                securely via your client portal.
                            </p>
                        </div>
                    </section>

                    {/* ── Footer ── */}
                    <footer className="mt-14 flex justify-center border-t border-secondary pt-6">
                        <a href="https://hiddengem.media/" target="_blank" rel="noopener noreferrer">
                            <img src="/hgm logo/Logo ON LIGHT.svg" alt="HiddenGem Media" className="h-10 opacity-60 transition duration-100 ease-linear hover:opacity-90 dark:hidden" draggable={false} />
                            <img src="/hgm logo/LOGO ON Dark.svg" alt="HiddenGem Media" className="hidden h-10 opacity-70 transition duration-100 ease-linear hover:opacity-100 dark:block" draggable={false} />
                        </a>
                    </footer>
                </div>
            </article>

            {/* ── Fixed bottom-right action buttons ── */}
            <div className="fixed bottom-5 right-5 z-40 flex flex-col items-center gap-2">
                {/* Plus — create new client page */}
                <button
                    type="button"
                    onClick={handlePlusClick}
                    title="Create new client page"
                    className="flex size-10 items-center justify-center rounded-full bg-primary shadow-lg ring-1 ring-secondary text-quaternary transition duration-100 ease-linear hover:bg-secondary hover:text-secondary"
                >
                    <Plus className="size-4" aria-hidden="true" />
                </button>

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

                        {/* Step 2 — Client Info */}
                        {plusStep === "client-info" && (
                            <>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-md font-semibold text-primary">Client Details</h3>
                                        <p className="mt-1 text-sm text-tertiary">Enter the client's name and website URL.</p>
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
                                            onKeyDown={(e) => e.key === "Enter" && handlePlusClientInfo()}
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
                                            onKeyDown={(e) => e.key === "Enter" && handlePlusClientInfo()}
                                            className="w-full rounded-lg border border-secondary px-3 py-2 text-sm text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand"
                                        />
                                    </div>
                                    {newClientName.trim() && (
                                        <p className="text-xs text-tertiary">
                                            Page URL:{" "}
                                            <span className="font-medium text-brand-secondary">
                                                docs-hgm.netlify.app/{slugify(newClientName)}
                                            </span>
                                        </p>
                                    )}
                                </div>

                                <div className="mt-4 flex gap-3">
                                    <Button color="secondary" size="sm" className="flex-1" onClick={() => setShowPlusModal(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        color="primary"
                                        size="sm"
                                        className="flex-1"
                                        onClick={handlePlusClientInfo}
                                        isDisabled={!newClientName.trim()}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </>
                        )}

                        {/* Step 3 — Pixel Code */}
                        {plusStep === "pixel-code" && (
                            <>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-md font-semibold text-primary">Meta Pixel Code</h3>
                                        <p className="mt-1 text-sm text-tertiary">
                                            Paste the Meta Pixel code for {newClientName}.
                                        </p>
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
                                    <label className="mb-1.5 block text-sm font-medium text-secondary">Pixel Code</label>
                                    <textarea
                                        value={newPixelCode}
                                        onChange={(e) => setNewPixelCode(e.target.value)}
                                        rows={9}
                                        placeholder="Please enter Meta Pixel code"
                                        autoFocus
                                        spellCheck={false}
                                        className="w-full resize-none rounded-lg border border-secondary px-3 py-2 font-mono text-xs text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand"
                                    />
                                </div>

                                {createError && (
                                    <p className="mt-2 text-xs text-error-primary">{createError}</p>
                                )}

                                <div className="mt-4 flex gap-3">
                                    <Button
                                        color="secondary"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => setPlusStep("client-info")}
                                        isDisabled={isCreating}
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        color="primary"
                                        size="sm"
                                        className="flex-1"
                                        onClick={handleCreatePage}
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
        </main>
    );
};
