import { Bookmark, Heart, Home01, MessageCircle01, UserSquare } from "@untitledui-pro/icons/line";
import { Heart as HeartSolid, Home01 as Home01Solid } from "@untitledui-pro/icons/solid";
import { IG_SCREEN, IgAvatar, IgHandle, IgStoryProgress, IgTilePlaceholder, ReelsGlyph } from "./ig-chrome";

/**
 * IG SYSTEM — the atoms, pulled out of the surfaces and shown on their own.
 *
 * ------------------------------------------------------------------------
 * WHY THIS IS A DERIVED REFERENCE, NOT A SOURCE OF TRUTH
 * ------------------------------------------------------------------------
 * Every other file in this folder draws a screen. This one draws the vocabulary
 * those screens are built from — palette, type scale, radii, geometry,
 * proportions, the alpha ramp, and the twelve composed pieces that do the actual
 * work of making a rectangle read as Instagram rather than as a generic dark app.
 *
 * NOTHING HERE IS AUTHORITATIVE AND IT MUST NOT BECOME SO. The palette lives in
 * src/styles/instagram.css; the type sizes and radii live in the surfaces. This
 * board reads them back. The counts below were taken by grep over ig-*.tsx on
 * 2026-08-29 and are the reason the scale is ordered by frequency rather than by
 * value — the useful fact about Instagram's type is not that it runs 11 to 22px,
 * it is that 13px semibold carries most of the app. Re-grepped 2026-08-29 after the
 * profile learned to change tabs: 77 declarations, up from 75.
 *
 *   grep -ho 'text-\[[0-9]*px\]' 'src/app/(site)/Mockup-IG/ig-'*.tsx | sort | uniq -c
 *
 * Re-run it after any surface work; a count that has drifted is a note to fix,
 * not a number to quietly edit.
 *
 * ------------------------------------------------------------------------
 * IT IS ALL ON THE INSTAGRAM CANVAS, WHICH IS NOT A STYLE CHOICE
 * ------------------------------------------------------------------------
 * The `.ig-surface` wrappers are what let this file use `--ig-*` at all — they
 * are private custom properties, so outside that subtree they resolve to nothing.
 * That also keeps the folder's containment grep passing: no HGM semantic token
 * appears anywhere below, including in the labels, which is why the captions are
 * `--ig-text-secondary` rather than `text-tertiary`.
 *
 * The swatches would in any case be a lie on our canvas. #262626 is invisible
 * against HGM's near-black and obvious against Instagram's true black, and the
 * whole point of an elevated surface is that it separates from what is behind it.
 *
 * ------------------------------------------------------------------------
 * THE CONTRAST COLUMN IS COMPUTED, AND TWO OF THE ROWS FAIL
 * ------------------------------------------------------------------------
 * WCAG 2.1 relative luminance against `--ig-canvas` (#000). `--ig-text-tertiary`
 * at 4.43:1 was already flagged in instagram.css. The second one is not, and is
 * worth knowing before anyone borrows the pattern: white on the #0095F6 Follow
 * button measures 3.17:1, so Instagram's single most recognisable component fails
 * AA for its own label.
 *
 * Both are fine HERE — every surface in this folder is `role="img"` with the real
 * content repeated in our tokens beside it, so none of this is text as far as a
 * reader is concerned. Neither is fine in an HGM component. That is the line.
 */

/* -------------------------------------------------------------------------- */
/* 1 · Palette                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * `value` is a raw hex rather than the custom property because these rows have to
 * PRINT the colour, not just wear it — and the gradient row below has no single
 * value to print at all, which is why it is separate.
 *
 * `note` carries the provenance marker from instagram.css unchanged. [fig] was
 * read off the supplied screenshots; [recall] is from memory of the iOS app and
 * may be a shade out. Copying the marker rather than dropping it is the point —
 * a swatch board is exactly where an unverified colour turns into a fact.
 */
const PALETTE = [
    { name: "--ig-canvas", value: "#000000", role: "The screen. iOS dark is true black, not near-black", contrast: null, note: "[fig]" },
    { name: "--ig-elevated", value: "#262626", role: "Secondary buttons, empty tiles, sheets", contrast: null, note: "[fig]" },
    { name: "--ig-separator", value: "#262626", role: "Hairlines — same value as elevated, different job", contrast: null, note: "[fig]" },
    { name: "--ig-text", value: "#ffffff", role: "Handles, headings, body", contrast: "21.00:1", note: "[fig]" },
    { name: "--ig-text-secondary", value: "#a8a8a8", role: "Captions, counts, timestamps", contrast: "8.83:1", note: "[fig]" },
    { name: "--ig-text-tertiary", value: "#737373", role: "Placeholders, disabled — FAILS AA", contrast: "4.43:1", note: "[fig]" },
    { name: "--ig-blue", value: "#0095f6", role: "Follow, bio link, active dot, sent message", contrast: "6.63:1", note: "[fig]" },
    { name: "--ig-verified", value: "#0095f6", role: "The tick. May be #3797f0 — unverified", contrast: "6.63:1", note: "[recall]" },
    { name: "--ig-like", value: "#ff3040", role: "Filled heart. Web uses #ed4956 — unverified", contrast: "5.75:1", note: "[recall]" },
    { name: "--ig-story-seen", value: "#363636", role: "A watched story loses the gradient", contrast: null, note: "[recall]" },
];

const Palette = () => (
    <ul className="ig-surface grid gap-px overflow-hidden rounded-2xl bg-(--ig-separator) sm:grid-cols-2">
        {PALETTE.map((colour) => (
            <li key={colour.name + colour.role} className="flex items-center gap-3.5 bg-(--ig-canvas) px-4 py-3.5">
                {/* Ringed, because #000 on #000 is otherwise an invisible row —
                    and the canvas swatch is the one that most needs to be seen. */}
                <span aria-hidden="true" className="size-9 shrink-0 rounded-[9px] ring-1 ring-(--ig-text)/15 ring-inset" style={{ background: colour.value }} />

                <span className="flex min-w-0 flex-col">
                    <span className="flex items-baseline gap-2">
                        <span className="truncate font-mono text-[13px] text-(--ig-text)">{colour.name}</span>
                        <span className="shrink-0 font-mono text-[11px] text-(--ig-text-tertiary)">{colour.note}</span>
                    </span>
                    <span className="truncate text-[12px] text-(--ig-text-secondary)">{colour.role}</span>
                    <span className="font-mono text-[11px] text-(--ig-text-tertiary)">
                        {colour.value}
                        {colour.contrast && ` · ${colour.contrast} on canvas`}
                    </span>
                </span>
            </li>
        ))}

        {/* The gradient gets its own row: five stops, no single hex to print. */}
        <li className="flex items-center gap-3.5 bg-(--ig-canvas) px-4 py-3.5 sm:col-span-2">
            <span aria-hidden="true" className="size-9 shrink-0 rounded-full bg-(image:--ig-story-ring)" />
            <span className="flex min-w-0 flex-col">
                <span className="truncate font-mono text-[13px] text-(--ig-text)">--ig-story-ring</span>
                <span className="truncate text-[12px] text-(--ig-text-secondary)">
                    The one gradient in the app. 45°, five stops — orange bottom-left to purple top-right
                </span>
                <span className="truncate font-mono text-[11px] text-(--ig-text-tertiary)">#ffc800 · #ff6c00 · #ff0069 · #d300c5 · #7638fa</span>
            </span>
        </li>
    </ul>
);

/* -------------------------------------------------------------------------- */
/* 2 · Type scale                                                              */
/* -------------------------------------------------------------------------- */

/**
 * ORDERED BY HOW MUCH WORK EACH SIZE DOES, not by value, and the shape of that
 * list is the finding: 13px semibold is 25 of the 77 declarations across these
 * surfaces. Instagram is not a typographic system with a scale — it is one body
 * size, one caption size, and a few one-off headers.
 *
 * Rendered in the same system stack `IgScreen` sets, at 1:1, so a row here is the
 * size the app draws. That only holds because this board is NOT inside the scaled
 * stage — the surfaces are authored at 402pt and scaled by a matrix, and a
 * specimen that inherited that scale would print the wrong number beside itself.
 */
const TYPE = [
    { size: 13, weight: "font-semibold", uses: 25, role: "Handles, captions, bio, comments — the body of the app" },
    { size: 11, weight: "font-semibold", uses: 18, role: "Reel counters, Sponsored, badge numerals" },
    { size: 12, weight: "font-normal", uses: 13, role: "Timestamps, sub-labels, audio row" },
    { size: 14, weight: "font-semibold", uses: 8, role: "Follow, Message, sheet rows, poll question" },
    { size: 15, weight: "font-semibold", uses: 5, role: "Status bar, nav titles, story CTA" },
    { size: 22, weight: "font-bold", uses: 4, role: "Reels wordmark, insight metrics, empty-state titles" },
    { size: 17, weight: "font-semibold", uses: 2, role: "Screen titles — Insights" },
    { size: 19, weight: "font-semibold", uses: 1, role: "Profile handle in the nav bar" },
    { size: 16, weight: "font-semibold", uses: 1, role: "One-off" },
];

const TypeScale = () => (
    <ul className="ig-surface flex flex-col gap-px overflow-hidden rounded-2xl bg-(--ig-separator)">
        {TYPE.map((step) => (
            <li key={step.size} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 bg-(--ig-canvas) px-4 py-3.5">
                <span className="w-[7ch] shrink-0 font-mono text-[11px] text-(--ig-text-tertiary)">{step.size}px</span>

                <span className={`min-w-0 flex-1 truncate text-(--ig-text) ${step.weight}`} style={{ fontSize: step.size }}>
                    thecohostcompany
                </span>

                {/* `w-full` below sm so the role drops to its own line rather than
                    being clipped by the list's overflow-hidden — at 390 the 22px
                    specimen and this label cannot share a row.

                    `min-w-0` IS NOT OPTIONAL and cost a round trip to find: a flex
                    item's automatic minimum size is its min-content width, so
                    without it this span measured 373px inside a 350px row and
                    overflowed anyway, `w-full` and the inner `truncate`
                    notwithstanding. The truncate can only engage once the box it
                    is in is allowed to be narrower than its text. */}
                <span className="flex w-full min-w-0 items-baseline justify-between gap-3 sm:w-auto sm:justify-start">
                    <span className="min-w-0 truncate text-[12px] text-(--ig-text-secondary)">{step.role}</span>
                    <span className="w-[6ch] shrink-0 text-right font-mono text-[11px] text-(--ig-text-tertiary)">×{step.uses}</span>
                </span>
            </li>
        ))}
    </ul>
);

/* -------------------------------------------------------------------------- */
/* 3 · Radii                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * `rounded-full` outnumbers every fixed radius put together — 23 against 18 —
 * which is the whole character of the shape language: Instagram rounds a thing
 * completely or barely at all, and almost never in between. The fixed values that
 * do exist cluster at 9-12px, and 9px is specifically the Follow button.
 *
 * THIS TABLE WAS WRONG AND IS WORTH SAYING SO. It recorded "24 against 15" and
 * listed seven values; the surfaces actually carry 23 rounded-full and TWELVE
 * distinct fixed radii, so six of them had never been written down. The margin is
 * real but narrower than the note claimed. Re-grepped 2026-08-29:
 *
 *   grep -ho 'rounded-full\|rounded-\[[0-9]*px\]' ig-{ads,chrome,feed,formats,profile,proof,reel}.tsx | sort | uniq -c
 *
 * The one-offs at the bottom are not noise to be tidied away — 1px is the story
 * progress bar's cap and 20px is a sheet corner, and both would be wrong at any
 * other value.
 */
const RADII = [
    { label: "full", css: "9999px", uses: 23, role: "Avatars, pills, dots, badges" },
    { label: "9px", css: "9px", uses: 5, role: "Follow / Message buttons" },
    { label: "12px", css: "12px", uses: 2, role: "Ad CTA, sheet cards" },
    { label: "10px", css: "10px", uses: 2, role: "Story CTA" },
    { label: "6px", css: "6px", uses: 2, role: "Grid tiles" },
    { label: "20px", css: "20px", uses: 1, role: "Sheet corner" },
    { label: "16px", css: "16px", uses: 1, role: "Message bubble" },
    { label: "8px", css: "8px", uses: 1, role: "Inline media" },
    { label: "7px", css: "7px", uses: 1, role: "Small chip" },
    { label: "4px", css: "4px", uses: 1, role: "Battery shell" },
    { label: "2px", css: "2px", uses: 1, role: "Chart bar caps" },
    { label: "1px", css: "1px", uses: 1, role: "Story progress cap" },
];

const Radii = () => (
    <ul className="ig-surface grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {RADII.map((radius) => (
            <li key={radius.label} className="flex items-center gap-3 rounded-2xl bg-(--ig-elevated) p-3">
                <span aria-hidden="true" className="size-11 shrink-0 bg-(--ig-text)/90" style={{ borderRadius: radius.css }} />
                <span className="flex min-w-0 flex-col">
                    <span className="font-mono text-[13px] text-(--ig-text)">{radius.label}</span>
                    <span className="truncate text-[12px] text-(--ig-text-secondary)">{radius.role}</span>
                    <span className="font-mono text-[11px] text-(--ig-text-tertiary)">×{radius.uses}</span>
                </span>
            </li>
        ))}
    </ul>
);

/* -------------------------------------------------------------------------- */
/* 4 · The composed pieces                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Six atoms, each the real markup lifted out of the surface that uses it rather
 * than re-typed — the ring is `IgAvatar`, the handle is `IgHandle`, and the
 * buttons carry the same h-[32px] / rounded-[9px] / 14px semibold the profile
 * action row does.
 *
 * WHY THESE SIX AND NOT TWENTY. They are the ones that carry the recognition. A
 * dark rectangle with white text is any app; a gradient ring, a #0095F6 pill and
 * a scalloped blue tick is Instagram before a single word is read. Everything
 * else in the folder is arrangement.
 */
const Cell = ({ title, note, children }: { title: string; note: string; children: React.ReactNode }) => (
    <li className="flex flex-col gap-4 rounded-2xl bg-(--ig-elevated) p-5">
        <div className="flex min-h-[56px] flex-wrap items-center gap-3">{children}</div>
        <div className="flex flex-col">
            <span className="text-[13px] font-semibold text-(--ig-text)">{title}</span>
            <span className="text-[12px] text-(--ig-text-secondary)">{note}</span>
        </div>
    </li>
);

const Atoms = ({ avatar }: { avatar: string }) => (
    <ul className="ig-surface grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Cell title="Story ring" note="Gradient ring, canvas gap, image — three nested boxes, 2px each. Seen drops to flat #363636.">
            <IgAvatar src={avatar} alt="" size={56} ring="unseen" />
            <IgAvatar src={avatar} alt="" size={56} ring="seen" />
            <IgAvatar src={avatar} alt="" size={56} />
        </Cell>

        <Cell title="Action row" note="h-32px, rounded-9px, 14px semibold. Follow is blue; every other state is --ig-elevated.">
            <span className="flex h-[32px] flex-1 items-center justify-center rounded-[9px] bg-(--ig-blue) text-[14px] font-semibold text-(--ig-text)">
                Follow
            </span>
            <span className="flex h-[32px] flex-1 items-center justify-center rounded-[9px] bg-(--ig-canvas)/40 text-[14px] font-semibold text-(--ig-text) ring-1 ring-(--ig-text)/15 ring-inset">
                Message
            </span>
        </Cell>

        <Cell title="Verified handle" note="The project's own VerifiedTick at 13px — a twelve-lobed seal, not a generic check.">
            <IgHandle handle="thecohostcompany" verified className="text-[15px] font-semibold text-(--ig-text)" />
        </Cell>

        <Cell title="Engagement row" note="Outline by default, filled when active — the same glyph in two weights, so no extra asset.">
            <span aria-hidden="true" className="flex items-center gap-4 text-(--ig-text) [&>svg]:size-6">
                <HeartSolid className="text-(--ig-like)" />
                <Heart strokeWidth={1.8} />
                <MessageCircle01 className="-scale-x-100" strokeWidth={1.8} />
                <Bookmark strokeWidth={1.8} />
            </span>
        </Cell>

        <Cell title="Tab bar states" note="Active is the solid weight at full white, inactive the outline. No colour change, no underline.">
            <span aria-hidden="true" className="flex items-center gap-4 text-(--ig-text) [&>svg]:size-6">
                <Home01Solid />
                <Home01 strokeWidth={1.7} />
                <ReelsGlyph active />
                <ReelsGlyph />
            </span>
        </Cell>

        <Cell title="Labels and dots" note="11px for Sponsored, 5.5px carousel dots — blue for current, 25% white for the rest.">
            <span className="text-[11px] text-(--ig-text-secondary)">Sponsored</span>
            <span aria-hidden="true" className="flex items-center gap-1.5">
                <span className="size-[5.5px] rounded-full bg-(--ig-blue)" />
                <span className="size-[5.5px] rounded-full bg-(--ig-text)/25" />
                <span className="size-[5.5px] rounded-full bg-(--ig-text)/25" />
            </span>
        </Cell>
    </ul>
);

/* -------------------------------------------------------------------------- */
/* 5 · Geometry                                                                */
/* -------------------------------------------------------------------------- */

/**
 * THE ONE MEASUREMENT THAT MAKES EVERY OTHER ONE TRUE. Every surface in this
 * folder is authored at 402 × 874 and scaled by a single matrix, so the bands
 * below are absolute pixels rather than a proportion — change the screen size and
 * they are all wrong at once.
 *
 * The heights are the Figma's own decomposition × 1.0276, the conversion from its
 * iPhone 14/15 (850.49pt) to the iPhone 17 Pro we build at (874pt). They tile the
 * screen: the eight bands above the grid sum to 596 and the grid plus tab bar take
 * the remaining 278, which is what makes this a reading of the reference rather
 * than a guess. The full derivation is in ig-profile.tsx.
 *
 * `fixed` marks a band whose height is declared. The grid is the only one that is
 * not — it takes whatever is left, which is why its second row is cut mid-tile on
 * a real profile and on ours.
 */
const GEOMETRY = [
    { band: "Status bar", px: 48, fixed: true, note: "IgStatusBar — clock, signal, battery" },
    { band: "Nav header", px: 58, fixed: true, note: "IgProfileTopBar — back, handle, overflow" },
    { band: "Identity", px: 117, fixed: true, note: "Avatar and the three counters" },
    { band: "Bio", px: 108, fixed: true, note: "Category, four lines, the blue link" },
    { band: "Social proof", px: 56, fixed: true, note: "Facepile and “followed by”" },
    { band: "Actions", px: 54, fixed: true, note: "Follow / Message / Email / add" },
    { band: "Highlights", px: 106, fixed: true, note: "Five 62px bubbles and their labels" },
    { band: "Tabs", px: 49, fixed: true, note: "Four glyphs and the 2px underline" },
    { band: "Grid", px: 278, fixed: false, note: "Whatever is left — clipped mid-row, as the app does" },
    { band: "Tab bar", px: 68, fixed: true, note: "IgTabBar — five destinations" },
];

const Geometry = () => (
    <div className="ig-surface flex flex-col gap-3">
        <ul className="flex flex-col gap-px overflow-hidden rounded-2xl bg-(--ig-separator)">
            {GEOMETRY.map((row) => (
                <li key={row.band} className="flex items-center gap-4 bg-(--ig-canvas) px-4 py-3">
                    {/* The bar is the band drawn to scale against the 874px screen,
                        so the column reads as a cross-section of the phone rather
                        than as a list of numbers. */}
                    <span aria-hidden="true" className="h-2.5 w-24 shrink-0 overflow-hidden rounded-full bg-(--ig-text)/15">
                        <span
                            className={`block h-full rounded-full ${row.fixed ? "bg-(--ig-text)/70" : "bg-(--ig-blue)"}`}
                            style={{ width: `${(row.px / IG_SCREEN.h) * 100}%` }}
                        />
                    </span>

                    <span className="w-[11ch] shrink-0 text-[13px] font-semibold text-(--ig-text)">{row.band}</span>
                    <span className="w-[7ch] shrink-0 font-mono text-[11px] text-(--ig-text-tertiary)">{row.px}px</span>
                    <span className="min-w-0 flex-1 truncate text-[12px] text-(--ig-text-secondary)">{row.note}</span>
                </li>
            ))}
        </ul>

        <p className="text-[12px] text-(--ig-text-secondary)">
            Screen {IG_SCREEN.w} × {IG_SCREEN.h}. Blue is the one band that is not declared — the grid takes the remainder.
        </p>
    </div>
);

/* -------------------------------------------------------------------------- */
/* 6 · Proportions                                                             */
/* -------------------------------------------------------------------------- */

/**
 * FIVE RATIOS, AND THE PROFILE TILE IS THE ONE PEOPLE GET WRONG. It is 3:4, not
 * square and not 4:5 — measured off the Figma at 130.49 × 173.84, a ratio of
 * 0.7506. Instagram moved profile grids to portrait and the old square is the
 * single most common tell in a mockup built from memory.
 *
 * Counted the same way as everything else on this board:
 *
 *   grep -ho 'aspect-[0-9a-z/]*' ig-*.tsx | sort | uniq -c
 */
const RATIOS = [
    { label: "3:4", w: 3, h: 4, uses: 2, role: "Profile grid tile — 0.7506 measured, NOT square" },
    { label: "4:5", w: 4, h: 5, uses: 3, role: "The feed post, and the tallest an ad may run" },
    { label: "9:16", w: 9, h: 16, uses: 1, role: "Story and reel — full bleed, edge to edge" },
    { label: "1:1", w: 1, h: 1, uses: 1, role: "Square. Survives as a crop option, not a default" },
    { label: "402:874", w: 402, h: 874, uses: 2, role: "The screen itself" },
];

const Proportions = () => (
    <ul className="ig-surface grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {RATIOS.map((ratio) => (
            <li key={ratio.label} className="flex flex-col gap-3 rounded-2xl bg-(--ig-elevated) p-3">
                {/* A fixed 96px BOX with the shape centred inside it, rather than
                    five boxes of five heights: the row is comparing proportions,
                    and a grid that also varied its own height would be comparing
                    two things at once. */}
                <span aria-hidden="true" className="flex h-24 items-center justify-center">
                    <span
                        className="block bg-(--ig-text)/25 ring-1 ring-(--ig-text)/40 ring-inset"
                        style={{
                            aspectRatio: `${ratio.w} / ${ratio.h}`,
                            height: ratio.h >= ratio.w ? "100%" : "auto",
                            width: ratio.h >= ratio.w ? "auto" : "100%",
                        }}
                    />
                </span>

                <span className="flex flex-col">
                    <span className="flex items-baseline gap-2">
                        <span className="font-mono text-[13px] text-(--ig-text)">{ratio.label}</span>
                        <span className="font-mono text-[11px] text-(--ig-text-tertiary)">×{ratio.uses}</span>
                    </span>
                    <span className="text-[12px] text-(--ig-text-secondary)">{ratio.role}</span>
                </span>
            </li>
        ))}
    </ul>
);

/* -------------------------------------------------------------------------- */
/* 7 · The alpha ramp                                                          */
/* -------------------------------------------------------------------------- */

/**
 * INSTAGRAM HAS NO ELEVATION COLOURS. There is the canvas and there is #262626,
 * and every other tone in the app is white at some percentage over black. That is
 * why the alpha ladder is a first-class part of this vocabulary rather than a
 * detail of it — thirteen steps of one colour are doing the work a grey scale
 * would do in another design system.
 *
 * The counts are the tell again: /25 is used seven times and nothing else reaches
 * three. It is the disabled dot, the inactive glyph, the hairline over media —
 * one value carrying most of "present but not active".
 */
const ALPHA = [
    { step: 90, uses: 1, role: "Solid-ish fill on media" },
    { step: 85, uses: 2, role: "Scrim over a bright still" },
    { step: 80, uses: 1, role: "Secondary glyph on media" },
    { step: 75, uses: 1, role: "Caption over a photo" },
    { step: 70, uses: 1, role: "Sub-label on media" },
    { step: 60, uses: 2, role: "Timestamp on media" },
    { step: 55, uses: 1, role: "Muted glyph" },
    { step: 40, uses: 2, role: "Ring on a swatch, inactive control" },
    { step: 30, uses: 2, role: "Story progress track" },
    { step: 25, uses: 7, role: "Carousel dot, inactive — the workhorse" },
    { step: 20, uses: 1, role: "Hairline over media" },
    { step: 15, uses: 3, role: "Empty-tile glyph, inset ring" },
];

const AlphaRamp = () => (
    <div className="ig-surface flex flex-col gap-3">
        <ul className="flex overflow-hidden rounded-2xl">
            {ALPHA.map((tone) => (
                <li key={tone.step} className="flex-1 bg-(--ig-canvas)">
                    <span aria-hidden="true" className="block h-16" style={{ background: `rgb(255 255 255 / ${tone.step}%)` }} />
                    <span className="flex flex-col items-center gap-0.5 py-2">
                        <span className="font-mono text-[11px] text-(--ig-text-secondary)">{tone.step}</span>
                        <span className="font-mono text-[11px] text-(--ig-text-tertiary)">×{tone.uses}</span>
                    </span>
                </li>
            ))}
        </ul>

        <p className="text-[12px] text-(--ig-text-secondary)">
            White over the canvas, at every percentage the surfaces actually use. Three non-white alphas exist and are all one-offs:
            <span className="font-mono"> --ig-elevated/60</span>, <span className="font-mono">--ig-canvas/40</span> and{" "}
            <span className="font-mono">--ig-blue/30</span>.
        </p>
    </div>
);

/* -------------------------------------------------------------------------- */
/* 8 · The rest of the vocabulary                                              */
/* -------------------------------------------------------------------------- */

/**
 * The six above are the ones that carry the RECOGNITION. These six carry the
 * STATE — they are what the app draws when there is nothing to show, when
 * something has not loaded, when a story is part-watched, when a message is yours
 * rather than theirs. A mockup with only the first six looks like Instagram in a
 * screenshot; it does not survive being asked what an empty tab looks like.
 *
 * The empty state is new: it did not exist in this folder until the profile
 * learned to change tabs, because nothing had ever needed to render a tab with no
 * content in it. Its 22px bold title is the fourth use of that size in the
 * surfaces, which is why the type table above moved from three to four.
 */
const MorePieces = () => (
    <ul className="ig-surface grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Cell title="Empty state" note="Outline glyph in a hairline ring, 22px bold, one secondary line. Shown here at 46px; the surface draws it at 62.">
            <span className="flex flex-col items-center gap-1.5 py-1">
                <span className="flex size-[46px] items-center justify-center rounded-full text-(--ig-text) ring-[1.5px] ring-(--ig-text) ring-inset [&>svg]:size-[26px]">
                    <UserSquare strokeWidth={1.6} />
                </span>
                <span className="text-[15px] font-bold text-(--ig-text)">No Photos</span>
            </span>
        </Cell>

        <Cell title="Tile states" note="What a grid cell draws before its still lands — photo, reel and carousel each get their own glyph at 15% white.">
            <span aria-hidden="true" className="flex gap-1.5">
                {(["photo", "reel", "carousel"] as const).map((kind) => (
                    <span key={kind} className="block size-[52px] overflow-hidden rounded-[6px]">
                        <IgTilePlaceholder kind={kind} />
                    </span>
                ))}
            </span>
        </Cell>

        <Cell title="Story progress" note="2.5px rails, gap-1, one per frame. Watched is full, current is partial, unwatched is zero width.">
            <span className="w-full">
                <IgStoryProgress frames={5} current={2} progress={0.55} />
            </span>
        </Cell>

        <Cell title="Message bubbles" note="16px radius. Outgoing is blue and right-aligned, incoming is --ig-elevated. The real app runs a gradient outgoing.">
            <span aria-hidden="true" className="flex w-full flex-col gap-1.5">
                <span className="max-w-[80%] self-start rounded-[16px] bg-(--ig-elevated) px-3 py-1.5 text-[13px] text-(--ig-text)">
                    Is the cabin free in May?
                </span>
                <span className="max-w-[80%] self-end rounded-[16px] bg-(--ig-blue) px-3 py-1.5 text-[13px] text-(--ig-text)">It is — sending dates now</span>
            </span>
        </Cell>

        <Cell title="The counter triplet" note="Number over label, centred. Abbreviated past a thousand — 26.4K, never 26,400.">
            <span aria-hidden="true" className="flex items-start gap-6">
                {[
                    ["325", "posts"],
                    ["26.4K", "followers"],
                    ["205", "following"],
                ].map(([value, label]) => (
                    <span key={label} className="flex flex-col items-center">
                        <span className="text-[15px] font-semibold text-(--ig-text)">{value}</span>
                        <span className="text-[13px] text-(--ig-text)">{label}</span>
                    </span>
                ))}
            </span>
        </Cell>

        {/* ON A CANVAS PATCH, NOT BARE ON THE CELL. A highlight is a --ig-separator
            ring around a cover that falls back to --ig-elevated — and these cells
            ARE --ig-elevated, so drawn directly on one the whole component is
            invisible. Every other cell here happens to be lighter or bluer than
            its card; this is the one that is the same value as it. The patch is
            what the surface actually puts behind them. */}
        <Cell title="Highlight bubble" note="A 62px ring in --ig-separator, not the story gradient — a highlight is archived, so it never shows as unwatched.">
            <span aria-hidden="true" className="flex items-end gap-3 rounded-xl bg-(--ig-canvas) px-3 py-2">
                {["SAVE 10%", "Reviews"].map((label) => (
                    <span key={label} className="flex w-[62px] flex-col items-center gap-1.5">
                        <span className="flex size-[62px] items-center justify-center rounded-full ring-1 ring-(--ig-separator) ring-inset">
                            <span className="size-[54px] rounded-full bg-(--ig-elevated)" />
                        </span>
                        <span className="w-full truncate text-center text-[11px] text-(--ig-text)">{label}</span>
                    </span>
                ))}
            </span>
        </Cell>
    </ul>
);

/* -------------------------------------------------------------------------- */
/* The board                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Four blocks in Instagram's own type and colour, so the whole board is one
 * continuous surface rather than our page with swatches dropped into it. The
 * system font stack is set once here and inherited — the same stack `IgScreen`
 * applies, which is why a 13px row on this board matches a 13px row in a frame.
 */
const Block = ({ title, lede, children }: { title: string; lede: string; children: React.ReactNode }) => (
    <div className="ig-surface">
        <h3 className="text-[17px] font-semibold text-(--ig-text)">{title}</h3>
        <p className="mt-1.5 max-w-[70ch] text-[13px] text-(--ig-text-secondary)">{lede}</p>
        <div className="mt-5">{children}</div>
    </div>
);

export const IgSystemBoard = ({ avatar }: { avatar: string }) => (
    <div className="flex flex-col gap-12 font-[system-ui,-apple-system,'Segoe_UI',sans-serif] antialiased">
        <Block
            title="Palette"
            lede="Eleven values, and the two markers matter more than the hexes: [fig] was eyedropped off the supplied screenshots, [recall] is from memory of the iOS app and may be a shade out. Contrast is computed against the canvas."
        >
            <Palette />
        </Block>

        <Block
            title="Type"
            lede="Ordered by how much work each size does rather than by value. 13px semibold is a third of every declaration in the folder — Instagram is one body size and a few one-off headers, not a scale. Counts re-grepped after the empty state landed: 77 declarations, and 22px bold went from three uses to four."
        >
            <TypeScale />
        </Block>

        <Block
            title="Radii"
            lede="rounded-full outnumbers every fixed radius put together, 23 against 18. Instagram rounds a shape completely or barely at all, and 9px is specifically the Follow button. This table had drifted — it recorded seven fixed values where the surfaces carry twelve, so five of the one-offs below had never been written down."
        >
            <Radii />
        </Block>

        <Block
            title="The pieces that carry the recognition"
            lede="A dark rectangle with white text is any app. A gradient ring, a #0095F6 pill and a scalloped tick is Instagram before a word is read — everything else in this folder is arrangement."
        >
            <Atoms avatar={avatar} />
        </Block>

        <Block
            title="The pieces that carry the state"
            lede="What the app draws when there is nothing to show, when a still has not landed, when a story is part-watched, when a message is yours rather than theirs. The empty state is new — nothing needed one until the profile learned to change tabs."
        >
            <MorePieces />
        </Block>

        <Block
            title="Geometry"
            lede="Ten bands that tile a 402 × 874 screen, read off the Figma's own decomposition and converted from its iPhone 14/15 to the iPhone 17 Pro we build at. Nine are declared; the grid takes what is left, which is why its second row is cut mid-tile."
        >
            <Geometry />
        </Block>

        <Block
            title="Proportions"
            lede="Five ratios, and the profile tile is the one that gets rebuilt wrong: it is 3:4, measured at 0.7506 off the Figma. Instagram moved profile grids to portrait, and an old square grid is the most common tell in a mockup built from memory."
        >
            <Proportions />
        </Block>

        <Block
            title="The alpha ramp"
            lede="Instagram has no elevation colours — there is the canvas, there is #262626, and everything else is white at a percentage over black. Twelve steps of one colour doing the work a grey scale does elsewhere, and 25% alone is used seven times."
        >
            <AlphaRamp />
        </Block>
    </div>
);
