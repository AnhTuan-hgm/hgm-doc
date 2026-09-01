import { Bookmark, ChevronRight, DotsHorizontal, Heart, MessageCircle01, MusicNote01, Send02 } from "@untitledui-pro/icons/line";
import { IgAvatar, IgCtaBar, IgHandle, IgScreen, IgStatusBar, IgStoryProgress, IgTabBar } from "./ig-chrome";
import type { IgAd } from "./instagram-data";
import { ReelVideo } from "@/components/shared-assets/reel-video";

/**
 * META ADS — the three Instagram placements.
 *
 * ------------------------------------------------------------------------
 * ONE OF THESE HAS A REFERENCE AND TWO DO NOT
 * ------------------------------------------------------------------------
 * The Figma page "✨ Instagram Ad Style 1" holds seven real feed-ad screenshots in
 * the vacation-rental and real-estate space, plus a decomposition of one of them
 * into three bands that tile the screen exactly:
 *
 *   H1      50.711   the status bar
 *   Body   576.363   the ad header OVER the media, plus the media
 *   Footer 223.418   CTA bar, action row, caption, tab bar
 *                    ─────────
 *                    850.492 = the full screen
 *
 * So `IgFeedAd` is read off a reference. `IgStoryAd` and `IgReelsAd` are not — no
 * story or reels ad appears in any of the supplied files — and they are rebuilt from
 * the current app with the usual caveat.
 *
 * ------------------------------------------------------------------------
 * FOUR THINGS THE REFERENCE CORRECTED THAT MEMORY GOT WRONG
 * ------------------------------------------------------------------------
 * 1. THE AD HEADER SITS ON THE MEDIA, not on a black bar above it. Avatar, handle,
 *    "Sponsored" beneath it, an OUTLINED Follow pill and the overflow dots, all
 *    floating over the creative. That is why the Body band contains both, and it is
 *    the single biggest structural difference from an organic post.
 * 2. THE CTA BAR IS TINTED FROM THE CREATIVE — a flat desaturated colour, measured
 *    #728598, not a grey and not Instagram blue. It lives on the ad, not the
 *    palette. See `IgCtaBar`.
 * 3. THE FOLLOW PILL IS OUTLINED, not the blue fill a profile uses. Over a
 *    photograph a solid blue block fights the picture.
 * 4. ACTION COUNTS SIT INLINE beside each glyph — 214, 2, 19 — where an organic post
 *    puts "1,284 likes" on its own line above the caption.
 *
 * Copy is deliberately generic: these demonstrate a format, not a live campaign.
 */

/* -------------------------------------------------------------------------- */
/* 31 · IgSponsoredHeader                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The overlay header. `absolute` over the media rather than a row above it, with a
 * short scrim behind it so white type survives a pale creative — the reference's own
 * creatives are all mid-to-dark at the top so it gets away without one, but ours
 * have to work with whatever still lands here.
 */
const IgSponsoredHeader = ({ ad, follow = true }: { ad: IgAd; follow?: boolean }) => (
    <div className="absolute inset-x-0 top-0 z-10">
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[86px] bg-linear-to-b from-black/45 to-transparent" />

        <div className="relative flex h-[56px] items-center gap-2.5 px-3">
            <IgAvatar src={ad.author.avatar} alt="" size={32} />

            <span className="flex min-w-0 flex-1 flex-col leading-tight">
                <IgHandle handle={ad.author.handle} verified={ad.author.verified} className="text-[13px] font-semibold" />
                <span className="text-[12px]">Sponsored</span>
            </span>

            {follow && <span className="shrink-0 rounded-[8px] px-3.5 py-1 text-[13px] font-semibold ring-1 ring-(--ig-text)/80">Follow</span>}
            <DotsHorizontal aria-hidden="true" className="size-[20px] shrink-0" strokeWidth={2.2} />
        </div>
    </div>
);

/* -------------------------------------------------------------------------- */
/* 32 · IgAdActions                                                            */
/* -------------------------------------------------------------------------- */

/** Counts inline, bookmark pushed right. See correction 4 above. */
const IgAdActions = ({ counts }: { counts: IgAd["counts"] }) => (
    <div aria-hidden="true" className="flex h-[42px] shrink-0 items-center px-3 text-[14px] font-semibold">
        <span className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
                <Heart className="size-[24px]" strokeWidth={1.8} />
                {counts.likes}
            </span>
            <span className="flex items-center gap-1.5">
                <MessageCircle01 className="size-[24px] -scale-x-100" strokeWidth={1.8} />
                {counts.comments}
            </span>
            <span className="flex items-center gap-1.5">
                <Send02 className="size-[24px] -rotate-12" strokeWidth={1.8} />
                {counts.sends}
            </span>
        </span>

        <Bookmark className="ml-auto size-[24px]" strokeWidth={1.8} />
    </div>
);

/* -------------------------------------------------------------------------- */
/* 33 · IgFeedAd — Style 1, the one with a reference                           */
/* -------------------------------------------------------------------------- */

/**
 * THE POST IS CENTRED BETWEEN THE STATUS BAR AND THE TAB BAR, and that is a
 * deliberate departure from the reference rather than a fix to it.
 *
 * The arithmetic: 874 of screen, less 48 of status bar, 68 of tab bar, a 502.5
 * media at 4:5 of 402, 44 of CTA bar, 42 of actions and ~40 of caption, leaves
 * about 130px unaccounted for. Instagram spends all of it BELOW the caption,
 * because a real feed has the next post coming up underneath — the void is not
 * empty on a device, it is just off-screen.
 *
 * A mockup has no next post, so that same 130px reads as the layout having
 * collapsed upward. Splitting it above and below sits the ad in the middle of the
 * frame and looks composed instead. `justify-center` on a `flex-1` wrapper does
 * it, so the tab bar stays pinned and no magic offset is involved.
 *
 * If this is ever used to argue about real placement — where the fold lands, how
 * much caption survives above it — put the top alignment back, because then the
 * asymmetry is the information.
 */
const IgFeedAdScreen = ({ ad, avatar }: { ad: IgAd; avatar: string }) => (
    <div className="flex h-full flex-col">
        <IgStatusBar time="8:50" />

        <div className="flex min-h-0 flex-1 flex-col justify-center">
            {/* Body band — the header floats on the media, so they share one box. */}
            <div className="relative shrink-0">
                <IgSponsoredHeader ad={ad} />
                <span className="block aspect-4/5 w-full overflow-hidden bg-(--ig-elevated)">
                    {ad.media.src && <img src={ad.media.src} alt={ad.media.alt} width={804} height={1005} className="size-full object-cover" />}
                </span>
            </div>

            {/* Footer band. */}
            <IgCtaBar label={ad.cta} tint={ad.ctaTint} />
            <IgAdActions counts={ad.counts} />

            <div className="shrink-0 px-3 text-[13px] leading-[18px]">
                <span className="font-semibold">{ad.author.handle}</span> {ad.caption} <span className="text-(--ig-text-secondary)">… more</span>
            </div>
        </div>

        <IgTabBar active="home" avatar={avatar} />
    </div>
);

export const IgFeedAdSurface = ({ ad, avatar }: { ad: IgAd; avatar: string }) => (
    <IgScreen label={`Instagram feed ad mockup — sponsored post by @${ad.author.handle} with a "${ad.cta}" call to action`}>
        <IgFeedAdScreen ad={ad} avatar={avatar} />
    </IgScreen>
);

/* -------------------------------------------------------------------------- */
/* 35 · IgStoryAd — Style 2, no reference                                      */
/* -------------------------------------------------------------------------- */

/**
 * Full-bleed 9:16, progress track and header at the top, a CTA button at the
 * bottom. NO TAB BAR — a story takes the whole screen, and that absence is the
 * structural thing separating this placement from the other two.
 *
 * TWO THINGS THIS GOT WRONG FIRST TIME, both worth keeping written down:
 *
 * THE PROGRESS TRACK GOES BELOW THE STATUS BAR. Drawn first it lands at y=0, in the
 * bezel's top curve, above the clock — and on a device the system status bar is
 * always the topmost thing. Instagram's own order is status bar, then track, then
 * the account row.
 *
 * "SWIPE UP" IS RETIRED. Instagram dropped the chevron-and-label swipe affordance
 * around 2021 in favour of a tappable CTA button sitting above the home indicator.
 * A chevron over a word dates a story mockup immediately, which is exactly the kind
 * of thing a reference would have caught — and there is no story ad in any of the
 * supplied files, so this is built from knowledge and should be checked.
 */
const IgStoryAdScreen = ({ ad }: { ad: IgAd }) => (
    <div className="relative flex h-full flex-col">
        <span className="absolute inset-0 block overflow-hidden bg-(--ig-elevated)">
            {ad.media.src?.endsWith(".mp4") ? (
                <ReelVideo src={ad.media.src} poster={ad.media.poster ?? ""} />
            ) : (
                ad.media.poster && <img src={ad.media.poster} alt={ad.media.alt} width={804} height={1430} className="size-full object-cover" />
            )}
        </span>

        {/* Two scrims. The top one has to cover the status bar as well as the header,
            because on a story the video runs behind both — unlike the feed ad, where
            the status bar sits on the canvas and only the header needs protecting. */}
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[150px] bg-linear-to-b from-black/55 to-transparent" />
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[220px] bg-linear-to-t from-black/60 to-transparent" />

        <div className="relative flex h-full flex-col">
            {/* Status bar FIRST — it is the topmost thing on a device, always. */}
            <IgStatusBar time="8:49" />
            <IgStoryProgress />

            {/*
              NO NEGATIVE MARGIN HERE. Pulling this up by the status bar's height put
              the handle over the Dynamic Island and hid the clock — the header belongs
              below, which is where it lands if it is simply left in flow. `relative`
              is what the absolutely-positioned header anchors to.
            */}
            <div className="relative">
                <IgSponsoredHeader ad={ad} follow={false} />
            </div>

            {/*
              The CTA button, and the home indicator below it. Frosted rather than
              solid: over an unknown creative a filled block either fights the
              picture or disappears into it, and Instagram's own treatment is a
              translucent panel that borrows whatever is behind it. That is also why
              it carries a hairline — on a pale sky the panel alone has no edge.

              A story ad's CTA is a real button, not a swipe. See the note above.
            */}
            <div className="mt-auto flex flex-col items-center gap-3 px-4 pb-2">
                <span className="flex w-full items-center justify-center gap-1.5 rounded-[10px] bg-white/18 py-2.5 text-[15px] font-semibold ring-1 ring-(--ig-text)/25 backdrop-blur-md">
                    {ad.cta}
                    <ChevronRight aria-hidden="true" className="size-[16px] shrink-0" strokeWidth={2.6} />
                </span>

                {/* The iOS home indicator. Every other surface here hides behind a tab
                    bar; a story has nothing at the bottom, so without this the frame
                    ends on a hard edge and reads as cropped. */}
                <span aria-hidden="true" className="h-[5px] w-[134px] rounded-full bg-(--ig-text)/85" />
            </div>
        </div>
    </div>
);

export const IgStoryAdSurface = ({ ad }: { ad: IgAd }) => (
    <IgScreen label={`Instagram story ad mockup — full-screen sponsored frame by @${ad.author.handle} with a "${ad.cta}" swipe-up`}>
        <IgStoryAdScreen ad={ad} />
    </IgScreen>
);

/* -------------------------------------------------------------------------- */
/* 36 · IgReelsAd — Style 3, no reference                                      */
/* -------------------------------------------------------------------------- */

/**
 * A reel with a CTA strip wedged between the caption and the tab bar. It keeps the
 * organic reel's right-hand action rail — a reels ad is still a reel and Instagram
 * does not take the rail away — so what separates this from `IgReelSurface` is the
 * "Sponsored" line and that strip.
 */
const IgReelsAdScreen = ({ ad, avatar }: { ad: IgAd; avatar: string }) => (
    <div className="relative flex h-full flex-col">
        <span className="absolute inset-0 block overflow-hidden bg-(--ig-elevated)">
            {ad.media.src && <ReelVideo src={ad.media.src} poster={ad.media.poster ?? ""} />}
        </span>

        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[130px] bg-linear-to-b from-black/50 to-transparent" />
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[280px] bg-linear-to-t from-black/65 to-transparent" />

        <div className="relative flex h-full flex-col">
            <IgStatusBar time="8:49" />

            <div className="flex h-[46px] shrink-0 items-center px-4">
                <span className="text-[22px] font-bold">Reels</span>
            </div>

            {/* The right-hand rail, kept from the organic reel. */}
            <div aria-hidden="true" className="absolute right-2.5 bottom-[150px] flex flex-col items-center gap-5 text-[11px] font-semibold">
                <span className="flex flex-col items-center gap-1">
                    <Heart className="size-[27px]" strokeWidth={1.8} />
                    {ad.counts.likes}
                </span>
                <span className="flex flex-col items-center gap-1">
                    <MessageCircle01 className="size-[27px] -scale-x-100" strokeWidth={1.8} />
                    {ad.counts.comments}
                </span>
                <span className="flex flex-col items-center gap-1">
                    <Send02 className="size-[27px] -rotate-12" strokeWidth={1.8} />
                    {ad.counts.sends}
                </span>
                <DotsHorizontal className="size-[24px]" strokeWidth={2.2} />
            </div>

            <div className="mt-auto">
                <div className="flex flex-col gap-2 px-3 pb-3">
                    <span className="flex items-center gap-2.5">
                        <IgAvatar src={ad.author.avatar} alt="" size={30} className="ring-1 ring-(--ig-text)/60" />
                        <span className="flex min-w-0 flex-col leading-tight">
                            <IgHandle handle={ad.author.handle} verified={ad.author.verified} className="text-[13px] font-semibold" />
                            <span className="text-[11px]">Sponsored</span>
                        </span>
                    </span>

                    <span className="max-w-[74%] text-[13px] leading-[18px]">{ad.caption}</span>

                    <span className="flex max-w-[70%] items-center gap-1.5 text-[12px]">
                        <MusicNote01 aria-hidden="true" className="size-[13px] shrink-0" strokeWidth={2.2} />
                        <span className="truncate">Original audio · {ad.author.handle}</span>
                    </span>
                </div>

                <IgCtaBar label={ad.cta} tint={ad.ctaTint} />
                <IgTabBar active="reels" avatar={avatar} />
            </div>
        </div>
    </div>
);

export const IgReelsAdSurface = ({ ad, avatar }: { ad: IgAd; avatar: string }) => (
    <IgScreen label={`Instagram reels ad mockup — sponsored full-screen reel by @${ad.author.handle} with a "${ad.cta}" call to action`}>
        <IgReelsAdScreen ad={ad} avatar={avatar} />
    </IgScreen>
);
