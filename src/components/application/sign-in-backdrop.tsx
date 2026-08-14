import { type ReactNode, useEffect, useRef } from "react";
import { cx } from "@/utils/cx";

/** Shared default behind every sign-in card — a subtle leaf-shadow loop, 534KB. */
export const LOGIN_BG_VIDEO = "/hgm%20video/Tree-Leaves-Shadow-Overlay-02-4k-Video-Loop.webm";
/**
 * A still frame of that loop, 17KB. Carries the design on its own whenever the video can't:
 * as the video's poster while it buffers or if decoding fails, and as the whole background for
 * anyone browsing with reduced motion. Without it those cases fall back to flat grey.
 */
export const LOGIN_BG_POSTER = "/hgm%20video/leaf-shadow-poster.webp";

/**
 * Full-page backdrop for a sign-in screen: the leaf video, its still fallback, a scrim, and the
 * card centred on top.
 *
 * It owns the page element rather than just the background layer, and that's deliberate. The
 * layering here is easy to get subtly wrong — the first version of this put the background at
 * -z-10 inside a page element that wasn't a stacking context, so the layer escaped to the page
 * root and the page's own opaque background painted straight over the video. The sign-in screen
 * rendered flat grey for weeks before anyone traced it. Owning the whole stack means a caller
 * can't reintroduce that: `isolate` here, background at z-0, card at z-10.
 */
export const SignInBackdrop = ({
    children,
    backgroundUrl,
    className,
}: {
    children: ReactNode;
    /** Per-client override (image or video). Falls back to the shared leaf loop. */
    backgroundUrl?: string;
    /** Extra classes for the page element (padding, alignment). */
    className?: string;
}) => {
    const bg = (backgroundUrl ?? "").trim() || LOGIN_BG_VIDEO;
    const bgIsVideo = /\.(webm|mp4|mov)(\?|$)/i.test(bg);
    const isDefault = bg === LOGIN_BG_VIDEO;

    /* The `autoplay` attribute alone isn't reliable: Chrome refuses it in a tab that loads in the
       background, and some setups block it outright, which leaves the video parked on its poster.
       Ask again once the tab is actually visible and once on the first interaction — both count as
       a fresh chance to start. Nothing here can un-hide the video for a reduced-motion visitor;
       that's the poster's job. */
    const videoRef = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        if (!bgIsVideo) return;
        const tryPlay = () => void videoRef.current?.play().catch(() => {});
        tryPlay();
        document.addEventListener("visibilitychange", tryPlay);
        document.addEventListener("pointerdown", tryPlay);
        return () => {
            document.removeEventListener("visibilitychange", tryPlay);
            document.removeEventListener("pointerdown", tryPlay);
        };
    }, [bgIsVideo, bg]);

    return (
        <main className={cx("relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-tertiary p-6", className)}>
            {/* Always a solid colour underneath, so a slow or failed load leaves a clean page
                rather than a flash of nothing. Motion is suppressed for anyone who asked for
                reduced motion — an autoplaying loop is exactly what that setting is about. */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 bg-tertiary">
                {bgIsVideo ? (
                    <>
                        <video
                            ref={videoRef}
                            src={bg}
                            poster={isDefault ? LOGIN_BG_POSTER : undefined}
                            autoPlay
                            muted
                            loop
                            playsInline
                            preload="auto"
                            className="size-full object-cover motion-reduce:hidden"
                        />
                        {/* Reduced motion gets the still instead of nothing — same look, no movement. */}
                        {isDefault && (
                            <img src={LOGIN_BG_POSTER} alt="" className="absolute inset-0 hidden size-full object-cover motion-reduce:block" draggable={false} />
                        )}
                    </>
                ) : (
                    <img src={bg} alt="" className="size-full object-cover" draggable={false} />
                )}
                {/* Scrim: the asset is a shadow OVERLAY, so it's low-contrast by design and the
                    card needs its own separation from it. */}
                <div className="absolute inset-0 bg-black/25" />
            </div>

            <div className="relative z-10 flex w-full justify-center">{children}</div>
        </main>
    );
};
