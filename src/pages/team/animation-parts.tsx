import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "@untitledui-pro/icons/line";
import type { MotionValue } from "motion/react";
import {
    AnimatePresence,
    LayoutGroup,
    MotionConfig,
    cubicBezier,
    motion,
    useInView,
    useMotionValueEvent,
    useReducedMotion,
    useScroll,
    useTransform,
} from "motion/react";
import { cx } from "@/utils/cx";

/**
 * The moving pieces of /animation that the project did not already own.
 * Ported from the HiddenGem marketing site's animation-parts.tsx.
 *
 * TWO THINGS ARE DELIBERATELY NOT HERE. The staggered entrance in section 03 is
 * `Reveal` from components/shared-assets, and the text entrances in section 04
 * are `TextFx` from components/marketing — both already exist, both already
 * handle reduced motion, and re-implementing either would have been the exact
 * mistake this page argues against.
 *
 * THE DEVICE FRAMES ARE LOCAL to this file rather than imported: the marketing
 * site has PhoneFrame/LaptopFrame components, this project has committed bezel
 * bitmaps in public/device-mockups/ plus the inline pattern /test uses. The
 * screen insets below are copied from the canonical manifest in
 * ~/Documents/For_You_Claude/device-bezels/prepared/manifest.json — never
 * re-measured per project.
 */

/* -------------------------------------------------------------------------- */
/* Device frames                                                               */
/* -------------------------------------------------------------------------- */

type FrameSpec = {
    src: string;
    /** Cropped bitmap dimensions — drives the wrapper's aspect ratio. */
    px: [number, number];
    /** Screen cut-out as a percentage of the cropped bitmap (from the manifest). */
    inset: { left: number; top: number; width: number; height: number };
};

const PHONE_BEZEL: FrameSpec = {
    src: "/device-mockups/iphone-17-pro-silver.png",
    px: [626, 1290],
    inset: { left: 4.313, top: 1.86, width: 91.374, height: 96.279 },
};

const LAPTOP_BEZEL: FrameSpec = {
    src: "/device-mockups/macbook-air-13.png",
    px: [1723, 1005],
    inset: { left: 11.203, top: 6.347, width: 77.544, height: 83.089 },
};

/**
 * Percentage corner radius so it tracks the frame at every size — same formula
 * as /test. The horizontal and vertical halves are given separately (`x% / y%`)
 * because a single percentage resolves per axis and would ellipse the corner.
 */
const screenRadius = ({ px, inset }: FrameSpec, share: number) => {
    const w = (px[0] * inset.width) / 100;
    const h = (px[1] * inset.height) / 100;
    const r = w * share;
    return `${((r / w) * 100).toFixed(2)}% / ${((r / h) * 100).toFixed(2)}%`;
};

const screenStyle = (spec: FrameSpec, radiusShare: number): React.CSSProperties => ({
    left: `${spec.inset.left}%`,
    top: `${spec.inset.top}%`,
    width: `${spec.inset.width}%`,
    height: `${spec.inset.height}%`,
    borderRadius: screenRadius(spec, radiusShare),
});

/** The tag on a screen we have no capture for yet. */
const ScreenAssetNote = ({ children }: { children: React.ReactNode }) => (
    <span className="inline-flex items-center gap-2 rounded-full border border-brand bg-primary/80 px-2.5 py-1 text-[0.625rem] font-semibold tracking-[0.08em] text-brand-secondary uppercase backdrop-blur-sm">
        <span aria-hidden="true" className="size-1.5 shrink-0 rotate-45 bg-brand-solid" />
        {children}
    </span>
);

/** The stand-in for a screen capture we do not have. All tokens, no assets. */
const ScreenPlaceholder = ({ label }: { label: string }) => (
    <div className="flex size-full items-end overflow-hidden bg-linear-160 from-bg-secondary via-bg-primary to-bg-secondary p-3">
        <ScreenAssetNote>{label}</ScreenAssetNote>
    </div>
);

/**
 * A real capture pair from public/device-mockups/ — the screenshots follow the
 * theme, so the phones read correctly in both light and dark mode.
 */
const ScreenShot = ({ shot }: { shot: string }) => (
    <>
        <img src={`/device-mockups/screen-${shot}-light.jpg`} alt="" className="size-full object-cover object-top dark:hidden" />
        <img src={`/device-mockups/screen-${shot}-dark.jpg`} alt="" className="hidden size-full object-cover object-top dark:block" />
    </>
);

/**
 * iPhone frame plus its screen. The bezel is a true cut-out — alpha 0 at the
 * screen — so content sits BEHIND the frame and the bezel's own edge falls over
 * it. `shot` renders a committed screenshot pair; `children` takes over the
 * screen entirely (the scrubbed video in section 09); with neither, the
 * gold-tagged placeholder stands in.
 */
export const PhoneFrame = ({ label, shot, className, children }: { label: string; shot?: string; className?: string; children?: React.ReactNode }) => (
    <div className={cx("relative w-full", className)} style={{ aspectRatio: `${PHONE_BEZEL.px[0]} / ${PHONE_BEZEL.px[1]}` }}>
        <div className="absolute overflow-hidden bg-linear-160 from-bg-secondary via-bg-primary to-bg-secondary" style={screenStyle(PHONE_BEZEL, 0.047)}>
            {children ?? (shot ? <ScreenShot shot={shot} /> : <ScreenPlaceholder label={label} />)}
        </div>
        <img src={PHONE_BEZEL.src} alt="" className="pointer-events-none relative z-10 size-full drop-shadow-xl select-none" />
    </div>
);

/** MacBook Air 13 frame. Same mechanics; a laptop screen is nearly square-cornered. */
export const LaptopFrame = ({ label, className, children }: { label: string; className?: string; children?: React.ReactNode }) => (
    <div className={cx("relative w-full", className)} style={{ aspectRatio: `${LAPTOP_BEZEL.px[0]} / ${LAPTOP_BEZEL.px[1]}` }}>
        <div className="absolute overflow-hidden" style={{ ...screenStyle(LAPTOP_BEZEL, 0.008), borderRadius: "0.5% / 0.9%" }}>
            {children ?? <ScreenPlaceholder label={label} />}
        </div>
        <img src={LAPTOP_BEZEL.src} alt="" className="pointer-events-none relative z-10 size-full drop-shadow-xl select-none" />
    </div>
);

/**
 * A drawn desktop page for the laptop's screen — bars, cards, one brand
 * element, everything a percentage so it scales with the frame the way a
 * screenshot would. Not one pixel value in it.
 */
export const DesktopPage = () => (
    <div className="flex size-full flex-col bg-primary">
        <div className="flex h-[9%] shrink-0 items-center gap-[2.5%] border-b border-secondary px-[3%]">
            <span aria-hidden="true" className="aspect-square h-[30%] shrink-0 rotate-45 bg-brand-solid" />
            <span className="h-[16%] w-[14%] rounded-full bg-quaternary" />
            <span className="ml-auto flex h-[16%] w-[32%] justify-between">
                <span className="h-full w-[28%] rounded-full bg-quaternary" />
                <span className="h-full w-[28%] rounded-full bg-quaternary" />
                <span className="h-full w-[28%] rounded-full bg-quaternary" />
            </span>
        </div>

        <div className="flex h-[28%] shrink-0 items-end justify-between gap-[3%] bg-linear-160 from-bg-secondary via-bg-primary to-bg-secondary px-[3%] pb-[5%]">
            <span className="flex h-[40%] flex-1 flex-col justify-end gap-[16%]">
                <span className="h-[24%] w-[55%] rounded-sm bg-quaternary" />
                <span className="h-[14%] w-[36%] rounded-full bg-quaternary" />
            </span>
        </div>

        <div className="grid h-[63%] grid-cols-3 gap-[2%] p-[3%]">
            {[0, 1, 2].map((card) => (
                <div key={card} className="flex flex-col gap-[4%] overflow-hidden rounded-md border border-secondary bg-secondary p-[6%]">
                    <span className="flex-1 rounded-sm bg-quaternary" />
                    <span className="h-[7%] w-[66%] shrink-0 rounded-full bg-quaternary" />
                </div>
            ))}
        </div>
    </div>
);

/* -------------------------------------------------------------------------- */
/* Easing lab                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Four dots, one start gun. Curves cannot be compared from their numbers —
 * `cubic-bezier(0, 0, 0.2, 1)` and `cubic-bezier(0.4, 0, 0.6, 1)` are four
 * digits apart and feel like different products — so this races them over the
 * same distance in the same time and lets the eye do the work.
 *
 * `linear` is in the race on purpose. It is this project's house
 * micro-transition (`transition duration-100 ease-linear`, per CLAUDE.md), and
 * next to the other three it reads as a machine moving a part. That is fine for
 * opacity and colour, which is most of what it is used on, and wrong for
 * anything that changes position.
 */
const CURVES = [
    {
        name: "ease-enter",
        css: "cubic-bezier(0, 0, 0.2, 1)",
        note: "Decelerate. Arrives fast, settles. Anything entering the frame.",
    },
    {
        name: "ease-state",
        css: "cubic-bezier(0.4, 0, 0.6, 1)",
        note: "The workhorse — 316 of apple.com's 400-odd easing declarations. On-screen state changes.",
    },
    {
        name: "ease-overshoot",
        css: "cubic-bezier(0.4, 0, 0.3, 2)",
        note: "Passes the target and returns. Small elements only — 7 uses on a whole product page.",
    },
    {
        name: "linear",
        css: "linear",
        note: "Our house micro-transition. Correct for colour, mechanical for movement.",
    },
];

/** The scale worth staying on: micro, component, panel, cinematic. */
const DURATIONS = [
    { ms: 100, note: "Micro — hover, focus, a chevron turning." },
    { ms: 240, note: "Component — a menu item, a card lifting." },
    { ms: 320, note: "Panel — flyouts, drawers, anything with area." },
    { ms: 1000, note: "Cinematic — scroll-driven only. Never a click." },
];

/**
 * One dot on one track. Travel is measured in container units, not pixels: a
 * percentage translate resolves against the DOT (28px); `100cqw` resolves
 * against the TRACK at whatever width the column is. That is the whole reason
 * the track carries `@container`.
 */
const Track = ({ on, duration, ease, instant }: { on: boolean; duration: number; ease: string; instant: boolean }) => (
    <div className="@container relative h-9 overflow-hidden rounded-full border border-secondary bg-secondary">
        <div
            className="absolute top-1/2 left-1 size-7 rounded-full bg-brand-solid"
            style={{
                transitionProperty: "transform",
                // Reduced motion gets the end state with no journey — which is
                // what apple.com's 61 prefers-reduced-motion blocks do too.
                transitionDuration: instant ? "0ms" : `${duration}ms`,
                transitionTimingFunction: ease,
                // 2.25rem = the 0.25rem inset at each end plus the 1.75rem dot.
                transform: on ? "translate(calc(100cqw - 2.25rem), -50%)" : "translate(0, -50%)",
            }}
        />
    </div>
);

const LabButton = ({ onClick, children, disabled }: { onClick: () => void; children: React.ReactNode; disabled?: boolean }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="rounded-full bg-brand-solid px-5 py-2.5 text-sm font-semibold text-white transition duration-100 ease-linear hover:bg-brand-solid_hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-50"
    >
        {children}
    </button>
);

export const EasingLab = () => {
    const [on, setOn] = useState(false);
    const instant = !!useReducedMotion();

    return (
        <div className="mt-12">
            <LabButton onClick={() => setOn((value) => !value)}>{on ? "Send them back" : "Run all eight"}</LabButton>

            <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-x-12">
                <div>
                    <h3 className="text-sm font-semibold tracking-[0.08em] text-secondary uppercase">Four curves · all at 1000ms</h3>
                    <p className="mt-2 text-sm text-tertiary">Same distance, same time. The only variable is the shape of the acceleration.</p>

                    <ul className="mt-6 flex flex-col gap-6">
                        {CURVES.map((curve) => (
                            <li key={curve.name}>
                                <div className="flex items-baseline justify-between gap-4">
                                    <span className="font-mono text-xs text-primary">{curve.name}</span>
                                    <span className="font-mono text-xs text-quaternary">{curve.css}</span>
                                </div>
                                <div className="mt-2">
                                    <Track on={on} duration={1000} ease={curve.css} instant={instant} />
                                </div>
                                <p className="mt-2 text-sm text-tertiary">{curve.note}</p>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h3 className="text-sm font-semibold tracking-[0.08em] text-secondary uppercase">Four durations · all on ease-state</h3>
                    <p className="mt-2 text-sm text-tertiary">
                        Same curve, four speeds. 1000ms is unusable for anything a finger triggers — which is exactly why it is reserved for scroll.
                    </p>

                    <ul className="mt-6 flex flex-col gap-6">
                        {DURATIONS.map((step) => (
                            <li key={step.ms}>
                                <div className="flex items-baseline justify-between gap-4">
                                    <span className="font-mono text-xs text-primary">{step.ms}ms</span>
                                    <span className="font-mono text-xs text-quaternary">duration-{step.ms}</span>
                                </div>
                                <div className="mt-2">
                                    <Track on={on} duration={step.ms} ease="cubic-bezier(0.4, 0, 0.6, 1)" instant={instant} />
                                </div>
                                <p className="mt-2 text-sm text-tertiary">{step.note}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/* Pin and scrub                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The finding worth stealing. apple.com's product pages carry 25 live sticky
 * elements and no fly-in for the hero: a section PINS to the viewport and its
 * contents are driven by scroll POSITION, not by a timer that a scroll happened
 * to start. The visitor is scrubbing — they can stop halfway, go backwards, and
 * the thing under their thumb tracks them.
 *
 * THE TALL WRAPPER IS THE TIMELINE. Its height IS the duration — 280vh of
 * scroll maps to 0 → 1 — and the sticky child is what stays on screen while
 * that plays. No scroll listener and no rAF loop: `useScroll` hands back a
 * motion value and `useTransform` reads off it, so scrolling never re-renders
 * React.
 *
 * REDUCED MOTION GETS THE END STATE — the finished frame, sitting still, with
 * the tall wrapper gone so the page does not carry three screens of empty
 * scroll for an effect that is not running.
 */
export const PinStage = ({ children }: { children: React.ReactNode }) => {
    const wrapper = useRef<HTMLDivElement>(null);
    const prefersReducedMotion = useReducedMotion();

    // Scoped to the wrapper, not the document: 0 when the wrapper's top meets
    // the top of the viewport (the instant the child pins), 1 when its bottom
    // does (the instant it unpins).
    const { scrollYProgress } = useScroll({ target: wrapper, offset: ["start start", "end end"] });

    // The move finishes at 0.85 rather than 1, so the frame is fully assembled
    // for the last half-screen of the pin instead of still settling as it
    // leaves. Transform only — no opacity ramp (see the source page's measured
    // note: a scroll-driven opacity was handed to WAAPI on its own timeline and
    // faded the laptop out exactly as it finished assembling).
    const scale = useTransform(scrollYProgress, [0, 0.85], [0.58, 1]);
    const rotateX = useTransform(scrollYProgress, [0, 0.85], [18, 0]);
    const progress = useTransform(scrollYProgress, (value) => `${Math.round(value * 100)}%`);

    if (prefersReducedMotion) {
        return <div className="mx-auto mt-14 w-full max-w-3xl px-5">{children}</div>;
    }

    return (
        <div ref={wrapper} className="relative h-[280vh]">
            {/* `h-svh`, not `h-screen`: on mobile Safari the URL bar makes 100vh
                taller than the visible area, so the pinned frame sits low and
                its bottom edge is cut off exactly while pinned. */}
            <div className="sticky top-0 flex h-svh flex-col items-center justify-center gap-8 px-5" style={{ perspective: 1400 }}>
                <motion.div style={{ scale, rotateX }} className="w-full max-w-3xl">
                    {children}
                </motion.div>

                {/* The input, drawn: a scrub whose driver you cannot see is
                    indistinguishable from a slow animation. It reads the same
                    motion value as the frame, so it cannot drift out of step. */}
                <div className="h-1 w-full max-w-3xl shrink-0 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
                    <motion.div style={{ width: progress }} className="h-full bg-brand-solid" />
                </div>
            </div>
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/* Four houses                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The same bar filling four times, each in a different company's measured house
 * style. Counted from live stylesheets on 29 August 2026 — see section 28 for
 * the tallies and the method.
 */
const HOUSES = [
    {
        name: "Apple",
        css: "cubic-bezier(0.4, 0, 0.6, 1)",
        ms: 320,
        evidence: "316 uses of one symmetric curve; 320ms is the modal duration.",
        stance: "Cinematic. Scroll drives the page and a film crew fills it.",
    },
    {
        name: "Linear",
        css: "cubic-bezier(0.32, 0.72, 0, 1)",
        ms: 160,
        evidence: "160ms is the modal duration; nothing on the page is sticky.",
        stance: "App speed. Motion confirms an action, never performs one.",
    },
    {
        name: "Stripe",
        css: "cubic-bezier(0.25, 1, 0.5, 1)",
        ms: 300,
        evidence: "43 uses of ease-out-quart, the strongest deceleration of the four.",
        stance: "Middle. Nothing narrates on scroll; the curve does the persuading.",
    },
    {
        name: "Aman",
        css: "cubic-bezier(0.19, 1, 0.22, 1)",
        ms: 400,
        evidence: "Three easing declarations on the entire homepage.",
        stance: "Near-silence. The photograph is the content; motion gets out of the way.",
    },
];

export const HouseLab = () => {
    const [on, setOn] = useState(false);
    const instant = !!useReducedMotion();

    return (
        <div className="mt-12">
            <LabButton onClick={() => setOn((value) => !value)}>{on ? "Reset all four" : "Fill all four"}</LabButton>

            <ul className="mt-10 grid gap-8 md:grid-cols-2 md:gap-x-12">
                {HOUSES.map((house) => (
                    <li key={house.name}>
                        <div className="flex items-baseline justify-between gap-4">
                            <span className="text-md font-semibold text-primary">{house.name}</span>
                            <span className="font-mono text-xs text-quaternary">{house.ms}ms</span>
                        </div>

                        {/* A bar filling, not the dot from section 01: a fill is
                            the honest shape for what is being compared — most
                            real transitions reveal or resize something rather
                            than fly it across a rail. */}
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                            <div
                                className="h-full origin-left rounded-full bg-brand-solid"
                                style={{
                                    transitionProperty: "transform",
                                    transitionDuration: instant ? "0ms" : `${house.ms}ms`,
                                    transitionTimingFunction: house.css,
                                    transform: on ? "scaleX(1)" : "scaleX(0)",
                                }}
                            />
                        </div>

                        <p className="mt-3 font-mono text-xs text-quaternary">{house.css}</p>
                        <p className="mt-2 text-sm text-secondary">{house.stance}</p>
                        <p className="mt-1 text-sm text-tertiary">{house.evidence}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/* Scroll-scrubbed video                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The technique the whole apple.com product page is built around: the video's
 * `currentTime` is written from scroll position, so the footage is not playing —
 * it is being scrubbed, frame by frame, by the visitor's thumb.
 *
 * IT FINDS ITS OWN VIDEO rather than owning it: the `<video>` arrives as
 * children inside the phone frame, and this component reaches into its wrapper
 * for it. There is exactly one video in this subtree; if that stops being true
 * the query needs a data attribute, not a refactor.
 *
 * SEEKING IS NOT PLAYING: every seek decodes forward from the nearest keyframe,
 * so a file authored for playback (one keyframe every few seconds) stutters.
 * That is demonstrated honestly here rather than staged.
 *
 * REDUCED MOTION NEVER SEEKS. No tall wrapper, no listener: the poster frame
 * stands as a still photograph.
 */
export const ScrubStage = ({ children }: { children: React.ReactNode }) => {
    const wrapper = useRef<HTMLDivElement>(null);
    const prefersReducedMotion = useReducedMotion();

    const { scrollYProgress } = useScroll({ target: wrapper, offset: ["start start", "end end"] });

    useMotionValueEvent(scrollYProgress, "change", (progress) => {
        const video = wrapper.current?.querySelector("video");
        // `duration` is NaN until metadata arrives and Infinity for a stream;
        // seeking on either throws the frame away and logs noise.
        if (!video || !Number.isFinite(video.duration)) return;
        video.currentTime = video.duration * Math.min(Math.max(progress, 0), 1);
    });

    if (prefersReducedMotion) {
        return <div className="mx-auto mt-14 w-[min(62vw,300px)]">{children}</div>;
    }

    return (
        <div ref={wrapper} className="relative h-[300vh]">
            <div className="sticky top-0 flex h-svh flex-col items-center justify-center gap-8">
                <div className="w-[min(62vw,300px)]">{children}</div>
            </div>
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/* Replay scope                                                                */
/* -------------------------------------------------------------------------- */

/**
 * A button that remounts its children, so an in-view entrance can be watched
 * more than once. It contains no animation of its own, which is the point:
 * `Reveal` and `TextFx` fire once when they reach the reading line, which is
 * correct behaviour and useless in a lab, so this bumps a React key and they
 * mount again. Fifteen lines of state instead of a third entrance component.
 */
export const ReplayScope = ({ label, children }: { label: string; children: React.ReactNode }) => {
    const [run, setRun] = useState(0);

    return (
        <div>
            <LabButton onClick={() => setRun((value) => value + 1)}>{label}</LabButton>
            <div key={run}>{children}</div>
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/* The family shot                                                             */
/* -------------------------------------------------------------------------- */

/**
 * apple.com/iphone-17-pro's "All in the family" section, rebuilt from its
 * measured transforms rather than from what it looks like: the outer two start
 * 100px further apart and close in, the middle one starts 40% oversized and
 * settles back, all three start 200px low and rise — and the move is finished
 * while the row is still a third of the way down the screen.
 *
 * It is eased, barely: their sampled progress is near-linear with a mild S, and
 * cubicBezier(0.4, 0, 0.6, 1) — their own most-declared curve — tracks it
 * within a few percent.
 */
export const FamilyStage = ({ left, middle, right }: { left: React.ReactNode; middle: React.ReactNode; right: React.ReactNode }) => {
    const wrapper = useRef<HTMLDivElement>(null);
    const prefersReducedMotion = useReducedMotion();

    // Progress 0 when the row's top meets the viewport's bottom, 1 when it
    // meets the top.
    const { scrollYProgress } = useScroll({ target: wrapper, offset: ["start end", "start start"] });

    // Ends at 0.633, and that number is measured: Apple's row finishes its move
    // while its own top is still 330px down the viewport — about 37% of a
    // screen — not when it reaches the top.
    const END = 0.633;
    const ease = { ease: cubicBezier(0.4, 0, 0.6, 1) };
    const lift = useTransform(scrollYProgress, [0, END], [200, 0], ease);
    const spread = useTransform(scrollYProgress, [0, END], [100, 0], ease);
    const pull = useTransform(scrollYProgress, [0, END], [-100, 0], ease);
    const swell = useTransform(scrollYProgress, [0, END], [1.4, 1], ease);

    const still = !!prefersReducedMotion;

    return (
        <div ref={wrapper} className="mt-16 flex justify-center overflow-hidden">
            {/* Wider than the page below sm and cropped by the parent: three
                phones sharing 350px are 84px each — too small to read as
                devices. At 150% the outer two run off both edges, which is what
                Apple's own narrow layout does. Three EQUAL widths is a
                deliberate departure from the original — the three things this
                row stands for are peers, and a permanent size difference would
                claim one matters more. */}
            <div className="flex w-[150%] shrink-0 items-end justify-center gap-[3%] sm:w-full sm:max-w-[820px]">
                <motion.div style={still ? undefined : { x: pull, y: lift }} className="w-[28%] shrink-0">
                    {left}
                </motion.div>

                {/* `origin-bottom` so the swell grows upward off the shared
                    baseline — three feet not being level is the first thing the
                    eye catches in a row of devices. */}
                <motion.div style={still ? undefined : { y: lift, scale: swell }} className="w-[28%] shrink-0 origin-bottom">
                    {middle}
                </motion.div>

                <motion.div style={still ? undefined : { x: spread, y: lift }} className="w-[28%] shrink-0">
                    {right}
                </motion.div>
            </div>
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/* Snap gallery                                                                */
/* -------------------------------------------------------------------------- */

/**
 * The one technique every Apple Pro page shares — and it is not a scroll effect
 * at all. Measured on the container: `overflow-x: scroll` plus
 * `scroll-snap-type: x mandatory`, with the snap alignment on the items. No
 * rAF, no hijacking of the vertical scroll, no library.
 *
 * The only JS here is the part the browser does not give you: paddle buttons,
 * and knowing when to disable them. `tabIndex={0}` plus a label makes the
 * scroller reachable by keyboard; arrow keys then scroll it natively.
 */
export const SnapGallery = ({ label, children }: { label: string; children: React.ReactNode }) => {
    const scroller = useRef<HTMLDivElement>(null);
    const [edges, setEdges] = useState({ start: true, end: false });

    const measure = () => {
        const el = scroller.current;
        if (!el) return;
        // 2px of slack: sub-pixel layout means scrollLeft rarely lands exactly
        // on 0 or on the maximum.
        setEdges({ start: el.scrollLeft <= 2, end: el.scrollLeft >= el.scrollWidth - el.clientWidth - 2 });
    };

    useEffect(measure, []);

    const page = (direction: 1 | -1) => {
        const el = scroller.current;
        if (!el) return;
        // One item, not one viewport: the gallery snaps to items, so paging by
        // anything else fights the snap and lands mid-card.
        const item = el.firstElementChild?.firstElementChild as HTMLElement | null;
        const stride = item ? item.getBoundingClientRect().width + 24 : el.clientWidth * 0.8;
        el.scrollBy({ left: stride * direction, behavior: "smooth" });
    };

    return (
        <div>
            <div className="flex items-center justify-between gap-6 px-5 md:px-6">
                <p className="text-sm text-tertiary">{label}</p>

                <div className="flex gap-2">
                    {([-1, 1] as const).map((direction) => (
                        <button
                            key={direction}
                            type="button"
                            onClick={() => page(direction)}
                            disabled={direction === -1 ? edges.start : edges.end}
                            aria-label={direction === -1 ? "Previous" : "Next"}
                            className="flex size-10 items-center justify-center rounded-full border border-secondary bg-secondary text-primary transition duration-100 ease-linear hover:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {direction === -1 ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-5" />}
                        </button>
                    ))}
                </div>
            </div>

            <div
                ref={scroller}
                onScroll={measure}
                tabIndex={0}
                role="group"
                aria-label={label}
                className="mt-6 snap-x snap-mandatory overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
                <div className="flex w-max gap-6 px-5 pb-4 md:px-6">{children}</div>
            </div>
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/* Parallax layers                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Depth from nothing but two different rates. The back layer moves 80px against
 * the section, the middle 40px, the front 0 — a 2:1:0 ratio. Anything past
 * about 100px on the back layer stops reading as depth and starts reading as a
 * misaligned page. Transform only, so the layers composite rather than
 * relayout; reduced motion renders them flat and stacked.
 */
export const ParallaxLayers = ({ back, middle, front }: { back: React.ReactNode; middle: React.ReactNode; front: React.ReactNode }) => {
    const wrapper = useRef<HTMLDivElement>(null);
    const prefersReducedMotion = useReducedMotion();

    const { scrollYProgress } = useScroll({ target: wrapper, offset: ["start end", "end start"] });
    const far = useTransform(scrollYProgress, [0, 1], [80, -80]);
    const near = useTransform(scrollYProgress, [0, 1], [40, -40]);

    const still = !!prefersReducedMotion;

    return (
        <div ref={wrapper} className="relative h-[420px] overflow-hidden rounded-3xl border border-secondary bg-secondary md:h-[520px]">
            <motion.div style={still ? undefined : { y: far }} className="absolute inset-x-0 top-0 flex h-[120%] items-start justify-center pt-10">
                {back}
            </motion.div>
            <motion.div style={still ? undefined : { y: near }} className="absolute inset-0 flex items-center justify-center">
                {middle}
            </motion.div>
            <div className="absolute inset-x-0 bottom-0 p-8 md:p-10">{front}</div>
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/* Counter                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * A number that settles on its value instead of appearing at it. The duration
 * is 1000ms and that breaks this page's own rule deliberately: a counter is not
 * a transition between two states, it is the READING of a quantity. It counts
 * once (`useInView` with `once`), and reduced motion prints the value —
 * which was the content all along.
 */
export const Counter = ({ to, suffix = "", prefix = "" }: { to: number; suffix?: string; prefix?: string }) => {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true, margin: "-15%" });
    const still = !!useReducedMotion();
    const [value, setValue] = useState(0);

    useEffect(() => {
        if (!inView) return;
        if (still) {
            setValue(to);
            return;
        }
        let raf = 0;
        const started = performance.now();
        const tick = (now: number) => {
            const t = Math.min((now - started) / 1000, 1);
            // Decelerate: the digits should slow into the answer, not stop dead.
            const eased = 1 - Math.pow(1 - t, 3);
            setValue(Math.round(to * eased));
            if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [inView, still, to]);

    // `tabular-nums` so the digits do not shuffle the layout as they change.
    return (
        <span ref={ref} className="tabular-nums">
            {prefix}
            {value}
            {suffix}
        </span>
    );
};

/* -------------------------------------------------------------------------- */
/* View transitions                                                            */
/* -------------------------------------------------------------------------- */

/**
 * The native API for "this content just became that content". The browser
 * snapshots the old state, applies the new one, and crossfades. It is
 * feature-detected, not polyfilled: where `startViewTransition` is missing the
 * state still changes — instantly, with no animation and no error. That is the
 * correct failure for a progressive enhancement.
 */
export const ViewTransitionTabs = ({ groups }: { groups: { name: string; items: string[] }[] }) => {
    const [active, setActive] = useState(0);
    const prefersReducedMotion = useReducedMotion();

    const select = (index: number) => {
        const run = () => setActive(index);
        // Reduced motion skips the transition rather than the state change.
        const start = (document as Document & { startViewTransition?: (cb: () => void) => void }).startViewTransition;
        if (prefersReducedMotion || typeof start !== "function") {
            run();
            return;
        }
        start.call(document, run);
    };

    return (
        <div>
            <div role="tablist" aria-label="Asset type" className="flex flex-wrap gap-2">
                {groups.map((group, index) => (
                    <button
                        key={group.name}
                        type="button"
                        role="tab"
                        aria-selected={active === index}
                        onClick={() => select(index)}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition duration-100 ease-linear focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${
                            active === index ? "border-brand bg-brand-solid text-white" : "border-secondary text-secondary hover:border-brand"
                        }`}
                    >
                        {group.name}
                    </button>
                ))}
            </div>

            {/* The named element the browser matches across the change. */}
            <ul className="mt-8 grid gap-3 sm:grid-cols-2" style={{ viewTransitionName: "asset-list" }}>
                {groups[active].items.map((item) => (
                    <li key={item} className="rounded-xl border border-secondary bg-secondary px-5 py-4 text-md text-tertiary">
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/* Skeleton                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The motion nobody puts in a brief, and the only one on this page with a
 * measurable job: making a wait feel shorter than it is. The shimmer is 1.6s
 * and linear, both on purpose — eased motion reads as an object sliding past,
 * and a skeleton is the opposite of an object. The `.hgm-shimmer` CSS (in
 * globals.css) stops entirely under reduced motion, leaving a flat block.
 */
export const SkeletonDemo = () => {
    const [loading, setLoading] = useState(true);

    return (
        <div>
            <LabButton onClick={() => setLoading((value) => !value)}>{loading ? "Load the content" : "Back to loading"}</LabButton>

            <div className="mt-8 grid gap-6 sm:grid-cols-3">
                {[0, 1, 2].map((card) => (
                    <div key={card} className="rounded-2xl border border-secondary bg-secondary p-5">
                        {loading ? (
                            <div className="flex flex-col gap-3" aria-hidden="true">
                                <div className="hgm-shimmer h-32 rounded-lg" />
                                <div className="hgm-shimmer h-3 w-3/4 rounded-full" />
                                <div className="hgm-shimmer h-3 w-1/2 rounded-full" />
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <div className="flex h-32 items-end rounded-lg bg-linear-160 from-bg-secondary via-bg-primary to-bg-secondary p-3">
                                    <span aria-hidden="true" className="size-2 rotate-45 bg-brand-solid" />
                                </div>
                                <span className="text-md font-semibold text-primary">Meta Pixel guide</span>
                                <span className="text-sm text-tertiary">Page · /metapixel</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* The status line is what a screen reader gets; the shimmer is
                decorative and hidden from it. */}
            <p role="status" className="mt-6 text-sm text-tertiary">
                {loading ? "Loading three assets…" : "Three assets loaded."}
            </p>
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/* Disclosure                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Animating to a height nobody knows yet. `height: auto` is not animatable —
 * the browser cannot interpolate towards a value it will only compute at the
 * end. A grid row CAN interpolate between `0fr` and `1fr`, so the row collapses
 * smoothly and the content inside it needs no measurement, no ref and no
 * ResizeObserver.
 *
 * `inert` rather than `hidden` on the collapsed panel: `hidden` cannot
 * transition, and leaving it plain would put a closed panel's links in the tab
 * order.
 */
export const Disclosure = ({ summary, children }: { summary: string; children: React.ReactNode }) => {
    const [open, setOpen] = useState(false);

    return (
        <div className="border-b border-secondary">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-6 py-5 text-left text-md font-semibold text-primary transition duration-100 ease-linear hover:text-brand-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
                {summary}
                <ChevronDown aria-hidden="true" className={`size-5 shrink-0 transition-transform duration-240 ease-state ${open ? "rotate-180" : ""}`} />
            </button>

            <div
                className={`grid transition-[grid-template-rows] duration-320 ease-state motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            >
                <div inert={!open} className="overflow-hidden">
                    <div className="pb-5 text-md text-tertiary">{children}</div>
                </div>
            </div>
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/* Dialog                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * A modal built on the native `<dialog>` element. `showModal()` gives you, for
 * free: the top layer, a `::backdrop`, focus moved in, focus TRAPPED, Escape to
 * close, and the rest of the page marked inert. Returning focus is the one
 * thing it does not do consistently, so the opener is remembered and refocused
 * on close. The entrance CSS lives in globals.css (`.hgm-dialog`).
 */
export const NativeDialog = ({ label, children }: { label: string; children: React.ReactNode }) => {
    const ref = useRef<HTMLDialogElement>(null);
    const opener = useRef<HTMLButtonElement>(null);

    return (
        <>
            <button
                ref={opener}
                type="button"
                onClick={() => ref.current?.showModal()}
                className="rounded-full bg-brand-solid px-5 py-2.5 text-sm font-semibold text-white transition duration-100 ease-linear hover:bg-brand-solid_hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
                {label}
            </button>

            <dialog
                ref={ref}
                onClose={() => opener.current?.focus()}
                aria-label={label}
                className="hgm-dialog m-auto w-[min(92vw,32rem)] rounded-3xl border border-secondary bg-secondary p-8 text-primary backdrop:bg-black/60"
            >
                {children}

                <button
                    type="button"
                    onClick={() => ref.current?.close()}
                    className="mt-8 rounded-full border border-secondary px-5 py-2.5 text-sm font-semibold text-secondary transition duration-100 ease-linear hover:border-brand hover:text-brand-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                    Close
                </button>
            </dialog>
        </>
    );
};

/* -------------------------------------------------------------------------- */
/* Blur-up image                                                               */
/* -------------------------------------------------------------------------- */

/**
 * A photograph arriving, driven by the load event rather than a timer. A fixed
 * delay either uncovers an image that has not arrived or holds a blur over one
 * that has. `onLoad` also has to run for cached images: an <img> already in
 * cache can finish before React attaches the handler — checking `complete` on
 * mount covers it.
 */
export const BlurUp = ({ src, alt }: { src: string; alt: string }) => {
    const ref = useRef<HTMLImageElement>(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (ref.current?.complete) setLoaded(true);
    }, []);

    return (
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-secondary">
            <img
                ref={ref}
                src={src}
                alt={alt}
                onLoad={() => setLoaded(true)}
                className={`size-full object-cover object-top transition-[filter,opacity] duration-320 ease-enter motion-reduce:transition-none ${
                    loaded ? "blur-0 opacity-100" : "opacity-70 blur-xl"
                }`}
            />
            {!loaded && <span className="hgm-shimmer absolute inset-0 opacity-40" aria-hidden="true" />}
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/* Frame benchmark                                                             */
/* -------------------------------------------------------------------------- */

/**
 * The section that measures itself: 600 squares moved with `left` against 600
 * moved with `transform`, reported as a median and a 95th-percentile worst
 * frame. The median hides exactly the failure this section is about — layout
 * thrash does not slow every frame evenly, it drops occasional long ones.
 */
export const FrameBench = () => {
    const [mode, setMode] = useState<"transform" | "left" | null>(null);
    const [results, setResults] = useState<Record<string, { median: number; worst: number }>>({});
    const boxes = useRef<HTMLDivElement>(null);

    const run = (which: "transform" | "left") => {
        const host = boxes.current;
        if (!host || mode) return;
        setMode(which);

        const nodes = [...host.children] as HTMLElement[];
        const frames: number[] = [];
        const started = performance.now();
        let last = started;

        const tick = (now: number) => {
            frames.push(now - last);
            last = now;
            const t = (now - started) / 2000;
            const offset = Math.sin(t * Math.PI * 4) * 40 + 40;
            nodes.forEach((node, i) => {
                const shifted = offset + (i % 12) * 2;
                // The only difference between the two runs is this line.
                if (which === "transform") node.style.transform = `translateX(${shifted}px)`;
                else node.style.left = `${shifted}px`;
            });
            if (t < 1) requestAnimationFrame(tick);
            else {
                nodes.forEach((node) => {
                    node.style.transform = "";
                    node.style.left = "";
                });
                const sorted = frames.slice(1).sort((a, b) => a - b);
                setResults((prev) => ({
                    ...prev,
                    [which]: {
                        median: +sorted[Math.floor(sorted.length / 2)].toFixed(1),
                        worst: +sorted[Math.floor(sorted.length * 0.95)].toFixed(1),
                    },
                }));
                setMode(null);
            }
        };
        requestAnimationFrame(tick);
    };

    return (
        <div>
            <div className="flex flex-wrap gap-3">
                {(["transform", "left"] as const).map((which) => (
                    <LabButton key={which} onClick={() => run(which)} disabled={mode !== null}>
                        {mode === which ? "Measuring…" : `Animate 600 boxes with ${which}`}
                    </LabButton>
                ))}
            </div>

            <div ref={boxes} className="relative mt-8 flex h-56 flex-wrap gap-1 overflow-hidden rounded-2xl border border-secondary bg-secondary p-4">
                {Array.from({ length: 600 }, (_, i) => (
                    // `relative` so `left` has something to move against. Both
                    // runs use identical markup — only the property changes.
                    <div key={i} className="relative size-3 rounded-sm bg-brand-solid/70" />
                ))}
            </div>

            <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3">
                {(["transform", "left"] as const).map((which) => (
                    <div key={which}>
                        <dt className="font-mono text-xs tracking-[0.08em] text-quaternary uppercase">{which} · worst frame</dt>
                        <dd className="mt-1 text-display-xs font-semibold text-brand-secondary tabular-nums">
                            {results[which] ? `${results[which].worst}ms` : "—"}
                        </dd>
                        <dd className="mt-1 font-mono text-xs text-quaternary tabular-nums">
                            {results[which] ? `median ${results[which].median}ms` : "worst frame / median"}
                        </dd>
                    </div>
                ))}
            </dl>
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/* Shared element (FLIP)                                                       */
/* -------------------------------------------------------------------------- */

/**
 * FLIP: measure the box first, apply the change so the browser computes the
 * last box, invert with a transform, play the transform away. The layout change
 * happens in one frame; every frame after it is a transform. `layoutId` is
 * motion's implementation of exactly that.
 *
 * It is a disclosure, not a dialog: the panel expands in place, so there is no
 * focus trap to get wrong — `aria-expanded` and a real button are the whole
 * accessibility story.
 */
export const SharedElementGrid = ({ items }: { items: { id: string; src: string; title: string; note: string }[] }) => {
    const [openId, setOpenId] = useState<string | null>(null);
    const open = items.find((item) => item.id === openId);

    return (
        // `reducedMotion="user"` covers the layout animation too: motion skips
        // the transform interpolation and the panel simply appears expanded.
        <MotionConfig reducedMotion="user">
            <LayoutGroup>
                <ul className="grid gap-4 sm:grid-cols-3">
                    {items.map((item) => (
                        <li key={item.id}>
                            {/* The closed card and the open panel share a
                                layoutId, which is what tells motion they are the
                                same object rather than two that look alike. */}
                            {openId !== item.id && (
                                <motion.button
                                    layoutId={`shot-${item.id}`}
                                    type="button"
                                    aria-expanded={false}
                                    onClick={() => setOpenId(item.id)}
                                    className="block w-full overflow-hidden rounded-2xl border border-secondary bg-secondary text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                                >
                                    <motion.img layoutId={`img-${item.id}`} src={item.src} alt="" className="aspect-[4/3] w-full object-cover object-top" />
                                    <motion.span layoutId={`title-${item.id}`} className="block px-4 py-3 text-md font-semibold text-primary">
                                        {item.title}
                                    </motion.span>
                                </motion.button>
                            )}
                        </li>
                    ))}
                </ul>

                <AnimatePresence>
                    {open && (
                        <motion.div key={open.id} layoutId={`shot-${open.id}`} className="mt-6 overflow-hidden rounded-2xl border border-brand bg-secondary">
                            <div className="grid gap-6 sm:grid-cols-2">
                                <motion.img
                                    layoutId={`img-${open.id}`}
                                    src={open.src}
                                    alt={open.note}
                                    className="aspect-[4/3] w-full object-cover object-top"
                                />

                                <div className="flex flex-col items-start justify-center gap-4 p-6 sm:pr-8 sm:pl-0">
                                    <motion.span layoutId={`title-${open.id}`} className="block text-display-xs font-semibold text-primary">
                                        {open.title}
                                    </motion.span>
                                    {/* Not shared — this text has no counterpart
                                        in the closed card, so it fades in on its
                                        own rather than morphing from nothing. */}
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.24, ease: [0, 0, 0.2, 1] }}
                                        className="text-md text-tertiary"
                                    >
                                        {open.note}
                                    </motion.p>
                                    <button
                                        type="button"
                                        onClick={() => setOpenId(null)}
                                        className="rounded-full border border-secondary px-4 py-2 text-sm font-semibold text-secondary transition duration-100 ease-linear hover:border-brand hover:text-brand-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                                    >
                                        Collapse
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </LayoutGroup>
        </MotionConfig>
    );
};

/* -------------------------------------------------------------------------- */
/* Scatter stage                                                               */
/* -------------------------------------------------------------------------- */

/**
 * A deck of tiles stacked dead centre that fans out as you scroll, uncovering
 * the headline underneath. Rebuilt from a Framer template ("Tedy Scroll
 * Animation", Framer University) by measuring it. All eight tiles start
 * IDENTICAL and STACKED — the opening frame is one card with seven hidden
 * behind it — and every value is LINEAR, because in a scrub the visitor's own
 * scroll is the easing. The headline holds until roughly 72% through the pin.
 *
 * Offsets are percentages of the stage (container units), not pixels, so the
 * field reflows on a narrow screen instead of being cropped.
 */
const SCATTER = [
    { x: -34.6, y: 22.0, scale: 0.5, poster: 0 },
    { x: -24.3, y: -46.6, scale: 0.4, poster: 1 },
    { x: 33.2, y: -33.4, scale: 0.4, poster: 2 },
    { x: 26.2, y: 19.5, scale: 0.4, poster: 0 },
    { x: 16.0, y: -46.5, scale: 0.35, poster: 1 },
    { x: 30.0, y: 42.0, scale: 0.3, poster: 2 },
    { x: -19.3, y: 43.8, scale: 0.3, poster: 0 },
    { x: -37.0, y: -32.8, scale: 0.3, poster: 1 },
];

/**
 * One tile, as its own component because each needs its own `useTransform`
 * calls — hooks cannot be called from inside a map without pinning the array
 * length forever.
 */
const ScatterTile = ({ progress, tile, src, still }: { progress: MotionValue<number>; tile: (typeof SCATTER)[number]; src: string; still: boolean }) => {
    // Linear, matching the original. Tiles clear by 0.9 so the last tenth of
    // the pin is calm while the headline lands.
    const range: [number, number] = [0, 0.9];

    // Container units, not percentages: a percentage translate resolves against
    // the ELEMENT, `cqw`/`cqh` resolve against the stage, so the measured
    // numbers go in unchanged and stay correct at every aspect ratio.
    const x = useTransform(progress, range, ["0cqw", `${tile.x}cqw`]);
    const y = useTransform(progress, range, ["0cqh", `${tile.y}cqh`]);
    const scale = useTransform(progress, range, [1, tile.scale]);

    return (
        <motion.div
            style={still ? { x: `${tile.x}cqw`, y: `${tile.y}cqh`, scale: tile.scale } : { x, y, scale }}
            // Both widths written out rather than interpolated from a constant:
            // Tailwind scans source text for class names, so a template literal
            // produces no rule and the tile collapses to zero.
            className="absolute aspect-square w-[46%] overflow-hidden rounded-[18%] border border-secondary shadow-2xl sm:w-[30%]"
        >
            <img src={src} alt="" className="size-full object-cover object-top" />
        </motion.div>
    );
};

export const ScatterStage = ({ posters, headline }: { posters: string[]; headline: React.ReactNode }) => {
    const wrapper = useRef<HTMLDivElement>(null);
    const still = !!useReducedMotion();

    const { scrollYProgress } = useScroll({ target: wrapper, offset: ["start start", "end end"] });
    const headOpacity = useTransform(scrollYProgress, [0.72, 1], [0, 1]);
    const headScale = useTransform(scrollYProgress, [0.72, 1], [0.9, 1]);

    const stage = (
        // `container-type: size` rather than Tailwind's `@container`, which only
        // sets `inline-size` and leaves `cqh` resolving to zero. The stage has a
        // definite height (h-svh), which makes size containment legal here.
        <div style={{ containerType: "size" }} className="relative flex h-svh items-center justify-center overflow-hidden">
            <motion.div
                style={still ? undefined : { opacity: headOpacity, scale: headScale }}
                // A rem cap, not `ch`: `ch` resolves against the font size of
                // the element it is written on, not the heading inside it.
                className="pointer-events-none max-w-[min(90%,34rem)] px-5 text-center"
            >
                {headline}
            </motion.div>

            {SCATTER.map((tile, index) => (
                <ScatterTile key={index} progress={scrollYProgress} tile={tile} src={posters[tile.poster % posters.length]} still={still} />
            ))}
        </div>
    );

    if (still) return <div className="relative">{stage}</div>;

    // 2.18 viewports — the original's own ratio: one screen of pin, 1.18 of
    // scroll to drive it.
    return (
        <div ref={wrapper} className="relative h-[218svh]">
            <div className="sticky top-0">{stage}</div>
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/* Spiral stage                                                                */
/* -------------------------------------------------------------------------- */

/**
 * A helix: five arms stacked up a vertical axis, each rotated 45 degrees
 * further round than the one below, every arm carrying a card at its far end.
 * The axis turns as you scroll. Rebuilt from a Framer template ("Spiral 3D
 * Scroll Animation") by reading its layout out of the DOM: axis 865×755 with
 * preserve-3d, arms 865×151 at a 151px step rotated 0/45/90/135/180, card
 * 320×215 at left -161, itself rotated -90. Only the axis animates.
 */
const SPIRAL_ARMS = [
    { angle: 0, poster: 0, kicker: "Branding", name: "Fahey" },
    { angle: 45, poster: 1, kicker: "Film", name: "Reynolds" },
    { angle: 90, poster: 2, kicker: "Stills", name: "Wisoky" },
    { angle: 135, poster: 0, kicker: "Social", name: "Trantow" },
    { angle: 180, poster: 1, kicker: "Direct", name: "Bergstrom" },
];

export const SpiralStage = ({ posters }: { posters: string[] }) => {
    const wrapper = useRef<HTMLDivElement>(null);
    const still = !!useReducedMotion();

    const { scrollYProgress } = useScroll({ target: wrapper, offset: ["start start", "end end"] });
    // Reversed from the original's -80 → +86 on purpose: the eye starts at the
    // top of a composition, and the column is rising as you scroll, so the
    // first card to turn should be the one already leaving. Running +86 → -80
    // hands you the top card first and each lower one in turn.
    const rotateY = useTransform(scrollYProgress, [0, 1], [86, -80]);
    const y = useTransform(scrollYProgress, [0, 1], [310, -343]);

    const stage = (
        <div className="relative flex h-svh items-center justify-center overflow-hidden">
            {/* The axis is fixed at the measured 865×755 and scaled down instead
                of sized responsively: every number in a 3D scene is in the same
                coordinate space, so changing one in isolation distorts the
                projection. Scaling the finished scene keeps the geometry. */}
            <div className="scale-[0.4] sm:scale-[0.62] lg:scale-90 xl:scale-100">
                <motion.div
                    style={still ? { transformPerspective: 1200, rotateY: -14 } : { transformPerspective: 1200, rotateY, y }}
                    className="relative h-[755px] w-[865px] [transform-style:preserve-3d]"
                >
                    {SPIRAL_ARMS.map((arm, index) => (
                        <div
                            key={arm.name}
                            style={{ top: index * 151, transform: `rotateY(${arm.angle}deg)` }}
                            className="absolute left-0 h-[151px] w-[865px] [transform-style:preserve-3d]"
                        >
                            {/* The card, mounted at the arm's far end and turned
                                perpendicular to it so it faces outward along the
                                radius. */}
                            <div className="absolute -top-[33px] -left-[161px] h-[215px] w-[320px] [transform:rotateY(-90deg)] overflow-hidden rounded-lg shadow-2xl">
                                <img src={posters[arm.poster % posters.length]} alt="" className="size-full object-cover object-top" />
                                <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/35 text-center">
                                    <span className="text-[0.625rem] font-semibold tracking-[0.18em] text-white uppercase">{arm.kicker}</span>
                                    <span className="text-2xl font-semibold tracking-tight text-white">{arm.name}</span>
                                </span>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );

    if (still) return <div className="relative">{stage}</div>;

    // 2.76 viewports, the original's ratio.
    return (
        <div ref={wrapper} className="relative h-[276svh]">
            <div className="sticky top-0">{stage}</div>
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/* Destination showcase                                                        */
/* -------------------------------------------------------------------------- */

/**
 * One pinned stage that walks through a list of places, changing the
 * background, the card and the name together — rebuilt from a Framer travel
 * template ("Traavellio") by measuring it, then re-cut against Aman.
 *
 * The card and the name are DISCRETE: a linear scrub leaves the name half gone
 * whenever the visitor stops mid-slide, so the index is derived from the
 * continuous scroll value and the transition runs on the change. The
 * backgrounds have no readable half-state, so they stay scrubbed.
 *
 * ASSET ADAPTATION IN THIS PROJECT: the repo has one committed landscape plate
 * (the sign-in backdrop's poster), so every background layer shares it with a
 * different token-tinted wash and object position, and the cards carry page
 * screenshots. The choreography — one progress value, three layers that cannot
 * drift — is the thing being demonstrated; the asset library is honestly thin,
 * the same confession the source page makes in its scatter section.
 */
const AMAN_EASE = [0.19, 1, 0.22, 1] as const;

export const ShowcaseStage = ({ places }: { places: { name: string; blurb: string; src: string; card: string; tint: string; position: string }[] }) => {
    const wrapper = useRef<HTMLDivElement>(null);
    const still = !!useReducedMotion();
    const [index, setIndex] = useState(0);

    const { scrollYProgress } = useScroll({ target: wrapper, offset: ["start start", "end end"] });
    const n = places.length;

    // The card and the name row are discrete, so the index is derived from the
    // continuous value rather than animated. This sets state at most n-1 times
    // across the whole pin.
    useMotionValueEvent(scrollYProgress, "change", (p) => {
        const next = Math.min(n - 1, Math.max(0, Math.floor(p * n)));
        setIndex((current) => (current === next ? current : next));
    });

    const place = places[index];

    const stage = (
        <div className="relative flex h-svh items-center justify-center overflow-hidden">
            {/* Backgrounds are all mounted and crossfaded, not swapped: a single
                <img> whose src changes shows a blank frame on every change,
                because the browser drops the old bitmap before the new one
                decodes. */}
            {places.map((item, i) => (
                <ShowcaseLayer
                    key={item.name}
                    progress={scrollYProgress}
                    index={i}
                    count={n}
                    src={item.src}
                    tint={item.tint}
                    position={item.position}
                    active={still && i === 0}
                />
            ))}

            {/* A light scrim: enough to hold the type, not so much that the
                plate is a texture. Fixed black/white over imagery is deliberate
                and theme-stable — the pair never separates. */}
            <div className="absolute inset-0 bg-linear-to-b from-black/25 via-black/10 to-black/65" />

            {/* THE NAME WINDOW. One row tall, clipping a column that steps up by
                exactly one row per destination. One instance, light weight, wide
                tracking — a repeated word is a pattern fill; a single
                letterspaced one is a caption. */}
            <div className="pointer-events-none absolute inset-x-0 bottom-[4%] h-[clamp(2rem,4.2vw,3.5rem)] overflow-hidden">
                <motion.div animate={{ y: still ? "0%" : `${(index * -100) / places.length}%` }} transition={{ duration: 0.9, ease: AMAN_EASE }}>
                    {places.map((item) => (
                        // The whole row is aria-hidden: the name is already
                        // announced by the card's caption below.
                        <div key={item.name} aria-hidden="true" className="flex h-[clamp(2rem,4.2vw,3.5rem)] items-center justify-center">
                            <span className="text-[clamp(1.25rem,3.2vw,2.5rem)] leading-none font-light tracking-[0.34em] text-white/70 uppercase">
                                {item.name}
                            </span>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* The card. Opacity only — Aman animates its photographs and
                nothing else. */}
            <div className="relative z-10 w-[min(86vw,460px)]">
                <AnimatePresence mode="wait">
                    <motion.figure
                        key={place.name}
                        initial={still ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={still ? undefined : { opacity: 0 }}
                        transition={{ duration: 0.7, ease: AMAN_EASE }}
                        className="overflow-hidden rounded-sm"
                    >
                        <div className="relative aspect-4/5">
                            <img src={place.card} alt="" className="size-full object-cover object-top" />
                            {/* Taller and softer than a caption bar, so the type
                                sits on the image rather than on a panel. */}
                            <figcaption className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/85 via-black/45 to-transparent px-7 pt-24 pb-7">
                                <span className="block text-xs font-medium tracking-[0.24em] text-white/70 uppercase">
                                    {String(index + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
                                </span>
                                <span className="mt-3 block text-2xl font-normal tracking-tight text-white">{place.name}</span>
                                <span className="mt-2 block text-sm leading-relaxed text-white/70">{place.blurb}</span>
                            </figcaption>
                        </div>
                    </motion.figure>
                </AnimatePresence>

                {/* A hairline index rather than dots — orientation without
                    decoration, and nothing that invites a click it cannot
                    service. It reads the same `index` the card does. */}
                <div aria-hidden="true" className="mt-6 flex gap-2">
                    {places.map((item, i) => (
                        <motion.span
                            key={item.name}
                            animate={{ opacity: still ? (i === 0 ? 1 : 0.28) : i === index ? 1 : 0.28 }}
                            transition={{ duration: 0.7, ease: AMAN_EASE }}
                            className="h-px flex-1 bg-white"
                        />
                    ))}
                </div>
            </div>
        </div>
    );

    if (still) return <div className="relative">{stage}</div>;

    // 5.1 viewports, the template's own ratio — about one screen of scroll per
    // destination plus the screen being pinned.
    return (
        <div ref={wrapper} className="relative h-[510svh]">
            <div className="sticky top-0">{stage}</div>
        </div>
    );
};

/** One crossfading background. Its own component so it can own its transform. */
const ShowcaseLayer = ({
    progress,
    index,
    count,
    src,
    tint,
    position,
    active,
}: {
    progress: MotionValue<number>;
    index: number;
    count: number;
    src: string;
    tint: string;
    position: string;
    active: boolean;
}) => {
    const start = index / count;
    const end = (index + 1) / count;
    const fade = 0.5 / count;

    // Clamped into [0, 1] and forced strictly increasing: motion hands these to
    // WAAPI as keyframe offsets, and the browser rejects the whole animation on
    // a non-monotonic range — a single bad range is a blank route.
    const clamp = (v: number) => Math.min(1, Math.max(0, v));
    const isFirst = index === 0;
    const isLast = index === count - 1;
    // The end layers hold rather than fade: without this the first background
    // fades UP from nothing as the section pins, and the last one fades OUT to
    // an empty stage over the final 5% of the scroll.
    const a = isFirst ? 0 : clamp(start - fade);
    const b = isFirst ? 0.0001 : Math.max(a + 0.001, clamp(start + fade * 0.4));
    const c = isLast ? 0.998 : Math.max(b + 0.001, clamp(end - fade * 0.4));
    const d = isLast ? 1 : Math.max(c + 0.001, clamp(end + fade));

    const opacity = useTransform(progress, [a, b, c, d], [0, 1, 1, 0]);
    // The only thing that moves: a slow push from 1.12 to 1 across the layer's
    // whole life — over a screen of scroll, so it is felt rather than seen.
    const scale = useTransform(progress, [a, d], [1.12, 1]);

    return (
        <motion.div style={active ? { opacity: 1 } : { opacity, scale }} className="absolute inset-0">
            <img src={src} alt="" className="size-full object-cover" style={{ objectPosition: position }} />
            <div className={cx("absolute inset-0", tint)} />
        </motion.div>
    );
};
