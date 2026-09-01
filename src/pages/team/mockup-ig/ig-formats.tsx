import { ChevronRight, DotsHorizontal, Heart, Lock01, MessageCircle01, MusicNote01, Send02, Share01 } from "@untitledui-pro/icons/line";
import { Pin02 } from "@untitledui-pro/icons/solid";
import { cx } from "@/utils/cx";
import { IgAvatar, IgHandle, IgScreen, IgStatusBar, IgTabBar } from "./ig-chrome";
import type { IgBioLink, IgReel } from "./instagram-data";
import { ReelVideo } from "@/components/shared-assets/reel-video";

/**
 * TWO FORMATS THAT ARE NEITHER ADS NOR THE APP'S OWN SCREENS.
 *
 * PIN REEL is a reel presented as a pinned post — what an account puts at the top of
 * its grid so it is the first thing a visitor sees. The Figma outline gives it four
 * bands (H1, H2, Body (Video), Footer), one more than the ad pages, because the
 * pinned label is its own band above the video.
 *
 * BIO LINK is not Instagram at all. It is the page `profile.link` points at — the
 * link-in-bio destination — so it is a mobile web page in browser chrome, not app
 * chrome. The outline gives it H1 plus two body blocks, which maps to a header, a
 * featured link, and the rest of the stack.
 *
 * That distinction matters for the palette: the bio-link page is OURS, not Meta's,
 * so building it from HGM tokens would be entirely reasonable. It is kept on the
 * Instagram palette for one reason — it renders beside the app screens in the same
 * row, and a cream card there would read as a bug rather than a deliberate
 * contrast. Worth revisiting if this format ever gets a section of its own.
 */

/* -------------------------------------------------------------------------- */
/* 37 · IgPinnedReel                                                           */
/* -------------------------------------------------------------------------- */

/**
 * The pinned label is the point of this format, so it takes its own band rather than
 * a corner badge. The corner badge is what the grid TILE uses (`IgGridTile`); this
 * is the opened post, where the media is full-bleed and a badge would sit on the
 * picture.
 */
const IgPinnedReelScreen = ({ reel, avatar }: { reel: IgReel; avatar: string }) => (
    <div className="flex h-full flex-col">
        <IgStatusBar />

        {/* H1 — the post's own header. */}
        <div className="flex h-[50px] shrink-0 items-center gap-2.5 px-3">
            <IgAvatar src={reel.author.avatar} alt="" size={32} ring="unseen" />
            <IgHandle handle={reel.author.handle} verified={reel.author.verified} className="min-w-0 flex-1 text-[13px] font-semibold" />
            <DotsHorizontal aria-hidden="true" className="size-[20px] shrink-0" strokeWidth={2.2} />
        </div>

        {/* H2 — the pinned band. */}
        <div className="flex h-[34px] shrink-0 items-center gap-2 border-y border-(--ig-separator) bg-(--ig-elevated)/60 px-3 text-[12px] font-semibold">
            <Pin02 aria-hidden="true" className="size-[14px] shrink-0" />
            Pinned to your profile
        </div>

        {/* Body — the video. */}
        <div className="relative min-h-0 flex-1 overflow-hidden bg-(--ig-elevated)">
            <ReelVideo src={reel.video.src} poster={reel.video.poster} />
            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[120px] bg-linear-to-t from-black/55 to-transparent" />

            <span aria-hidden="true" className="absolute bottom-2.5 left-3 flex max-w-[80%] items-center gap-1.5 text-[12px]">
                <MusicNote01 className="size-[13px] shrink-0" strokeWidth={2.2} />
                <span className="truncate">{reel.audio}</span>
            </span>
        </div>

        {/* Footer — actions, likes, caption. */}
        <div aria-hidden="true" className="flex h-[44px] shrink-0 items-center gap-4 px-3">
            <Heart className="size-[25px]" strokeWidth={1.8} />
            <MessageCircle01 className="size-[25px] -scale-x-100" strokeWidth={1.8} />
            <Send02 className="size-[25px] -rotate-12" strokeWidth={1.8} />
        </div>

        <div className="shrink-0 px-3 pb-2 text-[13px] leading-[18px]">
            <span className="font-semibold">{reel.counts.likes} likes</span>
            <br />
            <span className="font-semibold">{reel.author.handle}</span> {reel.caption}
        </div>

        <IgTabBar active="profile" avatar={avatar} />
    </div>
);

export const IgPinnedReelSurface = ({ reel, avatar }: { reel: IgReel; avatar: string }) => (
    <IgScreen label={`Instagram pinned reel mockup — ${reel.video.alt}, pinned to @${reel.author.handle}'s profile`}>
        <IgPinnedReelScreen reel={reel} avatar={avatar} />
    </IgScreen>
);

/* -------------------------------------------------------------------------- */
/* 38 · IgBioLink                                                              */
/* -------------------------------------------------------------------------- */

/**
 * A link-in-bio page inside mobile browser chrome, because that is what it is —
 * tapping the link in a profile leaves the app. The chrome is minimal on purpose: a
 * URL pill with a padlock and a share glyph is enough to say "browser", and more of
 * it would compete with the page it frames.
 *
 * THE FEATURED LINK IS A DIFFERENT SHAPE, not just a different colour — filled and
 * taller where the rest are outlined. On a stack of six near-identical buttons,
 * colour alone does not survive being scaled to 0.61.
 */
const IgBioLinkScreen = ({ bio }: { bio: IgBioLink }) => (
    <div className="flex h-full flex-col bg-(--ig-canvas)">
        <IgStatusBar />

        {/* Browser chrome. */}
        <div className="flex h-[46px] shrink-0 items-center gap-2 px-3">
            <span className="flex min-w-0 flex-1 items-center gap-1.5 rounded-[10px] bg-(--ig-elevated) px-2.5 py-1.5">
                <Lock01 aria-hidden="true" className="size-[11px] shrink-0 text-(--ig-text-secondary)" strokeWidth={2.4} />
                <span className="truncate text-[12px] text-(--ig-text-secondary)">bio.{bio.handle}.com/links</span>
            </span>
            <Share01 aria-hidden="true" className="size-[18px] shrink-0" strokeWidth={2} />
        </div>

        {/* H1 — the identity block. */}
        <div className="flex shrink-0 flex-col items-center gap-2 px-6 pt-6 pb-5">
            <IgAvatar src={bio.avatar} alt="" size={72} />
            <span className="text-[16px] font-semibold">@{bio.handle}</span>
            <span className="text-center text-[13px] text-(--ig-text-secondary)">{bio.tagline}</span>
        </div>

        {/* Body — the link stack, featured first. */}
        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden px-5">
            {bio.links.map((link) => (
                <span
                    key={link.label}
                    className={cx(
                        "flex shrink-0 items-center justify-between gap-2 rounded-[12px] px-4 text-[14px] font-semibold",
                        link.featured ? "h-[52px] bg-(--ig-blue)" : "h-[46px] ring-1 ring-(--ig-text)/25",
                    )}
                >
                    <span className="truncate">{link.label}</span>
                    <ChevronRight aria-hidden="true" className="size-[17px] shrink-0" strokeWidth={2.4} />
                </span>
            ))}
        </div>

        <div className="shrink-0 py-4 text-center text-[11px] text-(--ig-text-tertiary)">Built by Hidden Gem Media</div>
    </div>
);

export const IgBioLinkSurface = ({ bio }: { bio: IgBioLink }) => (
    <IgScreen label={`Link-in-bio page mockup for @${bio.handle} — a featured offer above ${bio.links.length - 1} more links, shown in mobile browser chrome`}>
        <IgBioLinkScreen bio={bio} />
    </IgScreen>
);
