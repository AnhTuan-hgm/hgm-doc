import { useEffect, useRef } from "react";
import { useInView, useReducedMotion } from "motion/react";

/**
 * A muted 9:16 client reel sized to fill a phone screen. Ported from
 * hiddengem-media's `(site)/mockup/reel-video.tsx`.
 *
 * PLAYBACK IS DRIVEN FROM AN EFFECT, NOT `autoPlay`. The attribute fires at
 * load, before any preference has been read, and setting or clearing it
 * afterwards neither starts nor stops a video — so honouring reduced motion
 * with it is not possible. The markup therefore never autoplays, and the effect
 * starts the loop only when motion is allowed. The loop also stays paused with
 * JS off, which is the correct failure direction.
 *
 * THE MP4S WERE NOT PORTED — only the poster JPEGs live in /public/mockup-ig,
 * so every `<video src>` here 404s and the poster carries the surface. That is
 * exactly what the source site ships too (its `.gitignore` blocks the MP4s), so
 * a still frame IS parity with the live reference, not a downgrade. Drop the
 * MP4s into /public/mockup-ig under the same names and the reels start moving.
 *
 * `preload="none"` so the browser fetches nothing until `play()` is called —
 * which the effect only does when motion is allowed AND the element is in view.
 */
export const ReelVideo = ({ src, poster, paused = false }: { src: string; poster: string; paused?: boolean }) => {
    const ref = useRef<HTMLVideoElement>(null);
    const prefersReducedMotion = useReducedMotion();
    // Not `once` — leaving the section should pause the loop, not just skip
    // starting it. The margin starts the fetch just before the phones arrive.
    const inView = useInView(ref, { margin: "200px" });

    useEffect(() => {
        const video = ref.current;
        if (!video) return;

        // Assert `muted` as a property — an unmuted play() is refused by every
        // browser.
        video.muted = true;

        if (prefersReducedMotion || !inView || paused) {
            video.pause();
        } else {
            // Rejects when the browser blocks playback; the poster is the fallback.
            video.play().catch(() => {});
        }
    }, [prefersReducedMotion, inView, paused]);

    return (
        <video
            ref={ref}
            src={src}
            poster={poster}
            muted
            loop
            playsInline
            preload="none"
            // The reel is 9:16 and so is the screen, so `cover` crops nothing
            // worth keeping — it only absorbs the bezel's rounded corners.
            className="size-full object-cover"
        />
    );
};
