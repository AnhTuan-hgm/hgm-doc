import type { CSSProperties, FC } from "react";
import { Rocket01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";

/**
 * The launch meter that sits directly under the "Your journey" heading.
 *
 * This is the one thing on the Overview that says how close the client is to going
 * live, so it is deliberately the loudest element on the page: a full-width bar that
 * runs from the first step into a Launch medallion at the far right, and fills a
 * segment every time a step is ticked. The steps list below it explains WHAT is left;
 * this only has to answer "how far along am I, and what am I heading towards".
 *
 * The bar is divided into one segment per journey step, so the fill lands on a tick
 * mark each time — a client who just finished a step can see which notch moved. The
 * final notch is the medallion itself: 100% is Launch, it is not an eleventh step to
 * tick off, so nothing here writes to `content.journey_done`.
 */
export const JourneyProgress: FC<{
    /** Total journey steps — the bar's denominator and its number of segments. */
    total: number;
    /** How many are done. */
    done: number;
    /** Label of the first unfinished step, or null once everything is done. */
    nextLabel?: string | null;
}> = ({ total, done, nextLabel }) => {
    const safeTotal = Math.max(total, 1);
    const percent = Math.round((done / safeTotal) * 100);
    const complete = done >= safeTotal && total > 0;

    return (
        <div className="relative mt-5 overflow-hidden rounded-2xl bg-secondary p-4 ring-1 ring-secondary md:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="text-sm font-semibold text-primary">
                    {complete ? (
                        "You're launched — every step is done."
                    ) : (
                        <>
                            <span className="journey-meter-figure text-lg font-bold tabular-nums">{percent}%</span> of the way to launch
                        </>
                    )}
                </p>
                <p className="text-xs text-tertiary">
                    {complete ? (
                        "Congratulations from all of us at HiddenGem."
                    ) : (
                        <>
                            <span className="tabular-nums">
                                {done} of {safeTotal} steps
                            </span>
                            {nextLabel ? ` · Up next: ${nextLabel}` : null}
                        </>
                    )}
                </p>
            </div>

            <div className="mt-3.5 flex items-center gap-3">
                <div
                    role="progressbar"
                    aria-valuenow={done}
                    aria-valuemin={0}
                    aria-valuemax={safeTotal}
                    aria-label="Progress to launch"
                    className="relative h-3 flex-1 overflow-hidden rounded-full bg-quaternary"
                >
                    {/* Width rather than a transform: the fill has to stop ON a tick mark,
                        and a translated full-width bar would slide its gradient with it, so
                        the colour under a given notch would change as the bar grew. */}
                    <div
                        className="journey-meter-fill absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out"
                        style={
                            {
                                width: `${percent}%`,
                                // The ramp is painted at TRACK width, so each notch keeps its
                                // colour as the bar grows — see globals.css.
                                "--journey-meter-track": percent > 0 ? `${(100 / percent) * 100}%` : "100%",
                            } as CSSProperties
                        }
                    />
                    {/* One notch per completed segment boundary. The last boundary is the
                        medallion, so this stops one short. */}
                    {Array.from({ length: safeTotal - 1 }, (_, i) => {
                        const at = ((i + 1) / safeTotal) * 100;
                        return (
                            <span
                                key={i}
                                aria-hidden="true"
                                className={cx(
                                    "absolute top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full transition duration-100 ease-linear",
                                    at <= percent ? "bg-white/70" : "bg-primary_alt opacity-60",
                                )}
                                style={{ left: `${at}%` }}
                            />
                        );
                    })}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <span
                        className={cx(
                            "grid size-9 place-items-center rounded-full transition duration-100 ease-linear",
                            complete ? "journey-meter-fill journey-meter-medallion text-white" : "bg-primary text-quaternary ring-1 ring-secondary",
                        )}
                    >
                        <Rocket01 className="size-4.5" aria-hidden="true" />
                    </span>
                    <span className={cx("text-sm font-semibold", complete ? "text-primary" : "text-tertiary")}>Launch</span>
                </div>
            </div>
        </div>
    );
};
