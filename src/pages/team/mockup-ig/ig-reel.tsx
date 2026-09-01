import { Camera01, DotsHorizontal, Heart, MessageCircle01, MusicNote01, Send02 } from "@untitledui-pro/icons/line";
import { IgAvatar, IgHandle, IgScreen, IgStatusBar, IgTabBar } from "./ig-chrome";
import type { IgReel } from "./instagram-data";
import { ReelVideo } from "@/components/shared-assets/reel-video";

/**
 * THE FULL-SCREEN REEL — not in the supplied Figma either. Rebuilt from the app,
 * same caveat as ig-feed.tsx.
 *
 * REUSES `ReelVideo` UNCHANGED. It is the one client component this route pulls in,
 * and it has to be: it drives `play()` from an effect so `prefers-reduced-motion`
 * can pause it, which the `autoPlay` attribute cannot do. It also pauses when out
 * of view, so this reel and the three on /mockup never all decode at once.
 *
 * THE MP4S WERE NOT PORTED — only the poster JPEGs live in /public/mockup-ig, so
 * /mockup-ig/reel-*.mp4 404s and `ReelVideo` fails in the right direction: a
 * failed `<video src>` leaves the poster showing. That matches the live source
 * site, whose .gitignore blocks its MP4s too. Drop the files in under the same
 * names and the reel starts moving.
 *
 * EVERYTHING SITS OVER VIDEO, so every overlay needs its own contrast. Two scrims
 * do that: one down from the top for the status bar, one up from the bottom for the
 * caption and rail. Instagram uses the same trick, and without them white type
 * disappears the moment a bright frame comes round.
 */

/* -------------------------------------------------------------------------- */
/* 27 · IgReelRail                                                             */
/* -------------------------------------------------------------------------- */

/**
 * The vertical action stack. Counts sit under their glyph at 11px, the smallest
 * type anywhere in this build — still above the 10px floor, and it only has to
 * survive the scale because the 1:1 presentation is the primary one.
 */
const IgReelRail = ({ reel }: { reel: IgReel }) => (
    <div aria-hidden="true" className="absolute right-2.5 bottom-[112px] flex flex-col items-center gap-5">
        <span className="flex flex-col items-center gap-1">
            <Heart className="size-[27px] drop-shadow-[0_1px_3px_rgb(0_0_0/0.5)]" strokeWidth={1.8} />
            <span className="text-[11px] font-semibold">{reel.counts.likes}</span>
        </span>

        <span className="flex flex-col items-center gap-1">
            <MessageCircle01 className="size-[27px] -scale-x-100 drop-shadow-[0_1px_3px_rgb(0_0_0/0.5)]" strokeWidth={1.8} />
            <span className="text-[11px] font-semibold">{reel.counts.comments}</span>
        </span>

        <span className="flex flex-col items-center gap-1">
            <Send02 className="size-[27px] -rotate-12 drop-shadow-[0_1px_3px_rgb(0_0_0/0.5)]" strokeWidth={1.8} />
            <span className="text-[11px] font-semibold">{reel.counts.sends}</span>
        </span>

        <DotsHorizontal className="size-[24px] drop-shadow-[0_1px_3px_rgb(0_0_0/0.5)]" strokeWidth={2.2} />

        {/* The audio thumbnail — a small rotating album tile on the real thing.
            Static here, by the same rule that makes this surface role="img" rather
            than a player. */}
        <span className="flex size-[27px] items-center justify-center rounded-[6px] bg-(--ig-elevated) ring-1 ring-(--ig-text)/30">
            <MusicNote01 className="size-[14px]" strokeWidth={2} />
        </span>
    </div>
);

/* -------------------------------------------------------------------------- */
/* 28 · IgReelFooter                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Handle with an outlined Follow chip, caption, then the audio strip. The Follow
 * here is a hairline outline rather than the blue fill the profile uses — over
 * video a solid blue block fights the picture, so Instagram switches treatment.
 */
const IgReelFooter = ({ reel }: { reel: IgReel }) => (
    <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2.5 px-3 pb-3">
        <span className="flex items-center gap-2.5">
            <IgAvatar src={reel.author.avatar} alt="" size={32} className="ring-1 ring-(--ig-text)/60" />
            <IgHandle handle={reel.author.handle} verified={reel.author.verified} className="text-[13px] font-semibold" />
            <span className="rounded-[7px] px-2.5 py-1 text-[12px] font-semibold ring-1 ring-(--ig-text)/70">Follow</span>
        </span>

        <span className="max-w-[76%] text-[13px] leading-[18px]">{reel.caption}</span>

        <span className="flex max-w-[70%] items-center gap-1.5 text-[12px]">
            <MusicNote01 aria-hidden="true" className="size-[13px] shrink-0" strokeWidth={2.2} />
            <span className="truncate">{reel.audio}</span>
        </span>
    </div>
);

/* -------------------------------------------------------------------------- */
/* 29 · IgReelTopBar                                                           */
/* -------------------------------------------------------------------------- */

const IgReelTopBar = () => (
    <div className="flex h-[46px] shrink-0 items-center justify-between px-4">
        <span className="text-[22px] font-bold drop-shadow-[0_1px_3px_rgb(0_0_0/0.5)]">Reels</span>
        <Camera01 aria-hidden="true" className="size-[25px] drop-shadow-[0_1px_3px_rgb(0_0_0/0.5)]" strokeWidth={1.8} />
    </div>
);

/* -------------------------------------------------------------------------- */
/* 30 · IgReelScreen                                                           */
/* -------------------------------------------------------------------------- */

export const IgReelScreen = ({ reel, avatar }: { reel: IgReel; avatar: string }) => (
    <div className="relative flex h-full flex-col bg-(--ig-canvas)">
        {/* The video fills everything behind the chrome, including under the tab
            bar — which is how a reel actually looks, edge to edge. */}
        <span className="absolute inset-0 block overflow-hidden">
            <ReelVideo src={reel.video.src} poster={reel.video.poster} />
        </span>

        {/* Two scrims, so white type survives a bright frame. */}
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[140px] bg-linear-to-b from-(--ig-scrim) to-transparent" />
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[300px] bg-linear-to-t from-(--ig-scrim) to-transparent" />

        <div className="relative flex h-full flex-col">
            <IgStatusBar />
            <IgReelTopBar />

            <div className="relative min-h-0 flex-1">
                <IgReelRail reel={reel} />
                <IgReelFooter reel={reel} />
            </div>

            <IgTabBar active="reels" avatar={avatar} />
        </div>
    </div>
);

/** The whole reel, staged and scaled. */
export const IgReelSurface = ({ reel, avatar }: { reel: IgReel; avatar: string }) => (
    <IgScreen label={`Instagram reel mockup — ${reel.video.alt}, posted by @${reel.author.handle}, with ${reel.counts.likes} likes`}>
        <IgReelScreen reel={reel} avatar={avatar} />
    </IgScreen>
);
