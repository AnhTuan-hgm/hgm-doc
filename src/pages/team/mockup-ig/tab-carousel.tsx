import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "@untitledui-pro/icons/line";
import { cx } from "@/utils/cx";

/**
 * A paged carousel for the 1:1 surfaces — snap rail, paddles, and Instagram's own
 * dot indicator.
 *
 * ------------------------------------------------------------------------
 * WHY THIS FILE IS NOT CALLED ig-carousel.tsx
 * ------------------------------------------------------------------------
 * The `ig-` prefix in this folder is not decoration: it marks the files the
 * containment grep in instagram-screen.tsx requires to be free of HGM semantic
 * tokens, because they draw Instagram and Instagram's palette is the sanctioned
 * exception. This file is page CHROME — the paddles and the caption belong to our
 * site and must use our tokens. Only the dot row is Instagram, and it says so by
 * wearing `.ig-surface`, which is the one thing that makes `--ig-*` resolve.
 *
 * Name it `ig-carousel.tsx` and the third grep fires on every paddle.
 *
 * ------------------------------------------------------------------------
 * IT IS A SCROLLER, NOT AN ANIMATION
 * ------------------------------------------------------------------------
 * `overflow-x-auto` + `scroll-snap-type: x mandatory`, per the project's rule that
 * a snap gallery is layout rather than motion (/animation §10). The browser does
 * the physics, the OS does the momentum, and there is nothing for
 * prefers-reduced-motion to switch off — `scrollBy({ behavior: "smooth" })` reads
 * the user's setting through the `scroll-behavior` rule already in globals.css.
 *
 * Deliberately NOT built on `SnapGallery` from /animation, which is the closest
 * existing thing: it tracks only whether the scroller is at an edge, and a
 * carousel has to know WHICH slide is showing to light a dot and name the tab.
 * Adding an index to that component for one caller would change the reference
 * page that documents it.
 *
 * ------------------------------------------------------------------------
 * THE DOTS ARE BUTTONS, WHICH THE REAL APP'S ARE NOT
 * ------------------------------------------------------------------------
 * On a phone you swipe, so Instagram's dots are a read-out and nothing more. On a
 * desktop page with no touch they would be a picture of a control. They are real
 * buttons here, carrying `aria-current` — the same 5.5px geometry, doing a job.
 */

export type CarouselSlide = {
    id: string;
    /** Names the slide under the dots, and labels its dot for a screen reader. */
    caption: string;
    node: React.ReactNode;
};

export const TabCarousel = ({ label, slides, initial = 0 }: { label: string; slides: CarouselSlide[]; initial?: number }) => {
    const scroller = useRef<HTMLDivElement>(null);
    const [current, setCurrent] = useState(initial);

    /**
     * Nearest slide by distance, rather than `scrollLeft / stride`.
     *
     * The rail centres its slides below lg and left-aligns them at lg, so the
     * offset of slide 0 is not 0 at every width and a division would be one out
     * for the whole rail on desktop. Measuring each child against the scroller's
     * own centre is width-agnostic and costs a loop over four items.
     */
    const measure = useCallback(() => {
        const el = scroller.current;
        if (!el) return;

        const centre = el.scrollLeft + el.clientWidth / 2;
        let best = 0;
        let bestDistance = Infinity;

        [...el.children].forEach((child, index) => {
            const item = child as HTMLElement;
            const itemCentre = item.offsetLeft + item.offsetWidth / 2;
            const distance = Math.abs(itemCentre - centre);
            if (distance < bestDistance) {
                bestDistance = distance;
                best = index;
            }
        });

        setCurrent(best);
    }, []);

    useEffect(() => {
        measure();
        // `resize` matters more than it looks: the rail switches from centred to
        // left-aligned at lg, which moves every slide without firing `scroll`.
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, [measure]);

    const goTo = (index: number, behavior: ScrollBehavior = "smooth") => {
        const el = scroller.current;
        const item = el?.children[index] as HTMLElement | undefined;
        if (!el || !item) return;

        // Centre the target rather than aligning it left, because that is what
        // `snap-center` on the slides settles to anyway — scrolling to
        // `offsetLeft` makes the browser correct us afterwards, which reads as a
        // bounce.
        el.scrollTo({ left: item.offsetLeft - (el.clientWidth - item.offsetWidth) / 2, behavior });
    };

    /**
     * OPEN ON `initial`, INSTANTLY.
     *
     * A carousel whose first slide is the least interesting one wastes the slot
     * that does the most work — here the profile's real content lives on the
     * Reels tab, and slide 0 is the empty photo tab because that is the order
     * Instagram's own tab bar runs in. Reordering the slides would misreport the
     * tab bar, so the rail opens on the useful one instead.
     *
     * `"auto"`, never `"smooth"`: a carousel that visibly slides on page load is
     * an entrance animation nobody asked for, and it would fight a browser
     * restoring scroll position on a refresh. Runs once — `initial` is a starting
     * position, not a controlled value, so re-running it would yank the rail back
     * under anyone who had already swiped.
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => goTo(initial, "auto"), []);

    return (
        <div>
            <div className="flex items-center justify-between gap-6 px-5 md:px-6">
                <p className="text-sm text-tertiary">{label}</p>

                <div className="flex gap-2">
                    {([-1, 1] as const).map((direction) => (
                        <button
                            key={direction}
                            type="button"
                            onClick={() => goTo(current + direction)}
                            disabled={direction === -1 ? current === 0 : current === slides.length - 1}
                            aria-label={direction === -1 ? "Previous tab" : "Next tab"}
                            className="flex size-10 items-center justify-center rounded-full border border-secondary bg-secondary text-primary transition duration-100 ease-linear hover:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {direction === -1 ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-5" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* `tabIndex` and the role are what make this reachable at all: a
                scroll container is not focusable by default, so a keyboard user
                could see four slides and reach none of them. With it, arrow keys
                scroll the rail natively — no key handler of our own. */}
            <div
                ref={scroller}
                onScroll={measure}
                tabIndex={0}
                role="group"
                aria-label={label}
                className="mt-6 scrollbar-hide flex snap-x snap-mandatory gap-8 overflow-x-auto px-5 pb-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring md:px-6"
            >
                {slides.map((slide) => (
                    <div key={slide.id} className="flex shrink-0 snap-center flex-col items-center">
                        {slide.node}
                    </div>
                ))}
            </div>

            <div className="mt-2 flex flex-col items-center gap-3">
                {/* THE ONE INSTAGRAM OBJECT IN THIS FILE. 5.5px, blue for current,
                    25% white for the rest — the same two values the carousel post
                    in ig-proof.tsx uses, which is why this wears `.ig-surface`
                    rather than restating them in our tokens. */}
                <div className="ig-surface flex items-center gap-1.5">
                    {slides.map((slide, index) => (
                        <button
                            key={slide.id}
                            type="button"
                            onClick={() => goTo(index)}
                            aria-label={slide.caption}
                            aria-current={index === current ? "true" : undefined}
                            // The hit area is 24px; the dot inside it stays 5.5px.
                            // A 5.5px button is a 5.5px target, and the pointer
                            // guidance floor is 24.
                            className="flex size-6 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                        >
                            <span
                                aria-hidden="true"
                                className={cx(
                                    "size-[5.5px] rounded-full transition duration-100 ease-linear",
                                    index === current ? "bg-(--ig-blue)" : "bg-(--ig-text)/25",
                                )}
                            />
                        </button>
                    ))}
                </div>

                <p aria-live="polite" className="text-center text-sm text-tertiary">
                    {slides[current]?.caption}
                </p>
            </div>
        </div>
    );
};
