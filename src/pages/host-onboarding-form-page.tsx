import { type FC, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import {
    Backpack,
    BankNote01,
    BatteryFull,
    Bell01,
    BookOpen01,
    Briefcase01,
    Building03,
    Building05,
    Camera01,
    Clock,
    Cloud01,
    CloudSun01,
    Compass03,
    Diamond01,
    Diamond02,
    Droplets01,
    FaceHappy,
    FaceWink,
    Feather,
    Glasses01,
    Globe01,
    HeartHand,
    HeartRounded,
    Hearts,
    Home01,
    Home03,
    Home05,
    Laptop01,
    Lightbulb02,
    Lightbulb03,
    Lock01,
    MarkerPin01,
    MessageChatCircle,
    Microphone01,
    Moon01,
    MusicNote01,
    Palette,
    PiggyBank01,
    Rocket01,
    Route,
    Square,
    Star01,
    Sun,
    Sunrise,
    Sunset,
    Trophy01,
    Umbrella01,
    Users01,
    Users02,
    Waves,
    Zap,
} from "@untitledui-pro/icons/line";
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Check,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Compass01,
    Edit03,
    Heart,
    Mail01,
    MessageSmileCircle,
    PlayCircle,
    Plus,
    Stars01,
    Target04,
    VideoRecorder,
    XClose,
} from "@untitledui/icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Checkbox as AriaCheckbox, CheckboxGroup as AriaCheckboxGroup } from "react-aria-components";
import { useNavigate, useSearchParams } from "react-router";
import { AppShell } from "@/components/application/icon-rail";
import { MediaAnswer, RecordingPlayer } from "@/components/application/media-answer";
import { VideoAttach } from "@/components/application/video-block";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { type CheckboxAnswer, type HostOnboardingData, supabase } from "@/lib/supabase";
import { cx } from "@/utils/cx";

/**
 * Host Onboarding Form — the in-app version of the team's "Brand Vision Form"
 * Google Form, presented Typeform-style: one question per screen, big type,
 * letter-key shortcuts, Enter to continue. The master template lives at
 * /host-onboarding-form; the team creates a private copy per new host
 * (?create=1 or the "+ New" button on the Docs → Host Onboarding Form list),
 * and the host fills it in themselves — no login required, same as a shared
 * Google Form link. Answers autosave.
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
        mediaAnswers: { ...(partial?.mediaAnswers ?? {}) },
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

type CheckboxField =
    | "purpose"
    | "guestFeelings"
    | "differentiators"
    | "idealGuest"
    | "experienceType"
    | "personaVoice"
    | "tone"
    | "aesthetic"
    | "brandKnownFor";
type TextField = "email" | "businessName" | "threeWords" | "reviewMention" | "completeSentence";

type Question =
    | { type: "text"; field: TextField; label: string; required?: boolean; long?: boolean; placeholder: string }
    | { type: "checkbox"; field: CheckboxField; label: string; required?: boolean; hint?: string; maxPick?: number; options: string[] };

interface SectionDef {
    id: string;
    title: string;
    /** Short line under the title (kept for the dashboard/legacy consumers of this array). */
    subtitle: string;
    description?: string;
    icon: typeof Mail01;
    questions: Question[];
}

/** The form content — verbatim from the team's "Brand Vision Form" Google Form,
 * 6 sections / 14 questions. Driving the render off this array (rather than
 * hand-writing 14 near-identical question screens) keeps it maintainable. */
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
            {
                type: "text",
                field: "threeWords",
                label: "Describe your property in exactly 3 words",
                required: true,
                long: true,
                placeholder: "Long answer text",
            },
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
            {
                type: "text",
                field: "reviewMention",
                label: "What's the ONE thing guests always mention in reviews?",
                required: true,
                placeholder: "Short answer text",
            },
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
                options: [
                    "Couples seeking romance",
                    "Families with kids",
                    "Friend groups",
                    "Solo travellers",
                    "Remote workers",
                    "Adventure seekers",
                    "Luxury travellers",
                ],
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
            {
                type: "text",
                field: "completeSentence",
                label: 'In one sentence, complete this: "We want to help guests ___"',
                placeholder: "Short answer text",
            },
        ],
    },
];

const inputCls =
    "w-full rounded-lg border border-secondary bg-primary px-3.5 py-2.5 text-sm text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand";

/** A line icon per option — Untitled UI PRO, matching the rest of the app's
 * iconography instead of emoji (which render differently on every OS and can't
 * take a theme colour). Keyed by the exact option text, so the data model and
 * every stored answer are untouched. Falls back to a star. */
const OPTION_ICON: Record<string, FC<{ className?: string }>> = {
    // Section 2 — The WHY (purpose)
    "To reconnect people with nature": CloudSun01,
    "To offer escape from busy city life": Sunset,
    "To create meaningful family memories": Users01,
    "To showcase sustainable living": Globe01,
    "To provide romantic getaways": Heart,
    "To inspire adventure and exploration": Compass03,
    "To preserve/share a unique location": MarkerPin01,
    // …how guests should feel
    "Refreshed and recharged": BatteryFull,
    "Connected to nature": Sun,
    "Closer to their partner/family": HeartHand,
    "Inspired and creative": Palette,
    "Adventurous and alive": Zap,
    "Peaceful and grounded": Feather,
    "Pampered and luxurious": Stars01,
    // Section 3 — The HOW (differentiators)
    "Unique architecture/design": Building05,
    "Stunning natural location": Sunrise,
    "Luxury amenities (hot tub, sauna, etc.)": Droplets01,
    "Off-grid/sustainable features": Lightbulb02,
    "Privacy and seclusion": Lock01,
    "Instagram-worthy interiors": Camera01,
    "Pet-friendly": HeartRounded,
    "Adventure activities nearby": Route,
    // Section 4 — The WHAT (ideal guest & tier)
    "Couples seeking romance": Hearts,
    "Families with kids": Users01,
    "Friend groups": Users02,
    "Solo travellers": Backpack,
    "Remote workers": Laptop01,
    "Adventure seekers": Compass01,
    "Luxury travellers": Diamond01,
    "Budget-friendly getaway": PiggyBank01,
    "Mid-range comfort": Home03,
    "Premium experience": Star01,
    "Luxury escape": Diamond02,
    // Section 5 — Brand personality & voice
    "Warm and welcoming (like a friendly host)": FaceHappy,
    "Sophisticated and elegant (like a luxury concierge)": Glasses01,
    "Adventurous and bold (like an expedition guide)": Rocket01,
    "Calm and zen (like a wellness retreat)": Feather,
    "Playful and fun (like a creative friend)": FaceWink,
    "Down-to-earth and authentic (like a local neighbor)": Home01,
    "Professional and polished": Briefcase01,
    "Casual and conversational": MessageChatCircle,
    "Poetic and inspiring": BookOpen01,
    "Simple and straightforward": Check,
    "Witty and clever": Lightbulb03,
    // …aesthetic
    "Rustic / Cabin Vibes": Home05,
    "Modern Minimalist": Square,
    "Boho / Free-Spirited": Waves,
    "Luxe Boutique Hotel": Bell01,
    "Scandinavian / Light & Airy": Cloud01,
    "Desert / Southwest": Sun,
    "Coastal / Beachy": Umbrella01,
    "Industrial / Urban": Building03,
    "Vintage / Retro": MusicNote01,
    "Dark & Moody": Moon01,
    // Section 6 — Brand ambition
    "Most unique design": Trophy01,
    "Best location/views": Sunrise,
    "Ultimate luxury experience": Diamond01,
    "Most Instagram-worthy": Camera01,
    "Best value for price": BankNote01,
    "Most romantic spot": Heart,
    "Perfect family destination": Users01,
    "Best for adventure lovers": Compass03,
};

/** Resolve an option's icon, falling back to a star for anything unmapped. */
const optionIcon = (opt: string): FC<{ className?: string }> => OPTION_ICON[opt] ?? Star01;

/* ── Step model — SECTIONS flattened into one-screen-per-question steps ── */

type Step =
    | { kind: "welcome" }
    | { kind: "question"; q: Question; sectionTitle: string; icon: typeof Mail01; num: number }
    | { kind: "video" }
    | { kind: "thankyou" };

const QUESTION_STEPS = SECTIONS.flatMap((s) => s.questions.map((q) => ({ q, sectionTitle: s.title, icon: s.icon })));
const TOTAL_QUESTIONS = QUESTION_STEPS.length;
const STEPS: Step[] = [
    { kind: "welcome" },
    ...QUESTION_STEPS.map((x, i) => ({ kind: "question" as const, ...x, num: i + 1 })),
    { kind: "video" },
    { kind: "thankyou" },
];
const VIDEO_INDEX = STEPS.length - 2;
const THANKYOU_INDEX = STEPS.length - 1;

/** Letter shortcuts for choice cards — the longest option list (aesthetic) has exactly 10. */
const LETTERS = "ABCDEFGHIJ";

/** Direction-aware slide: forward enters from below and exits upward, back reversed. */
const stepVariants = {
    enter: (dir: 1 | -1) => ({ opacity: 0, y: dir === 1 ? 40 : -40 }),
    center: { opacity: 1, y: 0 },
    exit: (dir: 1 | -1) => ({ opacity: 0, y: dir === 1 ? -24 : 24 }),
};

/**
 * Every question can be answered by voice or video, with one exception.
 *
 * `email` is excluded deliberately, not as an oversight: it is the address we
 * reply to and it is regex-validated, so a recording cannot satisfy it. If a
 * spoken answer counted as filling it in, a host could submit with no usable
 * email at all. Every other question offers the choice, short ones included.
 */
const NON_RECORDABLE_FIELDS = new Set(["email"]);
const canRecordField = (field: string) => !NON_RECORDABLE_FIELDS.has(field);

const mediaFor = (data: HostOnboardingData, field: string) => data.mediaAnswers?.[field];
const hasMediaAnswer = (data: HostOnboardingData, field: string) => !!mediaFor(data, field)?.path;

function validateStep(step: Step, data: HostOnboardingData): string | null {
    if (step.kind !== "question") return null;
    const q = step.q;
    if (q.type === "text") {
        const v = data[q.field].trim();
        if (q.required && !v && !hasMediaAnswer(data, q.field)) return "Please fill this in, or record your answer";
        if (q.field === "email" && v && !/^\S+@\S+\.\S+$/.test(v)) return "Hmm… that email doesn't look right";
        return null;
    }
    const a = data[q.field];
    if (q.required && a.picked.length === 0 && !a.other.trim() && !hasMediaAnswer(data, q.field)) return "Please make a selection, or record your answer";
    return null;
}

/* ── Small presentational pieces ── */

const Kbd = ({ children }: { children: ReactNode }) => (
    <kbd className="rounded-md border border-secondary bg-secondary px-1.5 py-0.5 font-sans text-[11px] font-semibold text-secondary">{children}</kbd>
);

const okBtnCls =
    "flex items-center gap-2 rounded-lg bg-brand-solid px-5 py-2.5 text-md font-semibold text-white shadow-sm outline-brand transition duration-100 ease-linear hover:bg-brand-solid_hover focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const underlineCls =
    "w-full border-b-2 border-secondary bg-transparent pb-2 text-primary outline-none transition duration-100 ease-linear placeholder:text-placeholder focus:border-brand";

const LetterBadge = ({ letter, checked }: { letter: string; checked: boolean }) => (
    <span
        className={cx(
            "flex size-6 shrink-0 items-center justify-center rounded-md border text-xs font-semibold transition duration-100 ease-linear",
            checked ? "border-brand bg-brand-solid text-white" : "border-secondary bg-primary text-secondary",
        )}
        aria-hidden="true"
    >
        {letter}
    </span>
);

/** Failed validation — small red row that shakes on every failed attempt (remounts per nonce). */
const ErrorShake = ({ msg }: { msg: string }) => (
    <motion.div
        role="alert"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, x: [0, -8, 8, -5, 5, 0] }}
        transition={{ duration: 0.4 }}
        className="mt-5 flex w-max max-w-full items-center gap-2 rounded-lg bg-error-primary px-3 py-2 text-sm font-medium text-error-primary"
    >
        <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
        {msg}
    </motion.div>
);

/** Typeform-style big underline text field. */
const TextQuestion = ({
    q,
    value,
    onChange,
}: {
    q: Extract<Question, { type: "text" }>;
    value: string;
    onChange: (field: TextField, value: string) => void;
}) => {
    // The Google-Form placeholders ("Short answer text") read oddly on a big Typeform field.
    const placeholder = /answer/i.test(q.placeholder) ? "Type your answer here…" : q.placeholder;
    const cls = cx(underlineCls, "mt-8 text-xl font-medium md:text-display-xs");
    if (q.long) {
        return (
            <div>
                <textarea
                    data-step-autofocus
                    rows={3}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(q.field, e.target.value)}
                    className={cx(cls, "field-sizing-content resize-none")}
                />
                <p className="mt-2 text-xs text-tertiary">
                    <Kbd>Cmd/Ctrl + Enter ↵</Kbd> to continue
                </p>
            </div>
        );
    }
    return (
        <input
            data-step-autofocus
            type={q.field === "email" ? "email" : "text"}
            inputMode={q.field === "email" ? "email" : undefined}
            autoComplete={q.field === "email" ? "email" : undefined}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(q.field, e.target.value)}
            className={cls}
        />
    );
};

/** Multi-select choice cards with letter badges — real checkboxes via React Aria. */
const ChoiceGroup = ({
    q,
    answer,
    onPicked,
    onOther,
}: {
    q: Extract<Question, { type: "checkbox" }>;
    answer: CheckboxAnswer;
    onPicked: (field: CheckboxField, picked: string[]) => void;
    onOther: (field: CheckboxField, other: string) => void;
}) => {
    const atMax = !!q.maxPick && answer.picked.length >= q.maxPick;
    return (
        <div className="mt-8">
            <AriaCheckboxGroup value={answer.picked} onChange={(picked) => onPicked(q.field, picked)} aria-labelledby="question-heading">
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {q.options.map((opt, i) => (
                        <AriaCheckbox
                            key={opt}
                            value={opt}
                            isDisabled={!answer.picked.includes(opt) && atMax}
                            className={({ isSelected, isDisabled, isFocusVisible }) =>
                                cx(
                                    "relative flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition duration-100 ease-linear active:scale-[0.98]",
                                    isSelected
                                        ? "border-brand bg-brand-primary_alt shadow-sm"
                                        : "border-secondary bg-primary hover:border-brand hover:bg-secondary",
                                    isDisabled && "cursor-not-allowed opacity-50 active:scale-100",
                                    isFocusVisible && "outline-2 outline-offset-2 outline-focus-ring",
                                )
                            }
                        >
                            {({ isSelected }) => (
                                <>
                                    <LetterBadge letter={LETTERS[i]} checked={isSelected} />
                                    {(() => {
                                        const OptIcon = optionIcon(opt);
                                        return (
                                            <OptIcon
                                                className={cx("size-5 shrink-0", isSelected ? "text-fg-brand-primary" : "text-fg-quaternary")}
                                                aria-hidden="true"
                                            />
                                        );
                                    })()}
                                    <span className={cx("flex-1 text-sm leading-snug font-medium", isSelected ? "text-brand-secondary" : "text-secondary")}>
                                        {opt}
                                    </span>
                                    <Check
                                        className={cx(
                                            "size-4 shrink-0 text-fg-brand-primary transition duration-100 ease-linear",
                                            isSelected ? "opacity-100" : "opacity-0",
                                        )}
                                        strokeWidth={3}
                                        aria-hidden="true"
                                    />
                                </>
                            )}
                        </AriaCheckbox>
                    ))}
                </div>
            </AriaCheckboxGroup>
            <input
                type="text"
                placeholder="Other…"
                aria-label="Other, please specify"
                value={answer.other}
                onChange={(e) => onOther(q.field, e.target.value)}
                className={cx(underlineCls, "mt-4 pb-1.5 text-md")}
            />
        </div>
    );
};

const NavChevrons = ({ canBack, canNext, onBack, onNext }: { canBack: boolean; canNext: boolean; onBack: () => void; onNext: () => void }) => {
    const btnCls =
        "flex size-11 items-center justify-center bg-brand-solid text-white outline-brand transition duration-100 ease-linear hover:bg-brand-solid_hover focus-visible:outline-2 focus-visible:-outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
    return (
        <div className="absolute right-4 bottom-4 z-20 flex overflow-hidden rounded-lg shadow-lg md:right-6 md:bottom-6">
            <button type="button" aria-label="Previous question" disabled={!canBack} onClick={onBack} className={btnCls}>
                <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <div className="w-px self-stretch bg-white/20" aria-hidden="true" />
            <button type="button" aria-label="Next question" disabled={!canNext} onClick={onNext} className={btnCls}>
                <ChevronRight className="size-5" aria-hidden="true" />
            </button>
        </div>
    );
};

/* ── Review / summary screen — every answer on one page, with a table of contents ── */

const isAnswered = (q: Question, data: HostOnboardingData): boolean => {
    // A recording answers the question just as a typed or picked answer does.
    if (hasMediaAnswer(data, q.field)) return true;
    if (q.type === "text") return data[q.field].trim().length > 0;
    const a = data[q.field];
    return a.picked.length > 0 || a.other.trim().length > 0;
};

/**
 * Where a returning host picks back up. Prefers the question they were last on
 * (matched by field name, so a reordered questionnaire can't land them on the
 * wrong screen), then the first unanswered question, then question 1.
 */
const resumeStepIndex = (data: HostOnboardingData) => {
    if (data.lastField) {
        const i = STEPS.findIndex((s) => s.kind === "question" && s.q.field === data.lastField);
        if (i > 0) return i;
    }
    const firstGap = STEPS.findIndex((s) => s.kind === "question" && !isAnswered(s.q, data));
    return firstGap > 0 ? firstGap : 1;
};

/** Signed-URL playback of a recorded answer on the review page. */
const ReviewRecording = ({ media }: { media: { path: string; kind: "audio" | "video" } }) => {
    const [url, setUrl] = useState("");
    useEffect(() => {
        let live = true;
        supabase.storage
            .from("recordings")
            .createSignedUrl(media.path, 60 * 60)
            .then(({ data }) => {
                if (live && data?.signedUrl) setUrl(data.signedUrl);
            });
        return () => {
            live = false;
        };
    }, [media.path]);

    return (
        <div className="mt-2.5 flex flex-col gap-1.5">
            <p className="flex items-center gap-1.5 text-xs font-medium text-tertiary">
                {media.kind === "video" ? <VideoRecorder className="size-3.5" aria-hidden="true" /> : <Microphone01 className="size-3.5" aria-hidden="true" />}
                {media.kind === "video" ? "Video answer" : "Voice answer"}
            </p>
            {url ? (
                <RecordingPlayer
                    src={url}
                    kind={media.kind}
                    className={media.kind === "video" ? "aspect-video w-full max-w-sm rounded-lg bg-secondary" : "w-full max-w-sm"}
                />
            ) : (
                <p className="text-xs text-quaternary">Loading…</p>
            )}
        </div>
    );
};

const chipCls = "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium ring-1";

/* ── Public helpers — used by the client dashboard's "Client Input" section so it
      reads this form's own question set instead of duplicating the field list. ── */

/** Answered-question count + submission state for a raw jsonb blob from the DB. */
export const hostOnboardingProgress = (partial?: Partial<HostOnboardingData> | null) => {
    const data = mergeData(partial);
    return {
        answered: QUESTION_STEPS.filter(({ q }) => isAnswered(q, data)).length,
        total: TOTAL_QUESTIONS,
        submittedAt: data.submittedAt,
    };
};

export type HostAnswerLine = { text: string; secret?: boolean };
export type HostAnswerRow = { field: string; label: string; lines: HostAnswerLine[]; mediaPath: string; mediaKind: "audio" | "video" | "" };
/** Structurally identical to the Onboarding Form's section, `icon` included — the dashboard renders
    both through the same panel. */
export type HostAnswerSection = { id: string; title: string; icon: typeof Mail01; rows: HostAnswerRow[] };

/**
 * Every answer, grouped by section — the counterpart to clientOnboardingAnswers(), so the
 * dashboard can render this form inline exactly the way it renders the Onboarding Form
 * instead of only offering a link to the review screen. Built from the same SECTIONS the
 * form renders from, so a question added there can never go missing here.
 *
 * Checkbox answers flatten to their picked options plus the free-text "Other", matching
 * how the review screen already presents them. Nothing is flagged `secret`: this form asks
 * about brand, not logins, so it holds no credentials to mask.
 *
 * The shape is structurally identical to the Onboarding Form's answer types on purpose —
 * that's what lets one presentational component render both without either form page
 * importing from the other.
 */
export const hostOnboardingAnswers = (partial?: Partial<HostOnboardingData> | null): HostAnswerSection[] => {
    const data = mergeData(partial);
    return SECTIONS.map((s) => ({
        id: s.id,
        title: s.title,
        icon: s.icon,
        rows: s.questions.map((q) => {
            const lines: HostAnswerLine[] = [];
            if (q.type === "checkbox") {
                const a = data[q.field];
                (a?.picked ?? []).forEach((p) => lines.push({ text: p }));
                const other = (a?.other ?? "").trim();
                if (other) lines.push({ text: other });
            } else {
                const v = (data[q.field] ?? "").trim();
                if (v) v.split("\n").forEach((t) => lines.push({ text: t }));
            }
            const media = mediaFor(data, q.field);
            return { field: q.field, label: q.label, lines, mediaPath: media?.path ?? "", mediaKind: media?.kind ?? ("" as const) };
        }),
    }));
};

/**
 * Every client automatically has their own onboarding form: read the row for
 * `slug`, creating an empty one if it doesn't exist yet. Idempotent — a
 * concurrent create (23505) just falls through to a re-read. Returns the row's
 * answers, or null if the row could not be read or created (callers surface that
 * as an error state rather than showing an empty form as "not started").
 *
 * Never rejects: an offline/DNS failure makes supabase-js throw rather than
 * return `{ error }`, so the whole body is wrapped.
 */
export const ensureHostOnboardingForm = async (args: {
    slug: string;
    clientName?: string;
    clientWebsite?: string;
}): Promise<Partial<HostOnboardingData> | null> => {
    /** `{ ok: false }` = the read itself failed — never confuse that with "no row yet". */
    const read = async (): Promise<{ ok: true; data: Partial<HostOnboardingData> | null } | { ok: false }> => {
        const { data: row, error } = await supabase.from("host_onboarding_pages").select("data").eq("slug", args.slug).maybeSingle();
        if (error) {
            console.error("[host onboarding read]", error);
            return { ok: false };
        }
        return { ok: true, data: (row as { data: Partial<HostOnboardingData> | null } | null)?.data ?? null };
    };

    try {
        const existing = await read();
        if (!existing.ok) return null; // don't insert over a row we simply failed to read
        if (existing.data) return existing.data;

        const { error } = await supabase.from("host_onboarding_pages").insert({
            slug: args.slug,
            client_name: args.clientName?.trim() ?? "",
            client_website: args.clientWebsite?.trim() ?? "",
            data: DEFAULT_DATA,
        });
        if (error) {
            if (error.code !== "23505") {
                console.error("[host onboarding provision]", error);
                return null;
            }
            const raced = await read(); // someone else created it first
            return raced.ok ? (raced.data ?? {}) : null;
        }
        return DEFAULT_DATA;
    } catch (e) {
        console.error("[host onboarding provision]", e);
        return null;
    }
};

/** One answer, read-only. */
const AnswerValue = ({ q, data }: { q: Question; data: HostOnboardingData }) => {
    if (q.type === "text") {
        const v = data[q.field].trim();
        return v ? <p className="text-md whitespace-pre-line text-primary">{v}</p> : <p className="text-md text-quaternary italic">Not answered</p>;
    }
    const a = data[q.field];
    const other = a.other.trim();
    if (!a.picked.length && !other) return <p className="text-md text-quaternary italic">Not answered</p>;
    return (
        <div className="flex flex-wrap gap-2">
            {a.picked.map((opt) => (
                <span key={opt} className={cx(chipCls, "bg-brand-primary_alt text-brand-secondary ring-brand")}>
                    {(() => {
                        const OptIcon = optionIcon(opt);
                        return <OptIcon className="size-3.5 shrink-0" aria-hidden="true" />;
                    })()}
                    {opt}
                </span>
            ))}
            {other && (
                <span className={cx(chipCls, "bg-secondary text-secondary ring-secondary")}>
                    <span className="text-tertiary">Other:</span> {other}
                </span>
            )}
        </div>
    );
};

const ReviewScreen = ({
    data,
    clientName,
    onEdit,
    onClose,
    onEditVideo,
}: {
    data: HostOnboardingData;
    clientName: string;
    onEdit: (questionNum: number) => void;
    onClose: () => void;
    onEditVideo: () => void;
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeId, setActiveId] = useState(SECTIONS[0].id);

    const answeredCount = QUESTION_STEPS.filter(({ q }) => isAnswered(q, data)).length;

    // Highlight the section currently in view — the trigger band sits just under the sticky header.
    useEffect(() => {
        const root = scrollRef.current;
        if (!root) return;
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible[0]?.target.id) setActiveId(visible[0].target.id.replace("review-", ""));
            },
            { root, rootMargin: "-72px 0px -60% 0px", threshold: 0 },
        );
        SECTIONS.forEach((s) => {
            const el = root.querySelector(`#review-${s.id}`);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, []);

    const scrollToSection = (id: string) => {
        const root = scrollRef.current;
        const el = root?.querySelector<HTMLElement>(`#review-${id}`);
        if (!root || !el) return;
        root.scrollTo({ top: el.offsetTop - 60, behavior: "smooth" }); // clear the sticky top bar
        setActiveId(id);
    };

    // Running question number so Edit jumps to the right step.
    let questionNum = 0;

    return (
        <div ref={scrollRef} className="absolute inset-0 overflow-y-auto">
            <div className="mx-auto flex w-full max-w-5xl gap-10 px-5 pt-16 pb-20 md:px-8">
                {/* ── Table of contents — sticky rail on desktop ── */}
                <nav aria-label="Sections" className="sticky top-14 hidden h-max w-56 shrink-0 lg:block">
                    <p className="px-3 text-xs font-semibold tracking-wide text-quaternary uppercase">On this page</p>
                    <ul className="mt-2 flex flex-col gap-0.5">
                        {SECTIONS.map((s) => {
                            const total = s.questions.length;
                            const done = s.questions.filter((q) => isAnswered(q, data)).length;
                            const active = activeId === s.id;
                            return (
                                <li key={s.id}>
                                    <button
                                        type="button"
                                        onClick={() => scrollToSection(s.id)}
                                        aria-current={active ? "true" : undefined}
                                        className={cx(
                                            "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition duration-100 ease-linear",
                                            active ? "bg-brand-primary_alt text-brand-secondary" : "text-secondary hover:bg-secondary",
                                        )}
                                    >
                                        <s.icon className={cx("size-4 shrink-0", active ? "text-fg-brand-primary" : "text-fg-quaternary")} aria-hidden="true" />
                                        <span className="flex-1 leading-snug">{s.title}</span>
                                        <span className={cx("shrink-0 text-xs tabular-nums", done === total ? "text-success-primary" : "text-quaternary")}>
                                            {done}/{total}
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-brand-secondary">{clientName || "Your submission"}</p>
                    <h1 data-step-heading tabIndex={-1} className="mt-3 text-display-xs font-semibold text-primary outline-none md:text-display-sm">
                        Your answers
                    </h1>
                    <p className="mt-2 text-sm text-tertiary">
                        <span className="font-semibold text-primary tabular-nums">
                            {answeredCount} of {TOTAL_QUESTIONS}
                        </span>{" "}
                        answered
                        {data.submittedAt && (
                            <> · submitted {new Date(data.submittedAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</>
                        )}
                    </p>

                    {/* ── Table of contents — horizontal chips on mobile/tablet ── */}
                    <nav aria-label="Sections" className="-mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:hidden">
                        {SECTIONS.map((s) => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => scrollToSection(s.id)}
                                aria-current={activeId === s.id ? "true" : undefined}
                                className={cx(
                                    "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition duration-100 ease-linear",
                                    activeId === s.id ? "bg-brand-primary_alt text-brand-secondary ring-brand" : "bg-primary text-secondary ring-secondary",
                                )}
                            >
                                <s.icon className="size-3.5" aria-hidden="true" />
                                {s.title}
                            </button>
                        ))}
                    </nav>

                    {SECTIONS.map((s) => (
                        <section key={s.id} id={`review-${s.id}`} className="mt-10 scroll-mt-4">
                            <h2 className="flex items-center gap-2 text-md font-semibold text-primary">
                                <s.icon className="size-4 text-fg-brand-primary" aria-hidden="true" />
                                {s.title}
                            </h2>
                            <div className="mt-3 flex flex-col gap-3">
                                {s.questions.map((q) => {
                                    questionNum += 1;
                                    const num = questionNum;
                                    return (
                                        <div key={q.field} className="rounded-2xl bg-primary p-4 ring-1 ring-secondary md:p-5">
                                            <div className="flex items-start justify-between gap-4">
                                                <p className="flex-1 text-sm font-semibold text-secondary">
                                                    <span className="text-quaternary tabular-nums">{num}. </span>
                                                    {q.label}
                                                    {q.required && !isAnswered(q, data) && (
                                                        <span className="ml-1.5 text-xs font-medium text-error-primary">required</span>
                                                    )}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => onEdit(num)}
                                                    className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-secondary outline-brand transition duration-100 ease-linear hover:bg-brand-primary_alt focus-visible:outline-2 focus-visible:outline-offset-2"
                                                >
                                                    <Edit03 className="size-3.5" aria-hidden="true" />
                                                    Edit
                                                    <span className="sr-only"> question {num}</span>
                                                </button>
                                            </div>
                                            <div className="mt-3">
                                                <AnswerValue q={q} data={data} />
                                                {hasMediaAnswer(data, q.field) && <ReviewRecording media={mediaFor(data, q.field)!} />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    ))}

                    {/* Video attachment — outside SECTIONS, so it gets its own card. */}
                    <section className="mt-10">
                        <h2 className="flex items-center gap-2 text-md font-semibold text-primary">
                            <VideoRecorder className="size-4 text-fg-brand-primary" aria-hidden="true" />
                            Personal video
                        </h2>
                        <div className="mt-3 rounded-2xl bg-primary p-4 ring-1 ring-secondary md:p-5">
                            <div className="flex items-start justify-between gap-4">
                                <p className="flex-1 text-sm font-semibold text-secondary">
                                    Video intro <span className="font-normal text-tertiary">(optional)</span>
                                </p>
                                <button
                                    type="button"
                                    onClick={onEditVideo}
                                    className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-secondary outline-brand transition duration-100 ease-linear hover:bg-brand-primary_alt focus-visible:outline-2 focus-visible:outline-offset-2"
                                >
                                    <Edit03 className="size-3.5" aria-hidden="true" />
                                    Edit
                                </button>
                            </div>
                            <div className="mt-3">
                                {data.video && (
                                    <span className={cx(chipCls, "bg-brand-primary_alt text-brand-secondary ring-brand")}>
                                        <PlayCircle className="size-4" aria-hidden="true" />
                                        Video attached
                                    </span>
                                )}
                                {/* A recorded intro plays back here too, not just a pasted link. */}
                                {hasMediaAnswer(data, "video") && <ReviewRecording media={mediaFor(data, "video")!} />}
                                {!data.video && !hasMediaAnswer(data, "video") && <p className="text-md text-quaternary italic">No video added</p>}
                            </div>
                        </div>
                    </section>

                    <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-secondary pt-8">
                        <button type="button" onClick={onClose} className={okBtnCls}>
                            <ArrowLeft className="size-5" aria-hidden="true" />
                            Done
                        </button>
                        <span className="hidden text-xs text-tertiary md:inline">
                            or press <Kbd>Esc</Kbd>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

/** Tasteful one-shot confetti on submit — pure motion spans, no dependency. */
const CONFETTI_COLORS = ["bg-brand-solid", "bg-success-solid", "bg-warning-solid", "bg-brand-secondary"];
const ConfettiBurst = () => {
    const reduceMotion = useReducedMotion();
    const [particles] = useState(() =>
        Array.from({ length: 28 }, (_, i) => ({
            x: (Math.random() - 0.5) * 520,
            y: 220 + Math.random() * 340,
            delay: Math.random() * 0.25,
            duration: 1.2 + Math.random() * 0.7,
            rotate: (Math.random() - 0.5) * 540,
            size: 6 + Math.round(Math.random() * 4),
            color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            shape: i % 3 === 0 ? "rounded-full" : "rounded-[2px]",
        })),
    );
    if (reduceMotion) return null;
    return (
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden="true">
            {particles.map((p, i) => (
                <motion.span
                    key={i}
                    className={cx("absolute top-14 left-1/2", p.color, p.shape)}
                    style={{ width: p.size, height: p.size }}
                    initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                    animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rotate }}
                    transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
                />
            ))}
        </div>
    );
};

/**
 * Outer chrome. Standalone the form owns the whole viewport via AppShell; inside
 * the dashboard modal it just fills the dialog. Declared at module scope (not
 * inline in the render) so switching branches never remounts the form and throws
 * away half-typed answers.
 */
const FormShell = ({ embedded, children }: { embedded: boolean; children: ReactNode }) =>
    embedded ? (
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-tertiary">{children}</div>
    ) : (
        <AppShell className="flex">{children}</AppShell>
    );

export interface HostOnboardingFormPageProps {
    slug?: string;
    initialClientName?: string;
    initialClientWebsite?: string;
    initialData?: Partial<HostOnboardingData> | null;
    /** Rendered inside the dashboard's form modal rather than as a standalone page:
        fills its container instead of the viewport, and drops the AppShell chrome.
        The client's own shared link (/{client}-hostonboarding) always renders full-page. */
    embedded?: boolean;
    /** Shown as a close control when embedded. */
    onClose?: () => void;
}

export const HostOnboardingFormPage = ({
    slug,
    initialClientName = "",
    initialClientWebsite = "",
    initialData,
    embedded = false,
    onClose,
}: HostOnboardingFormPageProps) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isTemplate = !slug;

    const [data, setData] = useState<HostOnboardingData>(() => mergeData(initialData));
    const hydratedRef = useRef(false);
    // Captured once on mount: a returning host lands straight on the review of
    // their answers (no confetti, no re-filling).
    const alreadySubmittedOnLoad = useRef(Boolean(slug && data.submittedAt));

    // Step index + travel direction together, so AnimatePresence reads both atomically.
    // Client copies open straight on question 1 (the welcome screen stays reachable
    // via Back, and the master template still opens on it so the team can preview it).
    const [[stepIndex, direction], setStep] = useState<[number, 1 | -1]>(() =>
        alreadySubmittedOnLoad.current ? [THANKYOU_INDEX, 1] : [slug ? resumeStepIndex(data) : 0, 1],
    );
    const [error, setError] = useState<{ msg: string; nonce: number } | null>(null);
    const [submitState, setSubmitState] = useState<"idle" | "saving" | "error">("idle");
    // Review mode = the read-only summary of every answer. `editingFromReview`
    // means the host jumped into one question from there, so saving it returns
    // to the summary instead of continuing forward through the flow.
    // Already-submitted forms open directly in review.
    const [showReview, setShowReview] = useState(alreadySubmittedOnLoad.current);
    const [editingFromReview, setEditingFromReview] = useState(false);
    const step = STEPS[stepIndex];
    const stepViewportRef = useRef<HTMLDivElement>(null);

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

    // Remember the question they're on so "Continue the form" resumes here. Folded
    // into `data` so it rides along on the debounced autosave below rather than
    // issuing a second write per step.
    useEffect(() => {
        if (!slug) return;
        const current = STEPS[stepIndex];
        if (current?.kind !== "question") return;
        setData((d) => (d.lastField === current.q.field ? d : { ...d, lastField: current.q.field }));
    }, [stepIndex, slug]);

    // Autosave — debounced, client copies only (the master template has nowhere
    // to save to). Guarded so the initial hydration from `initialData` never
    // re-writes the row it just came from.
    useEffect(() => {
        if (!slug) return;
        if (!hydratedRef.current) {
            hydratedRef.current = true; // first run is the initialData hydration — nothing to save
            return;
        }
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

    const onText = (field: TextField, value: string) => {
        setError(null);
        setData((d) => ({ ...d, [field]: value }));
    };
    const onToggle = (field: CheckboxField, option: string) => {
        setError(null);
        setData((d) => {
            const cur = d[field];
            const picked = cur.picked.includes(option) ? cur.picked.filter((o) => o !== option) : [...cur.picked, option];
            return { ...d, [field]: { ...cur, picked } };
        });
    };
    const onPicked = (field: CheckboxField, picked: string[]) => {
        setError(null);
        setData((d) => ({ ...d, [field]: { ...d[field], picked } }));
    };
    const onOther = (field: CheckboxField, other: string) => {
        setError(null);
        setData((d) => ({ ...d, [field]: { ...d[field], other } }));
    };
    const onVideo = (video: string | undefined) => setData((d) => ({ ...d, video }));

    /* ── Navigation ── */

    const goBack = () => {
        if (stepIndex === 0) return;
        setError(null);
        setStep([stepIndex - 1, -1]);
    };

    const goNext = () => {
        // The video → thank-you transition happens only through handleSubmit.
        if (step.kind === "video" || step.kind === "thankyou") return;
        const msg = validateStep(step, data);
        if (msg) {
            setError((er) => ({ msg, nonce: (er?.nonce ?? 0) + 1 }));
            return;
        }
        setError(null);
        if (editingFromReview) {
            backToReview();
            return;
        }
        setStep([stepIndex + 1, 1]);
    };

    /* ── Review / summary ── */

    const openReview = () => {
        setError(null);
        setEditingFromReview(false);
        setShowReview(true);
    };
    const backToReview = () => {
        setError(null);
        setEditingFromReview(false);
        setShowReview(true);
    };
    const closeReview = () => {
        setError(null);
        setShowReview(false);
        setStep([THANKYOU_INDEX, 1]);
    };
    /** Jump from the summary straight into one question (or the video step). */
    const editFromReview = (stepIdx: number) => {
        setError(null);
        setShowReview(false);
        setEditingFromReview(true);
        setStep([stepIdx, -1]);
    };

    const handleSubmit = async () => {
        if (submitState === "saving") return;
        // Safety net: forward nav only validates the current step, so an answer
        // cleared after its step was passed is caught here — jump back to it.
        for (let i = 0; i < STEPS.length; i++) {
            const msg = validateStep(STEPS[i], data);
            if (msg) {
                setStep([i, -1]);
                setError((er) => ({ msg, nonce: (er?.nonce ?? 0) + 1 }));
                return;
            }
        }
        const submittedAt = new Date().toISOString();
        if (slug) {
            setSubmitState("saving");
            const { error: dbError } = await supabase
                .from("host_onboarding_pages")
                .update({ data: { ...data, submittedAt } })
                .eq("slug", slug);
            if (dbError) {
                console.error("[host onboarding submit]", dbError);
                setSubmitState("error");
                return;
            }
        }
        setSubmitState("idle");
        setError(null);
        setData((d) => ({ ...d, submittedAt }));
        setStep([THANKYOU_INDEX, 1]);
        // Land on the answers review right after submitting; the thank-you screen
        // stays one "Close" away from it.
        setEditingFromReview(false);
        setShowReview(true);
    };

    const advance = () => {
        if (step.kind === "welcome" || step.kind === "question") goNext();
        else if (step.kind === "video") {
            // Editing the video from the summary: the attachment already autosaved,
            // so just go back rather than re-submitting the whole form.
            if (editingFromReview) backToReview();
            else void handleSubmit();
        }
    };

    /* ── Keyboard: Enter advances, ↑/↓ navigate, A–J toggle options ── */

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (showCreate) {
                if (e.key === "Escape" && !isCreating) setShowCreate(false);
                return;
            }
            if (showReview) {
                if (e.key === "Escape") closeReview();
                return; // the summary is a plain scrollable page — no step shortcuts
            }
            if (submitState === "saving") return;
            const target = e.target as HTMLElement | null;
            // React Aria's choice cards focus a hidden native checkbox — that's not
            // a typing field, so letter shortcuts must keep working there.
            const isCheckboxInput = target instanceof HTMLInputElement && target.type === "checkbox";
            const inField = !!target && !isCheckboxInput && (target.matches("input, textarea, select") || target.isContentEditable);

            if (inField) {
                // Never hijack typing — inside a field only Enter (and, for the
                // auto-focused single-line inputs where vertical caret movement is
                // meaningless, ↑/↓) navigate, and only on question steps
                // (VideoAttach's own inputs stay theirs).
                if (step.kind !== "question" || e.repeat) return;
                const singleLine = target.tagName === "INPUT";
                if (singleLine && e.key === "ArrowUp") {
                    e.preventDefault();
                    goBack();
                    return;
                }
                if (singleLine && e.key === "ArrowDown") {
                    e.preventDefault();
                    goNext();
                    return;
                }
                if (e.key !== "Enter") return;
                if (target.tagName === "TEXTAREA" && !(e.metaKey || e.ctrlKey)) return; // plain Enter = newline
                e.preventDefault();
                advance();
                return;
            }
            if (e.metaKey || e.ctrlKey || e.altKey) return;

            if (e.key === "Enter") {
                if (!e.repeat) {
                    e.preventDefault();
                    advance();
                }
                return;
            }
            // ←/→ match the back/forward buttons; ↑/↓ keep working for Typeform muscle memory.
            if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                e.preventDefault();
                goBack();
                return;
            }
            if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                e.preventDefault();
                goNext();
                return;
            }

            if (step.kind === "question" && step.q.type === "checkbox" && !e.repeat) {
                const q = step.q;
                const idx = LETTERS.toLowerCase().indexOf(e.key.toLowerCase());
                if (idx >= 0 && idx < q.options.length) {
                    e.preventDefault();
                    const opt = q.options[idx];
                    const answer = data[q.field];
                    const atMax = !!q.maxPick && answer.picked.length >= q.maxPick;
                    if (!answer.picked.includes(opt) && atMax) {
                        setError((er) => ({ msg: `Pick up to ${q.maxPick}`, nonce: (er?.nonce ?? 0) + 1 }));
                    } else {
                        onToggle(q.field, opt);
                    }
                }
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stepIndex, data, showCreate, submitState, isCreating, showReview, editingFromReview]);

    /* ── Focus management — after the step transition settles ── */

    const focusCurrentStep = useCallback(() => {
        const root = stepViewportRef.current;
        if (!root) return;
        const el = root.querySelector<HTMLElement>("[data-step-autofocus]") ?? root.querySelector<HTMLElement>("[data-step-heading]");
        el?.focus({ preventScroll: true });
    }, []);

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
            setCreateError(
                error.code === "23505" ? "A form with that name already exists — pick another." : "Could not save — check your connection and try again.",
            );
            return;
        }
        setShowCreate(false);
        navigate(`/${newSlug}`);
    };

    const progressPct = showReview ? 100 : step.kind === "welcome" ? 0 : step.kind === "question" ? (step.num / TOTAL_QUESTIONS) * 100 : 100;

    return (
        <FormShell embedded={embedded}>
            <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                {embedded && onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        title="Close"
                        className="absolute top-2.5 right-3 z-30 flex size-9 items-center justify-center rounded-lg text-fg-quaternary transition duration-100 ease-linear hover:bg-secondary hover:text-fg-secondary"
                    >
                        <XClose className="size-5" aria-hidden="true" />
                    </button>
                )}
                {/* ── Top bar — title, counter, slim progress (visible on mobile too) ── */}
                {/* bg-tertiary matches the AppShell card surface, so long review content
                    scrolls under an opaque bar instead of bleeding through it. */}
                <header className="absolute inset-x-0 top-0 z-20 bg-tertiary">
                    {/* pr-16 clears the global floating theme toggle (fixed right-4 top-4) */}
                    <div className="flex items-center justify-between gap-3 py-3 pr-16 pl-5 md:pl-8">
                        <p className="truncate text-xs font-medium text-tertiary">
                            Brand Vision Form
                            {initialClientName && <span className="text-quaternary"> · {initialClientName}</span>}
                        </p>
                        {showReview ? (
                            <p className="shrink-0 text-xs font-medium text-tertiary">Your answers</p>
                        ) : (
                            <>
                                {step.kind === "question" && (
                                    <p className="shrink-0 text-xs font-medium text-tertiary tabular-nums">
                                        {step.num} of {TOTAL_QUESTIONS}
                                    </p>
                                )}
                                {step.kind === "video" && <p className="shrink-0 text-xs font-medium text-tertiary">Last step · optional</p>}
                            </>
                        )}
                    </div>
                    <div
                        className="h-1 w-full bg-quaternary"
                        role="progressbar"
                        aria-label="Form progress"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(progressPct)}
                    >
                        <motion.div
                            className="h-full bg-brand-solid"
                            initial={false}
                            animate={{ width: `${progressPct}%` }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        />
                    </div>
                </header>

                {/* ── Review summary — every answer on one page ── */}
                {showReview && (
                    <div className="relative min-h-0 flex-1">
                        <motion.div
                            className="absolute inset-0"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <ReviewScreen
                                data={data}
                                clientName={initialClientName}
                                onEdit={(num) => editFromReview(num)}
                                onEditVideo={() => editFromReview(VIDEO_INDEX)}
                                onClose={closeReview}
                            />
                        </motion.div>
                    </div>
                )}

                {/* ── Step viewport — one screen at a time ── */}
                <div className={cx("relative min-h-0 flex-1", showReview && "hidden")}>
                    <AnimatePresence mode="wait" custom={direction} initial={false}>
                        <motion.div
                            key={stepIndex}
                            ref={stepViewportRef}
                            custom={direction}
                            variants={stepVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            onAnimationComplete={(definition) => definition === "center" && focusCurrentStep()}
                            className="absolute inset-0 flex flex-col overflow-y-auto"
                        >
                            <div className="mx-auto my-auto w-full max-w-2xl px-5 py-20 md:px-8">
                                {step.kind === "welcome" && (
                                    <div>
                                        {isTemplate && (
                                            <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand_alt bg-brand-primary_alt px-4 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="inline-flex items-center rounded-full bg-brand-solid px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-white uppercase">
                                                        Template
                                                    </span>
                                                    <p className="text-[13px] font-medium text-brand-secondary">
                                                        Master template — answers here won't be saved. Create a private copy for a new host.
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCreate(true)}
                                                    className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-solid px-3.5 py-2 text-[13px] font-semibold text-white transition duration-100 ease-linear hover:bg-brand-solid_hover"
                                                >
                                                    <Plus className="size-4" aria-hidden="true" />
                                                    Create for a new host
                                                </button>
                                            </div>
                                        )}
                                        <p className="text-sm font-medium text-brand-secondary">{initialClientName || "Host Onboarding"}</p>
                                        <h1
                                            data-step-heading
                                            tabIndex={-1}
                                            className="mt-3 text-display-sm font-semibold text-primary outline-none md:text-display-lg"
                                        >
                                            Brand Vision Form
                                        </h1>
                                        <p className="mt-4 max-w-xl text-md text-tertiary">
                                            Your brand is more than just a logo — it's the look, feel, and personality that makes your property stand out and
                                            connect with the right guests.
                                        </p>
                                        <div className="mt-4 flex flex-col gap-1.5 text-md text-tertiary">
                                            <p className="flex items-start gap-2.5">
                                                <Clock className="mt-1 size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                                                Takes 5–10 minutes, and helps us avoid back-and-forth later.
                                            </p>
                                            <p className="flex items-start gap-2.5">
                                                <Stars01 className="mt-1 size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                                                The more insight you give, the better the result.
                                            </p>
                                        </div>
                                        <div className="mt-8 flex items-center gap-3">
                                            <button type="button" onClick={goNext} className={cx(okBtnCls, "rounded-xl px-7 py-3")}>
                                                Start
                                                <ArrowRight className="size-5" aria-hidden="true" />
                                            </button>
                                            <span className="hidden text-xs text-tertiary md:inline">
                                                press <Kbd>Enter ↵</Kbd>
                                            </span>
                                        </div>
                                        <p className="mt-6 text-sm text-quaternary">
                                            {TOTAL_QUESTIONS} questions
                                            {initialClientWebsite && <span> · {initialClientWebsite}</span>}
                                        </p>
                                    </div>
                                )}

                                {step.kind === "question" && (
                                    <div>
                                        {editingFromReview && (
                                            <button
                                                type="button"
                                                onClick={backToReview}
                                                className="mb-5 flex items-center gap-1.5 text-sm font-semibold text-tertiary transition duration-100 ease-linear hover:text-secondary"
                                            >
                                                <ArrowLeft className="size-4" aria-hidden="true" />
                                                Back to summary
                                            </button>
                                        )}
                                        <p className="flex items-center gap-2 text-sm font-medium text-brand-secondary">
                                            <step.icon className="size-4" aria-hidden="true" />
                                            {step.sectionTitle}
                                            <span className="flex items-center gap-1 text-tertiary tabular-nums">
                                                · {step.num} <ArrowRight className="size-4" aria-hidden="true" />
                                            </span>
                                        </p>
                                        <h1
                                            id="question-heading"
                                            data-step-heading
                                            tabIndex={-1}
                                            className="mt-3 text-display-xs font-semibold text-primary outline-none md:text-display-sm"
                                        >
                                            {step.q.label}
                                            {step.q.required && (
                                                <span className="text-error-primary" aria-hidden="true">
                                                    {" "}
                                                    *
                                                </span>
                                            )}
                                        </h1>
                                        {step.q.type === "checkbox" && (
                                            <p className="mt-2 text-sm text-tertiary">{step.q.hint ?? "Choose as many as you like"}</p>
                                        )}

                                        {step.q.type === "text" ? (
                                            <TextQuestion q={step.q} value={data[step.q.field]} onChange={onText} />
                                        ) : (
                                            <ChoiceGroup q={step.q} answer={data[step.q.field]} onPicked={onPicked} onOther={onOther} />
                                        )}

                                        {/* Voice / video alternative on the narrative questions — never a
                                            replacement for typing or picking, always an addition. */}
                                        {canRecordField(step.q.field) && (
                                            <MediaAnswer
                                                slug={slug}
                                                field={step.q.field}
                                                path={mediaFor(data, step.q.field)?.path ?? ""}
                                                kind={mediaFor(data, step.q.field)?.kind ?? ""}
                                                onChange={(path, kind) =>
                                                    setData((d) => {
                                                        const next = { ...(d.mediaAnswers ?? {}) };
                                                        if (path && kind) next[step.q.field] = { path, kind };
                                                        else delete next[step.q.field];
                                                        return { ...d, mediaAnswers: next };
                                                    })
                                                }
                                            />
                                        )}

                                        {error && <ErrorShake key={error.nonce} msg={error.msg} />}

                                        <div className="mt-8 flex items-center gap-3">
                                            <button type="button" onClick={goNext} className={okBtnCls}>
                                                {editingFromReview ? "Save" : "OK"}
                                                <Check className="size-5" strokeWidth={3} aria-hidden="true" />
                                            </button>
                                            <span className="hidden text-xs text-tertiary md:inline">
                                                press <Kbd>Enter ↵</Kbd>
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {step.kind === "video" && (
                                    <div>
                                        {editingFromReview && (
                                            <button
                                                type="button"
                                                onClick={backToReview}
                                                className="mb-5 flex items-center gap-1.5 text-sm font-semibold text-tertiary transition duration-100 ease-linear hover:text-secondary"
                                            >
                                                <ArrowLeft className="size-4" aria-hidden="true" />
                                                Back to summary
                                            </button>
                                        )}
                                        <p className="text-sm font-medium text-brand-secondary">Last step · optional</p>
                                        <h1
                                            data-step-heading
                                            tabIndex={-1}
                                            className="mt-3 text-display-xs font-semibold text-primary outline-none md:text-display-sm"
                                        >
                                            Want to add a personal touch? <span className="font-normal text-tertiary">(optional)</span>
                                        </h1>
                                        <p className="mt-2 text-sm text-tertiary">
                                            Record right here, or paste a Loom/YouTube link — whichever is easier.
                                        </p>

                                        {/* Record in the browser, same control as the questions. Stored under the
                                            "video" key in mediaAnswers, which keeps data.video free for the pasted
                                            link / uploaded file it already holds — a host can do either. */}
                                        <MediaAnswer
                                            slug={slug}
                                            field="video"
                                            path={mediaFor(data, "video")?.path ?? ""}
                                            kind={mediaFor(data, "video")?.kind ?? ""}
                                            onChange={(path, kind) =>
                                                setData((d) => {
                                                    const next = { ...(d.mediaAnswers ?? {}) };
                                                    if (path && kind) next.video = { path, kind };
                                                    else delete next.video;
                                                    return { ...d, mediaAnswers: next };
                                                })
                                            }
                                        />

                                        <div className="mt-6 flex items-center gap-3">
                                            <span className="h-px flex-1 bg-border-secondary" />
                                            <span className="text-xs font-medium text-quaternary">or share a link</span>
                                            <span className="h-px flex-1 bg-border-secondary" />
                                        </div>
                                        <VideoAttach value={data.video} onChange={onVideo} className="mt-4" />

                                        {submitState === "error" && (
                                            <div role="alert" className="mt-6 flex items-center gap-2 text-sm font-medium text-error-primary">
                                                <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
                                                Couldn't submit — check your connection and try again.
                                            </div>
                                        )}

                                        <div className="mt-8 flex items-center gap-3">
                                            {editingFromReview ? (
                                                <button type="button" onClick={backToReview} className={okBtnCls}>
                                                    Save
                                                    <Check className="size-5" strokeWidth={3} aria-hidden="true" />
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={handleSubmit}
                                                    disabled={submitState === "saving"}
                                                    className="flex items-center gap-2 rounded-lg bg-success-solid px-6 py-3 text-md font-semibold text-white shadow-sm transition duration-100 ease-linear hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {submitState === "saving" && (
                                                        <span
                                                            className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                                                            aria-hidden="true"
                                                        />
                                                    )}
                                                    {submitState === "saving" ? "Submitting…" : data.submittedAt ? "Update answers ✓" : "Submit 🎉"}
                                                </button>
                                            )}
                                            <span className="hidden text-xs text-tertiary md:inline">
                                                press <Kbd>Enter ↵</Kbd>
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {step.kind === "thankyou" && (
                                    <div className="flex flex-col items-center text-center">
                                        <FeaturedIcon icon={CheckCircle} color="success" theme="light" size="xl" />
                                        <h1
                                            data-step-heading
                                            tabIndex={-1}
                                            className="mt-6 text-display-sm font-semibold text-primary outline-none md:text-display-md"
                                        >
                                            Thank you{(data.businessName.trim() || initialClientName) && `, ${data.businessName.trim() || initialClientName}`}!
                                            🎉
                                        </h1>
                                        <p className="mt-3 max-w-md text-md text-tertiary">
                                            {alreadySubmittedOnLoad.current
                                                ? "You've already submitted this form — you can still review and update your answers any time."
                                                : "Your answers are in — the HiddenGem team takes it from here."}
                                        </p>
                                        {data.submittedAt && (
                                            <p className="mt-2 text-sm text-quaternary">
                                                Submitted{" "}
                                                {new Date(data.submittedAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                                            </p>
                                        )}
                                        <button
                                            type="button"
                                            onClick={openReview}
                                            className="mt-8 text-sm font-semibold text-brand-secondary transition duration-100 ease-linear hover:text-brand-secondary_hover"
                                        >
                                            Review or edit your answers →
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {step.kind === "thankyou" && !alreadySubmittedOnLoad.current && <ConfettiBurst />}
                </div>

                {!showReview && !editingFromReview && (step.kind === "question" || step.kind === "video") && (
                    <NavChevrons canBack={stepIndex > 0} canNext={step.kind === "question"} onBack={goBack} onNext={goNext} />
                )}
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
                                    <h3 className="text-md font-semibold text-primary">Create Brand Vision Form</h3>
                                    <p className="mt-1 text-sm text-tertiary">Enter the new host's details — they'll fill in the rest themselves.</p>
                                </div>
                                <button
                                    type="button"
                                    aria-label="Close"
                                    onClick={() => setShowCreate(false)}
                                    className="flex size-8 items-center justify-center rounded-lg text-tertiary hover:bg-secondary"
                                >
                                    <XClose className="size-4" aria-hidden="true" />
                                </button>
                            </div>

                            <div className="mt-4 flex flex-col gap-3">
                                <div>
                                    <label htmlFor="new-host-name" className="mb-1.5 block text-sm font-medium text-secondary">
                                        Business / property name
                                    </label>
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
                                    <label htmlFor="new-host-website" className="mb-1.5 block text-sm font-medium text-secondary">
                                        Website (optional)
                                    </label>
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
                                        Page URL:{" "}
                                        <span className="font-medium text-brand-secondary">docs-hgm.netlify.app/{slugify(newClientName)}-hostonboarding</span>
                                    </p>
                                )}
                                {createError && (
                                    <p role="alert" className="text-xs text-error-primary">
                                        {createError}
                                    </p>
                                )}
                            </div>

                            <div className="mt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    disabled={isCreating}
                                    className="flex-1 rounded-lg border border-secondary px-4 py-2 text-sm font-semibold text-secondary transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCreate}
                                    disabled={!newClientName.trim() || isCreating}
                                    className="flex-1 rounded-lg bg-brand-solid px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isCreating ? "Creating…" : "Create"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </FormShell>
    );
};
