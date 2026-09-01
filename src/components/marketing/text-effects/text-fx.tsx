import { useEffect, useRef, useState } from "react";
import type { Variants } from "motion/react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { cx } from "@/utils/cx";

/**
 * TextFx — preset text-entrance effects (the /textfx skill documents when to
 * use which). Renders inline spans only: the caller owns the heading tag.
 *
 *   <h2 className="…"><TextFx effect="mask-rise">Direct bookings, done right</TextFx></h2>
 *
 * Accessibility: the split spans are aria-hidden behind a single aria-label,
 * and every effect renders as plain static text under prefers-reduced-motion.
 * Timing defaults follow the ui-motion rules (≤500ms entrance, ≤80ms stagger).
 */

export type TextFxEffect = "fade-up" | "blur-in" | "mask-rise" | "scale-in" | "scramble";

interface TextFxProps {
    children: string;
    effect?: TextFxEffect;
    /** What to stagger. Defaults per effect: chars for blur-in/scale-in/scramble, words otherwise. */
    splitBy?: "word" | "char";
    /** Seconds before the effect starts once in view. */
    delay?: number;
    /** Per-unit animation duration in seconds. */
    duration?: number;
    /** Seconds between units. Keep ≤ 0.08. */
    stagger?: number;
    className?: string;
}

const variants: Record<Exclude<TextFxEffect, "scramble">, Variants> = {
    // blur-in is the one sanctioned non-transform/opacity effect: filter is
    // GPU-composited and only runs for the entrance.
    "fade-up": { hidden: { opacity: 0, y: "0.5em" }, visible: { opacity: 1, y: 0 } },
    "blur-in": { hidden: { opacity: 0, filter: "blur(8px)" }, visible: { opacity: 1, filter: "blur(0px)" } },
    "mask-rise": { hidden: { y: "115%" }, visible: { y: 0 } },
    "scale-in": { hidden: { opacity: 0, scale: 0.85 }, visible: { opacity: 1, scale: 1 } },
};

const SCRAMBLE_GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&";

/** Progressive decode: settled prefix grows while the tail cycles random glyphs. */
const ScrambleText = ({ text, delay, duration, className }: { text: string; delay: number; duration: number; className?: string }) => {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true, margin: "-10% 0px" });
    const [output, setOutput] = useState(text);

    useEffect(() => {
        if (!inView) return;
        const steps = text.length;
        const interval = Math.max(20, (duration * 1000) / Math.max(steps, 1));
        let settled = 0;
        let timer: number;

        const start = window.setTimeout(() => {
            setOutput(text.replace(/\S/g, () => SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)]));

            timer = window.setInterval(() => {
                settled += 1;
                setOutput(
                    text
                        .split("")
                        .map((char, i) => {
                            if (i < settled || char === " ") return char;
                            return SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)];
                        })
                        .join(""),
                );
                if (settled >= steps) window.clearInterval(timer);
            }, interval);
        }, delay * 1000);

        return () => {
            window.clearInterval(timer);
            window.clearTimeout(start);
        };
    }, [inView, text, delay, duration]);

    return (
        <span ref={ref} aria-label={text} className={cx("tabular-nums", className)}>
            <span aria-hidden="true">{output}</span>
        </span>
    );
};

export const TextFx = ({ children: text, effect = "fade-up", splitBy, delay = 0, duration = 0.5, stagger, className }: TextFxProps) => {
    const prefersReducedMotion = useReducedMotion();
    // useReducedMotion is null during SSR but resolves synchronously on the
    // client's first render, so branching on it alone mismatches hydration.
    // Gate the plain-text path on mount: both first renders agree, then
    // reduced-motion users swap to static text before any animation runs.
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    // The complete, motionless experience.
    if (prefersReducedMotion && mounted) {
        return <span className={className}>{text}</span>;
    }

    if (effect === "scramble") {
        return <ScrambleText text={text} delay={delay} duration={Math.min(duration * 2, 1.2)} className={className} />;
    }

    const resolvedSplit = splitBy ?? (effect === "blur-in" || effect === "scale-in" ? "char" : "word");
    const resolvedStagger = stagger ?? (resolvedSplit === "char" ? 0.03 : 0.07);
    const units = resolvedSplit === "word" ? text.split(" ") : text.split("");

    return (
        <motion.span
            className={cx("inline-block", className)}
            aria-label={text}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ staggerChildren: Math.min(resolvedStagger, 0.08), delayChildren: delay }}
        >
            {units.map((unit, index) => (
                // mask-rise clips each unit so it rises out of its own line box.
                <span key={index} aria-hidden="true" className={cx("inline-block", effect === "mask-rise" && "overflow-hidden pb-[0.1em] align-bottom")}>
                    <motion.span
                        className="inline-block"
                        variants={variants[effect]}
                        transition={{ duration: Math.min(duration, 0.7), ease: [0.22, 1, 0.36, 1] }}
                    >
                        {unit === " " ? " " : unit}
                    </motion.span>
                    {resolvedSplit === "word" && index < units.length - 1 ? " " : null}
                </span>
            ))}
        </motion.span>
    );
};
