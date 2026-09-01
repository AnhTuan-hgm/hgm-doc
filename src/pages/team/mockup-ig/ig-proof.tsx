import {
    ArrowNarrowUp,
    Bookmark,
    Camera01,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    DotsHorizontal,
    Heart,
    Image01,
    InfoCircle,
    MarkerPin01,
    MessageCircle01,
    Microphone01,
    Phone,
    Send02,
    VideoRecorder,
    X,
} from "@untitledui-pro/icons/line";
import { cx } from "@/utils/cx";
import { IgAvatar, IgHandle, IgScreen, IgStatusBar, IgStoryProgress, IgTabBar, IgTilePlaceholder } from "./ig-chrome";
import type { IgCarousel, IgInsights, IgStoryOrganic, IgThread } from "./instagram-data";
import { ReelVideo } from "@/components/shared-assets/reel-video";

/**
 * FOUR MORE SURFACES, chosen for what the library is actually for.
 *
 * The sections before this cover chrome — profile, feed, reel, three ad placements.
 * What they do not cover is the two things an agency page has to do: show PROOF that
 * the work worked, and show the DELIVERABLE itself. So:
 *
 *   Insights   the numbers. Reach, engagement, a thirty-day series, top posts.
 *   Story      the organic one, with poll / link / location stickers. Only the ad
 *              placement existed before, and the stickers ARE the deliverable.
 *   Carousel   the five-slide post, a staple that had no surface.
 *   Inbox      a booking enquiry, which for a rental client is the money moment.
 *
 * ------------------------------------------------------------------------
 * ⚠ THESE ARE THE FOUR MOST DANGEROUS SURFACES IN THE LIBRARY
 * ------------------------------------------------------------------------
 * An insights screen and a guest message are not chrome — they LOOK like evidence,
 * and every number and sentence in them is invented. Rendering convincingly is the
 * whole point of the component and also exactly what makes it easy to misuse by
 * accident: a screenshot of `IgInsightsSurface` in a deck is a fabricated result,
 * and a screenshot of `IgInboxSurface` is a fabricated testimonial.
 *
 * If either is used in anything client-facing, the numbers must come from that
 * client's own insights and the messages from their own inbox, with permission. The
 * placeholder handle is `a_guest_account` rather than a plausible name for exactly
 * this reason — it should look staged until someone replaces it on purpose.
 *
 * None of these four has a reference in any supplied Figma. All are built from the
 * current app, so treat the detail as informed rather than verified.
 */

/* -------------------------------------------------------------------------- */
/* 39 · IgInsights                                                             */
/* -------------------------------------------------------------------------- */

/**
 * THE BARS ARE A `<ul>` OF PERCENTAGE HEIGHTS, not a chart library. Thirty values
 * across a 402pt screen is about 11px a bar including its gap — no axis, no label
 * and no tooltip survives that, so the series is drawn as shape only and the numbers
 * that matter live in the four tiles above it. That is also how Instagram draws it.
 *
 * `items-end` on the track plus a percentage height on each bar means the whole
 * thing scales with the stage like everything else here, with no measuring step.
 */
const IgInsightsScreen = ({ data, avatar }: { data: IgInsights; avatar: string }) => (
    <div className="flex h-full flex-col">
        <IgStatusBar />

        <div className="flex h-[52px] shrink-0 items-center gap-3 px-4">
            <ChevronLeft aria-hidden="true" className="size-[24px] shrink-0" strokeWidth={2.2} />
            <span className="flex-1 text-[17px] font-semibold">Insights</span>
            <InfoCircle aria-hidden="true" className="size-[20px] shrink-0" strokeWidth={2} />
        </div>

        <div className="min-h-0 flex-1 overflow-hidden px-4">
            <span className="flex items-center gap-1.5 py-2 text-[13px] font-semibold text-(--ig-text-secondary)">
                {data.range}
                <ChevronDown aria-hidden="true" className="size-[14px]" strokeWidth={2.4} />
            </span>

            {/* Two columns, not four: at 402pt four across gives each 85px and
                "Accounts reached" wraps to three lines. */}
            <ul className="mt-1 grid grid-cols-2 gap-px overflow-hidden rounded-[12px] bg-(--ig-separator)">
                {data.metrics.map((metric) => (
                    <li key={metric.label} className="flex flex-col gap-0.5 bg-(--ig-canvas) p-3">
                        <span className="text-[12px] text-(--ig-text-secondary)">{metric.label}</span>
                        <span className="text-[22px] leading-tight font-semibold">{metric.value}</span>
                        <span className={cx("flex items-center gap-0.5 text-[12px] font-semibold", !metric.up && "opacity-60")}>
                            <ArrowNarrowUp aria-hidden="true" className={cx("size-[12px]", !metric.up && "rotate-180")} strokeWidth={3} />
                            {metric.delta}
                        </span>
                    </li>
                ))}
            </ul>

            <div className="mt-4">
                <span className="text-[13px] font-semibold">Reach by day</span>
                <ul aria-hidden="true" className="mt-2.5 flex h-[92px] items-end gap-[2px]">
                    {data.reachByDay.map((value, index) => (
                        <li key={index} className="flex-1 rounded-t-[2px] bg-(--ig-blue)" style={{ height: `${Math.max(value * 100, 4)}%` }} />
                    ))}
                </ul>
                <span className="mt-1.5 flex justify-between text-[11px] text-(--ig-text-tertiary)">
                    <span>30 days ago</span>
                    <span>Today</span>
                </span>
            </div>

            <div className="mt-4">
                <span className="text-[13px] font-semibold">Top posts by reach</span>
                <ul className="mt-2.5 grid grid-cols-3 gap-[3px]">
                    {data.topPosts.map((post) => (
                        <li key={post.alt} className="relative block aspect-3/4 overflow-hidden rounded-[6px]">
                            {post.src ? (
                                <img src={post.src} alt={post.alt} width={268} height={357} className="size-full object-cover" />
                            ) : (
                                <IgTilePlaceholder />
                            )}
                            <span aria-hidden="true" className="absolute bottom-1 left-1.5 text-[11px] font-semibold drop-shadow-[0_1px_2px_rgb(0_0_0/0.7)]">
                                {post.metric}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>

        <IgTabBar active="profile" avatar={avatar} />
    </div>
);

export const IgInsightsSurface = ({ data, avatar }: { data: IgInsights; avatar: string }) => (
    <IgScreen
        label={`Instagram insights mockup — placeholder figures showing ${data.metrics[0]?.value} accounts reached over ${data.range.toLowerCase()}, a reach-by-day chart and three top posts. The numbers are invented.`}
    >
        <IgInsightsScreen data={data} avatar={avatar} />
    </IgScreen>
);

/* -------------------------------------------------------------------------- */
/* 40 · IgStory — the organic one                                              */
/* -------------------------------------------------------------------------- */

/**
 * THE STICKERS ARE THE DELIVERABLE. A story with no sticker is just a vertical
 * video; the poll, the question and the link are what an agency is actually asked to
 * plan, so they get drawn properly rather than implied.
 *
 * THE POLL IS A FILLED BAR, because that is how a poll looks once anyone has voted —
 * a mockup showing 50/50 with no fill reads as broken rather than neutral. It sits a
 * couple of degrees off square for the same reason Instagram lets you rotate a
 * sticker: perfectly square to the frame, it reads as chrome instead of as something
 * placed on top.
 */
const IgStoryScreen = ({ data }: { data: IgStoryOrganic }) => (
    <div className="relative flex h-full flex-col">
        <span className="absolute inset-0 block overflow-hidden bg-(--ig-elevated)">
            {data.media.src?.endsWith(".mp4") ? (
                <ReelVideo src={data.media.src} poster={data.media.poster ?? ""} />
            ) : (
                data.media.poster && <img src={data.media.poster} alt={data.media.alt} width={804} height={1430} className="size-full object-cover" />
            )}
        </span>

        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[150px] bg-linear-to-b from-black/55 to-transparent" />
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[190px] bg-linear-to-t from-black/55 to-transparent" />

        <div className="relative flex h-full flex-col">
            <IgStatusBar />

            {/* Three frames, the second part-run. Was a hand-rolled second copy of
                the ad's track and had drifted out of register with it — see the
                note on `IgStoryProgress`. */}
            <IgStoryProgress frames={3} current={1} progress={0.55} />

            <div className="flex h-[52px] shrink-0 items-center gap-2.5 px-3">
                <IgAvatar src={data.author.avatar} alt="" size={30} />
                <span className="flex min-w-0 flex-1 items-baseline gap-2">
                    <IgHandle handle={data.author.handle} verified={data.author.verified} className="text-[13px] font-semibold" />
                    <span className="text-[12px] text-(--ig-text)/75">4h</span>
                </span>
                <DotsHorizontal aria-hidden="true" className="size-[20px] shrink-0" strokeWidth={2.2} />
                <X aria-hidden="true" className="size-[20px] shrink-0" strokeWidth={2.2} />
            </div>

            {data.location && (
                <span className="mt-1 ml-3 flex w-fit items-center gap-1 rounded-full bg-black/35 px-2.5 py-1 text-[12px] font-semibold backdrop-blur-sm">
                    <MarkerPin01 aria-hidden="true" className="size-[12px] shrink-0" strokeWidth={2.4} />
                    {data.location}
                </span>
            )}

            {data.poll && (
                <div className="mt-auto mb-auto rotate-[-2deg] px-6">
                    <div className="rounded-[16px] bg-white/92 p-3 text-center shadow-[0_8px_24px_rgb(0_0_0/0.28)]">
                        <span className="block text-[14px] font-bold text-black">{data.poll.question}</span>
                        <div className="mt-2.5 flex flex-col gap-1.5">
                            {data.poll.options.map((option, index) => (
                                <span key={option} className="relative block overflow-hidden rounded-[9px] bg-black/8">
                                    <span
                                        aria-hidden="true"
                                        className="absolute inset-y-0 left-0 bg-(--ig-blue)/30"
                                        style={{ width: `${data.poll?.split[index]}%` }}
                                    />
                                    <span className="relative flex items-center justify-between px-2.5 py-1.5 text-[13px] font-semibold text-black">
                                        {option}
                                        <span>{data.poll?.split[index]}%</span>
                                    </span>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {data.link && (
                <span className="mx-auto mb-3 flex w-fit items-center gap-1.5 rounded-full bg-white/92 px-3.5 py-1.5 text-[13px] font-bold text-black shadow-[0_6px_18px_rgb(0_0_0/0.25)]">
                    {data.link}
                    <ChevronRight aria-hidden="true" className="size-[14px] shrink-0" strokeWidth={3} />
                </span>
            )}

            {/*
              A story's own footer — nothing like a tab bar.

              IT SITS ABOVE A HOME INDICATOR, and that was the fix rather than a
              contrast one. First pass put the bar 12px off the bottom edge with
              nothing under it, and it read as clipped — the story AD had already
              been given this treatment and this surface had not, so two sibling
              screens disagreed about where the bottom of a phone is.

              Measured before changing anything: white on this footer's row is
              11.5:1, because the bar sits over shadowed grass rather than the lit
              grass higher up the frame. So it was never a legibility problem, and
              deepening the scrim would have been the wrong repair.
            */}
            <div className="flex shrink-0 items-center gap-3 px-3">
                <span className="flex flex-1 items-center rounded-full px-3.5 py-2 text-[13px] ring-1 ring-(--ig-text)/55">Send message</span>
                <Heart aria-hidden="true" className="size-[24px] shrink-0" strokeWidth={1.9} />
                <Send02 aria-hidden="true" className="size-[24px] shrink-0 -rotate-12" strokeWidth={1.9} />
            </div>

            <span aria-hidden="true" className="mx-auto mt-3 mb-2 h-[5px] w-[134px] shrink-0 rounded-full bg-(--ig-text)/85" />
        </div>
    </div>
);

export const IgStorySurface = ({ data }: { data: IgStoryOrganic }) => (
    <IgScreen label={`Instagram story mockup — ${data.media.alt}, with a poll sticker reading "${data.poll?.question}", a location chip and a link sticker`}>
        <IgStoryScreen data={data} />
    </IgScreen>
);

/* -------------------------------------------------------------------------- */
/* 41 · IgCarousel                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Five slides showing slide two. Two things carry that and both are needed: the
 * counter pill top-right says where you are, the dot row under the media says how
 * far there is to go.
 *
 * THE SLIDE TRACK IS A REAL ROW translated by whole slide widths, not one image
 * swapped out. It costs nothing and it means the neighbouring slides exist in the
 * DOM, so the format is honestly a carousel rather than a still with dots drawn on.
 */
const IgCarouselScreen = ({ data, avatar }: { data: IgCarousel; avatar: string }) => (
    <div className="flex h-full flex-col">
        <IgStatusBar />

        <div className="flex min-h-0 flex-1 flex-col justify-center">
            <div className="flex h-[54px] shrink-0 items-center gap-2.5 px-3">
                <IgAvatar src={data.author.avatar} alt="" size={34} ring="unseen" />
                <span className="flex min-w-0 flex-1 flex-col leading-tight">
                    <IgHandle handle={data.author.handle} verified={data.author.verified} className="text-[13px] font-semibold" />
                    {data.location && <span className="truncate text-[11px]">{data.location}</span>}
                </span>
                <DotsHorizontal aria-hidden="true" className="size-[20px] shrink-0" strokeWidth={2.2} />
            </div>

            <div className="relative w-full overflow-hidden">
                <div className="flex w-full" style={{ transform: `translateX(-${data.current * 100}%)` }}>
                    {data.slides.map((slide) => (
                        <span key={slide.alt} className="block aspect-4/5 w-full shrink-0 overflow-hidden bg-(--ig-elevated)">
                            {slide.src ? (
                                <img src={slide.src} alt={slide.alt} width={804} height={1005} className="size-full object-cover" />
                            ) : (
                                <IgTilePlaceholder kind="carousel" />
                            )}
                        </span>
                    ))}
                </div>

                <span aria-hidden="true" className="absolute top-3 right-3 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold backdrop-blur-sm">
                    {data.current + 1}/{data.slides.length}
                </span>
            </div>

            <div aria-hidden="true" className="relative flex h-[44px] shrink-0 items-center px-3">
                <span className="flex items-center gap-4">
                    <Heart className="size-[25px]" strokeWidth={1.8} />
                    <MessageCircle01 className="size-[25px] -scale-x-100" strokeWidth={1.8} />
                    <Send02 className="size-[25px] -rotate-12" strokeWidth={1.8} />
                </span>

                <span className="absolute inset-x-0 flex justify-center gap-1">
                    {data.slides.map((slide, index) => (
                        <span key={slide.alt} className={cx("size-[5.5px] rounded-full", index === data.current ? "bg-(--ig-blue)" : "bg-(--ig-text)/25")} />
                    ))}
                </span>

                <Bookmark className="ml-auto size-[25px]" strokeWidth={1.8} />
            </div>

            <div className="flex shrink-0 flex-col gap-1 px-3 text-[13px] leading-[18px]">
                <span className="font-semibold">{data.likes} likes</span>
                <span>
                    <span className="font-semibold">{data.author.handle}</span> {data.caption} <span className="text-(--ig-text-secondary)">more</span>
                </span>
                <span className="text-(--ig-text-secondary)">{data.comments}</span>
            </div>
        </div>

        <IgTabBar active="home" avatar={avatar} />
    </div>
);

export const IgCarouselSurface = ({ data, avatar }: { data: IgCarousel; avatar: string }) => (
    <IgScreen label={`Instagram carousel mockup — slide ${data.current + 1} of ${data.slides.length} in a swipeable post by @${data.author.handle}`}>
        <IgCarouselScreen data={data} avatar={avatar} />
    </IgScreen>
);

/* -------------------------------------------------------------------------- */
/* 42 · IgInbox — a booking enquiry                                            */
/* -------------------------------------------------------------------------- */

/**
 * OUTGOING BUBBLES ARE A GRADIENT IN THE REAL APP — Instagram runs purple into blue
 * down the outgoing side. Kept flat here, because a second gradient would need its
 * own palette entry to earn one use and at 0.61 the difference is invisible.
 *
 * The handle is `a_guest_account` on purpose. See the warning at the top of this
 * file: this surface renders convincingly enough to be mistaken for a real enquiry,
 * and the placeholder should look staged until somebody replaces it deliberately.
 */
const IgInboxScreen = ({ data, avatar }: { data: IgThread; avatar: string }) => (
    <div className="flex h-full flex-col">
        <IgStatusBar />

        <div className="flex h-[56px] shrink-0 items-center gap-3 border-b border-(--ig-separator) px-3">
            <ChevronLeft aria-hidden="true" className="size-[24px] shrink-0" strokeWidth={2.2} />
            <IgAvatar src={data.avatar || undefined} alt="" size={32} />
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate text-[14px] font-semibold">{data.handle}</span>
                <span className="truncate text-[11px] text-(--ig-text-secondary)">{data.status}</span>
            </span>
            <Phone aria-hidden="true" className="size-[20px] shrink-0" strokeWidth={2} />
            <VideoRecorder aria-hidden="true" className="size-[20px] shrink-0" strokeWidth={2} />
        </div>

        {/* `justify-end` so a short conversation sits against the composer, which is
            where a real one always is. */}
        <div className="flex min-h-0 flex-1 flex-col justify-end gap-2 px-3 pb-2">
            {data.messages.map((message) => (
                <span
                    key={message.text}
                    className={cx(
                        "max-w-[76%] rounded-[20px] px-3.5 py-2 text-[14px] leading-[19px]",
                        message.from === "us" ? "self-end bg-(--ig-blue)" : "self-start bg-(--ig-elevated)",
                    )}
                >
                    {message.text}
                </span>
            ))}
            {data.messages.at(-1)?.time && <span className="self-end pr-1 text-[11px] text-(--ig-text-tertiary)">Sent {data.messages.at(-1)?.time} ago</span>}
        </div>

        <div className="flex shrink-0 items-center gap-2.5 px-3 pb-3">
            <span className="flex size-[32px] shrink-0 items-center justify-center rounded-full bg-(--ig-blue)">
                <Camera01 aria-hidden="true" className="size-[17px]" strokeWidth={2} />
            </span>
            <span className="flex flex-1 items-center rounded-full px-3.5 py-2 text-[13px] text-(--ig-text-secondary) ring-1 ring-(--ig-text)/20">
                Message…
            </span>
            <Microphone01 aria-hidden="true" className="size-[21px] shrink-0" strokeWidth={2} />
            <Image01 aria-hidden="true" className="size-[21px] shrink-0" strokeWidth={2} />
        </div>

        <IgTabBar active="messages" avatar={avatar} />
    </div>
);

export const IgInboxSurface = ({ data, avatar }: { data: IgThread; avatar: string }) => (
    <IgScreen label={`Instagram direct message mockup — a placeholder booking enquiry thread with @${data.handle}. Every message is invented.`}>
        <IgInboxScreen data={data} avatar={avatar} />
    </IgScreen>
);
