import { Bookmark, DotsHorizontal, Heart, MessageCircle01, Send02 } from "@untitledui-pro/icons/line";
import Instagram from "@/components/foundations/social-icons/instagram";
import { cx } from "@/utils/cx";
import { IgAvatar, IgHandle, IgScreen, IgStatusBar, IgTabBar, IgTilePlaceholder } from "./ig-chrome";
import type { IgPerson, IgPost } from "./instagram-data";

/**
 * THE FEED SCREEN — NOT in the supplied Figma.
 *
 * Those five screenshots are all the same profile, cropped at the grid. So every
 * component in this file is rebuilt from Instagram's current app rather than read
 * off a reference, and it is only as accurate as knowledge of a UI that ships
 * changes constantly. If fidelity here matters, screenshot the feed and check it —
 * the profile in ig-profile.tsx is the one with a reference behind it.
 *
 * Most likely to be a version behind: whether the top bar carries the camera mark
 * or the wordmark, and whether the action bar has picked up another glyph. The
 * structure — top bar, stories, post header, media, actions, likes, caption,
 * comments link — has been stable for years.
 */

/** Static classes, because Tailwind scans source text and cannot see a template literal. */
const MEDIA_ASPECT: Record<IgPost["media"]["aspect"], string> = {
    "1/1": "aspect-1/1",
    "4/5": "aspect-4/5",
    "9/16": "aspect-9/16",
};

/* -------------------------------------------------------------------------- */
/* 19 · IgFeedTopBar                                                           */
/* -------------------------------------------------------------------------- */

/**
 * USES THE PROJECT'S OWN INSTAGRAM MARK — src/components/foundations/social-icons
 * already ships it as a currentColor SVG, so the feed header needs no new asset.
 *
 * It is the camera outline, NOT the script wordmark. Instagram's real feed header
 * is the wordmark; we are deliberately not attempting that, because a wordmark is
 * the part of their trade dress most clearly a trademark and least defensible to
 * recreate. The camera mark still reads unmistakably as Instagram.
 */
const IgFeedTopBar = () => (
    <div className="flex h-[52px] shrink-0 items-center justify-between px-4">
        <Instagram aria-hidden="true" size={27} />

        <span aria-hidden="true" className="flex items-center gap-4.5">
            <Heart className="size-[26px]" strokeWidth={1.8} />
            <span className="relative">
                <Send02 className="size-[26px] -rotate-12" strokeWidth={1.8} />
                {/* The unread-DM count. Instagram puts it on the messages glyph.
                    11px, not 10: this file's own rule is that nothing is authored
                    below 11px so the scale never meets a clamp, and a badge is not
                    worth being the one exception. */}
                <span className="absolute -top-1 -right-1.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-(--ig-like) px-1 text-[11px] leading-none font-semibold">
                    3
                </span>
            </span>
        </span>
    </div>
);

/* -------------------------------------------------------------------------- */
/* 20 · IgStoriesRail                                                          */
/* -------------------------------------------------------------------------- */

/**
 * "Your story" first with a plus badge instead of a ring, then unwatched stories
 * with the gradient. A watched one drops to flat grey — that state exists in
 * `IgAvatar` as `ring="seen"`, but this account's set is all unwatched, which is
 * the common case and what makes the gradient the thing you notice.
 */
const IgStoriesRail = ({ stories }: { stories: IgPerson[] }) => (
    <div className="scrollbar-hide flex h-[104px] shrink-0 items-start gap-4 overflow-x-auto border-b border-(--ig-separator) px-4 pt-1">
        {stories.map((person, index) => (
            <span key={person.name} className="flex w-[68px] shrink-0 flex-col items-center gap-1.5">
                <span className="relative">
                    <IgAvatar src={person.src} alt="" size={66} ring={index === 0 ? undefined : "unseen"} />
                    {index === 0 && (
                        <span
                            aria-hidden="true"
                            className="absolute right-0 bottom-0 flex size-[21px] items-center justify-center rounded-full bg-(--ig-blue) ring-[2.5px] ring-(--ig-canvas)"
                        >
                            <span className="text-[15px] leading-none font-medium">+</span>
                        </span>
                    )}
                </span>
                <span className="w-full truncate text-center text-[11px] leading-[14px]">{person.name}</span>
            </span>
        ))}
    </div>
);

/* -------------------------------------------------------------------------- */
/* 21 · IgPostHeader                                                           */
/* -------------------------------------------------------------------------- */

const IgPostHeader = ({ post }: { post: IgPost }) => (
    <div className="flex h-[54px] shrink-0 items-center gap-2.5 px-3">
        <IgAvatar src={post.author.avatar} alt="" size={34} ring="unseen" />

        <span className="flex min-w-0 flex-1 flex-col">
            <IgHandle handle={post.author.handle} verified={post.author.verified} className="text-[13px] font-semibold" />
            {post.subtitle && <span className="truncate text-[11px] leading-[14px]">{post.subtitle}</span>}
        </span>

        <DotsHorizontal aria-hidden="true" className="size-[20px] shrink-0" strokeWidth={2.2} />
    </div>
);

/* -------------------------------------------------------------------------- */
/* 22 · IgPostMedia                                                            */
/* -------------------------------------------------------------------------- */

/**
 * 4:5 is the tallest a feed photo goes; 1:1 and 9:16 are the other two. The aspect
 * comes from the data because it changes the post's height, which changes what
 * else fits on screen.
 */
const IgPostMedia = ({ media }: { media: IgPost["media"] }) => (
    <span className={cx("relative block w-full overflow-hidden bg-(--ig-elevated)", MEDIA_ASPECT[media.aspect])}>
        {media.src ? (
            <img src={media.src} alt={media.alt} width={804} height={1005} className="size-full object-cover" />
        ) : (
            <IgTilePlaceholder kind="carousel" />
        )}

        {media.count && media.count > 1 && (
            <span aria-hidden="true" className="absolute top-3 right-3 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold backdrop-blur-sm">
                1/{media.count}
            </span>
        )}
    </span>
);

/* -------------------------------------------------------------------------- */
/* 23 · IgPostActions                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Heart, comment, send on the left; bookmark pushed right; carousel dots centred
 * on the same row — which is why this is one flex row with the dots absolutely
 * centred rather than three groups.
 *
 * `liked` and `saved` swap to the filled glyph. The icon package ships both
 * weights, so the active state costs no extra asset. The heart also goes red,
 * which is the one place Instagram uses that colour.
 */
const IgPostActions = ({ liked, saved, dots }: { liked?: boolean; saved?: boolean; dots?: number }) => (
    <div aria-hidden="true" className="relative flex h-[44px] shrink-0 items-center px-3">
        <span className="flex items-center gap-4">
            <Heart className={cx("size-[25px]", liked && "fill-(--ig-like) text-(--ig-like)")} strokeWidth={1.8} />
            <MessageCircle01 className="size-[25px] -scale-x-100" strokeWidth={1.8} />
            <Send02 className="size-[25px] -rotate-12" strokeWidth={1.8} />
        </span>

        {dots && dots > 1 && (
            <span className="absolute inset-x-0 flex justify-center gap-1">
                {Array.from({ length: dots }, (_, index) => (
                    <span key={index} className={cx("size-[5.5px] rounded-full", index === 0 ? "bg-(--ig-blue)" : "bg-(--ig-text)/25")} />
                ))}
            </span>
        )}

        <Bookmark className={cx("ml-auto size-[25px]", saved && "fill-(--ig-text)")} strokeWidth={1.8} />
    </div>
);

/* -------------------------------------------------------------------------- */
/* 24 · IgPostCaption                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Likes, then the caption with the handle inline as its first word — one text flow,
 * not a header plus a body, which is why the handle is a span inside the paragraph
 * rather than its own row.
 */
const IgPostCaption = ({ post }: { post: IgPost }) => (
    <div className="flex shrink-0 flex-col gap-1 px-3 text-[13px] leading-[18px]">
        <span className="font-semibold">{post.likes} likes</span>

        <span>
            <span className="font-semibold">{post.author.handle}</span> {post.caption}
        </span>

        <span className="text-(--ig-text-secondary)">{post.comments}</span>
        <span className="text-[11px] text-(--ig-text-tertiary)">{post.posted}</span>
    </div>
);

/* -------------------------------------------------------------------------- */
/* 25 · IgPostCard                                                             */
/* -------------------------------------------------------------------------- */

const IgPostCard = ({ post }: { post: IgPost }) => (
    <div className="flex shrink-0 flex-col pb-3">
        <IgPostHeader post={post} />
        <IgPostMedia media={post.media} />
        <IgPostActions liked dots={post.media.count} />
        <IgPostCaption post={post} />
    </div>
);

/* -------------------------------------------------------------------------- */
/* 26 · IgFeedScreen                                                           */
/* -------------------------------------------------------------------------- */

export const IgFeedScreen = ({ stories, posts, avatar }: { stories: IgPerson[]; posts: IgPost[]; avatar: string }) => (
    <div className="flex h-full flex-col">
        <IgStatusBar />
        <IgFeedTopBar />

        <div className="min-h-0 flex-1 overflow-hidden">
            <IgStoriesRail stories={stories} />
            {posts.map((post) => (
                <IgPostCard key={post.caption} post={post} />
            ))}
        </div>

        <IgTabBar active="home" avatar={avatar} />
    </div>
);

/** The whole feed, staged and scaled. */
export const IgFeedSurface = ({ stories, posts, avatar }: { stories: IgPerson[]; posts: IgPost[]; avatar: string }) => (
    <IgScreen
        label={`Instagram feed mockup — a stories rail and a post from @${posts[0]?.author.handle ?? "the account"} with ${posts[0]?.likes ?? "some"} likes`}
    >
        <IgFeedScreen stories={stories} posts={posts} avatar={avatar} />
    </IgScreen>
);
