import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import {
    Check,
    Compass01,
    Heart,
    Mail01,
    MessageSmileCircle,
    Plus,
    Stars01,
    Target04,
    XClose,
} from "@untitledui/icons";
import { AppShell } from "@/components/application/icon-rail";
import { VideoAttach } from "@/components/application/video-block";
import { supabase, type CheckboxAnswer, type HostOnboardingData } from "@/lib/supabase";
import { cx } from "@/utils/cx";

/**
 * Host Onboarding Form — the in-app version of the team's "Brand Vision Form"
 * Google Form. The master template lives at /host-onboarding-form; the team
 * creates a private copy per new host (?create=1 or the "+ New" button on the
 * Docs → Host Onboarding Form list), and the host fills it in themselves —
 * no login required, same as a shared Google Form link. Answers autosave.
 */

function slugify(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

const emptyCheckbox = (): CheckboxAnswer => ({ picked: [], other: "" });

const DEFAULT_DATA: HostOnboardingData = {
    email: "",
    businessName: "",
    purpose: emptyCheckbox(),
    guestFeelings: emptyCheckbox(),
    threeWords: "",
    differentiators: emptyCheckbox(),
    reviewMention: "",
    idealGuest: emptyCheckbox(),
    experienceType: emptyCheckbox(),
    personaVoice: emptyCheckbox(),
    tone: emptyCheckbox(),
    aesthetic: emptyCheckbox(),
    brandKnownFor: emptyCheckbox(),
    completeSentence: "",
};

/** Merge a partial jsonb blob from the DB over the defaults so old/blank rows never crash. */
function mergeData(partial?: Partial<HostOnboardingData> | null): HostOnboardingData {
    const cb = (v?: CheckboxAnswer): CheckboxAnswer => ({ picked: v?.picked ?? [], other: v?.other ?? "" });
    return {
        email: partial?.email ?? "",
        businessName: partial?.businessName ?? "",
        purpose: cb(partial?.purpose),
        guestFeelings: cb(partial?.guestFeelings),
        threeWords: partial?.threeWords ?? "",
        differentiators: cb(partial?.differentiators),
        reviewMention: partial?.reviewMention ?? "",
        idealGuest: cb(partial?.idealGuest),
        experienceType: cb(partial?.experienceType),
        personaVoice: cb(partial?.personaVoice),
        tone: cb(partial?.tone),
        aesthetic: cb(partial?.aesthetic),
        brandKnownFor: cb(partial?.brandKnownFor),
        completeSentence: partial?.completeSentence ?? "",
        video: partial?.video,
        submittedAt: partial?.submittedAt,
    };
}

type CheckboxField = "purpose" | "guestFeelings" | "differentiators" | "idealGuest" | "experienceType" | "personaVoice" | "tone" | "aesthetic" | "brandKnownFor";
type TextField = "email" | "businessName" | "threeWords" | "reviewMention" | "completeSentence";

type Question =
    | { type: "text"; field: TextField; label: string; required?: boolean; long?: boolean; placeholder: string }
    | { type: "checkbox"; field: CheckboxField; label: string; required?: boolean; hint?: string; maxPick?: number; options: string[] };

interface SectionDef {
    id: string;
    title: string;
    /** Short line under the title in the stepper (not the in-page hero text). */
    subtitle: string;
    description?: string;
    icon: typeof Mail01;
    questions: Question[];
}

/** The form content — verbatim from the team's "Brand Vision Form" Google Form,
 * 6 sections / 14 questions. Driving the render off this array (rather than
 * hand-writing 14 near-identical question blocks) keeps it maintainable. */
const SECTIONS: SectionDef[] = [
    {
        id: "basics",
        title: "The Basics",
        subtitle: "Email and business name",
        icon: Mail01,
        questions: [
            { type: "text", field: "email", label: "Email", required: true, placeholder: "you@email.com" },
            { type: "text", field: "businessName", label: "Name of your business", required: true, placeholder: "Your answer" },
        ],
    },
    {
        id: "why",
        title: "The WHY (Purpose)",
        subtitle: "Your deeper motivation",
        icon: Heart,
        questions: [
            {
                type: "checkbox",
                field: "purpose",
                label: "Why did you create this property? What's the deeper reason beyond income?",
                required: true,
                options: [
                    "To reconnect people with nature",
                    "To offer escape from busy city life",
                    "To create meaningful family memories",
                    "To showcase sustainable living",
                    "To provide romantic getaways",
                    "To inspire adventure and exploration",
                    "To preserve/share a unique location",
                ],
            },
            {
                type: "checkbox",
                field: "guestFeelings",
                label: "How should guests FEEL when they leave your property?",
                required: true,
                options: [
                    "Refreshed and recharged",
                    "Connected to nature",
                    "Closer to their partner/family",
                    "Inspired and creative",
                    "Adventurous and alive",
                    "Peaceful and grounded",
                    "Pampered and luxurious",
                ],
            },
        ],
    },
    {
        id: "how",
        title: "The HOW (Your Unique Approach)",
        subtitle: "What sets you apart",
        icon: Compass01,
        questions: [
            { type: "text", field: "threeWords", label: "Describe your property in exactly 3 words", required: true, long: true, placeholder: "Long answer text" },
            {
                type: "checkbox",
                field: "differentiators",
                label: "What makes your property DIFFERENT from other rentals?",
                required: true,
                options: [
                    "Unique architecture/design",
                    "Stunning natural location",
                    "Luxury amenities (hot tub, sauna, etc.)",
                    "Off-grid/sustainable features",
                    "Privacy and seclusion",
                    "Instagram-worthy interiors",
                    "Pet-friendly",
                    "Adventure activities nearby",
                ],
            },
            { type: "text", field: "reviewMention", label: "What's the ONE thing guests always mention in reviews?", required: true, placeholder: "Short answer text" },
        ],
    },
    {
        id: "what",
        title: "The WHAT (Your Offering)",
        subtitle: "Your guests and experience",
        icon: Target04,
        questions: [
            {
                type: "checkbox",
                field: "idealGuest",
                label: "Who is your ideal guest?",
                required: true,
                options: ["Couples seeking romance", "Families with kids", "Friend groups", "Solo travellers", "Remote workers", "Adventure seekers", "Luxury travellers"],
            },
            {
                type: "checkbox",
                field: "experienceType",
                label: "What type of experience are you offering?",
                options: ["Budget-friendly getaway", "Mid-range comfort", "Premium experience", "Luxury escape"],
            },
        ],
    },
    {
        id: "voice",
        title: "Brand Personality & Voice",
        subtitle: "Tone and aesthetic",
        icon: MessageSmileCircle,
        questions: [
            {
                type: "checkbox",
                field: "personaVoice",
                label: "If your property was a person, how would they talk to guests?",
                options: [
                    "Warm and welcoming (like a friendly host)",
                    "Sophisticated and elegant (like a luxury concierge)",
                    "Adventurous and bold (like an expedition guide)",
                    "Calm and zen (like a wellness retreat)",
                    "Playful and fun (like a creative friend)",
                    "Down-to-earth and authentic (like a local neighbor)",
                ],
            },
            {
                type: "checkbox",
                field: "tone",
                label: "Pick the tone that matches your brand",
                options: ["Professional and polished", "Casual and conversational", "Poetic and inspiring", "Simple and straightforward", "Witty and clever"],
            },
            {
                type: "checkbox",
                field: "aesthetic",
                label: "Choose the aesthetic styles that fit your property",
                hint: "Pick up to 3",
                maxPick: 3,
                options: [
                    "Rustic / Cabin Vibes",
                    "Modern Minimalist",
                    "Boho / Free-Spirited",
                    "Luxe Boutique Hotel",
                    "Scandinavian / Light & Airy",
                    "Desert / Southwest",
                    "Coastal / Beachy",
                    "Industrial / Urban",
                    "Vintage / Retro",
                    "Dark & Moody",
                ],
            },
        ],
    },
    {
        id: "ambition",
        title: "Brand Ambition",
        subtitle: "What you want to be known for",
        icon: Stars01,
        questions: [
            {
                type: "checkbox",
                field: "brandKnownFor",
                label: "What do you want your brand to be known for?",
                options: [
                    "Most unique design",
                    "Best location/views",
                    "Ultimate luxury experience",
                    "Most Instagram-worthy",
                    "Best value for price",
                    "Most romantic spot",
                    "Perfect family destination",
                    "Best for adventure lovers",
                ],
            },
            { type: "text", field: "completeSentence", label: 'In one sentence, complete this: "We want to help guests ___"', placeholder: "Short answer text" },
        ],
    },
];

const inputCls = "w-full rounded-lg border border-secondary bg-primary px-3.5 py-2.5 text-sm text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand";

/** A little personality per option — purely cosmetic, keyed by the exact option
 * text so it needs zero changes to the data model. Falls back to a sparkle. */
const OPTION_EMOJI: Record<string, string> = {
    "To reconnect people with nature": "🌿",
    "To offer escape from busy city life": "🌄",
    "To create meaningful family memories": "👨‍👩‍👧‍👦",
    "To showcase sustainable living": "♻️",
    "To provide romantic getaways": "💕",
    "To inspire adventure and exploration": "🧭",
    "To preserve/share a unique location": "📍",
    "Refreshed and recharged": "🔋",
    "Connected to nature": "🌳",
    "Closer to their partner/family": "🤝",
    "Inspired and creative": "🎨",
    "Adventurous and alive": "⚡",
    "Peaceful and grounded": "🧘",
    "Pampered and luxurious": "✨",
    "Unique architecture/design": "🏛️",
    "Stunning natural location": "🏞️",
    "Luxury amenities (hot tub, sauna, etc.)": "🛁",
    "Off-grid/sustainable features": "🌱",
    "Privacy and seclusion": "🔒",
    "Instagram-worthy interiors": "📸",
    "Pet-friendly": "🐾",
    "Adventure activities nearby": "🚵",
    "Couples seeking romance": "💑",
    "Families with kids": "👶",
    "Friend groups": "👯",
    "Solo travellers": "🎒",
    "Remote workers": "💻",
    "Adventure seekers": "🏔️",
    "Luxury travellers": "💎",
    "Budget-friendly getaway": "💰",
    "Mid-range comfort": "🛋️",
    "Premium experience": "⭐",
    "Luxury escape": "👑",
    "Warm and welcoming (like a friendly host)": "🤗",
    "Sophisticated and elegant (like a luxury concierge)": "🎩",
    "Adventurous and bold (like an expedition guide)": "🧗",
    "Calm and zen (like a wellness retreat)": "🕊️",
    "Playful and fun (like a creative friend)": "🎉",
    "Down-to-earth and authentic (like a local neighbor)": "🌻",
    "Professional and polished": "👔",
    "Casual and conversational": "💬",
    "Poetic and inspiring": "🖋️",
    "Simple and straightforward": "✅",
    "Witty and clever": "😏",
    "Rustic / Cabin Vibes": "🪵",
    "Modern Minimalist": "⬜",
    "Boho / Free-Spirited": "🌾",
    "Luxe Boutique Hotel": "🛎️",
    "Scandinavian / Light & Airy": "☁️",
    "Desert / Southwest": "🌵",
    "Coastal / Beachy": "🌊",
    "Industrial / Urban": "🏗️",
    "Vintage / Retro": "📻",
    "Dark & Moody": "🌑",
    "Most unique design": "🏆",
    "Best location/views": "🌅",
    "Ultimate luxury experience": "💎",
    "Most Instagram-worthy": "📸",
    "Best value for price": "💵",
    "Most romantic spot": "❤️",
    "Perfect family destination": "👨‍👩‍👧",
    "Best for adventure lovers": "🏕️",
};

/** One question — text field or checkbox group with an "Other, please specify" text field. */
const QuestionField = ({
    q,
    data,
    onText,
    onToggle,
    onOther,
}: {
    q: Question;
    data: HostOnboardingData;
    onText: (field: TextField, value: string) => void;
    onToggle: (field: CheckboxField, option: string) => void;
    onOther: (field: CheckboxField, other: string) => void;
}) => {
    if (q.type === "text") {
        return (
            <div>
                <label className="block text-sm font-semibold text-primary">
                    {q.label}
                    {q.required && <span className="text-error-primary"> *</span>}
                </label>
                {q.long ? (
                    <textarea rows={3} placeholder={q.placeholder} value={data[q.field]} onChange={(e) => onText(q.field, e.target.value)} className={cx(inputCls, "mt-2 resize-y")} />
                ) : (
                    <input type="text" placeholder={q.placeholder} value={data[q.field]} onChange={(e) => onText(q.field, e.target.value)} className={cx(inputCls, "mt-2")} />
                )}
            </div>
        );
    }

    const answer = data[q.field];
    const atMax = !!q.maxPick && answer.picked.length >= q.maxPick;
    return (
        <div>
            <label className="block text-sm font-semibold text-primary">
                {q.label}
                {q.required && <span className="text-error-primary"> *</span>}
            </label>
            {q.hint && <p className="mt-0.5 text-xs text-tertiary">{q.hint}</p>}
            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {q.options.map((opt) => {
                    const checked = answer.picked.includes(opt);
                    return (
                        <motion.button
                            key={opt}
                            type="button"
                            whileTap={!(!checked && atMax) ? { scale: 0.97 } : undefined}
                            disabled={!checked && atMax}
                            onClick={() => onToggle(q.field, opt)}
                            className={cx(
                                "relative flex items-start gap-3 rounded-xl border p-3.5 text-left text-sm transition duration-150 ease-linear",
                                checked
                                    ? "border-brand bg-brand-50 shadow-sm dark:bg-brand-950/30"
                                    : "border-secondary bg-primary hover:border-brand/40 hover:bg-secondary",
                                !checked && atMax && "cursor-not-allowed opacity-40",
                            )}
                        >
                            <span className="text-xl leading-none" aria-hidden="true">{OPTION_EMOJI[opt] ?? "✨"}</span>
                            <span className={cx("flex-1 pt-0.5 font-medium leading-snug", checked ? "text-brand-secondary" : "text-secondary")}>{opt}</span>
                            {checked && (
                                <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-brand-solid text-white shadow-sm">
                                    <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                                </span>
                            )}
                        </motion.button>
                    );
                })}
            </div>
            <input
                type="text"
                placeholder="Other…"
                value={answer.other}
                onChange={(e) => onOther(q.field, e.target.value)}
                className={cx(inputCls, "mt-2.5")}
            />
        </div>
    );
};

export interface HostOnboardingFormPageProps {
    slug?: string;
    initialClientName?: string;
    initialClientWebsite?: string;
    initialData?: Partial<HostOnboardingData> | null;
}

export const HostOnboardingFormPage = ({ slug, initialClientName = "", initialClientWebsite = "", initialData }: HostOnboardingFormPageProps) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isTemplate = !slug;

    const [data, setData] = useState<HostOnboardingData>(() => mergeData(initialData));
    const mainRef = useRef<HTMLElement>(null);
    const hydratedRef = useRef(false);

    // Scroll-driven vertical stepper: which section is "active" (scrollspy), plus
    // how far scrolled through it (0-1) so the connector fill animates continuously
    // rather than snapping between steps.
    const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
    const railRef = useRef<HTMLDivElement>(null);
    const circleRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [fillFraction, setFillFraction] = useState(0);
    const [railGeom, setRailGeom] = useState({ top: 16, bottom: 16 });

    const recomputeScrollSpy = useCallback(() => {
        const mainEl = mainRef.current;
        if (!mainEl) return;
        // Reached the bottom of the scroll container — trailing content (video
        // block, submit button) can keep the last section's top below the trigger
        // line forever, so force-complete instead of stalling on the 2nd-to-last step.
        if (mainEl.scrollTop + mainEl.clientHeight >= mainEl.scrollHeight - 4) {
            setActiveIndex(SECTIONS.length - 1);
            setFillFraction(1);
            return;
        }
        const triggerY = mainEl.getBoundingClientRect().top + 140;
        let idx = 0;
        let local = 0;
        sectionRefs.current.forEach((el, i) => {
            if (!el) return;
            const rect = el.getBoundingClientRect();
            if (rect.top <= triggerY) {
                idx = i;
                local = Math.min(1, Math.max(0, (triggerY - rect.top) / rect.height));
            }
        });
        setActiveIndex(idx);
        setFillFraction((idx + local) / Math.max(1, SECTIONS.length - 1));
    }, []);

    useEffect(() => {
        const measureRail = () => {
            const railEl = railRef.current;
            const first = circleRefs.current[0];
            const last = circleRefs.current[SECTIONS.length - 1];
            if (!railEl || !first || !last) return;
            const railRect = railEl.getBoundingClientRect();
            const firstRect = first.getBoundingClientRect();
            const lastRect = last.getBoundingClientRect();
            setRailGeom({ top: firstRect.top - railRect.top + firstRect.height / 2, bottom: lastRect.top - railRect.top + lastRect.height / 2 });
        };
        measureRail();
        const t = setTimeout(measureRail, 300); // re-measure after font swap/layout settle
        window.addEventListener("resize", measureRail);
        return () => {
            clearTimeout(t);
            window.removeEventListener("resize", measureRail);
        };
    }, []);

    useEffect(() => {
        recomputeScrollSpy();
        const mainEl = mainRef.current;
        if (!mainEl) return;
        let raf = 0;
        const onScroll = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(recomputeScrollSpy);
        };
        mainEl.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        return () => {
            cancelAnimationFrame(raf);
            mainEl.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
        };
    }, [recomputeScrollSpy]);

    // Create-copy modal (team only — reachable from the Docs → Host Onboarding
    // Form list, or the master template's own banner).
    const [showCreate, setShowCreate] = useState(false);
    const [newClientName, setNewClientName] = useState("");
    const [newClientWebsite, setNewClientWebsite] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState("");

    useEffect(() => {
        if (searchParams.get("create") === "1") setShowCreate(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Autosave — debounced, client copies only (the master template has nowhere
    // to save to). Guarded so the initial hydration from `initialData` never
    // re-writes the row it just came from.
    useEffect(() => {
        hydratedRef.current = true;
    }, []);
    useEffect(() => {
        if (!slug || !hydratedRef.current) return;
        const t = setTimeout(() => {
            supabase
                .from("host_onboarding_pages")
                .update({ data })
                .eq("slug", slug)
                .then(({ error }) => {
                    if (error) console.error("[host onboarding autosave]", error);
                });
        }, 900);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, slug]);

    const onText = (field: TextField, value: string) => setData((d) => ({ ...d, [field]: value }));
    const onToggle = (field: CheckboxField, option: string) =>
        setData((d) => {
            const cur = d[field];
            const picked = cur.picked.includes(option) ? cur.picked.filter((o) => o !== option) : [...cur.picked, option];
            return { ...d, [field]: { ...cur, picked } };
        });
    const onOther = (field: CheckboxField, other: string) => setData((d) => ({ ...d, [field]: { ...d[field], other } }));
    const onVideo = (video: string | undefined) => setData((d) => ({ ...d, video }));

    const scrollToSection = (i: number) => {
        const el = sectionRefs.current[i];
        const mainEl = mainRef.current;
        if (!el || !mainEl) return;
        const top = el.getBoundingClientRect().top - mainEl.getBoundingClientRect().top + mainEl.scrollTop - 24;
        mainEl.scrollTo({ top, behavior: "smooth" });
    };

    const handleSubmit = async () => {
        const submittedAt = new Date().toISOString();
        setData((d) => ({ ...d, submittedAt }));
        if (slug) {
            await supabase.from("host_onboarding_pages").update({ data: { ...data, submittedAt } }).eq("slug", slug);
        }
    };

    const handleCreate = async () => {
        const base = slugify(newClientName);
        if (!base) return;
        const newSlug = `${base}-hostonboarding`;
        setIsCreating(true);
        setCreateError("");
        const { error } = await supabase.from("host_onboarding_pages").insert({
            slug: newSlug,
            client_name: newClientName.trim(),
            client_website: newClientWebsite.trim(),
            data: DEFAULT_DATA,
        });
        setIsCreating(false);
        if (error) {
            setCreateError(error.code === "23505" ? "A form with that name already exists — pick another." : "Could not save — check your connection and try again.");
            return;
        }
        setShowCreate(false);
        navigate(`/${newSlug}`);
    };

    return (
        <AppShell className="flex md:flex-row">
            {/* ── Sidebar — identity + vertical connected stepper (scrollspy) ── */}
            <aside className="hidden h-full w-72 shrink-0 flex-col border-r border-secondary bg-primary p-6 md:flex">
                <p className="text-md font-semibold text-primary">Host Onboarding Form</p>
                <p className="mt-0.5 text-sm text-tertiary">{initialClientName || "Brand Vision Form"}</p>
                {initialClientWebsite && <p className="mt-0.5 truncate text-xs text-quaternary">{initialClientWebsite}</p>}

                <div ref={railRef} className="relative mt-8 flex-1">
                    {/* base track */}
                    <div
                        className="absolute left-4 w-0.5 -translate-x-1/2 bg-secondary"
                        style={{ top: railGeom.top, height: Math.max(0, railGeom.bottom - railGeom.top) }}
                        aria-hidden="true"
                    />
                    {/* animated fill — grows continuously as the user scrolls down */}
                    <motion.div
                        className="absolute left-4 w-0.5 -translate-x-1/2 rounded-full bg-brand-solid"
                        style={{ top: railGeom.top, height: Math.max(0, railGeom.bottom - railGeom.top) * fillFraction }}
                        transition={{ type: "tween", duration: 0.1 }}
                        aria-hidden="true"
                    />
                    <div className="flex flex-col gap-7">
                        {SECTIONS.map((s, i) => {
                            const done = i < activeIndex;
                            const current = i === activeIndex;
                            return (
                                <button key={s.id} type="button" onClick={() => scrollToSection(i)} className="relative z-10 flex items-start gap-3 text-left">
                                    <span
                                        ref={(el) => {
                                            circleRefs.current[i] = el;
                                        }}
                                        className={cx(
                                            "flex size-8 shrink-0 items-center justify-center rounded-full border-2 bg-primary transition-colors duration-200",
                                            done ? "border-brand-solid bg-brand-solid text-white" : current ? "border-brand-solid" : "border-secondary",
                                        )}
                                    >
                                        {done ? (
                                            <Check className="size-4" strokeWidth={3} aria-hidden="true" />
                                        ) : (
                                            <span className={cx("size-2 rounded-full", current ? "bg-brand-solid" : "bg-quaternary")} aria-hidden="true" />
                                        )}
                                    </span>
                                    <span>
                                        <p className={cx("text-sm font-semibold transition-colors duration-200", current ? "text-brand-secondary" : done ? "text-primary" : "text-quaternary")}>{s.title}</p>
                                        <p className="mt-0.5 text-xs text-tertiary">{s.subtitle}</p>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </aside>

            {/* ── Main — one continuously-scrolling page, sections reveal as you reach them ── */}
            <main ref={mainRef} className="min-h-0 min-w-0 flex-1 overflow-y-auto">
                <div className="mx-auto max-w-2xl px-5 py-10 md:px-8">
                    {isTemplate && (
                        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand/40 bg-brand-50 px-4 py-3 dark:bg-brand-950/30">
                            <div className="flex items-center gap-2.5">
                                <span className="inline-flex items-center rounded-full bg-brand-600 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">Template</span>
                                <p className="text-[13px] font-medium text-brand-800 dark:text-brand-200">This is the master template. Create a private copy to send to a new host.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowCreate(true)}
                                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-solid px-3.5 py-2 text-[13px] font-semibold text-white transition hover:opacity-90"
                            >
                                <Plus className="size-4" aria-hidden="true" />
                                Create for a new host
                            </button>
                        </div>
                    )}

                    {!isTemplate && data.submittedAt && (
                        <div className="mb-8 rounded-xl border border-success-primary/30 bg-success-primary/5 px-4 py-3">
                            <p className="text-[13px] font-medium text-success-primary">
                                ✅ Submitted — thanks! You can still come back and update your answers any time.
                            </p>
                        </div>
                    )}

                    {SECTIONS.map((s, i) => (
                        <motion.div
                            key={s.id}
                            ref={(el) => {
                                sectionRefs.current[i] = el;
                            }}
                            className={i > 0 ? "mt-16" : undefined}
                            initial={{ opacity: 0, y: 28 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ root: mainRef, once: true, amount: 0.2 }}
                            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <p className="text-xs font-semibold uppercase tracking-wide text-quaternary">Section {i + 1} of {SECTIONS.length}</p>
                            <h2 className="mt-1.5 text-display-xs font-semibold text-primary md:text-display-sm">{s.title}</h2>
                            {i === 0 && (
                                <p className="mt-3 text-sm text-tertiary">
                                    Your brand is more than just a logo — it's the look, feel, and personality that makes your property stand out and
                                    connect with the right guests.
                                    <br />
                                    🕐 This only takes 5–10 minutes, and helps us avoid back-and-forth later.
                                    <br />
                                    ✨ The more insight you give, the better the result.
                                </p>
                            )}

                            <div className="mt-8 flex flex-col gap-8">
                                {s.questions.map((q) => (
                                    <QuestionField key={q.field} q={q} data={data} onText={onText} onToggle={onToggle} onOther={onOther} />
                                ))}
                            </div>
                        </motion.div>
                    ))}

                    <motion.div
                        className="mt-16 rounded-xl border border-secondary bg-secondary/40 p-4"
                        initial={{ opacity: 0, y: 28 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ root: mainRef, once: true, amount: 0.2 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <p className="text-sm font-semibold text-primary">Want to add a personal touch? <span className="font-normal text-tertiary">(optional)</span></p>
                        <p className="mt-0.5 text-xs text-tertiary">Record a quick video intro of yourself and your property — a Loom/YouTube link works too.</p>
                        <VideoAttach value={data.video} onChange={onVideo} className="mt-3" />
                    </motion.div>

                    <div className="mt-10 flex justify-center border-t border-secondary pt-8">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            className="flex items-center gap-2 rounded-xl bg-success-solid px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                        >
                            Submit 🎉
                        </button>
                    </div>
                </div>
            </main>

            {/* ── Create-copy modal ── */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={(e) => e.target === e.currentTarget && !isCreating && setShowCreate(false)}
                    >
                        <motion.div
                            className="w-full max-w-sm rounded-2xl bg-primary p-6 shadow-2xl ring-1 ring-secondary"
                            initial={{ opacity: 0, scale: 0.94, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 10 }}
                            transition={{ type: "spring", stiffness: 300, damping: 26 }}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-md font-semibold text-primary">Create Host Onboarding Form</h3>
                                    <p className="mt-1 text-sm text-tertiary">Enter the new host's details — they'll fill in the rest themselves.</p>
                                </div>
                                <button type="button" aria-label="Close" onClick={() => setShowCreate(false)} className="flex size-8 items-center justify-center rounded-lg text-tertiary hover:bg-secondary">
                                    <XClose className="size-4" aria-hidden="true" />
                                </button>
                            </div>

                            <div className="mt-4 flex flex-col gap-3">
                                <div>
                                    <label htmlFor="new-host-name" className="mb-1.5 block text-sm font-medium text-secondary">Business / property name</label>
                                    <input
                                        id="new-host-name"
                                        type="text"
                                        placeholder="e.g. Oceanview Cottage"
                                        value={newClientName}
                                        onChange={(e) => setNewClientName(e.target.value)}
                                        autoFocus
                                        className={inputCls}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="new-host-website" className="mb-1.5 block text-sm font-medium text-secondary">Website (optional)</label>
                                    <input
                                        id="new-host-website"
                                        type="text"
                                        placeholder="e.g. oceanviewcottage.com"
                                        value={newClientWebsite}
                                        onChange={(e) => setNewClientWebsite(e.target.value)}
                                        className={inputCls}
                                    />
                                </div>
                                {newClientName.trim() && (
                                    <p className="text-xs text-tertiary">
                                        Page URL: <span className="font-medium text-brand-secondary">docs-hgm.netlify.app/{slugify(newClientName)}-hostonboarding</span>
                                    </p>
                                )}
                                {createError && <p className="text-xs text-error-primary">{createError}</p>}
                            </div>

                            <div className="mt-4 flex gap-3">
                                <button type="button" onClick={() => setShowCreate(false)} disabled={isCreating} className="flex-1 rounded-lg border border-secondary px-4 py-2 text-sm font-semibold text-secondary transition hover:bg-secondary disabled:opacity-50">
                                    Cancel
                                </button>
                                <button type="button" onClick={handleCreate} disabled={!newClientName.trim() || isCreating} className="flex-1 rounded-lg bg-brand-solid px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40">
                                    {isCreating ? "Creating…" : "Create"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AppShell>
    );
};
