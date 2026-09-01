import { ChevronRight, Home01, SearchLg, Send02 } from "@untitledui-pro/icons/line";
import { Home01 as Home01Solid, SearchLg as SearchLgSolid } from "@untitledui-pro/icons/solid";
import { VerifiedTick } from "@/components/base/avatar/base-components/verified-tick";
import { cx } from "@/utils/cx";
import type { IgPerson } from "./instagram-data";

/**
 * IG CHROME — the stage every Instagram surface sits on, plus the pieces all
 * three screens share.
 *
 * ------------------------------------------------------------------------
 * 402 × 874, AND THE NUMBER IS NOT ARBITRARY
 * ------------------------------------------------------------------------
 * iPhone 17 Pro logical points, chosen because that is the bezel this project
 * ships. This repo's `iphone-17-pro-silver.png` crop (626 × 1290, from the
 * shared bezel library) has a measured screen inset of 91.374% wide by 96.279%
 * tall — an aspect of 0.46054. Against that: 402/874 = 0.45995, off by 0.13%. The Figma these screens were read from is
 * iPhone 14/15 (393 × 850.49 = 0.46209), off by 0.50% — half a percent of
 * permanent mismatch inside every frame, showing up as a gap under the tab bar
 * or a crop into it. The Figma's band heights are proportions, so they carried
 * over at ×1.0276.
 *
 * ------------------------------------------------------------------------
 * EVERYTHING IS AUTHORED AT 1:1 AND SCALED BY A MATRIX
 * ------------------------------------------------------------------------
 * Real Instagram type is 13px. A phone frame in this repo renders a 192–298px
 * screen, so a 402pt surface inside one is scaled to 0.48–0.74 and that 13px
 * lands at 6–10px. The project's smallest defined size is 12px and the smallest
 * it has ever shipped is 10px, so authoring at screen scale would mean clamping
 * — and a clamped 10px renders 26% too large, which is worse than small.
 *
 * So: author at 1:1, with the real 13px, and let `IgScreen` scale the stage.
 * Nothing here declares a font-size below 11px. Measured in Chrome: at container
 * widths of 192.4 / 245.5 / 320 / 402.14 the factor comes out 0.4786 / 0.6107 /
 * 0.7960 / 1.0003 and every rendered box is exactly proportional, because a
 * transform is one matrix over a layout computed once. `zoom` re-rounds paddings
 * and font metrics at the used size and drifts.
 *
 * THE LEGIBILITY ANSWER IS PRESENTATION, NOT CSS. No mechanism makes 13px
 * readable at 0.61×. But `PhoneFrame` takes a className, and `w-[440px]` gives a
 * 402.05px screen — scale 1.0001. A 440px phone shows this at true 1:1 inside a
 * real bezel, which is why that is the page's first section and the shrunken
 * frames are the later ones.
 *
 * ------------------------------------------------------------------------
 * IT IS A PICTURE, NOT A UI
 * ------------------------------------------------------------------------
 * Every `IgScreen` is `role="img"` with an `aria-label`, so assistive tech gets
 * one description instead of walking a fake interface where nothing is operable.
 * Two rules follow and both matter: every Instagram "button" here is a `span`,
 * never a `<button>`, and nothing is focusable. That is also what makes
 * Instagram's own `--ig-text-tertiary` defensible — #737373 on #000 is 4.43:1 and
 * fails AA for body text, which is Instagram's problem in Instagram's app but
 * ours the moment we call it text. The real handle, stats and bio are repeated in
 * the page prose beside each frame, in our tokens, at full size.
 *
 * Colours come from `.ig-surface` in src/styles/instagram.css. Nothing in this
 * folder may use an HGM semantic token — see the greps in instagram-screen.tsx.
 */

/** iPhone 17 Pro logical points. Coupled to iphone-17-pro-silver.png; see above. */
export const IG_SCREEN = { w: 402, h: 874 } as const;

/* -------------------------------------------------------------------------- */
/* 1 · IgScreen — the stage                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Four classes are load-bearing and none is optional:
 *
 * `@container`      so `100cqw` resolves against this wrapper's width. The repo
 *                   already relies on this idiom (animation-parts.tsx:75-90).
 * `aspect-402/874`  reserves the box, because a transform does not affect layout.
 *                   Measured within 0.01px of `w × 874/402` at every width.
 * `max-w-[402px]`   or the factor goes ABOVE 1 and the UI is magnified — a 720px
 *                   container measured 1.79×. 1:1 is the ceiling, never a floor.
 * `origin-top-left` the default 50% 50% origin leaves the stage floating in the
 *                   middle of a box it no longer fills.
 */
export const IgScreen = ({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) => (
    <div
        data-ig-fit
        role="img"
        aria-label={label}
        className={cx(
            "ig-surface @container aspect-402/874 w-full max-w-[402px] overflow-hidden bg-(--ig-canvas)",
            "font-[system-ui,-apple-system,'Segoe_UI',sans-serif] text-(--ig-text) antialiased",
            className,
        )}
    >
        <div data-ig-screen className="h-[874px] w-[402px] origin-top-left [transform:scale(calc(100cqw/402px))]">
            {children}
        </div>
    </div>
);

/* -------------------------------------------------------------------------- */
/* 2 · IgStatusBar                                                             */
/* -------------------------------------------------------------------------- */

/**
 * NO DYNAMIC ISLAND HERE, DELIBERATELY. `iphone-17-pro-silver.png` draws the
 * island itself — it is opaque in the bitmap, sitting over the screen aperture —
 * so drawing a second one would double it a few pixels out of register. The
 * centre is left empty and the bezel fills it. Standalone (no bezel) the top
 * centre is plain black, which is the one place this surface is not a pixel match
 * for a real screenshot.
 */
export const IgStatusBar = ({ time = "9:41" }: { time?: string }) => (
    <div className="flex h-12 shrink-0 items-center justify-between px-7 pt-1.5 text-[15px] font-semibold">
        <span>{time}</span>

        <span aria-hidden="true" className="flex items-center gap-1.5">
            {/* Signal — four ascending bars, all full opacity as iOS draws them. */}
            <span className="flex items-end gap-[2px]">
                {[4, 6, 8, 10].map((height) => (
                    <span key={height} className="w-[3px] rounded-[1px] bg-(--ig-text)" style={{ height }} />
                ))}
            </span>

            {/* Wi-Fi — drawn rather than imported so the stroke matches iOS
                instead of the icon package's heavier 2px default. */}
            <svg viewBox="0 0 16 12" className="h-[11px] w-[15px]" fill="none" aria-hidden="true">
                <path d="M1 4.2a10.5 10.5 0 0 1 14 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                <path d="M3.6 7a7 7 0 0 1 8.8 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                <path d="M6.2 9.7a3.2 3.2 0 0 1 3.6 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>

            {/* Battery — shell, fill, nub. */}
            <span className="relative flex h-[12px] w-[25px] items-center rounded-[4px] border border-(--ig-text)/40 px-[2px]">
                <span className="h-[7px] w-[16px] rounded-[2px] bg-(--ig-text)" />
                <span className="absolute -right-[3px] h-[4px] w-[2px] rounded-r-[1px] bg-(--ig-text)/40" />
            </span>
        </span>
    </div>
);

/* -------------------------------------------------------------------------- */
/* 3 · ReelsGlyph                                                              */
/* -------------------------------------------------------------------------- */

/**
 * The icon package has no Reels glyph in any of its four styles. `PlaySquare` is
 * the nearest and reads as a play button; `Clapperboard` reads as a movie
 * clapper. Neither says Reels.
 *
 * DRAWN, NOT COPIED. This is our construction on Instagram's geometry — a rounded
 * frame, a rule across the upper third, two diagonals descending onto that rule
 * (the perforation cue that separates it from a play button), and a centred
 * triangle — in round numbers rather than Meta's exact path data. The shape is
 * what carries the meaning; their SVG is their asset.
 *
 * strokeWidth 1.7 because the icon package's line style defaults to 2, which is
 * visibly heavier than iOS.
 */
export const ReelsGlyph = ({ active, className }: { active?: boolean; className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={cx("size-6", className)}>
        <rect
            x="2"
            y="2"
            width="20"
            height="20"
            rx="6.5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
            fill={active ? "currentColor" : "none"}
        />
        <g
            stroke={active ? "var(--ig-canvas)" : "currentColor"}
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={active ? "var(--ig-canvas)" : "none"}
        >
            <path d="M2.4 7.5h19.2" />
            <path d="M7.2 2.1 10 7.5" />
            <path d="M13.5 2.1 16.3 7.5" />
            <path d="M10.3 11.6v6.3l5.4-3.15z" />
        </g>
    </svg>
);

/* -------------------------------------------------------------------------- */
/* 4 · IgAvatar                                                                */
/* -------------------------------------------------------------------------- */

/**
 * THE STORY RING IS A WRAPPER, NOT A PROP, and that is why this is not the
 * project's `Avatar`. Four independent reasons, any one sufficient: `Avatar` is
 * `"use client"` for an image-error fallback a static mockup never triggers; its
 * size scale stops at 64px and the profile avatar is 86px; its internals are HGM
 * semantic tokens (`bg-tertiary`, `ring-secondary_alt`), which is exactly the
 * inward colour leak this folder's grep exists to catch; and its badge chain is a
 * strict if-else, so a ring and a verified tick could never both render anyway.
 *
 * The ring is a gradient ring around a canvas gap around the image — three nested
 * boxes, which is how Instagram draws it.
 */
export const IgAvatar = ({ src, alt, size, ring, className }: { src?: string; alt: string; size: number; ring?: "unseen" | "seen"; className?: string }) => (
    <span
        data-ig-ring={ring ? "" : undefined}
        className={cx("relative inline-flex shrink-0 items-center justify-center rounded-full", className)}
        style={{
            width: size,
            height: size,
            padding: ring ? 2 : 0,
            background: ring === "unseen" ? "var(--ig-story-ring)" : ring === "seen" ? "var(--ig-story-seen)" : undefined,
        }}
    >
        <span className="flex size-full items-center justify-center overflow-hidden rounded-full bg-(--ig-canvas)" style={{ padding: ring ? 2 : 0 }}>
            {src ? (
                <img src={src} alt={alt} width={size * 2} height={size * 2} className="size-full rounded-full object-cover" />
            ) : (
                // No avatar supplied — Instagram's own grey silhouette stand-in.
                <span className="flex size-full items-center justify-center rounded-full bg-(--ig-elevated)">
                    <svg viewBox="0 0 24 24" className="size-[58%] text-(--ig-text-tertiary)" fill="currentColor" aria-hidden="true">
                        <circle cx="12" cy="8.5" r="4" />
                        <path d="M3.5 22a8.5 8.5 0 0 1 17 0z" />
                    </svg>
                </span>
            )}
        </span>
    </span>
);

/* -------------------------------------------------------------------------- */
/* 5 · IgHandle                                                                */
/* -------------------------------------------------------------------------- */

/**
 * REUSES THE PROJECT'S `VerifiedTick`, which is already Instagram's badge — a
 * twelve-lobed scalloped seal with a knocked-out check. It ships as
 * `size-2.5 text-utility-blue-500`; `cx` is tailwind-merge, so passing a size and
 * a colour here overrides both. One `"use client"` leaf module is a smaller cost
 * than a second copy of that path data.
 */
export const IgHandle = ({
    handle,
    verified,
    className,
    tickClassName,
}: {
    handle: string;
    verified?: boolean;
    className?: string;
    tickClassName?: string;
}) => (
    <span data-ig-handle className={cx("inline-flex min-w-0 items-center gap-1", className)}>
        <span className="truncate">{handle}</span>
        {/* `size` is required by the component but its class is emitted BEFORE
            className, so tailwind-merge lets the exact 13px below win. Passing
            "xs" is satisfying the type, not choosing a size. */}
        {verified && <VerifiedTick size="xs" className={cx("size-[13px] shrink-0 text-(--ig-verified)", tickClassName)} />}
    </span>
);

/* -------------------------------------------------------------------------- */
/* 6 · IgFacepile                                                              */
/* -------------------------------------------------------------------------- */

/**
 * `AvatarStack` in src/components/hgm/ does almost this, but it rings each avatar
 * in `ring-bg-primary` and puts a `bg-tertiary` "+N" chip on the end — HGM tokens
 * inside the Instagram surface, and a chip Instagram's "Followed by" row does not
 * have. Six lines is cheaper than fighting it.
 */
export const IgFacepile = ({ people, size = 19 }: { people: IgPerson[]; size?: number }) => (
    <span aria-hidden="true" className="flex shrink-0 items-center">
        {people.map((person, index) => (
            <span key={person.name} className="rounded-full ring-2 ring-(--ig-canvas)" style={{ marginLeft: index ? -6 : 0 }}>
                <IgAvatar src={person.src} alt="" size={size} />
            </span>
        ))}
    </span>
);

/* -------------------------------------------------------------------------- */
/* 7 · IgTilePlaceholder                                                       */
/* -------------------------------------------------------------------------- */

/**
 * A grid still the team owes. Deliberately NOT a generated image and not a
 * gradient pretending to be a photo — an empty Instagram tile is a real state, and
 * the AssetNote under the frame is the shot list. See CLAUDE.md's owed-asset rule.
 */
export const IgTilePlaceholder = ({ kind = "photo" }: { kind?: "photo" | "reel" | "carousel" }) => (
    <span className="flex size-full items-center justify-center bg-(--ig-elevated)">
        <svg viewBox="0 0 24 24" className="size-7 text-(--ig-text)/15" fill="none" aria-hidden="true">
            {kind === "reel" ? (
                <path d="M9 7.5v9l7.5-4.5z" fill="currentColor" />
            ) : (
                <>
                    <rect x="3" y="4.5" width="18" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
                    <circle cx="8.5" cy="10" r="1.6" fill="currentColor" />
                    <path d="m4 17 5-4.5 4.5 4 3-2.5 4.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                </>
            )}
        </svg>
    </span>
);

/* -------------------------------------------------------------------------- */
/* 8 · IgTabBar — the footer                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Instagram's bottom five, and the order is READ OFF A REFERENCE rather than
 * recalled: home, reels, messages, search, profile. The ad screenshots on the
 * Figma's "Instagram Ad Style 1" page capture the tab bar in full, and they put the
 * paper-plane in the middle slot — Instagram moved DMs into the tab bar and dropped
 * the centre plus. Built from memory this row had home / search / plus / reels /
 * profile, which is the older layout. That is the value of a reference.
 *
 * The active tab is the filled variant of the same glyph, free from `/solid` — no
 * second asset, no opacity trick.
 *
 * The reference draws the profile tab as an outlined person-circle; this keeps the
 * account avatar instead, because on a signed-in account that is what Instagram
 * shows and it is the more useful thing in a client mockup.
 */
export const IgTabBar = ({ active, avatar }: { active: "home" | "reels" | "messages" | "search" | "profile"; avatar: string }) => (
    <div className="flex h-[68px] shrink-0 items-start justify-around border-t border-(--ig-separator) px-3 pt-3">
        {active === "home" ? (
            <Home01Solid aria-hidden="true" className="size-[26px]" />
        ) : (
            <Home01 aria-hidden="true" className="size-[26px]" strokeWidth={1.7} />
        )}
        {/* `ReelsGlyph`, not `PlaySquare`. This was the icon package's play
            button with `fill-(--ig-text)` applied when active — and `fill` on a
            LINE icon fills the outer square too, so the active reels tab
            rendered as a solid white block with no glyph left inside it. The
            drawn glyph above already solves both halves: its `active` state
            fills the frame and knocks the perforations and triangle back out in
            canvas colour, and it reads as Reels rather than as a generic play
            button. It was written for this and simply was not wired in here.
            Affects the two `active="reels"` callers, ig-reel and ig-ads. */}
        <ReelsGlyph active={active === "reels"} className="size-[26px]" />
        <Send02 aria-hidden="true" className="size-[26px] -rotate-12" strokeWidth={1.7} />
        {active === "search" ? (
            <SearchLgSolid aria-hidden="true" className="size-[26px]" />
        ) : (
            <SearchLg aria-hidden="true" className="size-[26px]" strokeWidth={1.7} />
        )}
        <span className={cx("flex size-[26px] items-center justify-center rounded-full", active === "profile" && "ring-2 ring-(--ig-text)")}>
            <IgAvatar src={avatar} alt="" size={24} />
        </span>
    </div>
);

/* -------------------------------------------------------------------------- */
/* 9 · IgCtaBar — the paid call to action                                      */
/* -------------------------------------------------------------------------- */

/**
 * THE TINT IS NOT A TOKEN, and that is the whole point of it. Instagram samples a
 * desaturated colour out of the creative for this bar rather than using a fixed
 * grey or blue — measured #728598 on the reference ad, flat across the full width.
 * So the colour travels with the ad in `IgAd.ctaTint`, not with the palette, and it
 * is the one inline style in this folder.
 *
 * Full width, bold label left, chevron right, sitting directly under the media with
 * no gap. That bar is what separates a paid post from an organic one at a glance,
 * and it is the detail a mockup built from memory always misses.
 */
export const IgCtaBar = ({ label, tint }: { label: string; tint: string }) => (
    <div className="flex h-[44px] shrink-0 items-center justify-between px-3.5 text-[15px] font-semibold" style={{ backgroundColor: tint }}>
        <span className="truncate">{label}</span>
        <ChevronRight aria-hidden="true" className="size-[20px] shrink-0" strokeWidth={2.4} />
    </div>
);

/* -------------------------------------------------------------------------- */
/* 10 · IgStoryProgress                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Segmented bars, one per frame, the current one part-filled. A single-frame ad
 * still gets the track — Instagram always draws it, and it is part of what makes a
 * story read as a story rather than as a full-screen image.
 *
 * IT LIVES HERE BECAUSE IT IS SHARED, and it did not used to be. This was declared
 * privately inside ig-ads.tsx while the organic story in ig-proof.tsx hand-rolled a
 * second copy, and the two drifted: the ad's carried `pt-1.5`, the organic one
 * carried nothing, so on the organic story the bars sat welded to the bottom edge of
 * the status bar with 0px between them. Measured at 1:1 before the fix — track top
 * y=48 against the ad's y=54, header y=50.5 against y=56.5. Two sibling surfaces
 * disagreeing about the top of a phone, which is the same class of bug the organic
 * story's own footer comment records about the BOTTOM of a phone.
 *
 * `pt-1.5` IS THE PADDING AND IT IS NOT DECORATIVE. The status bar is a system row;
 * a track flush against it reads as part of the clock rather than as the story's own
 * chrome. 6px is what the ad already used, so this adopts it rather than inventing a
 * third value.
 */
export const IgStoryProgress = ({ frames = 1, current = 0, progress = 0.4 }: { frames?: number; current?: number; progress?: number }) => (
    <div aria-hidden="true" className="flex shrink-0 items-center gap-1 px-2 pt-1.5">
        {Array.from({ length: frames }, (_, index) => (
            <span key={index} className="h-[2.5px] flex-1 overflow-hidden rounded-full bg-(--ig-text)/30">
                <span
                    className="block h-full rounded-full bg-(--ig-text)"
                    style={{ width: index < current ? "100%" : index === current ? `${progress * 100}%` : "0%" }}
                />
            </span>
        ))}
    </div>
);
