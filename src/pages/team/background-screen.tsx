import { type ReactNode, useEffect, useState } from "react";
import { Aurora, Halftone, RakingLight, Ridgeline, Weave } from "@/components/shared-assets/backdrops";
import { FloatingMarks } from "@/components/shared-assets/floating-marks";
import { cx } from "@/utils/cx";

/**
 * `/background` — the drawn-backdrop catalogue, ported from the HiddenGem
 * marketing site's /background route on 2026-09-01. Every entry is named, with
 * the technique behind it written down, and the name and note sit ON the
 * backdrop rather than beside it — so the page also shows the only thing that
 * finally matters: whether type stays legible over it.
 *
 * ALL OF THEM ARE CSS. No image files: every layer is a gradient reading a
 * colour variable, so they re-theme when the brand moves, stay sharp at any
 * pixel density, and cost nothing on the wire. That is also why they arrived
 * here wearing this project's blue instead of the marketing site's gold — the
 * artwork is token-pure, and the port was a copy, not a redraw.
 *
 * The marketing site's page carries a third family, Video: eight mp4 loops
 * from its own Supabase bucket, about 9.7MB together, graded for its gold
 * palette. They are deliberately NOT ported — off-palette here, and this
 * catalogue's argument is precisely that the drawn ones weigh nothing.
 *
 * HOW ONE IS BUILT. The section is `relative isolate` so it forms its own
 * stacking context; each layer is an absolutely positioned div at `inset-0`
 * with `-z-10`, so the layers sit behind the text but not behind the page. DOM
 * order is paint order. Every layer is `aria-hidden` and `pointer-events-none`
 * — decoration must not be announced and must not eat clicks.
 *
 * The five that ship on real pages live in shared-assets/backdrops.tsx and are
 * rendered here from there — a catalogue that redefines what it catalogues is
 * how two Auroras start to differ. The rest are inline entries, lifted into
 * backdrops.tsx the day a page ships one.
 */

/**
 * Taller than it looks like it needs to be, on purpose. At 360 the notes run to
 * a dozen lines and fill a 26rem band completely, leaving the artwork with
 * nowhere to be seen — on a page whose entire job is showing the artwork.
 */
const SHELL = "relative isolate flex min-h-[32rem] scroll-mt-16 items-end overflow-hidden border-t border-secondary bg-primary md:min-h-[34rem]";

const LAYER = "pointer-events-none absolute inset-0 -z-10";

/**
 * Entries are numbered in page order — the same number in the strip and the
 * heading — so "number nine" points at one thing wherever it is read.
 * Zero-padded because the collection is past ten and ragged numerals break the
 * left edge of the list.
 */
const label = (index: number) => String(index + 1).padStart(2, "0");

/**
 * THE MENU GROUPS BY WHAT A BACKDROP IS MADE OF, not by mood, because that is
 * the question someone actually arrives with: I need a soft field / I need a
 * repeat / I need direction / I need a shape. Mood words ("calm", "bold") stop
 * discriminating once there are twenty of these; the construction never does,
 * and a new entry sorts itself.
 */
type Family = "Fields" | "Patterns" | "Light" | "Shapes" | "Motion";

/**
 * `evokes` is what the backdrop is OF, where `family` is what it is MADE OF.
 * Only the entries drawn for the short-term-rental world carry one — the
 * abstract ones are not of anything, and inventing a subject for them would be
 * a lie told to make a table look full.
 */
const backdrops: { id: string; name: string; family: Family; evokes?: string; note: string; layers: ReactNode }[] = [
    {
        id: "aurora",
        name: "Aurora",
        family: "Fields",
        note: "Three wide radial blooms overlapping at low opacity — one brand, two neutral. No texture and no edges, so it reads as depth rather than as pattern. The quietest thing here, and the one that sits under dense copy without competing.",
        // SHIPPED, so it lives in shared-assets/backdrops.tsx and this entry
        // renders it rather than restating it.
        layers: <Aurora />,
    },
    {
        id: "contour",
        name: "Contour",
        family: "Patterns",
        note: "One repeating-radial-gradient — 1px rings at a 26px pitch — centred off-canvas at the bottom left, so only their arcs cross the frame. A mask fades them toward the top right so the pattern resolves out of the canvas instead of tiling to the edge, and a brand wash sits over the origin so the rings are warmest where they are tightest. The one backdrop here that suggests terrain without a photograph of anywhere.",
        layers: (
            <>
                <div
                    aria-hidden="true"
                    className={`${LAYER} bg-[repeating-radial-gradient(circle_at_18%_112%,transparent_0_25px,var(--color-border-secondary)_25px_26px)] [mask-image:radial-gradient(120%_120%_at_18%_112%,black_10%,transparent_78%)]`}
                />
                <div
                    aria-hidden="true"
                    className={`${LAYER} bg-[radial-gradient(58%_58%_at_18%_108%,var(--color-bg-brand-solid),transparent_70%)] opacity-22`}
                />
                <div aria-hidden="true" className={`${LAYER} bg-[radial-gradient(120%_100%_at_30%_90%,transparent_40%,var(--color-bg-primary)_100%)]`} />
            </>
        ),
    },
    {
        id: "stage",
        name: "Stage",
        family: "Patterns",
        note: "A 64px grid from two crossed linear-gradients, masked radially so it exists only where the light falls, under a soft pool centred above the top edge. The most architectural of the set: the light lands where a headline would, which frames content instead of merely sitting behind it.",
        layers: (
            <>
                <div
                    aria-hidden="true"
                    className={`${LAYER} bg-[linear-gradient(var(--color-border-secondary)_0_1px,transparent_1px_100%),linear-gradient(90deg,var(--color-border-secondary)_0_1px,transparent_1px_100%)] [mask-image:radial-gradient(58%_62%_at_50%_8%,black_5%,transparent_74%)] bg-size-[64px_64px]`}
                />
                <div
                    aria-hidden="true"
                    className={`${LAYER} bg-[radial-gradient(44%_50%_at_50%_-8%,var(--color-bg-brand-solid),transparent_70%)] opacity-24`}
                />
                <div aria-hidden="true" className={`${LAYER} bg-[radial-gradient(125%_110%_at_50%_10%,transparent_32%,var(--color-bg-primary)_100%)]`} />
            </>
        ),
    },
    {
        id: "mesh",
        name: "Mesh",
        family: "Fields",
        note: "Two conic-gradients thrown out of focus by a heavy blur. Conic sweeps band badly on their own, so the layer is inset past the section edges and blurred by 90px — the banding disappears and what is left is a soft colour field with no discernible shape. The richest backdrop here, and the one to use sparingly: blur is the only genuinely expensive effect on this page, and three of these on one route would be felt.",
        layers: (
            <>
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-[25%] -z-10 bg-[conic-gradient(from_210deg_at_32%_34%,var(--color-bg-brand-solid),transparent_38%),conic-gradient(from_20deg_at_74%_66%,var(--color-bg-tertiary),transparent_42%)] opacity-45 blur-[90px]"
                />
                <div aria-hidden="true" className={`${LAYER} bg-[radial-gradient(130%_110%_at_50%_50%,transparent_35%,var(--color-bg-primary)_100%)]`} />
            </>
        ),
    },
    {
        id: "halftone",
        name: "Halftone",
        family: "Patterns",
        note: "A 1px dot on an 18px repeat, faded across the diagonal by a linear mask so the field looks like it thins out rather than stopping. Print-derived and the most graphic of the set — it holds its character at any size because the dot never scales, which is also why it needs the mask: an even field of dots edge to edge reads as a screen defect.",
        // SHIPPED — see shared-assets/backdrops.tsx. Only the DOTS are the
        // component; the bloom and vignette below stay here because a pattern
        // does not own where the light falls.
        layers: (
            <>
                <Halftone />
                <div
                    aria-hidden="true"
                    className={`${LAYER} bg-[radial-gradient(60%_65%_at_12%_10%,var(--color-bg-brand-solid),transparent_66%)] opacity-18`}
                />
                <div aria-hidden="true" className={`${LAYER} bg-[radial-gradient(125%_105%_at_20%_20%,transparent_38%,var(--color-bg-primary)_100%)]`} />
            </>
        ),
    },
    {
        id: "raking",
        name: "Raking light",
        family: "Light",
        note: "Wide soft beams at 100°, from a single repeating-linear-gradient. The softness is free: leaving a gap between two colour stops makes the browser interpolate across it, so bands with space between their stops arrive blurred without a filter. Reads as light through a window, and gives a section a direction the others do not have.",
        layers: <RakingLight />,
    },
    {
        id: "weave",
        name: "Weave",
        family: "Patterns",
        note: "The Stage grid at a 5px pitch instead of 64. Past a certain density a grid stops being a grid and becomes a material — at this size it reads as woven cloth, and it is the closest thing here to film grain without an SVG turbulence filter, which could not read the tokens anyway. It needs the brighter border token: at this pitch the surface tokens are too close in value to the canvas to register at all.",
        // SHIPPED — see shared-assets/backdrops.tsx.
        layers: <Weave />,
    },
    {
        id: "dune",
        name: "Dune",
        family: "Shapes",
        note: "Two overlapping ellipses centred below the frame, each with a hard colour stop rather than a fade, so you get a silhouette edge instead of a glow — layered ridges receding into a lit sky. The only backdrop here with a drawn horizon, and the one that most wants content placed high, since its lower half belongs to the shapes. Where an arc crosses the frame is arithmetic, not taste: the ridge line sits at centre-Y minus the stop fraction times the vertical radius, which is why the radii are near 100% rather than the 45% that first felt right and left the arcs entirely off-screen.",
        layers: (
            <>
                <div
                    aria-hidden="true"
                    className={`${LAYER} bg-[radial-gradient(64%_44%_at_30%_86%,var(--color-bg-brand-solid),transparent_70%)] opacity-26`}
                />
                <div
                    aria-hidden="true"
                    className={`${LAYER} bg-[radial-gradient(120%_95%_at_24%_107%,var(--color-bg-tertiary)_62%,transparent_63%)] opacity-70`}
                />
                <div aria-hidden="true" className={`${LAYER} bg-[radial-gradient(110%_90%_at_74%_122%,var(--color-bg-secondary)_62%,transparent_63%)]`} />
                <div aria-hidden="true" className={`${LAYER} bg-[radial-gradient(135%_115%_at_50%_95%,transparent_52%,var(--color-bg-primary)_100%)]`} />
            </>
        ),
    },

    /* ---------------------------------------------------------------------- */
    /* Drawn for the industry                                                 */
    /*                                                                        */
    /* HiddenGem's clients own resorts and experiential stays — cabins,       */
    /* A-frames, treehouses, spa cabins. None of these reach for travel-      */
    /* agency iconography: no planes, pins, globes, routes or passport        */
    /* stamps. What is drawn instead is the world the properties sit in.      */
    /*                                                                        */
    /* The originals were drawn gold-on-near-black, where large gold washes   */
    /* at low alpha go olive — so the accent appears small and bright, never  */
    /* large and faint. The discipline carries over unchanged in blue.        */
    /* ---------------------------------------------------------------------- */

    {
        id: "ridgeline",
        name: "Ridgeline",
        family: "Shapes",
        evokes: "Mountain cabins, A-frames",
        note: "Four ranks of silhouette, each a clip-path polygon rather than a gradient — peaks need straight edges and hard corners, which no radial can give. Atmospheric perspective runs backwards on a dark canvas: the furthest rank is the lightest, so distance reads as haze rather than as shadow. A low brand band sits behind the nearest ridge, which is the only place the accent appears.",
        // SHIPPED — see shared-assets/backdrops.tsx.
        layers: <Ridgeline />,
    },
    {
        id: "canopy",
        name: "Canopy",
        family: "Light",
        evokes: "Treehouses, forest stays",
        note: "Dapple is a scatter of small soft light pools, not a few big dark shapes — the first build did it subtractively, laying hard-edged occluders over one broad glow, and it read as two tents rather than as light through leaves. What works is the light itself: nine warm pools at irregular sizes and spacings near the top edge, none of them touching, over a faint general wash. Irregularity is doing all the work, so no two radii or positions repeat.",
        layers: (
            <>
                <div
                    aria-hidden="true"
                    className={`${LAYER} bg-[radial-gradient(80%_46%_at_50%_-6%,var(--color-bg-brand-solid),transparent_72%)] opacity-12`}
                />
                <div
                    aria-hidden="true"
                    className={`${LAYER} bg-[radial-gradient(5%_9%_at_11%_7%,var(--color-bg-brand-solid),transparent_74%),radial-gradient(3%_6%_at_24%_2%,var(--color-bg-brand-solid),transparent_74%),radial-gradient(7%_12%_at_37%_11%,var(--color-bg-brand-solid),transparent_76%),radial-gradient(3%_5%_at_47%_4%,var(--color-bg-brand-solid),transparent_72%),radial-gradient(6%_10%_at_58%_9%,var(--color-bg-brand-solid),transparent_75%),radial-gradient(4%_7%_at_69%_3%,var(--color-bg-brand-solid),transparent_73%),radial-gradient(7%_13%_at_79%_13%,var(--color-bg-brand-solid),transparent_76%),radial-gradient(3%_6%_at_89%_6%,var(--color-bg-brand-solid),transparent_72%),radial-gradient(5%_8%_at_96%_15%,var(--color-bg-brand-solid),transparent_74%)] opacity-16`}
                />
                <div
                    aria-hidden="true"
                    className={`${LAYER} bg-[radial-gradient(3%_6%_at_17%_21%,var(--color-bg-brand-solid),transparent_74%),radial-gradient(2%_4%_at_31%_25%,var(--color-bg-brand-solid),transparent_72%),radial-gradient(4%_8%_at_52%_23%,var(--color-bg-brand-solid),transparent_75%),radial-gradient(3%_5%_at_73%_27%,var(--color-bg-brand-solid),transparent_73%),radial-gradient(4%_7%_at_86%_22%,var(--color-bg-brand-solid),transparent_74%)] opacity-10`}
                />
                <div aria-hidden="true" className={`${LAYER} bg-[radial-gradient(135%_115%_at_50%_2%,transparent_38%,var(--color-bg-primary)_100%)]`} />
            </>
        ),
    },
    {
        id: "water",
        name: "Still water",
        family: "Patterns",
        evokes: "Lakes, plunge pools, the spa cabin",
        note: "A horizon at 52%: canvas above, banding below. Three repeating gradients at different pitches, each masked to its own depth zone, so the spacing appears to compress toward the horizon — one repeating gradient cannot vary its own pitch, so perspective has to be assembled from several. The narrow brand column is light on water, and it survives precisely because it is narrow: the accent appears small and bright, never large and faint.",
        layers: (
            <>
                <div
                    aria-hidden="true"
                    className={`${LAYER} bg-[repeating-linear-gradient(0deg,var(--color-border-secondary)_0_1px,transparent_1px_7px)] [mask-image:linear-gradient(to_bottom,transparent_52%,black_56%,transparent_68%)]`}
                />
                <div
                    aria-hidden="true"
                    className={`${LAYER} bg-[repeating-linear-gradient(0deg,var(--color-border-secondary)_0_1px,transparent_1px_15px)] [mask-image:linear-gradient(to_bottom,transparent_64%,black_72%,transparent_86%)]`}
                />
                <div
                    aria-hidden="true"
                    className={`${LAYER} bg-[repeating-linear-gradient(0deg,var(--color-border-secondary)_0_1px,transparent_1px_28px)] [mask-image:linear-gradient(to_bottom,transparent_82%,black_92%)]`}
                />
                <div
                    aria-hidden="true"
                    className={`${LAYER} bg-[linear-gradient(90deg,transparent_44%,var(--color-bg-brand-solid)_49%,var(--color-bg-brand-solid)_51%,transparent_56%)] [mask-image:linear-gradient(to_bottom,transparent_50%,black_58%,transparent_96%)] opacity-30`}
                />
                <div aria-hidden="true" className={`${LAYER} bg-[radial-gradient(17%_8%_at_50%_51%,var(--color-bg-brand-solid),transparent_72%)] opacity-30`} />
                <div aria-hidden="true" className={`${LAYER} bg-[radial-gradient(125%_110%_at_50%_55%,transparent_42%,var(--color-bg-primary)_100%)]`} />
            </>
        ),
    },
    {
        id: "mist",
        name: "Mist",
        family: "Fields",
        evokes: "Valley fog, a hot tub at dawn",
        note: "Four very wide, very soft horizontal ellipses, offset and overlapping. No blur filter — a wide radial gradient is already soft, and blur is the only genuinely expensive effect on this page. The quietest of the set and the most usable under dense proof copy, which is the case most sections here actually are.",
        layers: (
            <>
                <div aria-hidden="true" className={`${LAYER} bg-[radial-gradient(75%_18%_at_28%_34%,var(--color-bg-tertiary),transparent_72%)] opacity-55`} />
                <div aria-hidden="true" className={`${LAYER} bg-[radial-gradient(90%_15%_at_68%_52%,var(--color-bg-tertiary),transparent_74%)] opacity-45`} />
                <div aria-hidden="true" className={`${LAYER} bg-[radial-gradient(80%_20%_at_40%_72%,var(--color-bg-secondary),transparent_70%)] opacity-80`} />
                <div
                    aria-hidden="true"
                    className={`${LAYER} bg-[radial-gradient(46%_22%_at_58%_20%,var(--color-bg-brand-solid),transparent_70%)] opacity-16`}
                />
                <div aria-hidden="true" className={`${LAYER} bg-[radial-gradient(130%_115%_at_50%_50%,transparent_45%,var(--color-bg-primary)_100%)]`} />
            </>
        ),
    },
    {
        id: "ember",
        name: "Ember",
        family: "Light",
        evokes: "The fire pit, the evening booking",
        note: "A tight, bright bloom low and centred — deliberately small, which on the original site was the direct lesson from every wide gold wash turning olive. Above it two dot layers at different pitches, masked to thin out with height: sparks. Density falls off as they rise; brightness does not, because a dim spark is just dirt.",
        layers: (
            <>
                <div
                    aria-hidden="true"
                    className={`${LAYER} bg-[radial-gradient(34%_20%_at_50%_104%,var(--color-bg-brand-solid),transparent_68%)] opacity-55`}
                />
                <div
                    aria-hidden="true"
                    className={`${LAYER} bg-[radial-gradient(64%_38%_at_50%_112%,var(--color-bg-brand-solid),transparent_72%)] opacity-22`}
                />
                <div
                    aria-hidden="true"
                    className={`${LAYER} bg-[radial-gradient(var(--color-bg-brand-solid)_1px,transparent_1.5px)] [mask-image:radial-gradient(46%_78%_at_50%_100%,black_8%,transparent_72%)] bg-size-[43px_43px] opacity-70`}
                />
                <div
                    aria-hidden="true"
                    className={`${LAYER} bg-[radial-gradient(var(--color-bg-brand-solid)_1px,transparent_2px)] [mask-image:radial-gradient(60%_88%_at_50%_100%,black_12%,transparent_76%)] bg-size-[71px_71px] opacity-45`}
                />
                <div aria-hidden="true" className={`${LAYER} bg-[radial-gradient(125%_105%_at_50%_100%,transparent_48%,var(--color-bg-primary)_100%)]`} />
            </>
        ),
    },
    {
        id: "darksky",
        name: "Dark sky",
        family: "Patterns",
        evokes: "Stargazing stays",
        note: "Two faint neutral dot layers at coprime pitches — 37 and 61 pixels — plus fourteen brand stars placed individually. Coprime spacing stops the combined field repeating quickly, but it does not make any single layer irregular, and the first build proved it: the accent layer was a repeat too, and being the brightest it read as an obvious lattice of evenly spaced dots. Faint layers can be grids because nobody resolves them; the bright ones have to be placed by hand.",
        layers: (
            <>
                <div
                    aria-hidden="true"
                    className={`${LAYER} bg-[radial-gradient(var(--color-border-secondary)_1px,transparent_1.5px)] bg-size-[37px_37px] opacity-90`}
                />
                <div
                    aria-hidden="true"
                    className={`${LAYER} bg-[radial-gradient(var(--color-fg-quaternary)_1px,transparent_2px)] bg-size-[61px_61px] opacity-60`}
                />
                <div
                    aria-hidden="true"
                    className={`${LAYER} bg-[radial-gradient(1.5px_1.5px_at_7%_12%,var(--color-bg-brand-solid),transparent),radial-gradient(1px_1px_at_19%_31%,var(--color-bg-brand-solid),transparent),radial-gradient(2px_2px_at_28%_8%,var(--color-bg-brand-solid),transparent),radial-gradient(1px_1px_at_36%_47%,var(--color-bg-brand-solid),transparent),radial-gradient(1.5px_1.5px_at_44%_19%,var(--color-bg-brand-solid),transparent),radial-gradient(1px_1px_at_53%_63%,var(--color-bg-brand-solid),transparent),radial-gradient(2px_2px_at_61%_27%,var(--color-bg-brand-solid),transparent),radial-gradient(1px_1px_at_69%_9%,var(--color-bg-brand-solid),transparent),radial-gradient(1.5px_1.5px_at_77%_41%,var(--color-bg-brand-solid),transparent),radial-gradient(1px_1px_at_84%_16%,var(--color-bg-brand-solid),transparent),radial-gradient(2px_2px_at_91%_55%,var(--color-bg-brand-solid),transparent),radial-gradient(1px_1px_at_97%_24%,var(--color-bg-brand-solid),transparent),radial-gradient(1.5px_1.5px_at_13%_58%,var(--color-bg-brand-solid),transparent),radial-gradient(1px_1px_at_47%_74%,var(--color-bg-brand-solid),transparent)] opacity-80`}
                />
                <div
                    aria-hidden="true"
                    className={`${LAYER} bg-[radial-gradient(var(--color-border-secondary)_1px,transparent_1.5px)] [mask-image:linear-gradient(118deg,transparent_28%,black_44%,black_56%,transparent_72%)] bg-size-[23px_23px] opacity-80`}
                />
                <div
                    aria-hidden="true"
                    className={`${LAYER} bg-[radial-gradient(55%_32%_at_50%_96%,var(--color-bg-brand-solid),transparent_70%)] opacity-18`}
                />
            </>
        ),
    },
    {
        id: "facet",
        name: "Facet",
        family: "Shapes",
        evokes: "The hidden gem itself",
        note: "Conic wedges from an off-centre origin with hard stops, and hairlines from a second conic drawn exactly where two wedges meet. What it delivers is light breaking off an edge rather than a modelled solid: on a dark canvas the three surface tokens sit within a few points of each other, so the hairlines and the single brand wedge carry the whole read — while in light mode those same tokens are far enough apart that the planes actually appear. The one entry here that genuinely changes character between themes, so check it in both. The banding that forced Mesh into a 90px blur is not a defect here — this one wants hard edges, so it costs nothing to paint.",
        layers: (
            <>
                <div
                    aria-hidden="true"
                    className={`${LAYER} bg-[conic-gradient(from_18deg_at_38%_44%,var(--color-bg-secondary)_0_38deg,var(--color-bg-primary)_38deg_96deg,var(--color-bg-tertiary)_96deg_142deg,var(--color-bg-primary)_142deg_205deg,var(--color-bg-secondary)_205deg_262deg,var(--color-bg-tertiary)_262deg_310deg,var(--color-bg-primary)_310deg_360deg)]`}
                />
                <div
                    aria-hidden="true"
                    className={`${LAYER} bg-[conic-gradient(from_18deg_at_38%_44%,var(--color-border-brand)_0_0.4deg,transparent_0.4deg_38deg,var(--color-border-brand)_38deg_38.4deg,transparent_38.4deg_96deg,var(--color-border-brand)_96deg_96.4deg,transparent_96.4deg_142deg,var(--color-border-brand)_142deg_142.4deg,transparent_142.4deg_205deg,var(--color-border-brand)_205deg_205.4deg,transparent_205.4deg_262deg,var(--color-border-brand)_262deg_262.4deg,transparent_262.4deg_310deg,var(--color-border-brand)_310deg_310.4deg,transparent_310.4deg_360deg)] opacity-40`}
                />
                <div
                    aria-hidden="true"
                    className={`${LAYER} bg-[conic-gradient(from_18deg_at_38%_44%,transparent_0_96deg,var(--color-bg-brand-solid)_96deg_142deg,transparent_142deg_360deg)] opacity-10`}
                />
                <div
                    aria-hidden="true"
                    className={`${LAYER} bg-[radial-gradient(13%_16%_at_38%_44%,var(--color-bg-brand-solid),transparent_74%)] opacity-30`}
                />
                <div aria-hidden="true" className={`${LAYER} bg-[radial-gradient(120%_110%_at_38%_44%,transparent_30%,var(--color-bg-primary)_100%)]`} />
            </>
        ),
    },
    {
        id: "ascent",
        name: "Ascent",
        family: "Motion",
        evokes: "Embers off a fire, sparks on a night",
        note: "Twenty-six brand diamonds drifting upward, each on its own duration, sway and starting offset. The mechanism is originkit.dev's Floating Icons; the implementation is not theirs. Theirs runs a requestAnimationFrame loop that calls setState every frame, re-running the particle memo sixty times a second and animating layout properties, so every frame is a reflow. This is two CSS keyframes the compositor owns and no JavaScript at runtime — and with reduced motion on, the marks keep their scattered positions and simply hold still.",
        layers: <FloatingMarks direction="up" />,
    },
    {
        id: "descent",
        name: "Descent",
        family: "Motion",
        evokes: "Snowfall, ash, the quiet season",
        note: "The same field inverted, with soft dots instead of diamonds and fewer of them. Falling reads calmer than rising because the eye tracks downward motion as settling rather than as energy — the same trick a resort uses when it photographs a property in snow rather than in sun. Randomness is a hash of the index rather than Math.random, so the field renders the same on every visit and nothing has to be generated in an effect.",
        layers: <FloatingMarks direction="down" mark="dot" count={18} />,
    },
];

/**
 * The sticky strip: one horizontal line of numbered chips grouped by family,
 * with a "you are here" tracked by an IntersectionObserver. The observer uses
 * a thin horizontal band near the top of the viewport (-18% / -72%) rather
 * than ratios — ratios pick whichever section covers the most pixels, which
 * flickers between two equally-sized neighbours; a band asks what is currently
 * crossing the reading line, and only one thing ever is.
 *
 * The marketing site adds a fixed sidebar rail from xl; this port keeps just
 * the strip at every width — the sections are full-bleed artwork, and a strip
 * is the only nav that costs them no horizontal room.
 */
const BackdropStrip = () => {
    const [activeId, setActiveId] = useState<string | null>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) setActiveId(entry.target.id);
                }
            },
            { rootMargin: "-18% 0px -72% 0px" },
        );

        backdrops.forEach((b) => {
            const el = document.getElementById(b.id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    // Preserve the order families first appear in, so the strip matches the page.
    const families = backdrops.reduce<Family[]>((acc, b) => (acc.includes(b.family) ? acc : [...acc, b.family]), []);

    return (
        <nav aria-label="Backdrops" className="sticky top-0 z-20 border-b border-secondary bg-primary/85 backdrop-blur-md">
            <div className="mx-auto flex w-full max-w-[1152px] gap-7 overflow-x-auto px-5 py-3 md:px-6">
                {families.map((family) => (
                    <div key={family} className="flex shrink-0 items-center gap-2">
                        <span className="font-mono text-[0.625rem] tracking-[0.14em] text-tertiary uppercase">{family}</span>
                        {backdrops
                            .map((b, index) => ({ ...b, number: label(index) }))
                            .filter((b) => b.family === family)
                            .map((b) => (
                                <a
                                    key={b.id}
                                    href={`#${b.id}`}
                                    aria-current={activeId === b.id ? "true" : undefined}
                                    className={cx(
                                        "rounded-full border px-3 py-1 text-sm whitespace-nowrap outline-focus-ring transition duration-100 ease-linear focus-visible:outline-2 focus-visible:outline-offset-2",
                                        activeId === b.id
                                            ? "border-brand bg-secondary font-medium text-primary"
                                            : "border-secondary text-secondary hover:border-brand hover:text-primary",
                                    )}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={cx(
                                            "mr-1.5 font-mono text-[0.625rem] tabular-nums",
                                            activeId === b.id ? "text-brand-secondary" : "text-tertiary",
                                        )}
                                    >
                                        {b.number}
                                    </span>
                                    {b.name}
                                </a>
                            ))}
                    </div>
                ))}
            </div>
        </nav>
    );
};

export const BackgroundScreen = () => (
    <main>
        <div className="border-b border-secondary bg-secondary py-10">
            <div className="mx-auto w-full max-w-[1152px] px-5 md:px-6">
                <p className="font-mono text-xs tracking-[0.14em] text-quaternary uppercase">Backgrounds</p>
                <h1 className="mt-2 text-display-xs font-semibold text-primary">Drawn backdrops</h1>
                <p className="mt-3 max-w-[62ch] text-md text-tertiary">
                    All {backdrops.length} are CSS on stacked layers — no image files, so they re-theme with the tokens and weigh nothing. Ported from the
                    HiddenGem marketing site, where they were drawn in gold; here the same layers read this project&rsquo;s blue, and they follow the theme
                    toggle. The five a real page ships live in shared-assets/backdrops.tsx; the rest are catalogue entries until a page wants one. Not linked
                    from any client-facing menu, not indexed.
                </p>
            </div>
        </div>

        <BackdropStrip />

        {backdrops.map((backdrop, index) => (
            <section key={backdrop.id} id={backdrop.id} className={SHELL}>
                {backdrop.layers}

                <div className="mx-auto w-full max-w-[1152px] px-5 py-12 md:px-6 md:py-16">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[0.625rem] tracking-[0.14em] text-quaternary uppercase">
                        <span>{backdrop.family}</span>
                        {backdrop.evokes && (
                            <>
                                <span aria-hidden="true" className="size-1 shrink-0 rotate-45 bg-border-brand" />
                                <span className="text-brand-secondary">{backdrop.evokes}</span>
                            </>
                        )}
                    </p>
                    <h2 className="mt-2 flex items-baseline gap-3 text-display-xs font-semibold text-primary">
                        <span aria-hidden="true" className="font-mono text-md text-quaternary tabular-nums">
                            {label(index)}
                        </span>
                        {backdrop.name}
                    </h2>
                    <p className="mt-3 max-w-[62ch] text-md text-tertiary">{backdrop.note}</p>
                </div>
            </section>
        ))}
    </main>
);
