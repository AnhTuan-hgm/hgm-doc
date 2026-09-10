import { type PointerEvent, useEffect, useRef, useState } from "react";
import { ChevronLeft, MessageChatCircle } from "@untitledui/icons";
import { useReducedMotion } from "motion/react";
import { IMAGE_SLIDE_SECONDS, type StoryHighlight, coverOf } from "@/pages/client/dashboard/pinned-stories-model";
import { cx } from "@/utils/cx";

/**
 * An Instagram profile with its pinned highlights, playing inside a phone screen.
 *
 * Two views. PROFILE shows the client's handle, avatar and the row of highlight circles —
 * the thing the client is actually approving is "what sits at the top of my profile", so
 * that is the first frame they see. STORY plays one highlight: segmented progress bar,
 * cover + title header, the slide, tap zones (left third back, the rest forward), and
 * hold-to-pause, exactly the gestures the client already knows from the real app.
 *
 * The bottom "Send message" bar is the one deliberate departure: on Instagram it DMs the
 * account; here it hands the current slide to the caller (`onReply`), which is how a
 * client leaves a note on precisely the slide they're looking at. Feedback therefore
 * needs no "which slide do you mean?" step.
 *
 * Controlled: the caller owns `position` so the arrange panel beside the phone can jump
 * it, and comments beside the phone can say "Slide 3 of 6 · FAQ" from the same value.
 *
 * Auto-advance is driven by the CSS animation's `animationend` (see story-progress in
 * globals.css) for images and by `ended` for videos — never a parallel timer. Under
 * reduced motion nothing auto-advances: the segment fills instantly and the client taps.
 */

export interface StoryPosition {
    /** null = the profile view. */
    highlightId: string | null;
    slide: number;
}

export const PROFILE: StoryPosition = { highlightId: null, slide: 0 };

export const StoryPlayer = ({
    highlights,
    position,
    onPosition,
    clientName,
    logoUrl,
    onReply,
    replyLabel = "Send message",
    commentCountFor,
    className,
}: {
    highlights: StoryHighlight[];
    position: StoryPosition;
    onPosition: (p: StoryPosition) => void;
    clientName: string;
    logoUrl?: string;
    /** Called with the slide on screen when the reply bar is tapped. Omit to hide the bar. */
    onReply?: (highlightId: string, slideId: string) => void;
    replyLabel?: string;
    /** Notes already left on a slide — shown as a small count so the client sees what's covered. */
    commentCountFor?: (slideId: string) => number;
    className?: string;
}) => {
    const reduced = useReducedMotion();
    const [holding, setHolding] = useState(false);
    const [videoProgress, setVideoProgress] = useState(0);
    const downAt = useRef(0);
    const downX = useRef(0);

    const hIndex = highlights.findIndex((h) => h.id === position.highlightId);
    const highlight = hIndex >= 0 ? highlights[hIndex] : null;
    const slide = highlight?.slides[position.slide] ?? null;

    // Bounce back to the profile if the highlight on screen was deleted or emptied
    // underneath us (the arrange panel can do both).
    useEffect(() => {
        if (position.highlightId && (!highlight || !slide)) onPosition(PROFILE);
    }, [position.highlightId, highlight, slide, onPosition]);

    useEffect(() => setVideoProgress(0), [position.highlightId, position.slide]);

    const open = (h: StoryHighlight) => onPosition({ highlightId: h.id, slide: 0 });

    const next = () => {
        if (!highlight) return;
        if (position.slide + 1 < highlight.slides.length) return onPosition({ highlightId: highlight.id, slide: position.slide + 1 });
        // End of this highlight: roll into the next circle, like the real app; the last one
        // returns to the profile so the loop is obviously finished.
        const after = highlights[hIndex + 1];
        onPosition(after && after.slides.length ? { highlightId: after.id, slide: 0 } : PROFILE);
    };

    const prev = () => {
        if (!highlight) return;
        if (position.slide > 0) return onPosition({ highlightId: highlight.id, slide: position.slide - 1 });
        const before = highlights[hIndex - 1];
        onPosition(before && before.slides.length ? { highlightId: before.id, slide: before.slides.length - 1 } : PROFILE);
    };

    const onDown = (e: PointerEvent<HTMLDivElement>) => {
        downAt.current = Date.now();
        downX.current = e.nativeEvent.offsetX / e.currentTarget.clientWidth;
        setHolding(true);
    };
    const onUp = () => {
        setHolding(false);
        // A quick press is a tap; a longer one was a hold-to-pause and moves nothing.
        if (Date.now() - downAt.current < 250) (downX.current < 0.3 ? prev : next)();
    };

    const initials = clientName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join("");
    const handle =
        clientName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "")
            .slice(0, 24) || "yourbrand";

    /* ── Profile view ── */
    if (!highlight || !slide) {
        return (
            <div className={cx("flex size-full flex-col overflow-hidden bg-primary text-primary select-none", className)}>
                <div className="flex items-center justify-between px-4 pt-12 pb-2">
                    <span className="text-[15px] font-semibold tracking-tight">{handle}</span>
                    <span className="flex gap-1" aria-hidden="true">
                        <span className="size-1 rounded-full bg-fg-primary" />
                        <span className="size-1 rounded-full bg-fg-primary" />
                        <span className="size-1 rounded-full bg-fg-primary" />
                    </span>
                </div>
                <div className="flex items-center gap-5 px-4 pt-1">
                    <div className="flex size-[76px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary ring-1 ring-secondary">
                        {logoUrl ? (
                            <img src={logoUrl} alt="" className="size-full object-cover" />
                        ) : (
                            <span className="text-lg font-semibold text-tertiary">{initials}</span>
                        )}
                    </div>
                    <div className="flex flex-1 justify-around text-center">
                        {["Posts", "Followers", "Following"].map((l) => (
                            <div key={l}>
                                <p className="text-[15px] font-semibold">–</p>
                                <p className="text-[12px] text-tertiary">{l}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="px-4 pt-3">
                    <p className="text-[13px] font-semibold">{clientName || "Your brand"}</p>
                    <p className="text-[12px] text-tertiary">Tap a highlight to play it</p>
                </div>

                {/* The highlight tray — the deliverable. */}
                <div className="mt-4 flex [scrollbar-width:none] gap-3.5 overflow-x-auto px-4 pb-2">
                    {highlights.map((h) => {
                        const cover = coverOf(h);
                        const disabled = h.slides.length === 0;
                        return (
                            <button
                                key={h.id}
                                type="button"
                                disabled={disabled}
                                onClick={() => open(h)}
                                className="flex w-[68px] shrink-0 flex-col items-center gap-1.5 disabled:opacity-50"
                                aria-label={`Play ${h.title}`}
                            >
                                <span className="flex size-[62px] items-center justify-center rounded-full ring-1 ring-primary ring-offset-2 ring-offset-bg-primary">
                                    <span className="size-[56px] overflow-hidden rounded-full bg-secondary">
                                        {cover && <img src={cover} alt="" className="size-full object-cover" />}
                                    </span>
                                </span>
                                <span className="w-full truncate text-center text-[11px] leading-none">{h.title || "Untitled"}</span>
                            </button>
                        );
                    })}
                    {highlights.length === 0 && <p className="py-4 text-[12px] text-quaternary">No highlights yet.</p>}
                </div>

                {/* A faint feed, so the tray reads as sitting on a real profile. */}
                <div className="mt-3 grid flex-1 grid-cols-3 gap-px border-t border-secondary bg-secondary pt-px" aria-hidden="true">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="aspect-square bg-primary_alt" />
                    ))}
                </div>
            </div>
        );
    }

    /* ── Story view ── */
    const count = commentCountFor?.(slide.id) ?? 0;
    const cover = coverOf(highlight);
    const animate = slide.kind === "image" && !reduced;

    return (
        <div className={cx("relative size-full overflow-hidden bg-primary-solid select-none", className)}>
            {slide.kind === "video" ? (
                <video
                    key={slide.id}
                    src={slide.url}
                    muted
                    playsInline
                    autoPlay={!reduced}
                    // Holding pauses; so does reduced motion, which never autoplays.
                    ref={(el) => {
                        if (!el) return;
                        if (holding) el.pause();
                        else if (!reduced) el.play().catch(() => {});
                    }}
                    onTimeUpdate={(e) => {
                        const v = e.currentTarget;
                        if (v.duration) setVideoProgress(v.currentTime / v.duration);
                    }}
                    onEnded={next}
                    className="absolute inset-0 size-full object-cover"
                />
            ) : (
                <img key={slide.id} src={slide.url} alt="" className="absolute inset-0 size-full object-cover" draggable={false} />
            )}

            {/* Legibility scrims for the chrome, like the app's own. */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-linear-to-b from-black/50 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-black/50 to-transparent" />

            {/* Progress */}
            <div className="absolute inset-x-2 top-[52px] flex gap-1">
                {highlight.slides.map((s, i) => {
                    const state = i < position.slide ? "done" : i === position.slide ? "active" : "todo";
                    return (
                        <div key={s.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/35">
                            {state === "done" && <div className="size-full bg-white" />}
                            {state === "active" &&
                                (slide.kind === "video" ? (
                                    <div className="h-full origin-left bg-white" style={{ transform: `scaleX(${videoProgress})` }} />
                                ) : (
                                    <div
                                        key={`${highlight.id}-${i}`}
                                        className="h-full origin-left bg-white"
                                        style={
                                            animate
                                                ? {
                                                      animation: `story-progress ${IMAGE_SLIDE_SECONDS}s linear forwards`,
                                                      animationPlayState: holding ? "paused" : "running",
                                                  }
                                                : { transform: "scaleX(1)" }
                                        }
                                        onAnimationEnd={next}
                                    />
                                ))}
                        </div>
                    );
                })}
            </div>

            {/* Header */}
            <div className="absolute inset-x-3 top-[62px] flex items-center gap-2.5 text-white">
                <button type="button" onClick={() => onPosition(PROFILE)} className="-ml-1 rounded-full p-1" aria-label="Back to profile">
                    <ChevronLeft className="size-5" aria-hidden="true" />
                </button>
                <span className="size-8 overflow-hidden rounded-full bg-white/20 ring-1 ring-white/60">
                    {cover && <img src={cover} alt="" className="size-full object-cover" />}
                </span>
                <span className="text-[13px] font-semibold drop-shadow">{highlight.title || "Untitled"}</span>
                <span className="text-[12px] text-white/70">
                    {position.slide + 1}/{highlight.slides.length}
                </span>
                {count > 0 && (
                    <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold backdrop-blur-sm">
                        <MessageChatCircle className="size-3" aria-hidden="true" />
                        {count}
                    </span>
                )}
            </div>

            {/* Tap / hold surface — below the header and above the reply bar. */}
            <div
                className="absolute inset-x-0 top-24 bottom-20 cursor-pointer touch-none"
                onPointerDown={onDown}
                onPointerUp={onUp}
                onPointerLeave={() => setHolding(false)}
                onPointerCancel={() => setHolding(false)}
                role="presentation"
            />

            {/* Reply bar → a note on this slide */}
            {onReply && (
                <div className="absolute inset-x-3 bottom-7 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => onReply(highlight.id, slide.id)}
                        className="flex flex-1 items-center rounded-full border border-white/60 px-4 py-2.5 text-left text-[13px] text-white/90 backdrop-blur-sm transition duration-100 ease-linear hover:bg-white/10"
                    >
                        {replyLabel}
                    </button>
                </div>
            )}
        </div>
    );
};
