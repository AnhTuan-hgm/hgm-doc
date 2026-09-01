import { ChevronLeft, DotsHorizontal, Grid01, Link01, Repeat01, UserPlus01, UserSquare } from "@untitledui-pro/icons/line";
import { Pin02, Play } from "@untitledui-pro/icons/solid";
import { cx } from "@/utils/cx";
import { IgAvatar, IgFacepile, IgHandle, IgScreen, IgStatusBar, IgTabBar, IgTilePlaceholder, ReelsGlyph } from "./ig-chrome";
import type { IgGridItem, IgHighlight, IgProfile } from "./instagram-data";

/**
 * THE PROFILE SCREEN — the only surface the supplied Figma actually contains.
 *
 * Its nine bands, and the heights they were read at. The Figma is iPhone 14/15
 * (850.49pt tall) and we build at iPhone 17 Pro (874pt), so every height below is
 * the Figma's measurement × 1.0276. They are recorded because the second, finer
 * decomposition in that file tiles the screen exactly — its eight bands above the
 * grid sum to 579.375 against the 579.08 the geometry implies, which is what makes
 * this a reading rather than a guess.
 *
 *   band              Figma    here    component
 *   status bar         46.75    48      IgStatusBar (ig-chrome)
 *   nav header         56.50    58      IgProfileTopBar
 *   identity          114.00   117      IgProfileHeader + IgStat ×3
 *   bio               105.00   108      IgBio
 *   social proof       54.00    56      IgBio's footer row
 *   actions            52.00    54      IgActionRow
 *   highlights        103.50   106      IgHighlights
 *   tabs               47.63    49      IgProfileTabs
 *   grid row          173.84   178      IgGrid + IgGridTile
 *
 * THE GRID IS 3:4, NOT SQUARE AND NOT 4:5. Measured off the Figma: cells are
 * 130.49 × 173.84, a ratio of 0.7506. Instagram moved profile grids to portrait
 * some time ago and mockups built from memory tend to land on 1:1 or 4:5; this is
 * what the reference actually shows.
 */

/* -------------------------------------------------------------------------- */
/* 9 · IgStat                                                                  */
/* -------------------------------------------------------------------------- */

/** Value over label, centred. Four lines, used three times. */
const IgStat = ({ value, label }: { value: string; label: string }) => (
    <span className="flex flex-1 flex-col items-center gap-0.5">
        <span className="text-[17px] leading-none font-semibold">{value}</span>
        <span className="text-[13px] leading-none">{label}</span>
    </span>
);

/* -------------------------------------------------------------------------- */
/* 10 · IgProfileTopBar                                                        */
/* -------------------------------------------------------------------------- */

/**
 * THE VISITOR VARIANT, matching the Figma: back chevron, handle with the verified
 * tick, overflow dots. Not the own-profile variant (switcher chevron, plus, menu),
 * because the action row below is Follow / Message / Email — which only exists on
 * somebody else's profile. Getting those two halves from different states was the
 * first thing that looked wrong on screen.
 *
 * The tab bar is therefore set to `search` by the screen below, not `profile`:
 * Instagram keeps the tab you arrived from highlighted, and search is how you
 * reach another account. The Figma cannot settle this one — its screenshots are
 * cropped above the tab bar.
 */
const IgProfileTopBar = ({ handle, verified }: { handle: string; verified?: boolean }) => (
    <div className="flex h-[58px] shrink-0 items-center gap-4 px-4">
        <ChevronLeft aria-hidden="true" className="size-[26px] shrink-0" strokeWidth={2.2} />

        <IgHandle handle={handle} verified={verified} className="min-w-0 flex-1 text-[19px] font-semibold" tickClassName="size-[16px]" />

        <DotsHorizontal aria-hidden="true" className="size-[24px] shrink-0" strokeWidth={2.2} />
    </div>
);

/* -------------------------------------------------------------------------- */
/* 11 · IgProfileHeader                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Avatar at 86px — larger than the project `Avatar`'s 64px ceiling, which is one
 * of the four reasons `IgAvatar` exists. The ring is on because this account has
 * an unwatched story, which is what the Figma shows.
 */
const IgProfileHeader = ({ profile }: { profile: IgProfile }) => (
    <div className="flex h-[117px] shrink-0 items-center gap-4 px-4">
        <IgAvatar src={profile.avatar} alt={`${profile.displayName} profile photo`} size={86} ring="unseen" />

        <div className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="truncate text-[15px] font-semibold">{profile.displayName}</span>
            <span className="flex items-center">
                <IgStat value={profile.stats.posts} label="posts" />
                <IgStat value={profile.stats.followers} label="followers" />
                <IgStat value={profile.stats.following} label="following" />
            </span>
        </div>
    </div>
);

/* -------------------------------------------------------------------------- */
/* 12 · IgBio                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Category, bio lines, link chip, then the "Followed by" row.
 *
 * EMOJI RENDER FROM THE SYSTEM FONT, so 🌵 📰 👇 differ in appearance and advance
 * width across macOS, Windows and Android. Line breaking in this block therefore
 * differs by platform — not by scale, since the matrix guarantees one layout at
 * every scale. Do not write a check that asserts a line count or a height here.
 */
const IgBio = ({ profile }: { profile: IgProfile }) => (
    <div className="flex shrink-0 flex-col gap-1.5 px-4 text-[13px] leading-[18px]">
        <span className="text-(--ig-text-secondary)">{profile.category}</span>

        {profile.bio.map((line) => (
            <span key={line}>{line}</span>
        ))}

        <span className="mt-0.5 flex items-center gap-1 font-semibold text-(--ig-blue)">
            <Link01 aria-hidden="true" className="size-[13px] shrink-0 rotate-45" strokeWidth={2.5} />
            <span className="truncate">{profile.link.label}</span>
        </span>

        {profile.followedBy && (
            <span className="mt-2.5 flex h-[38px] items-center gap-2 text-[12px] leading-[16px] text-(--ig-text-secondary)">
                <IgFacepile people={profile.followedBy.people} />
                <span className="line-clamp-2">{profile.followedBy.text}</span>
            </span>
        )}
    </div>
);

/* -------------------------------------------------------------------------- */
/* 13 · IgActionRow                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Follow / Message / Email / person-add, at the widths the Figma shows: Follow
 * takes a little more than a third, the two secondaries share the rest, and the
 * icon button is square on the end.
 *
 * These are SPANS, not buttons. Nothing in this surface is operable — see the
 * role="img" note in ig-chrome.
 */
const IgActionRow = () => (
    <div className="flex h-[54px] shrink-0 items-center gap-1.5 px-4">
        <span className="flex h-[32px] flex-[1.15] items-center justify-center rounded-[9px] bg-(--ig-blue) text-[14px] font-semibold">Follow</span>
        <span className="flex h-[32px] flex-1 items-center justify-center rounded-[9px] bg-(--ig-elevated) text-[14px] font-semibold">Message</span>
        <span className="flex h-[32px] flex-1 items-center justify-center rounded-[9px] bg-(--ig-elevated) text-[14px] font-semibold">Email</span>
        <span className="flex size-[32px] shrink-0 items-center justify-center rounded-[9px] bg-(--ig-elevated)">
            <UserPlus01 aria-hidden="true" className="size-[17px]" strokeWidth={2.2} />
        </span>
    </div>
);

/* -------------------------------------------------------------------------- */
/* 14 · IgHighlights                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Horizontally scrolling covers. `scrollbar-hide` is an existing project utility
 * (globals.css:16), so this needs no new CSS.
 *
 * A highlight cover gets a thin grey ring, not the story gradient — the gradient
 * means "unwatched story", which a highlight never is. The Figma's covers are
 * muted olive and beige photographs; without those assets each falls back to
 * IgAvatar's silhouette, which is the honest empty state.
 */
const IgHighlights = ({ items }: { items: IgHighlight[] }) => (
    <div className="scrollbar-hide flex h-[106px] shrink-0 items-start gap-4 overflow-x-auto px-4 pt-1">
        {items.map((item) => (
            <span key={item.label} className="flex w-[62px] shrink-0 flex-col items-center gap-1.5">
                <span className="rounded-full p-[1.5px] ring-1 ring-(--ig-text)/25">
                    <IgAvatar src={item.src} alt="" size={60} />
                </span>
                <span className="w-full truncate text-center text-[11px] leading-[14px]">{item.label}</span>
            </span>
        ))}
    </div>
);

/* -------------------------------------------------------------------------- */
/* 15 · IgProfileTabs                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Four tabs, and the active one is marked by an underline rather than a colour
 * change — which is why the inactive glyphs are dimmed instead.
 *
 * The reels tab in the Figma is drawn as a filled rounded square with a play
 * triangle, so `ReelsGlyph active` matches the reference rather than approximating
 * it.
 */
/**
 * The four tabs, exported because the 1:1 carousel in instagram-screen.tsx pages
 * through them and needs to name them without re-typing the union.
 */
export type IgProfileTab = "grid" | "reels" | "repost" | "tagged";

const IgProfileTabs = ({ active }: { active: IgProfileTab }) => {
    const tabs = [
        { id: "grid", node: <Grid01 className="size-[25px]" strokeWidth={1.8} /> },
        { id: "reels", node: <ReelsGlyph active={active === "reels"} className="size-[25px]" /> },
        { id: "repost", node: <Repeat01 className="size-[25px]" strokeWidth={1.8} /> },
        { id: "tagged", node: <UserSquare className="size-[25px]" strokeWidth={1.8} /> },
    ] as const;

    return (
        <div aria-hidden="true" className="flex h-[49px] shrink-0 items-stretch border-b border-(--ig-separator)">
            {tabs.map((tab) => (
                <span
                    key={tab.id}
                    className={cx(
                        "relative flex flex-1 items-center justify-center pb-2.5",
                        active === tab.id ? "text-(--ig-text)" : "text-(--ig-text-tertiary)",
                    )}
                >
                    {tab.node}
                    {active === tab.id && <span className="absolute inset-x-0 -bottom-px h-[2px] bg-(--ig-text)" />}
                </span>
            ))}
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/* 16 · IgGridTile                                                             */
/* -------------------------------------------------------------------------- */

/**
 * The view count sits bottom-left behind a play glyph; the pin sits top-right.
 * Both are on the media with no scrim, which is how Instagram draws them — it
 * relies on the drop shadow the glyphs carry, so on a pale still they can get
 * thin. That is Instagram's compromise, reproduced rather than corrected.
 */
const IgGridTile = ({ item }: { item: IgGridItem }) => (
    <span className="relative block aspect-3/4 overflow-hidden">
        {item.src ? <img src={item.src} alt={item.alt} width={268} height={357} className="size-full object-cover" /> : <IgTilePlaceholder kind={item.kind} />}

        {item.pinned && (
            <span aria-hidden="true" className="absolute top-1.5 right-1.5 drop-shadow-[0_1px_2px_rgb(0_0_0/0.6)]">
                <Pin02 className="size-[17px]" />
            </span>
        )}

        {item.views && (
            <span
                aria-hidden="true"
                className="absolute bottom-1.5 left-1.5 flex items-center gap-1 text-[12px] font-semibold drop-shadow-[0_1px_2px_rgb(0_0_0/0.6)]"
            >
                <Play className="size-[13px]" />
                {item.views}
            </span>
        )}
    </span>
);

/* -------------------------------------------------------------------------- */
/* 17 · IgGrid                                                                 */
/* -------------------------------------------------------------------------- */

/** Three columns, 1.5px gutters — Instagram's hairline, not a spacing token. */
const IgGrid = ({ items }: { items: IgGridItem[] }) => (
    <div className="grid grid-cols-3 gap-[1.5px]">
        {items.map((item) => (
            <IgGridTile key={item.alt} item={item} />
        ))}
    </div>
);

/* -------------------------------------------------------------------------- */
/* 17b · IgEmptyTab                                                            */
/* -------------------------------------------------------------------------- */

/**
 * The empty state, which is a real Instagram surface and one this library did not
 * have until the profile learned to change tabs.
 *
 * Its shape is the app's own and worth recording: a large OUTLINE glyph inside a
 * hairline ring, a 22px bold line, and one 13px secondary line under it. It is the
 * only place in this folder a glyph is drawn at 34px, and it is a third use of
 * 22px bold — a size the system board previously counted at three.
 *
 * IT IS ALSO THE HONEST ANSWER TO A CONTENT PROBLEM. We hold one set of stills for
 * this account and it is a set of reels. Repeating those tiles under "Reposts" and
 * "Tagged" would invent client content that does not exist; an empty state is what
 * those tabs would truthfully show.
 */
const IgEmptyTab = ({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) => (
    <div aria-hidden="true" className="flex h-full flex-col items-center justify-center gap-3 px-12 text-center">
        <span className="flex size-[62px] items-center justify-center rounded-full ring-[1.5px] ring-(--ig-text) ring-inset [&>svg]:size-[34px]">{icon}</span>
        <span className="mt-1 text-[22px] font-bold text-(--ig-text)">{title}</span>
        <span className="text-[13px] text-(--ig-text-secondary)">{body}</span>
    </div>
);

/**
 * WHAT EACH TAB SHOWS, and why the four are not the same grid four times.
 *
 * `reels` is the account as it really is — row one is real client footage, the
 * rest fall back to the empty-tile state until the stills land. `grid` runs the
 * same nine cells as PHOTO placeholders, because `IgTilePlaceholder` draws a
 * different glyph per kind, and that is the honest difference between a photo tab
 * with no photos yet and a reel tab with reels. The other two are empty states.
 */
const tabContent = (tab: IgProfileTab, items: IgGridItem[]) => {
    if (tab === "reels") return <IgGrid items={items} />;

    // Same cells, stripped back to photo placeholders: no src, no view count, no
    // pin — those three belong to the reel that occupied the cell, not to the cell.
    if (tab === "grid") return <IgGrid items={items.map((item) => ({ alt: `${item.alt} — photo slot`, kind: "photo" as const }))} />;

    if (tab === "repost") return <IgEmptyTab icon={<Repeat01 strokeWidth={1.6} />} title="No Reposts Yet" body="When you repost, it will appear here." />;

    return <IgEmptyTab icon={<UserSquare strokeWidth={1.6} />} title="No Photos" body="When people tag you in photos, they'll appear here." />;
};

/* -------------------------------------------------------------------------- */
/* 18 · IgProfileScreen                                                        */
/* -------------------------------------------------------------------------- */

/**
 * THE GRID CLIPS UNDER EVERYTHING ELSE. The bands above it are fixed height and
 * the tab bar takes 68 at the bottom, so the grid gets whatever is left and its
 * second row is cut mid-tile — which is exactly what a real profile shows.
 * `overflow-hidden` rather than `overflow-y-auto` because nothing here is
 * interactive.
 */
export const IgProfileScreen = ({ profile, avatar, tab = "reels" }: { profile: IgProfile; avatar: string; tab?: IgProfileTab }) => (
    <div className="flex h-full flex-col">
        <IgStatusBar />
        <IgProfileTopBar handle={profile.handle} verified={profile.verified} />
        <IgProfileHeader profile={profile} />
        <IgBio profile={profile} />
        <IgActionRow />
        <IgHighlights items={profile.highlights} />
        <IgProfileTabs active={tab} />

        {/* `tab` DEFAULTS TO "reels" so both existing callers — the feed's profile
            peek and the 1:1 surface — render exactly what they did before this
            prop existed. Only the carousel passes anything else. */}
        <div className="min-h-0 flex-1 overflow-hidden">{tabContent(tab, profile.grid)}</div>

        <IgTabBar active="search" avatar={avatar} />
    </div>
);

/**
 * The whole profile, staged and scaled.
 *
 * Named `IgProfileSurface` and not `IgProfile` because `IgProfile` is the data
 * type imported above — a value and a type of the same name in one module is a
 * redeclaration error, not a clever overload.
 */
const TAB_LABEL: Record<IgProfileTab, string> = {
    grid: "the photo grid, empty",
    reels: "a grid of reels",
    repost: "the reposts tab, empty",
    tagged: "the tagged tab, empty",
};

export const IgProfileSurface = ({ profile, tab = "reels" }: { profile: IgProfile; tab?: IgProfileTab }) => (
    // The label names the TAB, because the four carousel slides are otherwise four
    // identical announcements — and the tab is the only thing that differs.
    <IgScreen
        label={`Instagram profile mockup for @${profile.handle} — ${profile.stats.followers} followers, ${profile.stats.posts} posts, bio, story highlights and ${TAB_LABEL[tab]}`}
    >
        <IgProfileScreen profile={profile} avatar={profile.avatar} tab={tab} />
    </IgScreen>
);
