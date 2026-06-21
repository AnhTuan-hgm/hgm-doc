import { type FC, type ReactNode, useEffect, useRef, useState } from "react";
import type { Key } from "react-aria-components";
import {
    ArrowLeft,
    ArrowRight,
    Browser,
    Check,
    Code02,
    CodeBrowser,
    Copy01,
    Globe01,
    InfoCircle,
    LayoutAlt01,
    Lock01,
    LockUnlocked01,
    MessageChatCircle,
    Plus,
    XClose,
} from "@untitledui/icons";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { Tabs } from "@/components/application/tabs/tabs";
import { useClipboard } from "@/hooks/use-clipboard";
import { cx } from "@/utils/cx";
import { supabase } from "@/lib/supabase";

const PASSWORD = "ANHTUAN";
const SUPPORT_EMAIL = "anhtuan@hiddengem.media";
const CONTACT_SUBJECT = "Website Popup — I'd like some help";
const CONTACT_BODY = `Hi HiddenGem Team,

I'm following the Add Popup to Website guide and could use a hand.

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

/* ── Default editable content ─────────────────────────────────────── */

const DEFAULT_HEADER_CODE = `<!-- HiddenGem Popup — paste into your site's header / <head> -->
<script src="https://embed.hiddengem.media/popup.js"></script>
<script>
  HGPopup.init({
    formId: "YOUR_FORM_ID",
    delay: 5000,        // show after 5 seconds
    layout: "modal"     // "modal" | "slide-in" | "bar"
  });
</script>`;

const DEFAULT_FORM_CODE = `<!-- HiddenGem Inline Form — paste into an HTML / embed block -->
<iframe
  src="https://embed.hiddengem.media/form/YOUR_FORM_ID"
  style="width:100%;border:none;min-height:420px"
  id="hg-inline-form"
  title="Join our mailing list"
></iframe>`;

const DEFAULT_PROMO_HEADER = "Stay Longer, Save More";
const DEFAULT_PROMO_DESC = "Book 2 nights or more and enjoy 15% off your stay — straight to your inbox.";

const STEPS = [
    { short: "Why", full: "Why add a popup" },
    { short: "Task 1", full: "Task 1 · Header code" },
    { short: "Task 2", full: "Task 2 · Promotion" },
];

/* Per-platform instructions for adding the popup code to the site header. */
interface PopupPlatform {
    id: string;
    name: string;
    icon: FC<{ className?: string }>;
    steps: string[];
    image?: string;
}

const POPUP_PLATFORMS: PopupPlatform[] = [
    {
        id: "wix",
        name: "Wix",
        icon: Globe01,
        image: "/Section 3 Images/WIXZ.webp",
        steps: [
            "Log in to your Wix dashboard",
            "Go to Settings > Custom Code in your site's dashboard",
            "Click + Add Custom Code at the top right",
            "Paste the popup code in the text box",
            "Set the placement to 'Head'",
            "Select 'All Pages' and click 'Apply'",
            "Save and Publish your changes",
        ],
    },
    {
        id: "squarespace",
        name: "Squarespace",
        icon: LayoutAlt01,
        image: "/Section 3 Images/SquareSpace.webp",
        steps: [
            "Log in to your Squarespace account",
            "Click on Go to website",
            "Click Pages",
            "Click Custom Code / Code Injection",
            "Paste the popup code into the Header, then Save",
        ],
    },
    {
        id: "wordpress",
        name: "WordPress",
        icon: Code02,
        image: "/Section 3 Images/WordPress.webp",
        steps: [
            "Log in to your WordPress account by going to yourdomain.com/admin",
            "Click Code Snippets on the side menu, or navigate to Header & Footer",
            "Paste the code into the Header section",
            "Click Save Changes",
        ],
    },
    {
        id: "framer",
        name: "Framer",
        icon: CodeBrowser,
        image: "/Section 3 Images/Framer.webp",
        steps: [
            "Open your project in the Framer editor",
            "Go to Site Settings > General > Custom Code",
            "Paste the popup code into the 'Start of <head> tag' field",
            "Click Save to store the snippet",
            "Publish your site to apply the changes",
        ],
    },
    {
        id: "webflow",
        name: "Webflow",
        icon: Browser,
        image: "/Section 3 Images/Webflow.webp",
        steps: [
            "Open your project in the Webflow Designer",
            "Go to Project Settings > Custom Code",
            "Paste the code into the 'Head Code' field",
            "Click 'Save Changes' and then 'Publish' to make it live",
        ],
    },
];

/* ── Building blocks (shared look with the Meta Pixel page) ────────── */

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
                        : line.split(/(YOUR_FORM_ID|'[^']*'|"[^"]*")/g).map((part, j) => {
                              if (part === "YOUR_FORM_ID")
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

/* ── Code block with mac-style toolbar + copy ─────────────────────── */

const CodeBlock = ({
    code,
    copyId,
    copied,
    onCopy,
    editable,
    onChange,
}: {
    code: string;
    copyId: string;
    copied: string | boolean;
    onCopy: (text: string, id: string) => void;
    editable: boolean;
    onChange: (value: string) => void;
}) => (
    <div className="overflow-hidden rounded-xl bg-gray-950 ring-1 ring-gray-800 ring-inset">
        <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2.5">
            <div className="flex items-center gap-1.5">
                <span className="size-3 rounded-full bg-[#ff5f57]" />
                <span className="size-3 rounded-full bg-[#febc2e]" />
                <span className="size-3 rounded-full bg-[#28c840]" />
            </div>
            <button
                type="button"
                onClick={() => onCopy(code, copyId)}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-gray-300 transition duration-100 ease-linear hover:bg-white/10 hover:text-white"
            >
                {copied === copyId ? <Check className="size-3.5" /> : <Copy01 className="size-3.5" />}
                {copied === copyId ? "Copied!" : "Copy Code"}
            </button>
        </div>
        <div className="overflow-x-auto p-4 md:p-5">
            {editable ? (
                <textarea
                    value={code}
                    onChange={(e) => onChange(e.target.value)}
                    rows={code.split("\n").length}
                    spellCheck={false}
                    className="block w-full resize-none bg-transparent font-mono text-xs leading-relaxed text-gray-300 outline-none md:text-sm"
                />
            ) : (
                <HighlightedCode code={code} />
            )}
        </div>
    </div>
);

/* ── Copyable text field (header / description) ───────────────────── */

const CopyableField = ({
    label,
    value,
    copyId,
    copied,
    onCopy,
    editable,
    onChange,
    multiline,
}: {
    label: string;
    value: string;
    copyId: string;
    copied: string | boolean;
    onCopy: (text: string, id: string) => void;
    editable: boolean;
    onChange: (value: string) => void;
    multiline?: boolean;
}) => (
    <div>
        <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wide text-quaternary">{label}</label>
            <button
                type="button"
                onClick={() => onCopy(value, copyId)}
                className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-brand-secondary transition duration-100 ease-linear hover:bg-brand-50"
            >
                {copied === copyId ? <Check className="size-3.5" /> : <Copy01 className="size-3.5" />}
                {copied === copyId ? "Copied!" : "Copy"}
            </button>
        </div>
        {editable ? (
            multiline ? (
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand"
                />
            ) : (
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand"
                />
            )
        ) : (
            <p
                className={cx(
                    "rounded-lg bg-primary px-3 py-2 ring-1 ring-secondary ring-inset",
                    multiline ? "text-sm text-tertiary" : "text-md font-semibold text-primary",
                )}
            >
                {value}
            </p>
        )}
    </div>
);

/* ── Step list ────────────────────────────────────────────────────── */

const Steps = ({ steps }: { steps: ReactNode[] }) => (
    <ol className="mt-5 flex flex-col gap-2.5">
        {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
                <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-md bg-brand-50 text-xs font-semibold text-brand-700 tabular-nums">
                    {i + 1}
                </span>
                <span className="text-sm text-tertiary">{step}</span>
            </li>
        ))}
    </ol>
);

/* ── Before / after comparison slider ─────────────────────────────── */

const ImageSlot = ({ src, label, align, grayscale }: { src: string; label: string; align: "left" | "right"; grayscale?: boolean }) => (
    <div className="absolute inset-0 size-full">
        {src ? (
            <img src={src} alt={label} className={cx("size-full object-cover", grayscale && "grayscale")} draggable={false} />
        ) : (
            <div className={cx("flex size-full items-center justify-center bg-gradient-to-br from-secondary to-tertiary", grayscale && "grayscale")}>
                <span className="text-sm font-medium text-quaternary">{label} image</span>
            </div>
        )}
        <span
            className={cx(
                "absolute top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white",
                align === "left" ? "left-3" : "right-3",
            )}
        >
            {label}
        </span>
    </div>
);

const BeforeAfterSlider = ({
    before,
    after,
    editable,
    onBeforeChange,
    onAfterChange,
}: {
    before: string;
    after: string;
    editable: boolean;
    onBeforeChange: (dataUrl: string) => void;
    onAfterChange: (dataUrl: string) => void;
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const dragging = useRef(false);
    const [pos, setPos] = useState(50);

    const setFromClientX = (clientX: number) => {
        const r = containerRef.current?.getBoundingClientRect();
        if (!r?.width) return;
        setPos(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
    };

    useEffect(() => {
        const move = (e: MouseEvent | TouchEvent) => {
            if (!dragging.current) return;
            const x = "touches" in e ? e.touches[0]?.clientX : e.clientX;
            if (x != null) setFromClientX(x);
        };
        const up = () => { dragging.current = false; };
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up);
        window.addEventListener("touchmove", move, { passive: false });
        window.addEventListener("touchend", up);
        return () => {
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", up);
            window.removeEventListener("touchmove", move);
            window.removeEventListener("touchend", up);
        };
    }, []);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>, cb: (d: string) => void) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => cb(reader.result as string);
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    return (
        <div>
            <div
                ref={containerRef}
                onMouseMove={(e) => setFromClientX(e.clientX)}
                className="relative aspect-[16/10] w-full cursor-ew-resize select-none overflow-hidden rounded-xl ring-1 ring-secondary ring-inset"
            >
                <ImageSlot src={after} label="After" align="right" />
                <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
                    <ImageSlot src={before} label="Before" align="left" grayscale />
                </div>
                <div className="absolute inset-y-0 z-10 -ml-px w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.15)]" style={{ left: `${pos}%` }}>
                    <button
                        type="button"
                        aria-label="Drag to compare"
                        onMouseDown={() => { dragging.current = true; }}
                        onTouchStart={() => { dragging.current = true; }}
                        className="absolute top-1/2 left-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full bg-white text-gray-700 shadow-lg ring-1 ring-black/10"
                    >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 7l-5 5 5 5M15 7l5 5-5 5" />
                        </svg>
                    </button>
                </div>
            </div>

            {editable && (
                <div className="mt-3 flex flex-wrap gap-3">
                    <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-secondary px-3 py-1.5 text-xs font-medium text-secondary transition duration-100 ease-linear hover:bg-secondary">
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e, onBeforeChange)} />
                        Upload “Before” image
                    </label>
                    <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-secondary px-3 py-1.5 text-xs font-medium text-secondary transition duration-100 ease-linear hover:bg-secondary">
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e, onAfterChange)} />
                        Upload “After” image
                    </label>
                </div>
            )}
        </div>
    );
};

/* ── Page ─────────────────────────────────────────────────────────── */

export interface PopupPageProps {
    /** When set, this is a saved client page (loaded from Supabase): no “+”, lock saves to DB. */
    slug?: string;
    initialClientName?: string;
    initialClientWebsite?: string;
    initialPopupCode?: string;
    initialInlineCode?: string;
    initialPromoHeader?: string;
    initialPromoDesc?: string;
    initialBeforeImg1?: string;
    initialAfterImg1?: string;
    initialBeforeImg2?: string;
    initialAfterImg2?: string;
}

export const PopupPage = ({
    slug,
    initialClientName = "",
    initialClientWebsite = "",
    initialPopupCode = DEFAULT_HEADER_CODE,
    initialInlineCode = DEFAULT_FORM_CODE,
    initialPromoHeader = DEFAULT_PROMO_HEADER,
    initialPromoDesc = DEFAULT_PROMO_DESC,
    initialBeforeImg1 = "",
    initialAfterImg1 = "",
    initialBeforeImg2 = "",
    initialAfterImg2 = "",
}: PopupPageProps) => {
    const navigate = useNavigate();
    const { copied, copy } = useClipboard();

    const isClientPage = !!slug;

    const [step, setStep] = useState(0);
    const [selectedPlatform, setSelectedPlatform] = useState<Key>("wordpress");
    const [isLocked, setIsLocked] = useState(true);
    const [showUnlock, setShowUnlock] = useState(false);
    const [unlockPassword, setUnlockPassword] = useState("");
    const [unlockError, setUnlockError] = useState(false);
    const [saving, setSaving] = useState(false);

    // Editable content
    const [clientName, setClientName] = useState(initialClientName);
    const [clientWebsite, setClientWebsite] = useState(initialClientWebsite);
    const [headerCode, setHeaderCode] = useState(initialPopupCode);
    const [formCode, setFormCode] = useState(initialInlineCode);
    const [promoHeader, setPromoHeader] = useState(initialPromoHeader);
    const [promoDesc, setPromoDesc] = useState(initialPromoDesc);
    const [beforeImg1, setBeforeImg1] = useState(initialBeforeImg1);
    const [afterImg1, setAfterImg1] = useState(initialAfterImg1);
    const [beforeImg, setBeforeImg] = useState(initialBeforeImg2);
    const [afterImg, setAfterImg] = useState(initialAfterImg2);

    // Create wizard
    const [showCreate, setShowCreate] = useState(false);
    const [newClientName, setNewClientName] = useState("");
    const [newClientWebsite, setNewClientWebsite] = useState("");
    const [newPopupCode, setNewPopupCode] = useState(DEFAULT_HEADER_CODE);
    const [newInlineCode, setNewInlineCode] = useState(DEFAULT_FORM_CODE);
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState("");

    const saveToDb = async () => {
        if (!slug) return true;
        const { error } = await supabase.from("leadcapture_pages").upsert(
            {
                slug,
                client_name: clientName,
                client_website: clientWebsite,
                popup_code: headerCode,
                inline_form_code: formCode,
                promo_header: promoHeader,
                promo_desc: promoDesc,
                before_img_1: beforeImg1,
                after_img_1: afterImg1,
                before_img_2: beforeImg,
                after_img_2: afterImg,
            },
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
        // Locking → persist content for client pages
        if (isClientPage) {
            setSaving(true);
            await saveToDb();
            setSaving(false);
        }
        setIsLocked(true);
    };

    const goStep = (i: number) => {
        setStep(Math.max(0, Math.min(STEPS.length - 1, i)));
        if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
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
        setNewPopupCode(DEFAULT_HEADER_CODE);
        setNewInlineCode(DEFAULT_FORM_CODE);
        setCreateError("");
    };

    const newSlug = newClientName.trim() ? `${slugify(newClientName)}-leadcapture` : "";

    const handleCreate = async () => {
        if (!newSlug) return;
        setIsCreating(true);
        setCreateError("");
        const { error } = await supabase.from("leadcapture_pages").upsert(
            {
                slug: newSlug,
                client_name: newClientName.trim(),
                client_website: newClientWebsite.trim(),
                popup_code: newPopupCode,
                inline_form_code: newInlineCode,
                promo_header: DEFAULT_PROMO_HEADER,
                promo_desc: DEFAULT_PROMO_DESC,
            },
            { onConflict: "slug" },
        );
        setIsCreating(false);
        if (error) {
            console.error("[leadcapture create] Supabase error:", error);
            setCreateError(error.message || "Could not save — check your connection and try again.");
            return;
        }
        setShowCreate(false);
        navigate(`/${newSlug}`);
    };

    const headerFieldClass = (extra?: string) =>
        cx(
            "rounded-lg border bg-transparent px-3 py-1.5 text-sm text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear",
            isLocked
                ? "border-transparent cursor-default opacity-60 pointer-events-none"
                : "border-secondary focus:border-brand focus:ring-1 focus:ring-brand",
            extra,
        );

    return (
        <main className="min-h-dvh bg-secondary px-4 py-8 md:px-8 md:py-14">
            <motion.article
                className="mx-auto max-w-4xl rounded-2xl bg-primary shadow-xl ring-1 ring-secondary md:rounded-3xl"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className="px-6 py-8 md:px-14 md:py-12">

                    {/* ── Header: client name + website ── */}
                    <header className="flex items-center justify-between gap-4">
                        <input
                            type="text"
                            placeholder="Client Name"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            readOnly={isLocked}
                            className={headerFieldClass("min-w-0")}
                        />
                        <input
                            type="text"
                            placeholder="Client Website"
                            value={clientWebsite}
                            onChange={(e) => setClientWebsite(e.target.value)}
                            readOnly={isLocked}
                            className={headerFieldClass("min-w-0 text-right")}
                        />
                    </header>

                    {/* ── Title ── */}
                    <div className="mt-10 md:mt-12">
                        <h1 className="text-display-md font-semibold tracking-tight text-primary md:text-display-lg">
                            Add a Popup to Your Website
                        </h1>
                        <p className="mt-3 text-md text-tertiary">
                            A step-by-step guide to capturing email leads — works on Wix, Squarespace, WordPress, Framer,
                            Webflow and any other website builder. Prepared by the HiddenGem Team.
                        </p>
                    </div>

                    {/* ── Step indicator (sticky) ── */}
                    <nav className="sticky top-0 z-30 -mx-6 mt-10 flex items-center gap-2 border-b border-secondary bg-primary/95 px-6 py-3 backdrop-blur md:-mx-14 md:px-14">
                        {STEPS.map((s, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => goStep(i)}
                                className={cx(
                                    "flex flex-1 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition duration-100 ease-linear",
                                    i === step ? "border-brand bg-brand-50" : "border-secondary hover:bg-secondary",
                                )}
                            >
                                <span
                                    className={cx(
                                        "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                                        i === step
                                            ? "bg-brand-solid text-white"
                                            : i < step
                                              ? "bg-success-solid text-white"
                                              : "bg-secondary text-quaternary",
                                    )}
                                >
                                    {i < step ? <Check className="size-3.5" /> : i + 1}
                                </span>
                                <span className={cx("truncate text-sm font-semibold", i === step ? "text-primary" : "text-secondary")}>
                                    <span className="md:hidden">{s.short}</span>
                                    <span className="hidden md:inline">{s.full}</span>
                                </span>
                            </button>
                        ))}
                    </nav>

                    {/* ── Paginated content ── */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        >

                    {step === 0 && (
                    <>
                    {/* ── Section 01 — Why ── */}
                    <section className="mt-10">
                        <SectionEyebrow number="01" />
                        <SectionHeading>Why add a popup?</SectionHeading>
                        <p className="mt-4 text-md text-tertiary">
                            A well-timed popup turns anonymous visitors into subscribers you can reach again. Pair it with an
                            always-visible promotion form and you capture leads both ways. Every sign-up flows straight into
                            your mailing list, ready for your next campaign.
                        </p>

                        <div className="mt-5 flex gap-3 rounded-xl bg-brand-50 p-4 ring-1 ring-brand-200 ring-inset">
                            <InfoCircle className="mt-0.5 size-5 shrink-0 text-fg-brand-primary" aria-hidden="true" />
                            <p className="text-sm text-brand-700">
                                <span className="font-semibold">Before you start:</span> Your unique{" "}
                                <span className="font-mono">FORM_ID</span> has been generated by the HiddenGem Team and is
                                already embedded in the code below — just copy and paste, no edits needed.
                            </p>
                        </div>
                    </section>
                    </>
                    )}

                    {step === 1 && (
                    <>
                    {/* ── Section 02 — TASK 1: header code ── */}
                    <section className="mt-10">
                        <SectionEyebrow number="02" />
                        <SectionHeading>Task 1 — Add the popup code to your header</SectionHeading>

                        {/* Before / after result */}
                        <h3 className="mt-5 text-lg font-semibold text-primary">Before &amp; after</h3>
                        <p className="mt-2 text-sm text-tertiary">
                            Drag the handle to see how the popup looks once the code is added to your site.
                        </p>
                        <div className="mt-4">
                            <BeforeAfterSlider
                                before={beforeImg1}
                                after={afterImg1}
                                editable={!isLocked}
                                onBeforeChange={setBeforeImg1}
                                onAfterChange={setAfterImg1}
                            />
                        </div>

                        <p className="mt-8 text-md text-tertiary">
                            This snippet shows a popup to new visitors a few seconds after they land. It goes in your site's
                            header (the <span className="font-mono">&lt;head&gt;</span>) so it loads on every page.
                        </p>

                        <div className="mt-5">
                            <CodeBlock
                                code={headerCode}
                                copyId="header-code"
                                copied={copied}
                                onCopy={copy}
                                editable={!isLocked}
                                onChange={setHeaderCode}
                            />
                        </div>

                        {/* How to add the code, by platform — same pattern as the Meta Pixel page */}
                        <h3 className="mt-10 text-lg font-semibold text-primary">How to Add the Code to Your Website</h3>

                        <Tabs selectedKey={selectedPlatform} onSelectionChange={setSelectedPlatform} className="mt-4 gap-0">
                            <p className="text-sm font-semibold text-primary">Step 1: Choose your website platform</p>
                            <div className="sticky top-[70px] z-20 -mx-6 mt-3 border-b border-secondary bg-primary px-6 py-3 md:-mx-14 md:px-14">
                                <Tabs.List type="button-border" size="md" className="flex-wrap">
                                    {POPUP_PLATFORMS.map((platform) => (
                                        <Tabs.Item key={platform.id} id={platform.id} icon={platform.icon}>
                                            {platform.name}
                                        </Tabs.Item>
                                    ))}
                                </Tabs.List>
                            </div>

                            <p className="mt-7 text-sm font-semibold text-primary">Step 2: Follow this instruction</p>

                            {POPUP_PLATFORMS.map((platform) => (
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
                                                    alt={`${platform.name} custom code setup screenshot`}
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
                    </>
                    )}

                    {step === 2 && (
                    <>
                    {/* ── Section 03 — TASK 2: 2-column promo section ── */}
                    <section className="mt-10">
                        <SectionEyebrow number="03" />
                        <SectionHeading>Task 2 — Add a promotion section (2 columns)</SectionHeading>
                        <p className="mt-4 text-md text-tertiary">
                            On your homepage, create a <span className="font-semibold text-secondary">2-column section</span>.
                            The left column holds your promotion text; the right column holds the sign-up form. This always-on
                            form is your best long-term lead capture.
                        </p>

                        <Steps
                            steps={[
                                <>In your builder, add a <span className="font-semibold text-secondary">2-column section</span> to the homepage.</>,
                                <><span className="font-semibold text-secondary">Left column:</span> add a heading and a short description — copy the text below.</>,
                                <><span className="font-semibold text-secondary">Right column:</span> add an <span className="font-semibold text-secondary">HTML / embed block</span> and paste the form code below.</>,
                                <>Save and publish. Resize the columns so they sit side-by-side on desktop.</>,
                            ]}
                        />

                        {/* Two-column builder */}
                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                            <div className="flex flex-col rounded-xl p-5 ring-1 ring-secondary">
                                <span className="mb-4 inline-flex w-fit items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                                    Column 1 · Promotion text
                                </span>
                                <div className="flex flex-col gap-4">
                                    <CopyableField
                                        label="Heading"
                                        value={promoHeader}
                                        copyId="promo-header"
                                        copied={copied}
                                        onCopy={copy}
                                        editable={!isLocked}
                                        onChange={setPromoHeader}
                                    />
                                    <CopyableField
                                        label="Description"
                                        value={promoDesc}
                                        copyId="promo-desc"
                                        copied={copied}
                                        onCopy={copy}
                                        editable={!isLocked}
                                        onChange={setPromoDesc}
                                        multiline
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col rounded-xl p-5 ring-1 ring-secondary">
                                <span className="mb-4 inline-flex w-fit items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                                    Column 2 · Insert code
                                </span>
                                <CodeBlock
                                    code={formCode}
                                    copyId="form-code"
                                    copied={copied}
                                    onCopy={copy}
                                    editable={!isLocked}
                                    onChange={setFormCode}
                                />
                            </div>
                        </div>

                        {/* Before / after result */}
                        <h3 className="mt-10 text-lg font-semibold text-primary">Before &amp; after</h3>
                        <p className="mt-2 text-sm text-tertiary">
                            Drag the handle to see how your homepage looks once the promotion section is added.
                        </p>
                        <div className="mt-4">
                            <BeforeAfterSlider
                                before={beforeImg}
                                after={afterImg}
                                editable={!isLocked}
                                onBeforeChange={setBeforeImg}
                                onAfterChange={setAfterImg}
                            />
                        </div>
                    </section>

                    {/* ── Support ── */}
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
                                Our team is here to help. Reach out to HiddenGem if you'd like us to install the popup for you.
                            </p>
                            <div className="mt-5 flex justify-center">
                                <Button href={CONTACT_MAILTO} size="lg" color="primary" iconTrailing={ArrowRight}>
                                    Contact HiddenGem Team
                                </Button>
                            </div>
                            <p className="mx-auto mt-5 max-w-md text-xs text-quaternary">
                                We're happy to set up the popup and promotion form for you — just share your website login
                                securely via your client portal.
                            </p>
                        </div>
                    </section>
                    </>
                    )}

                        </motion.div>
                    </AnimatePresence>

                    {/* ── Back / Next ── */}
                    <div className="mt-10 flex items-center justify-between border-t border-secondary pt-6">
                        <Button color="secondary" size="lg" iconLeading={ArrowLeft} isDisabled={step === 0} onClick={() => goStep(step - 1)}>
                            Back
                        </Button>
                        {step < STEPS.length - 1 ? (
                            <Button color="primary" size="lg" iconTrailing={ArrowRight} onClick={() => goStep(step + 1)}>
                                Next
                            </Button>
                        ) : (
                            <Button color="primary" size="lg" iconTrailing={ArrowRight} onClick={() => goStep(0)}>
                                Back to start
                            </Button>
                        )}
                    </div>

                    {/* ── Footer ── */}
                    <footer className="mt-14 flex justify-center border-t border-secondary pt-6">
                        <a href="https://hiddengem.media/" target="_blank" rel="noopener noreferrer">
                            <img
                                src="/hgm logo/Logo ON LIGHT.svg"
                                alt="HiddenGem Media"
                                className="h-10 opacity-60 transition duration-100 ease-linear hover:opacity-90 dark:hidden"
                                draggable={false}
                            />
                            <img
                                src="/hgm logo/LOGO ON Dark.svg"
                                alt="HiddenGem Media"
                                className="hidden h-10 opacity-70 transition duration-100 ease-linear hover:opacity-100 dark:block"
                                draggable={false}
                            />
                        </a>
                    </footer>
                </div>
            </motion.article>

            {/* ── Fixed bottom-right action buttons ── */}
            <div className="fixed bottom-5 right-5 z-40 flex flex-col items-center gap-2">
                {/* Plus — only on the master template page */}
                {!isClientPage && (
                    <button
                        type="button"
                        onClick={openCreate}
                        title="Create new lead-capture page"
                        className="flex size-10 items-center justify-center rounded-full bg-primary shadow-lg ring-1 ring-secondary text-quaternary transition duration-100 ease-linear hover:bg-secondary hover:text-secondary"
                    >
                        <Plus className="size-4" aria-hidden="true" />
                    </button>
                )}

                {/* Lock / unlock */}
                <button
                    type="button"
                    onClick={handleLockClick}
                    title={isLocked ? "Unlock content" : "Lock & save"}
                    className="flex size-10 items-center justify-center rounded-full bg-primary shadow-lg ring-1 ring-secondary text-quaternary transition duration-100 ease-linear hover:bg-secondary hover:text-secondary disabled:opacity-50"
                    disabled={saving}
                >
                    {isLocked ? <Lock01 className="size-4" aria-hidden="true" /> : <LockUnlocked01 className="size-4" aria-hidden="true" />}
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
                            <p className="mt-1 text-sm text-tertiary">Enter the password to edit the text and code.</p>
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
                                    <h3 className="text-md font-semibold text-primary">Create Lead-Capture Page</h3>
                                    <p className="mt-1 text-sm text-tertiary">Fill in the details to generate a new client page.</p>
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
                                        className="w-full rounded-lg border border-secondary px-3 py-2 text-sm text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-secondary">Client Website</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. theoutpost.com"
                                        value={newClientWebsite}
                                        onChange={(e) => setNewClientWebsite(e.target.value)}
                                        className="w-full rounded-lg border border-secondary px-3 py-2 text-sm text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-secondary">Popup Code (Task 1)</label>
                                    <textarea
                                        value={newPopupCode}
                                        onChange={(e) => setNewPopupCode(e.target.value)}
                                        rows={5}
                                        spellCheck={false}
                                        placeholder="Paste the popup header code"
                                        className="w-full resize-none rounded-lg border border-secondary px-3 py-2 font-mono text-xs text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-secondary">Inline Form Code (Task 2)</label>
                                    <textarea
                                        value={newInlineCode}
                                        onChange={(e) => setNewInlineCode(e.target.value)}
                                        rows={5}
                                        spellCheck={false}
                                        placeholder="Paste the inline / promotion form code"
                                        className="w-full resize-none rounded-lg border border-secondary px-3 py-2 font-mono text-xs text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand"
                                    />
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
                                    {isCreating ? "Creating…" : "Create Page"}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
};
