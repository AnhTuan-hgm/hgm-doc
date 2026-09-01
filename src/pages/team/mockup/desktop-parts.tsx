import { Lock01 } from "@untitledui-pro/icons/line";
import { PhoneFrame } from "@/components/shared-assets/phone-frame";
import { Container, Eyebrow, SectionHeading } from "@/components/shared-assets/site-primitives";
import { cx } from "@/utils/cx";
import { DesktopPage, LaptopFrame } from "./mockup-screen";

/**
 * DESKTOP PARTS — four sections, kept out of mockup-screen.tsx on purpose:
 * that module is already 1,100+ lines. Ported from hiddengem-media's
 * `(site)/mockup/desktop-parts.tsx`.
 *
 * ------------------------------------------------------------------------
 * THE iMAC BEZEL — public/device-mockups/imac-24-silver.png
 * ------------------------------------------------------------------------
 * COPIED PREPARED from the marketing repo (public/device-bezels/), because the
 * iMac is NOT in the shared bezel library yet — the library holds seven devices
 * and none is a desktop. The bitmap travels with its measured inset, per the
 * library's own rule; if the iMac ever lands in
 * ~/Documents/For_You_Claude/device-bezels/prepared/, both repos should re-sync
 * from there and this note comes out.
 *
 * How it was prepared (in the marketing repo): extracted from imac-24-silver.svg
 * (9.6MB, zero <path> elements, one 4760x4040 base64 PNG), cropped to the opaque
 * bbox, resized to 1700 wide, quantised to 256 colours — 428KB down to 277KB.
 *
 * THE SCREEN WAS FOUND BY FLOOD FILL, NOT BY SCANNING ROWS, and that mattered:
 * an iMac's rounded outer corners are transparent too and share a y-range with
 * the display, so a row scan grabs x=0 and reports the 16:9 panel as 1.223 —
 * 31% out. Filling inward from the border leaves the cut-out as the only
 * interior hole. Result: 1.7775 against 16:9's 1.7778, off by 0.02%. Any future
 * device with rounded corners needs the same treatment.
 */

/** 1700x1433, screen inset measured by flood fill. See the note above. */
const IMAC_SCREEN_INSET = "left-[2.529%] top-[3.001%] w-[94.941%] h-[63.364%]";

/* -------------------------------------------------------------------------- */
/* IMacFrame                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Same contract as `PhoneFrame` and `LaptopFrame`: content behind, bezel over it
 * at z-10, `children` replacing the placeholder. The screen is only 63% of the
 * frame's height because the rest is chin and stand — which is the whole reason
 * this device is worth having. A laptop is a screen with a base; an iMac is a
 * screen on a pedestal, and the negative space under it reads differently.
 */
export const IMacFrame = ({ label, className, children }: { label: string; className?: string; children?: React.ReactNode }) => (
    <div className={cx("relative aspect-1700/1433 w-full", className)} aria-label={label}>
        <div className={cx("absolute overflow-hidden", IMAC_SCREEN_INSET)}>{children ?? <DesktopPage />}</div>

        <img src="/device-mockups/imac-24-silver.png" alt="" className="pointer-events-none absolute inset-0 z-10 size-full object-contain select-none" />
    </div>
);

/* -------------------------------------------------------------------------- */
/* Section 10 · On a pedestal                                                  */
/* -------------------------------------------------------------------------- */

/**
 * IT GETS A CONTACT SHADOW WHERE THE LAPTOP SECTIONS DO NOT, because this device
 * actually stands on something — the stand's foot is a shallow wedge, and without
 * a shadow under it the whole thing floats. Same technique as the iPad pair: an
 * ellipse blurred behind the frame rather than a box-shadow, which would draw the
 * rectangle of the image instead of the outline of the foot.
 */
export const DesktopDesk = () => (
    <section id="imac" className="scroll-mt-20 border-t border-secondary py-20 md:py-28">
        <Container>
            <Eyebrow>Section 10</Eyebrow>
            <SectionHeading className="mt-4">On a pedestal</SectionHeading>
            <p className="mt-5 max-w-[62ch] text-lg text-tertiary">
                A 24-inch iMac — the first desktop here that is not a laptop. Its screen is 63% of the frame&apos;s height and the rest is chin and stand, which
                is exactly why it reads differently: a laptop is a screen with a base, this is a screen on a pedestal.
            </p>

            <div className="relative mx-auto mt-14 w-full max-w-[820px]">
                <IMacFrame label="Website" />

                {/* The foot's contact shadow. Narrow, because the stand's base is. */}
                <span aria-hidden="true" className="absolute inset-x-[38%] -bottom-1 h-[2.5%] rounded-[100%] bg-current text-primary opacity-20 blur-md" />
            </div>

            <p className="mt-10 text-sm text-tertiary">
                Bezel prepared in the marketing repo at 1700×1433, 272KB — not yet in the shared library. Screen inset found by flood fill — 1.7775 against
                16:9&apos;s 1.7778, off by 0.02%.
            </p>
        </Container>
    </section>
);

/* -------------------------------------------------------------------------- */
/* Section 14 · Every width at once                                            */
/* -------------------------------------------------------------------------- */

/**
 * THE RESPONSIVE SHOT: the same page at three breakpoints, side by side.
 *
 * SIZES ARE PROPORTIONAL TO THE REAL DEVICES, not chosen to fill the row. A 24"
 * iMac is 547mm wide, an iPad Pro 11" is 249mm and an iPhone 17 Pro is 72mm —
 * roughly 7.6 : 3.5 : 1. Faking that to make a tidier composition is the fastest
 * way to make a device line-up look wrong without anyone being able to say why,
 * so the flex values below are that ratio, floored so the phone stays above 54px
 * at 360.
 *
 * They are BOTTOM-aligned because all three sit on the same imaginary surface.
 * Centred, the phone floats halfway up the iMac's screen.
 */
export const EveryWidth = () => (
    <section id="every-width" className="scroll-mt-20 overflow-x-clip border-t border-secondary py-20 md:py-28">
        <Container>
            <Eyebrow>Section 14</Eyebrow>
            <SectionHeading className="mt-4">Every width at once</SectionHeading>
            <p className="mt-5 max-w-[62ch] text-lg text-tertiary">
                One page at three breakpoints. The devices are sized to their real proportions — 547mm, 249mm and 72mm wide — because a line-up with invented
                ratios looks wrong in a way nobody can name.
            </p>

            <div className="mt-14 flex items-end justify-center gap-3 sm:gap-5 lg:gap-7">
                <div className="min-w-0 flex-[7.6]">
                    <IMacFrame label="Website" />
                </div>

                {/* Portrait, so the middle breakpoint is a genuinely different shape
                    rather than a smaller version of the desktop. Inset from the
                    shared library's manifest — same file, same numbers as /test. */}
                <div className="min-w-0 flex-[3.5] pb-[6%]">
                    <div className="relative aspect-569/800 w-full">
                        <div className="absolute top-[3.625%] left-[4.921%] h-[92.875%] w-[89.982%] overflow-hidden">
                            <DesktopPage />
                        </div>
                        <img
                            src="/device-mockups/ipad-pro-11-silver-portrait.png"
                            alt=""
                            className="pointer-events-none absolute inset-0 z-10 size-full object-contain select-none"
                        />
                    </div>
                </div>

                <div className="min-w-[54px] flex-[1] pb-[6%]">
                    <PhoneFrame label="Website" />
                </div>
            </div>
        </Container>
    </section>
);

/* -------------------------------------------------------------------------- */
/* Section 15 · Desk, lap, pocket                                              */
/* -------------------------------------------------------------------------- */

/**
 * THE SAME LINE-UP AS SECTION 14 WITH THE TABLET SWAPPED FOR A LAPTOP, and a
 * different shot rather than a variant: 14 is the responsive story, this is the
 * where-they-sit story. All three are landscape, all three run the desktop
 * layout, and the only thing that changes down the row is how far the viewer is
 * from the screen.
 *
 * THE RATIO IS ANCHORED ON THE SCREENS, NOT ON THE CHASSIS. Chassis-anchored
 * (7.61 : 4.23 : 1) is physically true and looked wrong, because the MacBook
 * plate is a perspective render with the lid tilted away — its screen is only
 * 77.5% of the plate's width, against ~95% and ~91% for the head-on iMac and
 * iPhone. Solving for display width instead — 520mm, 289mm, 66.9mm panels, each
 * divided by its plate's screen percentage — gives 7.50 : 5.10 : 1. The cost is
 * a MacBook chassis rendering ~22% wide, which is the perspective distortion
 * being paid back rather than a fudge. The honest fix is a head-on MacBook
 * plate; there isn't one in the shared library.
 *
 * BOTTOM-FLUSH, WITH NO LIFT ON ANY OF THEM, which 14 could not do: an iPad and
 * a phone do not stand up on a desk. Here every device genuinely rests on the
 * surface, so each one gets the contact shadow that goes with it — per-device,
 * not one bar under the row, because the three feet are nothing alike.
 */
export const DeskLapPocket = () => (
    <section id="line-up" className="scroll-mt-20 overflow-x-clip border-t border-secondary py-20 md:py-28">
        <Container>
            <Eyebrow>Section 15</Eyebrow>
            <SectionHeading className="mt-4">Desk, lap, pocket</SectionHeading>
            <p className="mt-5 max-w-[62ch] text-lg text-tertiary">
                The three places the work actually gets seen, scaled so the displays are true to each other — a 24-inch panel, a 13.6-inch one and a 6.3-inch
                one. Section 14 tells the responsive story with a portrait tablet in the middle; this one keeps all three landscape, because the point here is
                distance from the screen, not breakpoint.
            </p>

            {/* Same flex-ratio trick as section 14. `min-w-0` on the two wide
                devices lets them give way; the phone gets a floor instead, or at
                360 it lands at 23px and stops being a device. */}
            <div className="mt-14 flex items-end justify-center gap-3 sm:gap-5 lg:gap-7">
                <div className="relative min-w-0 flex-[7.5]">
                    <IMacFrame label="Website" />
                    <span aria-hidden="true" className="absolute inset-x-[38%] -bottom-1 h-[2.5%] rounded-[100%] bg-current text-primary opacity-20 blur-md" />
                </div>

                <div className="relative min-w-0 flex-[5.1]">
                    <LaptopFrame label="Website">
                        <DesktopPage />
                    </LaptopFrame>
                    {/* Wide and shallow: the base is almost the frame's width. */}
                    <span aria-hidden="true" className="absolute inset-x-[6%] -bottom-1 h-[4%] rounded-[100%] bg-current text-primary opacity-20 blur-md" />
                </div>

                <div className="relative min-w-[54px] flex-[1]">
                    <PhoneFrame label="Website" />
                    <span
                        aria-hidden="true"
                        className="absolute inset-x-[12%] -bottom-0.5 h-[1.6%] rounded-[100%] bg-current text-primary opacity-20 blur-sm"
                    />
                </div>
            </div>

            <p className="mt-10 text-sm text-tertiary">Team asset · Website — desktop capture (16:10), one file behind all three frames.</p>
        </Container>
    </section>
);

/* -------------------------------------------------------------------------- */
/* Section 12 · Above and below the fold                                       */
/* -------------------------------------------------------------------------- */

/**
 * The desktop answer to the scroll window. That one clips a tall page inside a
 * phone; this clips one inside browser chrome, which is where the fold argument
 * actually gets had — nobody signs off a phone's fold, they sign off the
 * desktop one.
 *
 * THE FOLD LINE IS DRAWN, and it is the whole section. A scroll-clipped page
 * without it is just a cropped screenshot; with it, the section makes a claim
 * you can disagree with, which is the point of showing it.
 *
 * It travels on hover like the scroll window, with the same guard:
 * `motion-safe:` on the TRANSFORM rather than only the transition, so reduced
 * motion holds the top of the page instead of jumping to the bottom.
 */
export const FoldWindow = () => (
    <section id="fold" className="scroll-mt-20 border-t border-secondary py-20 md:py-28">
        <Container>
            <Eyebrow>Section 12</Eyebrow>
            <SectionHeading className="mt-4">Above and below the fold</SectionHeading>
            <p className="mt-5 max-w-[62ch] text-lg text-tertiary">
                A desktop page twice the height of its viewport, clipped to one screen of it, with the fold marked. Hover to run it down. The scroll window does
                this in a phone; the fold is a desktop argument.
            </p>

            <div className="group mt-14 overflow-hidden rounded-xl border border-secondary shadow-xl">
                <div className="flex items-center gap-2 border-b border-secondary bg-secondary px-3 py-2.5 md:gap-3 md:px-4">
                    <span aria-hidden="true" className="hidden shrink-0 items-center gap-1.5 sm:flex">
                        <span className="size-2.5 rounded-full bg-quaternary" />
                        <span className="size-2.5 rounded-full bg-quaternary" />
                        <span className="size-2.5 rounded-full bg-quaternary" />
                    </span>
                    <span className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md border border-secondary bg-primary px-2.5 py-1">
                        <Lock01 aria-hidden="true" className="size-3 shrink-0 text-fg-quaternary" />
                        <span className="truncate text-xs text-tertiary">hiddengem.media</span>
                    </span>
                </div>

                <div className="relative aspect-16/10 w-full overflow-hidden">
                    <div className="h-[200%] w-full transition-transform duration-700 ease-out motion-safe:group-hover:-translate-y-[50%]">
                        <div className="h-1/2">
                            <DesktopPage />
                        </div>
                        <div className="h-1/2">
                            <DesktopPage />
                        </div>
                    </div>

                    {/*
                      The fold. Pinned to the FRAME, not the travelling page, so it
                      stays where the viewport ends while the content moves past it.
                    */}
                    <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-10 border-b-2 border-dashed border-brand/70" />
                    <span className="pointer-events-none absolute right-3 bottom-3 z-10 rounded-full border border-brand/40 bg-primary/80 px-2.5 py-1 text-[0.625rem] font-semibold tracking-[0.08em] text-brand-secondary uppercase backdrop-blur-sm">
                        The fold
                    </span>
                </div>
            </div>
        </Container>
    </section>
);

/* -------------------------------------------------------------------------- */
/* Section 08 · Both canvases                                                  */
/* -------------------------------------------------------------------------- */

/**
 * NOTHING IN `DesktopPage` CHANGES BETWEEN THESE TWO FRAMES. It is built
 * entirely from semantic tokens, so a wrapper class re-points every one of them
 * and the page flips — the claim is not "here are two designs" but "here is one
 * component surviving both canvases".
 *
 * ADAPTED FROM THE SOURCE, which pinned its right-hand frame to `cream-mode` —
 * a light-island class this project deliberately does not have (the whole app
 * themes at once). What it does have is the `.dark-mode` token block
 * (theme.css), which works on any subtree, not just <html>. So the right frame
 * is PINNED DARK and the left one follows the page theme: in light mode the two
 * canvases sit side by side, in dark mode they match — which is itself the
 * demonstration, and the caption says so.
 *
 * The pinned frame needs `bg-primary` on an inner wrapper as well as the class,
 * because `dark-mode` re-points the tokens but does not itself paint a
 * background.
 */
export const BothCanvases = () => (
    <section id="both-canvases" className="scroll-mt-20 border-t border-secondary py-20 md:py-28">
        <Container>
            <Eyebrow>Section 08</Eyebrow>
            <SectionHeading className="mt-4">Both canvases</SectionHeading>
            <p className="mt-5 max-w-[62ch] text-lg text-tertiary">
                One component, two canvases. The markup is identical in both frames — the right one is pinned inside{" "}
                <code className="text-secondary">dark-mode</code>, which re-points every semantic token it uses, while the left follows the page theme. Flip the
                theme toggle and only the left one moves. If a section only ever gets checked on one canvas, this is where that shows.
            </p>

            <div className="mt-14 grid gap-6 lg:grid-cols-2">
                <figure>
                    <LaptopFrame label="Website" />
                    <figcaption className="mt-5 text-center text-sm text-tertiary">The page&apos;s own canvas — follows the theme toggle</figcaption>
                </figure>

                <figure>
                    {/* The class sits on the inner wrapper, not the figure, so the
                        caption below stays on the PAGE's tokens — inside the
                        wrapper it would paint dark-canvas grey onto a light page. */}
                    <div className="dark-mode rounded-xl bg-primary p-4">
                        <LaptopFrame label="Website" />
                    </div>
                    <figcaption className="mt-5 text-center text-sm text-tertiary">Pinned dark — the same markup, re-pointed</figcaption>
                </figure>
            </div>
        </Container>
    </section>
);
