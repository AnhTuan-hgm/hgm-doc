/**
 * PORTED from the HiddenGem marketing site (hiddengem-media,
 * src/components/hgm/backdrops.tsx) on 2026-09-01. Copied rather than shared:
 * a component has to be type-checked and bundled inside the repo, and CI builds
 * from the git clone, so it cannot live in the machine-wide asset library the
 * way the device bezels do. If you fix one of these, fix it in both.
 *
 * It ported unchanged because it is token-pure — no imports, no raw palette
 * classes, no hardcoded hex. Every colour is a CSS variable, so these arrive
 * already wearing this project's blue instead of that site's gold.
 *
 * SHIPPED BACKDROPS — the entries from /background that a real page uses.
 *
 * The library authors each backdrop as JSX inside its own `backdrops` array,
 * which is right for a catalogue and wrong the moment a page wants one: copying
 * the gradients into a section leaves two definitions of the same artwork to
 * drift apart the first time the brand moves. Anything that ships gets lifted
 * here and the catalogue entry renders it, so there is exactly one of each.
 *
 * THE CALLER OWNS THE STACKING CONTEXT. These render bare layers at `-z-10`, so
 * the section around them needs `relative isolate` — without it the layers sit
 * behind the page rather than behind the section. Every layer is `aria-hidden`
 * and `pointer-events-none`: decoration must not be announced or eat clicks.
 */

const LAYER = "pointer-events-none absolute inset-0 -z-10";

/**
 * AURORA — three wide radial blooms overlapping at low opacity, one brand and
 * two neutral. No texture and no edges, so it reads as depth rather than as
 * pattern.
 *
 * LIFTED OUT OF /background, WHERE IT WAS AN INLINE ARRAY ENTRY. The library
 * authors each backdrop as JSX inside its own `backdrops` list, which is right
 * for a catalogue and wrong the moment a page wants to ship one: copying the
 * three gradients into a section would leave two definitions of the same
 * artwork to drift apart the first time the brand moves. The library entry
 * renders this component now, so there is one Aurora.
 *
 * WHY THIS ONE UNDER A LONG SECTION. The library's own note is the argument:
 * "the quietest thing here, and the one that sits under dense copy without
 * competing." Homepage section 09 is six capability blocks, six drawn graphics
 * and roughly four hundred words. A backdrop with any texture in it would be
 * fighting all of that — Contour and God rays are stronger pictures and both
 * would win that fight, which is exactly the problem.
 *
 * ALL CSS. Every layer is a gradient reading a colour variable, so it re-themes
 * when the brand moves, stays sharp at any pixel density, and costs nothing on
 * the wire.
 */
export const Aurora = () => (
    <>
        <div aria-hidden="true" className={`${LAYER} bg-[radial-gradient(58%_70%_at_18%_18%,var(--color-bg-brand-solid),transparent_68%)] opacity-20`} />
        <div aria-hidden="true" className={`${LAYER} bg-[radial-gradient(52%_64%_at_82%_38%,var(--color-bg-tertiary),transparent_66%)] opacity-70`} />
        <div aria-hidden="true" className={`${LAYER} bg-[radial-gradient(70%_48%_at_46%_104%,var(--color-bg-secondary),transparent_70%)]`} />
    </>
);

/**
 * WEAVE — the Stage grid at a 5px pitch instead of 64, a gold bloom over it and
 * a vignette back to the page colour.
 *
 * READ THE LIBRARY'S OWN NOTE BEFORE EXPECTING A GRID: "past a certain density
 * a grid stops being a grid and becomes a material — at this size it reads as
 * woven cloth". At 5px the lines are texture, close to film grain. If what is
 * wanted is a grid you can count the squares of, that is Stage (64px), not this.
 *
 * It uses `--color-border-secondary` rather than a surface token because at
 * this pitch the surface tokens are too close in value to the canvas to
 * register at all.
 */
export const Weave = () => (
    <>
        <div
            aria-hidden="true"
            className={`${LAYER} bg-[linear-gradient(var(--color-border-secondary)_0_1px,transparent_1px_100%),linear-gradient(90deg,var(--color-border-secondary)_0_1px,transparent_1px_100%)] bg-size-[5px_5px] opacity-55`}
        />
        <div aria-hidden="true" className={`${LAYER} bg-[radial-gradient(70%_60%_at_70%_20%,var(--color-bg-brand-solid),transparent_68%)] opacity-16`} />
        <div aria-hidden="true" className={`${LAYER} bg-[radial-gradient(130%_110%_at_60%_25%,transparent_40%,var(--color-bg-primary)_100%)]`} />
    </>
);

/**
 * HALFTONE — a 1px dot on an 18px repeat, faded across the diagonal by a linear
 * mask so the field looks like it thins out rather than stopping.
 *
 * ONE LAYER, UNLIKE ITS NEIGHBOURS HERE, and that is deliberate. Aurora, Weave
 * and Ridgeline ship their bloom and vignette with them because the light is part
 * of the picture. A halftone is a PATTERN: it holds its character at any size
 * because the dot never scales, and where the light falls has nothing to do with
 * it. The hero proves the point — its gold bloom has to sit behind the video
 * player, not where the library happened to put it (see the note at the bloom in
 * opening.tsx), so a bundled bloom would have to be overridden the moment it was
 * used. The catalogue entry keeps its own bloom and vignette inline for the same
 * reason: this component is the dots, and only the dots.
 *
 * THE MASK IS NOT DECORATION. An even field of dots edge to edge reads as a screen
 * defect rather than as texture — the 115° fade is what makes it read as print.
 *
 * `--color-border-secondary` at 1px with a 1.5px stop: the extra half-pixel is the
 * antialiasing margin. At a hard 1px stop the dots alias into squares on a
 * non-retina display.
 */
export const Halftone = () => (
    <div
        aria-hidden="true"
        className={`${LAYER} bg-[radial-gradient(var(--color-border-secondary)_1px,transparent_1.5px)] [mask-image:linear-gradient(115deg,black_2%,transparent_62%)] bg-size-[18px_18px]`}
    />
);

/**
 * RIDGELINE — four ranks of mountain silhouette, each a clip-path polygon
 * rather than a gradient, over a low gold band.
 *
 * WHY POLYGONS. Peaks need straight edges and hard corners, and no radial can
 * give either. Atmospheric perspective runs backwards on a dark canvas: the
 * furthest rank is the lightest, so distance reads as haze rather than as
 * shadow. The gold sits behind the nearest ridge and is the only place gold
 * appears.
 *
 * THE FRAME IT WANTS. Every y in the polygons is a percentage of the caller's
 * height, so the ridges scale with whatever box this is dropped into — the
 * artwork was drawn against the library's 32rem band, and in a short box the
 * mountains flatten to bumps. To crop rather than squash, give the caller a
 * short `overflow-hidden` box and render this inside a full-height frame
 * anchored to its bottom; the site footer does exactly that.
 *
 * The nearest rank fills to 100% in `bg-primary`, which is the page colour, so
 * a crop's bottom edge meets the canvas with no seam.
 */
export const Ridgeline = () => (
    <>
        <div aria-hidden="true" className={`${LAYER} bg-[radial-gradient(58%_30%_at_50%_78%,var(--color-bg-brand-solid),transparent_72%)] opacity-24`} />
        <div
            aria-hidden="true"
            className={`${LAYER} bg-tertiary opacity-45 [clip-path:polygon(0_62%,14%_47%,27%_58%,42%_38%,58%_55%,72%_43%,86%_57%,100%_46%,100%_100%,0_100%)]`}
        />
        <div
            aria-hidden="true"
            className={`${LAYER} bg-secondary [clip-path:polygon(0_74%,11%_63%,25%_72%,38%_56%,52%_70%,66%_59%,80%_71%,100%_62%,100%_100%,0_100%)]`}
        />
        <div
            aria-hidden="true"
            className={`${LAYER} bg-primary opacity-90 [clip-path:polygon(0_88%,16%_78%,30%_86%,45%_73%,60%_84%,74%_76%,88%_86%,100%_79%,100%_100%,0_100%)]`}
        />
    </>
);

/**
 * RAKING LIGHT — wide soft beams at 100°, from a single repeating-linear-
 * gradient per layer, plus a vignette back to the page colour.
 *
 * THE SOFTNESS IS FREE, and that is the whole trick: leaving a gap between two
 * colour stops makes the browser interpolate across it, so bands with space
 * between their stops arrive blurred with no filter and no blur radius to pay
 * for. Reads as light through a window, and gives a section a direction the
 * others do not have.
 *
 * The beams are in device pixels, not percentages, so they keep their width
 * whatever the section's height — which is what lets this sit under a section
 * as tall as the case-study deck without stretching into stripes.
 */
export const RakingLight = () => (
    <>
        <div
            aria-hidden="true"
            className={`${LAYER} bg-[repeating-linear-gradient(100deg,transparent_0_40px,var(--color-bg-secondary)_70px_95px,transparent_130px_240px)]`}
        />
        <div
            aria-hidden="true"
            className={`${LAYER} bg-[repeating-linear-gradient(100deg,transparent_0_120px,var(--color-bg-brand-solid)_190px_215px,transparent_290px_620px)] opacity-22`}
        />
        <div aria-hidden="true" className={`${LAYER} bg-[radial-gradient(120%_110%_at_25%_0%,transparent_30%,var(--color-bg-primary)_100%)]`} />
    </>
);
