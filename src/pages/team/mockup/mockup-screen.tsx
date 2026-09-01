import { ChevronLeft, ChevronRight, Lock01, Plus, RefreshCw01 } from "@untitledui-pro/icons/line";
import { ContentsRail } from "@/components/shared-assets/contents-rail";
import type { RailIcon } from "@/components/shared-assets/contents-rail";
import { ScreenAssetNote as AssetNote, PhoneFrame, ScreenPlaceholder } from "@/components/shared-assets/phone-frame";
import { ReelVideo } from "@/components/shared-assets/reel-video";
import { Container, Eyebrow, PrimaryAction, SectionHeading } from "@/components/shared-assets/site-primitives";
import { cx } from "@/utils/cx";
import { BothCanvases, DeskLapPocket, DesktopDesk, EveryWidth, FoldWindow } from "./desktop-parts";

/**
 * MOCKUP — the device-mockup library: phones, laptops, tablets, browser chrome
 * and one held in a hand, every bezel a real device export.
 *
 * PORTED from the hiddengem-media marketing site's `/mockup` route
 * (`src/app/(site)/mockup/`, 2026-09-01). Registered flat in src/main.tsx as
 * `/mockup`, beside `/mockup-ig`. Not linked from anywhere; a reference page.
 *
 * ------------------------------------------------------------------------
 * PREPARED BEZELS — public/device-mockups/
 * ------------------------------------------------------------------------
 * This repo's bezels are COPIES of the shared library's prepared files
 * (~/Documents/For_You_Claude/device-bezels/prepared/, synced via sync.mjs);
 * the insets below come from that library's manifest.json and are percentages
 * of the CROPPED bitmap, so they hold at any rendered size. The screen in every
 * one is a true cut-out — alpha 0 at its centre — so content goes BEHIND the
 * bezel, never on top.
 *
 *   file                              px          weight  screen inset (L / T / W / H)
 *   iphone-17-pro-silver.png          626×1290     92KB   4.313 / 1.86 / 91.374 / 96.279   (in phone-frame.tsx)
 *   macbook-air-13.png               1723×1005    204KB   11.203 / 6.347 / 77.544 / 83.089
 *   ipad-pro-11-silver-landscape.png 1578×1123    104KB   3.612 / 5.076 / 92.902 / 90.027
 *   ipad-pro-11-silver-portrait.png   569×800      32KB   4.921 / 3.625 / 89.982 / 92.875
 *   imac-24-silver.png               1700×1433    272KB   2.529 / 3.001 / 94.941 / 63.364  (NOT in the library — copied
 *                                                         prepared from the marketing repo; see desktop-parts.tsx)
 *
 * The MacBook and both iPads are byte-identical crops to the marketing repo's,
 * so the source page's insets carried over unchanged. The iPhone is NOT: this
 * repo holds the library's canonical 626×1290 crop where the marketing repo
 * ships an older 524×1082 one, so every 439px trick there is a 440px trick here
 * and the phone constants live in the shared phone-frame.tsx.
 *
 * ------------------------------------------------------------------------
 * PREPARED HAND PLATES — public/mockup/
 * ------------------------------------------------------------------------
 * Not bezels: photographic cut-outs with no screen inset to scan for. Only the
 * held-in-hand section uses them.
 *
 *   iphone-17-pro-in-hand-back.webp   1120×1714   163KB   palm and fingers, drawn under the phone
 *   iphone-17-pro-in-hand-front.webp  1120×1714    51KB   thumb and fingertips, drawn over the bezel
 *
 * GENERATED, NOT SHOT — nano_banana_2 (Google) via Higgsfield, 2k, 2026-08-29,
 * in the marketing repo, where the full prompt is recorded (phone-frame
 * reference plate on black; hand wraps the side rails; no finger crosses the
 * glass or the short edges; unretouched skin; one warm key light upper right).
 * Copied here as prepared plates. One photograph split in two along the grip:
 * everything the camera saw in the back plate, only the skin on the two side
 * rails in the front plate, our bezel dropped between them. Both plates share
 * one canvas cropped by the same rect, so the front plate is `inset-0` and
 * registration is free.
 *
 *   phone box in the plate   left 12.968% / top 0 / width 62.484%
 *
 * ONE REGISTRATION CAVEAT THAT IS THIS REPO'S OWN: the plates were generated
 * around the marketing repo's 524×1082 iPhone crop (aspect 0.48428); this repo's
 * canonical crop is 626×1290 (0.48527). Same rendering, slightly different crop
 * margins — at the box above our phone draws ~0.2% shorter, ~1.4px at the
 * largest render. The grip is on the side rails, which are width-registered, so
 * the fingers still land on the metal; verified visually in the composite.
 *
 * IT IS AN AI-GENERATED HUMAN HAND, on an unlisted reference page. That is fine
 * here and is a decision to re-make deliberately if this treatment ever
 * graduates to a client-facing route.
 */

/* -------------------------------------------------------------------------- */
/* Section 01 · Three phones                                                   */
/* -------------------------------------------------------------------------- */

const phones = [
    { label: "Instagram reel — 9:16", caption: "Cinematic content" },
    { label: "Booking flow — mobile", caption: "Direct booking" },
    { label: "Welcome email — mobile", caption: "List building" },
];

/**
 * A desktop page, drawn from the same tokens, for the frames a
 * `ScreenPlaceholder` cannot carry: at 720×450 in a browser window the
 * gradient-and-tag placeholder is a large void, and a frame with nothing in it
 * demonstrates nothing about the frame. Same vocabulary as `TallPage` (bars,
 * cards, one brand element), arranged the way a wide page is.
 *
 * NOT ONE PIXEL VALUE IN IT, because it renders from 213px wide (the tilted
 * laptop's screen at 360) to ~880px. Percentages make it behave the way a
 * screenshot does — the whole page scales with the frame — and the only thing
 * that keeps its own size is the note, which is a label on the mockup rather
 * than part of the page. The note carries the short tag only; the full asset
 * name lives in the caption under each frame.
 */
export const DesktopPage = ({ note }: { note?: React.ReactNode }) => (
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

        <div className="flex h-[28%] shrink-0 items-end justify-between gap-[3%] bg-linear-160 from-secondary via-primary to-secondary px-[3%] pb-[5%]">
            <span className="flex h-[40%] flex-1 flex-col justify-end gap-[16%]">
                <span className="h-[24%] w-[55%] rounded-sm bg-quaternary" />
                <span className="h-[14%] w-[36%] rounded-full bg-quaternary" />
            </span>
            {note}
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

/**
 * The three-phone row, shared by sections 01 and 02.
 *
 * One code path for every width. The row scrolls inside its own container below
 * lg; from lg it centres, because that is the first breakpoint where the phones
 * actually fit (3 × 268 + 2 × 40 + 48 = 932 against 1024). `-safe` rather than
 * the source's `lg:overflow-visible`, matching /mockup-ig: the row stays its own
 * scroll container at every width, so the body can never scroll horizontally.
 */
const PHONE_ROW = "scrollbar-hide mt-14 flex snap-x snap-mandatory gap-6 overflow-x-auto px-5 pb-4 lg:justify-center-safe lg:gap-10 lg:px-6";

const Phone = ({ label, caption }: { label: string; caption: string }) => (
    <figure className="flex w-[210px] shrink-0 snap-center flex-col items-center sm:w-[240px] lg:w-[268px]">
        <PhoneFrame label={label} className="w-full" />

        <figcaption className="mt-6 text-center">
            <span className="block text-md font-semibold text-primary">{caption}</span>
            <span className="mt-1 block text-sm text-tertiary">Team asset · {label}</span>
        </figcaption>
    </figure>
);

export const PhoneRow = () => (
    <section id="phones" className="scroll-mt-20 py-20 md:py-28">
        <Container>
            <Eyebrow>Section 01</Eyebrow>
            <SectionHeading className="mt-4">Three phones</SectionHeading>
            <p className="mt-5 max-w-[62ch] text-lg text-tertiary">
                Draft layout. Swap each screen for a real 9:16 capture when the assets land — the frames size themselves from the column.
            </p>
        </Container>

        <div className={PHONE_ROW}>
            {phones.map((phone) => (
                <Phone key={phone.label} {...phone} />
            ))}
        </div>
    </section>
);

/* -------------------------------------------------------------------------- */
/* Section 13 · Laptop + phone                                                 */
/* -------------------------------------------------------------------------- */

/**
 * MacBook Air 13", the shared library's prepared bezel — 1723×1005, cropped to
 * the opaque bounding box so the image box and the laptop are the same
 * rectangle, which is what lets the button below align to the device rather
 * than to invisible padding. Screen geometry came from the source SVG's own
 * grey screen rect, rebased onto the cropped bitmap; percentages, so they hold
 * at any size.
 */
const LAPTOP_SCREEN_INSET = "left-[11.203%] top-[6.347%] h-[83.089%] w-[77.544%]";

export const LaptopFrame = ({ label, className, children }: { label: string; className?: string; children?: React.ReactNode }) => (
    // The cropped bitmap's own proportion, so the inset percentages stay true.
    <div className={cx("relative aspect-1723/1005 w-full", className)}>
        {/* The radius is tiny — a MacBook screen is nearly square-cornered — but
            not zero, so a hard corner cannot peek through the bezel's
            antialiased inner edge. */}
        <div className={cx("absolute overflow-hidden rounded-[0.5%/0.9%]", LAPTOP_SCREEN_INSET)}>{children ?? <ScreenPlaceholder label={label} />}</div>

        <img src="/device-mockups/macbook-air-13.png" alt="" className="pointer-events-none absolute inset-0 z-10 size-full object-contain select-none" />
    </div>
);

export const DeviceDuo = () => (
    <section id="devices" className="scroll-mt-20 border-t border-secondary py-20 md:py-28">
        <Container>
            <Eyebrow>Section 13</Eyebrow>
            <SectionHeading className="mt-4">Laptop and phone</SectionHeading>
            <p className="mt-5 max-w-[62ch] text-lg text-tertiary">One composite: the site on a laptop, the same funnel on a phone in front of it.</p>

            {/*
              The phone overlaps the laptop's lower corner. The wrapper's bottom
              padding reserves the space the phone hangs into, so nothing below
              collides with it.
            */}
            <div className="relative mt-14 pb-16 sm:pb-20 lg:pb-12">
                <LaptopFrame label="Website" className="lg:max-w-[76%]" />

                {/*
                  The phone OVERLAPS the laptop rather than sitting beside it —
                  from lg it starts at 62%, so roughly a third of it crosses the
                  lid. The 210px cap keeps the size ratio honest: a phone is
                  about a quarter of a 13" laptop's width. It sits right, not
                  left, below lg — on the left it stacked on the laptop's own
                  screen label. Relies on cx being tailwind-merge, so `absolute`
                  here beats the frame's own `relative`.
                */}
                <PhoneFrame
                    label="Booking"
                    className="absolute right-0 bottom-0 z-20 w-[34%] max-w-[180px] sm:w-[28%] lg:right-auto lg:left-[62%] lg:w-[22%] lg:max-w-[210px]"
                />
            </div>

            {/* Short tags in the mockups, full asset names in the caption. */}
            <p className="mt-2 text-sm text-tertiary">Team assets · Website — desktop capture (16:10) · Booking — mobile capture (9:19.5)</p>

            {/*
              THE BUTTON IS ALIGNED TO THE LAPTOP, not to the section: both are
              anchored to the same container edge, so the alignment reads at
              every width with no measured offset to drift.
            */}
            <div className="mt-4 flex justify-start">
                <PrimaryAction href="#devices">Apply to Work With Us</PrimaryAction>
            </div>
        </Container>
    </section>
);

/* -------------------------------------------------------------------------- */
/* Section 02 · Reels playing in the phones                                    */
/* -------------------------------------------------------------------------- */

/**
 * The phone row with the assets it was waiting for — real client reels that
 * drop into the same frames at the same widths with nothing re-measured.
 *
 * THE POSTERS ARE SHARED WITH /mockup-ig — same three stills, committed once in
 * public/mockup-ig/, referenced from both pages. The MP4s were not ported (one
 * is 20.8MB); a missing `<video src>` leaves the poster showing, which is what
 * the live source site ships too, since its .gitignore blocks the MP4s.
 *
 * THE CAPTIONS DESCRIBE THE FOOTAGE, and they are the text alternative for it:
 * silent video-only content needs one (WCAG 1.2.1), and a reduced-motion or
 * poster-only visitor reads them instead of watching.
 */
const reels = [
    {
        src: "/mockup-ig/reel-cabin-rose-turndown.mp4",
        poster: "/mockup-ig/reel-cabin-rose-turndown.jpg",
        caption: "Romantic turndown",
        description: "A-frame interior, rose petals and candlelight",
    },
    {
        src: "/mockup-ig/reel-barrel-sauna-riverside.mp4",
        poster: "/mockup-ig/reel-barrel-sauna-riverside.jpg",
        caption: "Riverside sauna",
        description: "Barrel sauna on the bank, late-morning sun",
    },
    {
        src: "/mockup-ig/reel-river-deer-autumn.mp4",
        poster: "/mockup-ig/reel-river-deer-autumn.jpg",
        caption: "Autumn river",
        description: "Deer on the slope, cabin exterior, peak colour",
    },
];

const Reel = ({ src, poster, caption, description }: (typeof reels)[number]) => (
    <figure className="flex w-[210px] shrink-0 snap-center flex-col items-center sm:w-[240px] lg:w-[268px]">
        <PhoneFrame label={caption} className="w-full">
            <ReelVideo src={src} poster={poster} />
        </PhoneFrame>

        <figcaption className="mt-6 text-center">
            <span className="block text-md font-semibold text-primary">{caption}</span>
            <span className="mt-1 block text-sm text-tertiary">{description}</span>
        </figcaption>
    </figure>
);

export const ReelRow = () => (
    <section id="reels" className="scroll-mt-20 border-t border-secondary py-20 md:py-28">
        <Container>
            <Eyebrow>Section 02</Eyebrow>
            <SectionHeading className="mt-4">Reels in the frames</SectionHeading>
            <p className="mt-5 max-w-[62ch] text-lg text-tertiary">
                The same three frames as the phone row, carrying real client footage. Each loop is muted and plays only while the section is on screen; with
                reduced motion turned on they hold a still frame instead.
            </p>
        </Container>

        <div className={PHONE_ROW}>
            {reels.map((reel) => (
                <Reel key={reel.src} {...reel} />
            ))}
        </div>
    </section>
);

/* -------------------------------------------------------------------------- */
/* Section 06 · Off-axis laptop                                                */
/* -------------------------------------------------------------------------- */

/**
 * The same MacBook as the flat composite, on a 3D stage instead of flat-on.
 *
 * THE TILT IS A LIVE TRANSFORM, NOT A BAKED IMAGE. Rotating the wrapper puts
 * the screen div and the bezel through one matrix, so the overlaid screen stays
 * registered to the cut-out at every angle.
 *
 * PERSPECTIVE GOES ON THE PARENT, THE ROTATION ON THE CHILD — one element
 * cannot do both, because `perspective` applies to an element's children.
 * 1400px on an ~840px laptop is a mild lens. The rotation origin stays centred;
 * pinned to the left edge, the near edge magnifies ~1.4× and pushes out of the
 * container. Nothing is edge-aligned to a tilted device, deliberately — a
 * perspective projection is not the element's box.
 *
 * FLATTENING ON HOVER is the house 100ms micro-transition, so there is nothing
 * to disable for reduced motion: no entrance, no loop.
 */
export const PerspectiveDevice = () => (
    <section id="perspective" className="scroll-mt-20 overflow-x-clip border-t border-secondary py-20 md:py-28">
        <Container>
            <Eyebrow>Section 06</Eyebrow>
            <SectionHeading className="mt-4">Off axis</SectionHeading>
            <p className="mt-5 max-w-[62ch] text-lg text-tertiary">One device, turned away from the camera. Hover it to bring it back square on.</p>

            <div className="group mt-16 perspective-[1400px] md:mt-20">
                <div className="-translate-x-[3.2%] rotate-x-3 -rotate-y-14 transition duration-100 ease-linear transform-3d group-hover:rotate-x-0 group-hover:rotate-y-0">
                    <LaptopFrame label="Website" className="mx-auto max-w-[88%] lg:max-w-[82%]">
                        <DesktopPage note={<AssetNote>Website</AssetNote>} />
                    </LaptopFrame>
                </div>
            </div>

            <p className="mt-10 text-sm text-tertiary">Team asset · Website — desktop capture (16:10)</p>
        </Container>
    </section>
);

/* -------------------------------------------------------------------------- */
/* Section 03 · A long page through a short window                             */
/* -------------------------------------------------------------------------- */

/**
 * A page two screens tall, clipped to one screen of it.
 *
 * THE PAGE IS BUILT FROM TOKENS, not drawn as an image and not an SVG data URI:
 * a data URI is a separate document and cannot read our CSS custom properties,
 * so the brand band below would have to be a hardcoded hex. Every block here is
 * a real element on a real token, which also means the whole page flips with
 * the theme for free.
 *
 * THE TRAVEL IS -50% OF THE PAGE, which is a full screen: the page is 200%
 * tall, so half its own height is exactly one window. 700ms is not the house
 * 100ms, so it carries a reduced-motion fallback: `motion-safe:` on the
 * transform itself, not just the transition, so reduced motion holds a still
 * window rather than jumping to the bottom with no travel.
 */
const TallPage = () => (
    <div className="h-[200%] w-full transition-transform duration-700 ease-out motion-safe:group-hover:-translate-y-[50%]">
        {/* Hero — the brand bar is the one brand element, as on the real page. */}
        <div className="flex h-[25%] flex-col justify-end gap-1.5 bg-linear-160 from-secondary via-primary to-secondary p-3">
            <span className="h-1.5 w-8 rounded-full bg-brand-solid" />
            <span className="h-2.5 w-[85%] rounded-sm bg-quaternary" />
            <span className="h-2.5 w-[60%] rounded-sm bg-quaternary" />
        </div>

        {/* The card grid that only exists below the fold. */}
        <div className="grid h-[35%] grid-cols-2 grid-rows-3 gap-2 bg-primary p-3">
            {[0, 1, 2, 3, 4, 5].map((card) => (
                <div key={card} className="flex flex-col gap-1.5 overflow-hidden rounded-md border border-secondary bg-secondary p-1.5">
                    <span className="flex-1 rounded-sm bg-quaternary" />
                    <span className="h-1 w-3/4 shrink-0 rounded-full bg-quaternary" />
                </div>
            ))}
        </div>

        <div className="flex h-[15%] flex-col justify-center gap-1.5 bg-primary px-3">
            <span className="h-1.5 w-full rounded-full bg-quaternary" />
            <span className="h-1.5 w-[90%] rounded-full bg-quaternary" />
            <span className="h-1.5 w-[70%] rounded-full bg-quaternary" />
        </div>

        <div className="flex h-[10%] items-center justify-center bg-brand-solid">
            <span className="h-2 w-1/3 rounded-full bg-primary/80" />
        </div>

        <div className="flex h-[15%] flex-col justify-center gap-1.5 bg-secondary p-3">
            <span className="h-1.5 w-1/3 rounded-full bg-quaternary" />
            <span className="h-1.5 w-1/4 rounded-full bg-quaternary" />
        </div>
    </div>
);

export const ScrollWindow = () => (
    <section id="scroll-window" className="scroll-mt-20 border-t border-secondary py-20 md:py-28">
        <Container>
            <Eyebrow>Section 03</Eyebrow>
            <SectionHeading className="mt-4">Through the window</SectionHeading>
            <p className="mt-5 max-w-[62ch] text-lg text-tertiary">
                A whole page behind a one-screen opening. It rests on the fold; hover the frame and it runs to the footer.
            </p>

            <div className="group mt-14 grid items-center gap-10 md:grid-cols-[240px_1fr] md:gap-14">
                <PhoneFrame label="Homepage" className="mx-auto w-[240px] md:mx-0">
                    <TallPage />
                    {/* Pinned to the screen, not to the page: it has to stay put
                        while the page it describes travels past it. */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center p-3">
                        <AssetNote>Team asset · Homepage</AssetNote>
                    </div>
                </PhoneFrame>

                <dl className="space-y-6">
                    {[
                        ["Window", "One screen of a two-screen page, so the frame shows a fold rather than a whole page shrunk to fit."],
                        ["Travel", "One screen of page, 700ms, easing out. Reduced motion keeps the still window instead."],
                        ["Why", "A cropped page reads as a page. A full page scaled into a phone reads as a diagram of one."],
                    ].map(([term, detail]) => (
                        <div key={term}>
                            <dt className="text-sm font-semibold tracking-[0.08em] text-brand-secondary uppercase">{term}</dt>
                            <dd className="mt-1.5 max-w-[46ch] text-md text-tertiary">{detail}</dd>
                        </div>
                    ))}
                </dl>
            </div>
        </Container>
    </section>
);

/* -------------------------------------------------------------------------- */
/* Section 11 · Browser chrome                                                 */
/* -------------------------------------------------------------------------- */

/**
 * No hardware at all — a browser window, drawn. Chrome is the one part of a
 * mockup with no fixed appearance: a screenshotted Safari window is dated the
 * moment Safari ships a redesign and carries somebody's bookmarks bar. Twelve
 * token-coloured divs track the theme, weigh nothing, and never age.
 *
 * THE CHROME IS DECORATIVE. The traffic lights are `aria-hidden` and the URL is
 * plain text, not a link — a mockup of a control is not a control.
 */
export const BrowserFrame = ({ url, label, children }: { url: string; label: string; children?: React.ReactNode }) => (
    <div className="overflow-hidden rounded-xl border border-secondary shadow-xl">
        <div className="flex items-center gap-2 border-b border-secondary bg-secondary px-3 py-2.5 md:gap-3 md:px-4">
            <span aria-hidden="true" className="hidden shrink-0 items-center gap-1.5 sm:flex">
                <span className="size-2.5 rounded-full bg-quaternary" />
                <span className="size-2.5 rounded-full bg-quaternary" />
                <span className="size-2.5 rounded-full bg-quaternary" />
            </span>

            <span aria-hidden="true" className="hidden shrink-0 items-center gap-1 text-fg-quaternary md:flex">
                <ChevronLeft className="size-4" />
                <ChevronRight className="size-4" />
                <RefreshCw01 className="size-3.5" />
            </span>

            <span className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md border border-secondary bg-primary px-2.5 py-1">
                <Lock01 aria-hidden="true" className="size-3 shrink-0 text-fg-quaternary" />
                <span className="truncate text-xs text-tertiary">{url}</span>
            </span>

            <Plus aria-hidden="true" className="hidden size-4 shrink-0 text-fg-quaternary sm:block" />
        </div>

        {/* 16:10 — a MacBook viewport. */}
        <div className="aspect-16/10 w-full overflow-hidden">{children ?? <DesktopPage note={<AssetNote>{label}</AssetNote>} />}</div>
    </div>
);

export const BrowserWindow = () => (
    <section id="browser" className="scroll-mt-20 border-t border-secondary py-20 md:py-28">
        <Container>
            <Eyebrow>Section 11</Eyebrow>
            <SectionHeading className="mt-4">Just the window</SectionHeading>
            <p className="mt-5 max-w-[62ch] text-lg text-tertiary">
                Chrome instead of hardware. Nothing raster in this one — frame and page are both divs on the same colour tokens as the section around them.
            </p>

            <div className="mt-14">
                <BrowserFrame url="hiddengem.media/case-studies" label="Website" />
            </div>

            <p className="mt-4 text-sm text-tertiary">Team asset · Website — desktop capture (16:10), the same shot the flat composite is waiting on</p>
        </Container>
    </section>
);

/* -------------------------------------------------------------------------- */
/* Section 09 · iPads standing on their reflection                             */
/* -------------------------------------------------------------------------- */

/**
 * iPad Pro 11" M4, both ways up, standing on a light surface. Bezels are the
 * shared library's — landscape 1578×1123, portrait the same bitmap rotated 90°
 * and resized to 569×800, so the two frames are one render and read as one
 * photograph of two devices. Insets from the manifest; the portrait numbers are
 * the exact transpose of landscape, which is a check on the rotation.
 *
 * ADAPTED: the source wrapped this section in its `cream-mode` light-island
 * class and the screens in `ink-mode` — theme classes this project deliberately
 * does not have (the whole app themes at once). The section sits on the page
 * canvas instead and follows the theme; everything else is unchanged.
 *
 * THE FLOOR IS THE DEVICE'S OWN SILHOUETTE, mirrored, at 25%, faded into the
 * canvas with a token gradient rather than a mask — a box-shadow would draw the
 * rectangle of the image, not the outline of the iPad. The contact shadow takes
 * its colour from `currentColor` via `text-primary`, because there is no
 * `bg-fg-*` utility and a hex is not an option.
 */
const IPAD_LANDSCAPE_INSET = "left-[3.612%] top-[5.076%] h-[90.027%] w-[92.902%]";
const IPAD_PORTRAIT_INSET = "left-[4.921%] top-[3.625%] h-[92.875%] w-[89.982%]";

const IPadFrame = ({ label, orientation, className }: { label: string; orientation: "landscape" | "portrait"; className?: string }) => {
    const landscape = orientation === "landscape";
    const src = landscape ? "/device-mockups/ipad-pro-11-silver-landscape.png" : "/device-mockups/ipad-pro-11-silver-portrait.png";

    return (
        // The cropped bitmap's own proportion, so the inset percentages stay true.
        <div className={cx("relative", landscape ? "aspect-1578/1123" : "aspect-569/800", className)}>
            {/* 1.2% of the screen's width is ~14px on the 1466px panel, which is
                the real corner radius; the two numbers swap with orientation. */}
            <div
                className={cx(
                    "absolute overflow-hidden bg-linear-160 from-secondary via-primary to-secondary",
                    landscape ? `${IPAD_LANDSCAPE_INSET} rounded-[1.2%/1.7%]` : `${IPAD_PORTRAIT_INSET} rounded-[1.7%/1.2%]`,
                )}
            >
                <ScreenPlaceholder label={label} />
            </div>

            <img src={src} alt="" className="pointer-events-none absolute inset-0 z-10 size-full object-contain select-none" />

            {/* Contact shadow, then reflection. 30% of the device height, so the
                section only has to reserve that much below it. */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-[8%] bottom-0 h-[3%] rounded-[100%] bg-current text-primary opacity-15 blur-md"
            />

            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-full h-[30%] overflow-hidden opacity-25">
                {/* 333% of a 30% box is 100% of the device, so the mirrored copy
                    keeps the frame's proportions and the box does the cropping. */}
                <div className="absolute inset-x-0 top-0 h-[333%]">
                    <img src={src} alt="" className="absolute inset-0 size-full -scale-y-100 object-contain" />
                </div>
                <div className="absolute inset-0 bg-linear-to-b from-transparent to-primary" />
            </div>
        </div>
    );
};

export const TabletPair = () => (
    <section id="tablets" className="scroll-mt-20 border-t border-secondary bg-primary py-20 md:py-28">
        <Container>
            <Eyebrow>Section 09</Eyebrow>
            <SectionHeading className="mt-4">Both ways up</SectionHeading>
            <p className="mt-5 max-w-[62ch] text-lg text-tertiary">
                The tablet turned both ways and standing on its own reflection. The reflection is the bezel itself, mirrored and faded into the canvas, so it
                follows the theme like everything else here.
            </p>

            {/*
              The reflections are absolutely positioned below each frame, so the
              space they need is reserved here: 30% of the taller device. Stacked,
              the column gap has to clear the landscape iPad's reflection as well,
              which is why it is larger than the row gap.
            */}
            <div className="mt-14 flex flex-col items-center gap-20 pb-20 sm:flex-row sm:items-end sm:justify-center sm:gap-8 sm:pb-24 lg:pb-36">
                <IPadFrame label="Guidebook" orientation="landscape" className="w-full max-w-[420px] sm:w-[58%] sm:max-w-[660px]" />
                <IPadFrame label="In-room" orientation="portrait" className="w-[62%] max-w-[240px] sm:w-[26%] sm:max-w-[300px]" />
            </div>

            <p className="mt-2 text-sm text-tertiary">Team assets · Guidebook — tablet capture (1.45:1) · In-room — tablet capture (0.69:1)</p>
        </Container>
    </section>
);

/* -------------------------------------------------------------------------- */
/* Section 04 · Fanned phones                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The reel row's three reels, fanned instead of lined up.
 *
 * THE OVERLAP IS THE POINT. Three phones in a row are three objects; three
 * phones sharing edges at three angles are one held deck, which is what a reel
 * package actually is. Negative `space-x` does the overlapping, `origin-bottom`
 * puts the rotation pivot at the base so the fan opens upward like cards, and
 * the centre frame is a step wider and above the others so the eye lands there.
 *
 * WIDTHS ARE FIXED PER BREAKPOINT AND MEASURED: at 360 the fan's bounding box
 * comes to ~298 against 320 of usable width. The section clips on the x axis
 * anyway, so a fan corner can leave the container without the body ever gaining
 * a scrollbar.
 */
const fan = [
    { reel: reels[0], className: "w-[104px] -rotate-6 sm:w-[140px] lg:w-[184px]" },
    { reel: reels[1], className: "z-10 w-[116px] sm:w-[156px] lg:w-[206px]" },
    { reel: reels[2], className: "w-[104px] rotate-6 sm:w-[140px] lg:w-[184px]" },
];

export const PhoneFan = () => (
    <section id="fan" className="scroll-mt-20 overflow-x-clip border-t border-secondary py-20 md:py-28">
        <Container>
            <Eyebrow>Section 04</Eyebrow>
            <SectionHeading className="mt-4">Held as a deck</SectionHeading>
            <p className="mt-5 max-w-[62ch] text-lg text-tertiary">
                The same three reels as the reel row, overlapped and angled so the set reads as one deliverable rather than three files.
            </p>

            <div className="mt-16 flex origin-bottom items-end justify-center -space-x-6 pb-6 sm:-space-x-8 lg:-space-x-10">
                {fan.map(({ reel, className }) => (
                    <PhoneFrame key={reel.src} label={reel.caption} className={cx("shrink-0 origin-bottom", className)}>
                        <ReelVideo src={reel.src} poster={reel.poster} />
                    </PhoneFrame>
                ))}
            </div>

            {/* The names live here, not in the frames: at 360 the outer phones
                are 104px wide and two thirds covered. */}
            <p className="mt-8 text-center text-sm text-tertiary">{reels.map((reel) => reel.caption).join(" · ")}</p>
        </Container>
    </section>
);

/* -------------------------------------------------------------------------- */
/* Section 07 · Off the edge                                                   */
/* -------------------------------------------------------------------------- */

/**
 * One device at hero scale, running off the side of the page. A cropped device
 * reads as bigger than the page, which a device with air around it never does.
 *
 * FROM lg THE BLEED IS TIED TO THE VIEWPORT, NOT TO THE COLUMN — the container
 * is capped at 1152px, so past that width a percentage margin stops growing
 * while the viewport keeps going. `mr-[calc(27rem-50vw)]` was solved against
 * the source site's un-railed layout; this page pads 224px for the contents
 * rail from xl, which shifts the container left and makes the overhang larger
 * than the source's 120px. Deliberately left alone: the section's claim is
 * "runs off the edge", the overhang is clipped by `overflow-x-clip` either way,
 * and the body never gains a scrollbar.
 *
 * `overflow-x-clip` ON THE SECTION IS LOAD-BEARING. `clip` rather than `hidden`
 * because `hidden` makes the section a scroll container on both axes.
 */
export const HeroBleed = () => (
    <section id="hero-bleed" className="scroll-mt-20 overflow-x-clip border-t border-secondary py-20 md:py-28">
        <Container>
            <div className="lg:grid lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-center lg:gap-12">
                <div>
                    <Eyebrow>Section 07</Eyebrow>
                    <SectionHeading className="mt-4">Off the edge</SectionHeading>
                    <p className="mt-5 max-w-[46ch] text-lg text-tertiary">
                        Hero scale, cropped by the page. The screen keeps going past the edge, so the frame reads as the subject rather than as an illustration
                        of one.
                    </p>
                    <PrimaryAction href="#hero-bleed" className="mt-8">
                        Apply to Work With Us
                    </PrimaryAction>
                </div>

                <div className="mt-14 -mr-[22%] lg:mt-0 lg:mr-[calc(27rem-50vw)]">
                    <LaptopFrame label="Website">
                        <DesktopPage note={<AssetNote>Website</AssetNote>} />
                    </LaptopFrame>
                </div>
            </div>
        </Container>
    </section>
);

/* -------------------------------------------------------------------------- */
/* Section 05 · Held in a hand                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The same bezel as every other section, this time inside a photograph. See the
 * hand-plate block in this file's header for provenance and geometry.
 *
 * THE Z-ORDER IS THREE VALUES THAT ONLY MEAN ANYTHING AGAINST EACH OTHER. The
 * back plate is in flow and unpositioned, so painting order puts it under every
 * positioned sibling; PhoneFrame's own bezel is z-10; the front plate is z-20
 * and lands on top of the bezel. That works WITHOUT TOUCHING PhoneFrame because
 * its root carries no z-index, so it is not a stacking context and the bezel's
 * z-10 is reachable from out here. `isolate` keeps all three inside this
 * wrapper rather than loose in the page's stacking context.
 *
 * THE BACK PLATE IS INTRINSIC — its own width and height give the layer stack
 * its box, so there is no aspect class to re-measure when the plate changes.
 * The front plate is simply `inset-0`, because both plates share one canvas.
 *
 * THE DROP-SHADOW IS THE CONTACT SHADOW, and it costs no third asset: a CSS
 * drop-shadow is cast from the element's own alpha, and the front plate sits
 * above the bezel, so the thumb throws a soft shadow onto the rail and onto the
 * video. Down and to the left, because the key light is upper right. Without it
 * the fingers read as laid on top rather than wrapped around.
 *
 * IT SHRINKS ON MOBILE, IT DOES NOT CROP: nothing can reflow inside a
 * photograph, and a grip has to be seen whole to read as a grip.
 */
const HAND_PHONE_INSET = "left-[12.968%] top-0 w-[62.484%]";

export const HandHeld = () => {
    // The reel the model actually saw behind the glass when it lit the fingers,
    // so the screen spill on the skin belongs to this footage. Also the
    // brightest of the three.
    const reel = reels[2];

    return (
        <section id="in-hand" className="scroll-mt-20 border-t border-secondary py-20 md:py-28">
            <Container>
                <Eyebrow>Section 05</Eyebrow>
                <SectionHeading className="mt-4">Held in a hand</SectionHeading>
                <p className="mt-5 max-w-[62ch] text-lg text-tertiary">
                    A photograph with our own bezel dropped into it. The thumb and fingertips are a second cut-out that crosses back over the frame, so the
                    phone is held rather than pasted on.
                </p>

                {/*
                  The width cap is on the figure and the layer stack is its own
                  box: the phone's `top` is a percentage of its containing
                  block's HEIGHT, so a caption sharing the box would push the
                  phone down by 8% of the caption's height.
                */}
                <figure className="mx-auto mt-14 w-full max-w-[520px]">
                    <div className="relative isolate">
                        <img
                            src="/mockup/iphone-17-pro-in-hand-back.webp"
                            alt=""
                            width={1120}
                            height={1714}
                            className="pointer-events-none h-auto w-full select-none"
                        />

                        {/* No z-index here on purpose — see the note above. */}
                        <PhoneFrame label={reel.caption} className={`absolute ${HAND_PHONE_INSET}`}>
                            <ReelVideo src={reel.src} poster={reel.poster} />
                        </PhoneFrame>

                        <img
                            src="/mockup/iphone-17-pro-in-hand-front.webp"
                            alt=""
                            className="pointer-events-none absolute inset-0 z-20 size-full [filter:drop-shadow(-2px_4px_6px_rgb(0_0_0/0.55))] select-none"
                        />
                    </div>

                    {/* Taken from the reel data rather than retyped: the WCAG
                        1.2.1 text alternative for the same silent file the reel
                        row already describes, so the two cannot drift apart. */}
                    <figcaption className="mt-8 text-center text-sm text-tertiary">
                        {reel.caption} — {reel.description}
                    </figcaption>
                </figure>
            </Container>
        </section>
    );
};

/* -------------------------------------------------------------------------- */
/* Page chrome                                                                 */
/* -------------------------------------------------------------------------- */

const SECTIONS = [
    { n: "01", id: "phones", title: "Three phones", kind: "Phone" },
    { n: "02", id: "reels", title: "Reels in the frames", kind: "Phone" },
    { n: "03", id: "scroll-window", title: "Through the window", kind: "Phone" },
    { n: "04", id: "fan", title: "Held as a deck", kind: "Phone" },
    { n: "05", id: "in-hand", title: "Held in a hand", kind: "Phone" },
    { n: "06", id: "perspective", title: "Off axis", kind: "Laptop" },
    { n: "07", id: "hero-bleed", title: "Off the edge", kind: "Laptop" },
    { n: "08", id: "both-canvases", title: "Both canvases", kind: "Laptop" },
    { n: "09", id: "tablets", title: "Both ways up", kind: "Tablet" },
    { n: "10", id: "imac", title: "On a pedestal", kind: "Desktop" },
    { n: "11", id: "browser", title: "Just the window", kind: "Browser" },
    { n: "12", id: "fold", title: "Above and below the fold", kind: "Browser" },
    { n: "13", id: "devices", title: "Laptop and phone", kind: "Composite" },
    { n: "14", id: "every-width", title: "Every width at once", kind: "Composite" },
    { n: "15", id: "line-up", title: "Desk, lap, pocket", kind: "Composite" },
];

const RAIL_ICONS: Record<string, RailIcon> = {
    Phone: "phone",
    Laptop: "laptop",
    Browser: "browser",
    Tablet: "tablet",
    Desktop: "monitor",
    Composite: "layers",
};

/**
 * A KPI tile, trimmed from the source's `StatCard` to the two variants this row
 * actually uses — the full component carries a sparkline and a trend arrow that
 * no caller here passes.
 */
const StatCard = ({ label, value, caption, tone = "neutral" }: { label: string; value: string; caption: string; tone?: "neutral" | "brand" }) => (
    <div className={cx("flex flex-col rounded-2xl p-5", tone === "brand" ? "bg-brand-solid" : "border border-secondary bg-secondary")}>
        <p className={cx("text-sm font-medium", tone === "brand" ? "text-primary_on-brand/70" : "text-tertiary")}>{label}</p>
        <p className={cx("mt-2 text-display-sm font-semibold tracking-tight", tone === "brand" ? "text-primary_on-brand" : "text-primary")}>{value}</p>
        <p className={cx("mt-1 text-sm", tone === "brand" ? "text-primary_on-brand/70" : "text-quaternary")}>{caption}</p>
    </div>
);

/**
 * The stat row. Numbers are real and checkable rather than decorative: fifteen
 * sections is `SECTIONS.length`, five bezels is what this page renders, and
 * 704KB is their total on disk in public/device-mockups — the number that
 * matters, because the repo carries it forever.
 */
const StatRow = () => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Treatments" value={String(SECTIONS.length)} caption="Ways to put a screen in front of someone" tone="brand" />
        <StatCard label="Device bezels" value="5" caption="iPhone, MacBook, iPad ×2, iMac" />
        <StatCard label="Bezel weight" value="704KB" caption="All five, committed, as served" />
        <StatCard label="Widest screen" value="820px" caption="The iMac at desktop — 1614px of source" />
    </div>
);

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export const MockupScreen = () => (
    // The padding clears the fixed contents rail from xl, same as /mockup-ig.
    <main className="min-h-dvh bg-primary xl:pl-56">
        <ContentsRail
            label="Mockups"
            title="Mockups"
            icons={RAIL_ICONS}
            items={SECTIONS.map((s) => ({ id: s.id, name: s.title, family: s.kind, number: s.n }))}
        />

        <div className="border-b border-secondary bg-secondary py-10">
            <Container>
                <p className="font-mono text-xs tracking-[0.14em] text-quaternary uppercase">Mockups</p>
                <h1 className="mt-2 text-display-xs font-semibold text-primary">Devices and frames</h1>
                <p className="mt-3 max-w-[62ch] text-md text-tertiary">
                    Fifteen ways to put a screen in front of someone — phones, laptops, tablets, a desktop, browser chrome and one held in a hand, every bezel a
                    real device export rather than a drawing. Ported from the HiddenGem marketing site. Not linked, not indexed.
                </p>

                <div className="mt-8">
                    <StatRow />
                </div>
            </Container>
        </div>

        <div>
            <PhoneRow />
            <ReelRow />
            <ScrollWindow />
            <PhoneFan />
            <HandHeld />
            <PerspectiveDevice />
            <HeroBleed />
            <BothCanvases />
            <TabletPair />
            <DesktopDesk />
            <BrowserWindow />
            <FoldWindow />
            <DeviceDuo />
            <EveryWidth />
            <DeskLapPocket />
        </div>
    </main>
);
