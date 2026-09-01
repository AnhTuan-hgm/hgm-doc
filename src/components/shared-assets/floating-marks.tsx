import type { CSSProperties } from "react";

/**
 * PORTED from the HiddenGem marketing site (hiddengem-media,
 * src/components/hgm/floating-marks.tsx) on 2026-09-01, same terms as
 * backdrops.tsx: copied rather than shared, fix it in both.
 *
 * A field of small marks drifting across a section. The idea comes from
 * originkit.dev's "Floating Icons"; the implementation does not: theirs drives
 * every particle from React state in a requestAnimationFrame loop and animates
 * `left`/`top` (a reflow per frame). This is two CSS keyframes the compositor
 * owns — `hgm-drift` and `hgm-sway` in globals.css — animating transform and
 * opacity only, with no JavaScript at runtime.
 *
 * RANDOMNESS IS DETERMINISTIC, from a hash of the index, so the field renders
 * the same on every mount and nothing has to be generated in an effect.
 * Reduced motion keeps the scattered marks and simply stops them moving, so
 * the section keeps a composition rather than an empty box.
 *
 * Same caller contract as backdrops.tsx: renders at -z-10, so the section
 * needs `relative isolate`.
 */

/** GLSL-style hash. Same input, same output, on every render. */
const rand = (index: number, salt: number) => {
    const x = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
    return x - Math.floor(x);
};

export const FloatingMarks = ({
    direction = "up",
    count = 26,
    mark = "diamond",
}: {
    direction?: "up" | "down";
    count?: number;
    /** `diamond` is the brand's own mark; `dot` is the quieter neutral option. */
    mark?: "diamond" | "dot";
}) => (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {Array.from({ length: count }, (_, i) => {
            const size = 3 + rand(i, 1) * 8;
            const travel = 26 + rand(i, 2) * 8;
            const duration = 14 + rand(i, 3) * 16;
            const swayDuration = 3 + rand(i, 4) * 4;
            const peak = 0.07 + rand(i, 7) * 0.19;

            return (
                <span
                    key={i}
                    className="absolute animate-[hgm-drift_var(--dur)_linear_infinite] motion-reduce:animate-none"
                    style={
                        {
                            left: `${rand(i, 5) * 100}%`,
                            top: `${10 + rand(i, 6) * 70}%`,
                            opacity: peak,
                            // Negative delay starts each mark mid-flight, so the
                            // field is already populated on the first frame
                            // instead of filling up from empty.
                            animationDelay: `-${rand(i, 8) * duration}s`,
                            "--dur": `${duration}s`,
                            "--from": direction === "up" ? `${travel}rem` : `-${travel}rem`,
                            "--to": direction === "up" ? `-${travel}rem` : `${travel}rem`,
                            "--peak": `${peak}`,
                        } as CSSProperties
                    }
                >
                    <span
                        className="block animate-[hgm-sway_var(--swayDur)_ease-in-out_infinite_alternate] motion-reduce:animate-none"
                        style={
                            {
                                "--sway": `${8 + rand(i, 9) * 26}px`,
                                "--swayDur": `${swayDuration}s`,
                                animationDelay: `-${rand(i, 10) * swayDuration}s`,
                            } as CSSProperties
                        }
                    >
                        <span
                            className={mark === "diamond" ? "block rotate-45 bg-brand-solid" : "block rounded-full bg-brand-solid"}
                            style={{ width: size, height: size }}
                        />
                    </span>
                </span>
            );
        })}
    </div>
);
