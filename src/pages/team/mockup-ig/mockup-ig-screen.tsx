import {
    Bookmark,
    ChevronLeft,
    ChevronRight,
    DotsHorizontal,
    Grid01,
    Heart,
    Home01,
    Link01,
    MessageCircle01,
    MusicNote01,
    Pin02 as Pin02Line,
    PlaySquare,
    Repeat01,
    SearchLg,
    Send02,
    UserPlus01,
    UserSquare,
} from "@untitledui-pro/icons/line";
import Instagram from "@/components/foundations/social-icons/instagram";
import { cx } from "@/utils/cx";
import { ContentsRail } from "@/components/shared-assets/contents-rail";
import type { RailIcon } from "@/components/shared-assets/contents-rail";
import { IgFeedAdSurface, IgReelsAdSurface, IgStoryAdSurface } from "./ig-ads";
import { IG_SCREEN, ReelsGlyph } from "./ig-chrome";
import { IgFeedSurface } from "./ig-feed";
import { IgBioLinkSurface, IgPinnedReelSurface } from "./ig-formats";
import {
    HIGHLIGHT_FAMILY_COUNT,
    HIGHLIGHT_GAP_COUNT,
    HIGHLIGHT_GLYPH_COUNT,
    HIGHLIGHT_PHOSPHOR_COUNT,
    IgHighlightBoard,
    IgHighlightRail,
} from "./ig-highlight-glyphs";
import { IgProfileSurface } from "./ig-profile";
import type { IgProfileTab } from "./ig-profile";
import { IgCarouselSurface, IgInboxSurface, IgInsightsSurface, IgStorySurface } from "./ig-proof";
import { IgReelSurface } from "./ig-reel";
import { IgSystemBoard } from "./ig-system";
import { ads, bioLink, carousel, cohost, insights, story, thread } from "./instagram-data";
import { PhoneFrame } from "@/components/shared-assets/phone-frame";
import { Container, Eyebrow, SectionHeading } from "@/components/shared-assets/site-primitives";
import { SvgDownloadButton } from "./svg-download-button";
import { TabCarousel } from "./tab-carousel";

/**
 * INSTAGRAM — the app UI, rebuilt as components so a client's own account can be
 * shown inside it.
 *
 * PORTED from the hiddengem-media marketing site's `/Mockup-IG` route
 * (`src/app/(site)/Mockup-IG/`, 2026-09-01). The route here is `/mockup-ig` —
 * lowercase, this repo's convention — registered flat in src/main.tsx like every
 * other team page. Not linked from anywhere; a reference page, same standing as
 * `/test`.
 *
 * TWO THINGS THIS ROUTE CARRIES, both flagged in the source and still true here:
 * it recreates Meta's interface (the wordmark is deliberately not attempted and
 * the Reels glyph is our own drawing — mitigation, not clearance), and it shows a
 * real client's account (every number is a public fact on Instagram, but
 * recreating their brand presence on our domain can read as endorsement).
 * Swapping to a fictional account is one export in instagram-data.ts.
 *
 * ------------------------------------------------------------------------
 * THE COLOUR EXEMPTION, AND HOW TO PROVE IT HELD
 * ------------------------------------------------------------------------
 * Instagram's palette lives in src/styles/instagram.css, scoped to `.ig-surface`.
 * It is this project's one sanctioned exception to the semantic-token rule,
 * because the Follow button is #0095F6 or it is wrong, and no HGM token means
 * that.
 *
 * Containment is mechanically checkable. The third grep catches the real
 * failure — our tokens leaking INTO the Instagram surface:
 *
 *   grep -rl -- '--ig-' src | grep -v 'src/pages/team/mockup-ig/' | grep -v 'src/styles/instagram.css'
 *       → no output
 *
 *   grep -rnE '(^|[^-])(bg|text|border)-(primary|secondary|tertiary|quaternary)\b|(^|[^-])(text|bg)-brand' \
 *       src/pages/team/mockup-ig/ig-*.tsx | grep -v ':[0-9]*: *\*'
 *       → no output (ig-highlight-glyphs.tsx's board headings are page chrome
 *         and the one deliberate exception, as in the source)
 *
 * The page chrome below uses HGM tokens and must. The ig-*.tsx surface files
 * must not.
 *
 * ------------------------------------------------------------------------
 * SCALE — WHY 1:1 IS THE FIRST SECTION AND NOT THE LAST
 * ------------------------------------------------------------------------
 * Every surface is authored at 402 × 874 with real 13px type and scaled by one
 * matrix. A 440px phone frame yields a 402.05px screen with THIS repo's bezel
 * crop (the screen is 91.374% of the frame), so the scale lands on 1.0001 and
 * Instagram renders at the size it was drawn — the only presentation where the
 * type is genuinely readable, so it leads. The shrunken frames come after, at
 * the sizes a mockup row usually uses.
 */

/** The owed-asset note, at the size the rest of the project uses inside a section. */
const AssetNote = ({ children }: { children: React.ReactNode }) => (
    <span className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-primary/80 px-2.5 py-1 text-[0.625rem] font-semibold tracking-[0.08em] text-brand-secondary uppercase backdrop-blur-sm">
        <span aria-hidden="true" className="size-1.5 shrink-0 rotate-45 bg-border-brand" />
        {children}
    </span>
);

/**
 * The repeated section shell, so each surface below is only its own content.
 * `first` drops the top border, because the header band above already has a
 * bottom one.
 */
const Section = ({
    id,
    eyebrow,
    heading,
    lede,
    children,
    first,
}: {
    id: string;
    eyebrow: string;
    heading: string;
    lede: React.ReactNode;
    children: React.ReactNode;
    first?: boolean;
}) => (
    <section id={id} className={cx("scroll-mt-20 py-20 md:py-28", !first && "border-t border-secondary")}>
        <Container>
            <Eyebrow>{eyebrow}</Eyebrow>
            <SectionHeading className="mt-4">{heading}</SectionHeading>
            <p className="mt-5 max-w-[62ch] text-lg text-tertiary">{lede}</p>
        </Container>
        {children}
    </section>
);

/**
 * A rail rather than a shrink. 440px does not fit a 320px column, and the two
 * ways out are opposite: shrink it and lose the legibility this section exists
 * to demonstrate, or let it overhang and be dragged. Snap scrolling in its own
 * container, and the body never scrolls horizontally.
 *
 * ONE DEPARTURE FROM THE SOURCE: it used `lg:overflow-visible lg:justify-center`,
 * which lets a three-phone row overhang the viewport and scroll the BODY
 * sideways — measured 119px of horizontal body scroll on the live original at
 * 1440. This repo's rule is that wide content scrolls in its own container, so
 * the rail stays a scroll container at every width and centers with `safe` —
 * a row that fits is centred, one that does not falls back to start and drags,
 * instead of pushing content off the left edge unreachably.
 */
const RAIL = "scrollbar-hide mt-14 flex snap-x snap-mandatory gap-8 overflow-x-auto px-5 pb-4 lg:justify-center-safe lg:px-6";

/**
 * A 1:1 surface in a real bezel. `w-[440px]` is the whole trick: it yields a
 * 402.05px screen, so the scale lands on 1.0001 and Instagram renders at the
 * size it was drawn. Every section below uses it, which is why none of them
 * repeats a width.
 */
const OneToOne = ({ label, caption, children }: { label: string; caption: string; children: React.ReactNode }) => (
    <figure className="flex shrink-0 snap-center flex-col items-center">
        <PhoneFrame label={label} className="w-[440px]">
            {children}
        </PhoneFrame>
        <figcaption className="mt-6 max-w-[36ch] text-center text-sm text-tertiary">{caption}</figcaption>
    </figure>
);

/* -------------------------------------------------------------------------- */
/* Section 01 · The profile at 1:1                                             */
/* -------------------------------------------------------------------------- */

/**
 * The four profile tabs, as carousel slides. The slides are NOT four copies of
 * one grid: `reels` is the real account; `grid` is the same nine cells as photo
 * placeholders; the last two are Instagram's empty state, because this account
 * has one set of stills and it is a set of reels. See `tabContent` in
 * ig-profile.tsx.
 */
const PROFILE_TABS: { tab: IgProfileTab; caption: string }[] = [
    { tab: "grid", caption: "Grid — the photo tab, no photos posted yet" },
    { tab: "reels", caption: "Reels — the live account, row one is real client footage" },
    { tab: "repost", caption: "Reposts — Instagram's empty state, drawn rather than skipped" },
    { tab: "tagged", caption: "Tagged — the same empty state, different glyph and copy" },
];

const ProfileOneToOne = () => (
    <>
        <div className="mt-14">
            <TabCarousel
                label="Four tabs, one profile — drag, or use the arrows and dots"
                // Opens on Reels, index 1. The slides run in Instagram's own tab
                // order, so slide 0 is the empty photo tab; landing there would
                // open the section on the least informative screen it has.
                initial={1}
                slides={PROFILE_TABS.map(({ tab, caption }) => ({
                    id: tab,
                    caption,
                    node: (
                        <PhoneFrame label={`Instagram profile — ${tab} tab`} className="w-[440px]">
                            <IgProfileSurface profile={cohost.profile} tab={tab} />
                        </PhoneFrame>
                    ),
                }))}
            />
        </div>

        <Container>
            {/*
              THE REAL CONTENT, REPEATED IN OUR TOKENS AT FULL SIZE. Not duplication
              for its own sake: the surface above is role="img", so a screen reader
              gets one label and nothing else. Anyone who cannot read 7.9px type — or
              any type — gets the account here instead.
            */}
            <dl className="mt-10 grid max-w-[62ch] gap-x-8 gap-y-3 text-sm sm:grid-cols-[auto_1fr]">
                {[
                    ["Handle", `@${cohost.profile.handle}`],
                    ["Name", cohost.profile.displayName],
                    ["Category", cohost.profile.category],
                    [
                        "Stats",
                        `${cohost.profile.stats.posts} posts · ${cohost.profile.stats.followers} followers · ${cohost.profile.stats.following} following`,
                    ],
                    ["Bio", cohost.profile.bio.join(" / ")],
                    ["Link", cohost.profile.link.label],
                ].map(([term, value]) => (
                    <div key={term} className="sm:col-span-2 sm:grid sm:grid-cols-subgrid">
                        <dt className="font-semibold text-secondary">{term}</dt>
                        <dd className="text-tertiary">{value}</dd>
                    </div>
                ))}
            </dl>

            <p className="mt-8 flex flex-wrap items-center gap-3 text-sm text-tertiary">
                <AssetNote>6 grid stills owed</AssetNote>
                Row one is real client footage. Rows two and three fall back to the empty-tile state until the stills land.
            </p>
        </Container>
    </>
);

/* -------------------------------------------------------------------------- */
/* Section 02 · Feed and reel                                                  */
/* -------------------------------------------------------------------------- */

const FeedAndReel = () => (
    <div className={RAIL}>
        <figure className="flex shrink-0 snap-center flex-col items-center">
            <PhoneFrame label="Instagram feed" className="w-[440px]">
                <IgFeedSurface stories={cohost.stories} posts={cohost.feed} avatar={cohost.profile.avatar} />
            </PhoneFrame>
            <figcaption className="mt-6 text-center text-sm text-tertiary">Feed — stories rail and a post</figcaption>
        </figure>

        <figure className="flex shrink-0 snap-center flex-col items-center">
            <PhoneFrame label="Instagram reel" className="w-[440px]">
                <IgReelSurface reel={cohost.reel} avatar={cohost.profile.avatar} />
            </PhoneFrame>
            <figcaption className="mt-6 text-center text-sm text-tertiary">Reel — full screen, real client footage</figcaption>
        </figure>
    </div>
);

/* -------------------------------------------------------------------------- */
/* Section 03 · The same surfaces at the usual mockup sizes                    */
/* -------------------------------------------------------------------------- */

const AtMockupScale = () => (
    <div className="mt-14 scrollbar-hide flex snap-x snap-mandatory gap-6 overflow-x-auto px-5 pb-4 lg:justify-center-safe lg:gap-10 lg:px-6">
        <figure className="flex w-[210px] shrink-0 snap-center flex-col items-center sm:w-[240px] lg:w-[268px]">
            <PhoneFrame label="Instagram profile" className="w-full">
                <IgProfileSurface profile={cohost.profile} />
            </PhoneFrame>
            <figcaption className="mt-6 text-center text-sm text-tertiary">Profile</figcaption>
        </figure>

        <figure className="flex w-[210px] shrink-0 snap-center flex-col items-center sm:w-[240px] lg:w-[268px]">
            <PhoneFrame label="Instagram feed" className="w-full">
                <IgFeedSurface stories={cohost.stories} posts={cohost.feed} avatar={cohost.profile.avatar} />
            </PhoneFrame>
            <figcaption className="mt-6 text-center text-sm text-tertiary">Feed</figcaption>
        </figure>

        <figure className="flex w-[210px] shrink-0 snap-center flex-col items-center sm:w-[240px] lg:w-[268px]">
            <PhoneFrame label="Instagram reel" className="w-full">
                <IgReelSurface reel={cohost.reel} avatar={cohost.profile.avatar} />
            </PhoneFrame>
            <figcaption className="mt-6 text-center text-sm text-tertiary">Reel</figcaption>
        </figure>
    </div>
);

/* -------------------------------------------------------------------------- */
/* Sections 04-08 · Formats and paid placements                                */
/* -------------------------------------------------------------------------- */

const PinReel = () => (
    <div className={RAIL}>
        <OneToOne label="Instagram pinned reel" caption="The pinned band is its own row — the corner badge belongs to the grid tile, not the opened post.">
            <IgPinnedReelSurface reel={cohost.reel} avatar={cohost.profile.avatar} />
        </OneToOne>
    </div>
);

const BioLink = () => (
    <div className={RAIL}>
        <OneToOne label="Link-in-bio page" caption="Not Instagram — the page the profile link points at, so it gets browser chrome rather than app chrome.">
            <IgBioLinkSurface bio={bioLink} />
        </OneToOne>
    </div>
);

const AdPlacements = () => (
    <div className={RAIL}>
        <OneToOne
            label="Instagram feed ad"
            caption="Style 1 · Feed. The header floats on the creative and the CTA bar is tinted from it — both read off the reference."
        >
            <IgFeedAdSurface ad={ads.feed} avatar={cohost.profile.avatar} />
        </OneToOne>
        <OneToOne label="Instagram story ad" caption="Style 2 · Story. No tab bar and no CTA bar: the swipe-up is the whole call to action.">
            <IgStoryAdSurface ad={ads.story} />
        </OneToOne>
        <OneToOne label="Instagram reels ad" caption="Style 3 · Reels. Keeps the organic reel's action rail; the CTA strip sits above the tab bar.">
            <IgReelsAdSurface ad={ads.reels} avatar={cohost.profile.avatar} />
        </OneToOne>
    </div>
);

/* -------------------------------------------------------------------------- */
/* Sections 09-12 · Deliverables and proof                                     */
/* -------------------------------------------------------------------------- */

const Deliverables = () => (
    <div className={RAIL}>
        <OneToOne
            label="Instagram story"
            caption="Organic, with the stickers that are the actual deliverable — poll, link, location. A story with no sticker is just a vertical video."
        >
            <IgStorySurface data={story} />
        </OneToOne>
        <OneToOne
            label="Instagram carousel"
            caption="Slide two of five. The track is a real row, so the neighbouring slides exist rather than being implied by dots."
        >
            <IgCarouselSurface data={carousel} avatar={cohost.profile.avatar} />
        </OneToOne>
    </div>
);

const ProofSurfaces = () => (
    <div className={RAIL}>
        <OneToOne label="Instagram insights" caption="Four metric tiles, a thirty-day reach series and top posts. Every figure is invented.">
            <IgInsightsSurface data={insights} avatar={cohost.profile.avatar} />
        </OneToOne>
        <OneToOne label="Instagram direct message" caption="A booking enquiry — for a rental client, the money moment. Every message is invented.">
            <IgInboxSurface data={thread} avatar={cohost.profile.avatar} />
        </OneToOne>
    </div>
);

/* -------------------------------------------------------------------------- */
/* Section 13 · The glyph set                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Shown at 24px, the size the surfaces draw them at 1:1, on the Instagram canvas
 * rather than ours — an outline glyph's weight reads differently on black, and
 * this is the context they have to survive.
 *
 * ONLY ONE IS DRAWN. Everything else exists in @untitledui-pro/icons in both
 * `/line` and `/solid`, which is what makes Instagram's filled active states
 * free. Reels has no equivalent in any of the four styles, so `ReelsGlyph` is
 * our construction on Instagram's geometry rather than a copy of Meta's path
 * data.
 */
const GLYPHS = [
    { node: <Home01 strokeWidth={1.7} />, name: "Home01", use: "Tab bar · home" },
    { node: <PlaySquare strokeWidth={1.7} />, name: "PlaySquare", use: "Tab bar · reels" },
    { node: <Send02 className="-rotate-12" strokeWidth={1.7} />, name: "Send02", use: "Messages · share" },
    { node: <SearchLg strokeWidth={1.7} />, name: "SearchLg", use: "Tab bar · search" },
    { node: <Heart strokeWidth={1.8} />, name: "Heart", use: "Like — filled when active" },
    { node: <MessageCircle01 className="-scale-x-100" strokeWidth={1.8} />, name: "MessageCircle01", use: "Comment" },
    { node: <Bookmark strokeWidth={1.8} />, name: "Bookmark", use: "Save — filled when active" },
    { node: <Grid01 strokeWidth={1.8} />, name: "Grid01", use: "Profile tab · grid" },
    { node: <ReelsGlyph />, name: "ReelsGlyph", use: "Profile tab · reels — DRAWN, no package match" },
    { node: <Repeat01 strokeWidth={1.8} />, name: "Repeat01", use: "Profile tab · reposts" },
    { node: <UserSquare strokeWidth={1.8} />, name: "UserSquare", use: "Profile tab · tagged" },
    { node: <Pin02Line strokeWidth={1.8} />, name: "Pin02", use: "Pinned post" },
    { node: <Link01 className="rotate-45" strokeWidth={2.4} />, name: "Link01", use: "Bio link" },
    { node: <UserPlus01 strokeWidth={2.2} />, name: "UserPlus01", use: "Profile · follow-plus" },
    { node: <MusicNote01 strokeWidth={2.2} />, name: "MusicNote01", use: "Reel audio" },
    { node: <DotsHorizontal strokeWidth={2.2} />, name: "DotsHorizontal", use: "Overflow" },
    { node: <ChevronLeft strokeWidth={2.2} />, name: "ChevronLeft", use: "Profile · back" },
    { node: <ChevronRight strokeWidth={2.4} />, name: "ChevronRight", use: "CTA bar · bio-link rows" },
];

const IconSet = () => (
    <Container>
        <ul className="ig-surface mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-(--ig-separator) sm:grid-cols-3 lg:grid-cols-4">
            {GLYPHS.map((glyph) => (
                <li key={glyph.name} data-glyph className="flex items-center gap-3 bg-(--ig-canvas) px-4 py-3.5 text-(--ig-text)">
                    <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center [&>svg]:size-6">
                        {glyph.node}
                    </span>
                    <span className="flex min-w-0 flex-col">
                        {/* White ink: these are drawn for Instagram's black
                            canvas, so a file that opens black would be the
                            wrong asset. */}
                        <SvgDownloadButton name={glyph.name} ink="#FFFFFF" className="max-w-full font-mono text-[13px] text-(--ig-text)" />
                        <span className="truncate text-[12px] text-(--ig-text-secondary)">{glyph.use}</span>
                    </span>
                </li>
            ))}
        </ul>
    </Container>
);

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * The contents rail is a trimmed port of the source's `BackdropNav` — see
 * contents-rail.tsx for what was kept and what was dropped. Families are the
 * page's own structure; the `number` on each entry is the leading number of its
 * section eyebrow, not its index, because several sections cover a range
 * ("Sections 06-08") and a rail that renumbers them would disagree with the
 * page it indexes.
 */
const railIcons: Record<string, RailIcon> = {
    Surfaces: "phone",
    "Off-app": "browser",
    Advertising: "announce",
    Deliverables: "film",
    Proof: "bar-chart",
    Glyphs: "grid",
};

const railItems = [
    { id: "one-to-one", name: "The profile, at 1:1", family: "Surfaces", number: "01" },
    { id: "feed-and-reel", name: "Feed and reel", family: "Surfaces", number: "02" },
    { id: "at-scale", name: "At the usual size", family: "Surfaces", number: "03" },
    { id: "pin-reel", name: "Pin Reel", family: "Surfaces", number: "04" },
    { id: "bio-link", name: "Bio Link", family: "Off-app", number: "05" },
    { id: "ads", name: "Ad, three placements", family: "Advertising", number: "06" },
    { id: "deliverables", name: "Story and carousel", family: "Deliverables", number: "09" },
    { id: "proof", name: "Insights and enquiries", family: "Proof", number: "11" },
    { id: "icons", name: "The glyph set", family: "Glyphs", number: "13" },
    { id: "highlight-glyphs", name: "Highlight covers", family: "Glyphs", number: "14" },
    { id: "design-system", name: "What makes it Instagram", family: "Glyphs", number: "15" },
];

export const MockupIgScreen = () => (
    // The padding clears the fixed rail from xl — the rail publishes its
    // (draggable) width as --contents-rail, falling back to the 224px default
    // before mount. Every surface here sits in a container or a snap rail, and
    // both are unreadable underneath a rail.
    <main className="min-h-dvh bg-primary xl:pl-[var(--contents-rail,14rem)]">
        <ContentsRail label="Sections" title="Instagram" icons={railIcons} items={railItems} />

        <div className="border-b border-secondary bg-secondary py-10">
            <Container>
                <p className="flex items-center gap-2 font-mono text-xs tracking-[0.14em] text-quaternary uppercase">
                    <Instagram aria-hidden="true" size={14} />
                    Instagram
                </p>
                <h1 className="mt-2 text-display-xs font-semibold text-primary">The app, rebuilt</h1>
                <p className="mt-3 max-w-[62ch] text-md text-tertiary">
                    Thirty components — profile, feed, reel and the bottom tab bar — drawn from Instagram's own palette rather than ours, so a client's account
                    can be shown inside the platform it lives on. Authored at {IG_SCREEN.w}&nbsp;×&nbsp;{IG_SCREEN.h} and scaled by one matrix. Ported from the
                    HiddenGem marketing site. Not linked, not indexed.
                </p>
            </Container>
        </div>

        <Section
            first
            id="one-to-one"
            eyebrow="Section 01"
            heading="The profile, at 1:1"
            lede="A 440px phone gives a 402px screen, so the scale is 1.000 and every glyph sits at the size Instagram draws it. This is the only presentation where the 13px type is genuinely readable, which is why it leads. Paged through the profile's four tabs — drag it, or use the arrows and the dots."
        >
            <ProfileOneToOne />
        </Section>

        <Section
            id="feed-and-reel"
            eyebrow="Section 02"
            heading="Feed and reel"
            lede="Neither is in the Figma — those screenshots are cropped at the grid — so both are rebuilt from the current app. The reel carries real client footage through ReelVideo, which means it holds a still under reduced motion and on any deploy where the MP4 is absent — as it is here: only the posters were ported."
        >
            <FeedAndReel />
        </Section>

        <Section
            id="at-scale"
            eyebrow="Section 03"
            heading="At the library's usual size"
            lede="The same three surfaces in a 268px frame — a 245px screen, a 0.61 scale, and 13px type landing at 7.9px. It does not read, and it is not meant to: at this size an Instagram screen is texture and layout. Here so nobody plans a section around the assumption that the words are legible."
        >
            <AtMockupScale />
        </Section>

        <Section
            id="pin-reel"
            eyebrow="Section 04"
            heading="Pin Reel"
            lede="A reel opened from the top of a grid, with the pinned label as its own band above the video. Four bands rather than three, which is what the Figma outline gives this format."
        >
            <PinReel />
        </Section>

        <Section
            id="bio-link"
            eyebrow="Section 05"
            heading="Bio Link"
            lede="The destination the profile link points at, which means leaving the app — so this one wears browser chrome, and it is the only surface here that is our page rather than Meta's."
        >
            <BioLink />
        </Section>

        <Section
            id="ads"
            eyebrow="Sections 06-08"
            heading="Instagram ad, three placements"
            lede="Feed, story and reels. Only the feed ad has a reference: the Figma's ad page holds seven real ones and decomposes a screenshot into status bar, body and footer that tile the screen exactly. The story and reels placements are rebuilt from the app, so treat their detail as informed rather than verified."
        >
            <AdPlacements />
        </Section>

        <Section
            id="deliverables"
            eyebrow="Sections 09-10"
            heading="Story and carousel"
            lede="The two formats an agency is most often actually asked for. The story is the organic one — the ad placement above is a different surface — and its stickers are the thing being planned, so they are drawn rather than implied."
        >
            <Deliverables />
        </Section>

        <Section
            id="proof"
            eyebrow="Sections 11-12"
            heading="Insights and enquiries"
            lede="The two surfaces that carry proof rather than content, and the two most dangerous in the library: they look like evidence, and every number and message in them is invented. Screenshotting one into a deck would be fabricating a result. Real figures have to come from the client's own insights, real messages from their own inbox, with permission."
        >
            <ProofSurfaces />
        </Section>

        <Section
            id="icons"
            eyebrow="Section 13"
            heading="The glyph set"
            lede="Every icon these surfaces use, at the size they use it. All but one come from the project's own package in both outline and filled weights, so Instagram's active states cost no extra asset — the exception is Reels, which has no equivalent and is drawn here."
        >
            <IconSet />
        </Section>

        <Section
            id="highlight-glyphs"
            eyebrow="Section 14"
            heading="Highlight covers"
            lede={`Section 13 is Instagram's vocabulary; this is ours. ${HIGHLIGHT_GLYPH_COUNT} cover glyphs in ${HIGHLIGHT_FAMILY_COUNT} families for the one industry this agency sells to — short lets, boutique stays and the destination brands beside them. The labels are read off three real profiles rather than invented, and ${HIGHLIGHT_PHOSPHOR_COUNT} of the ${HIGHLIGHT_GLYPH_COUNT} come from Phosphor because the house set has no hospitality vocabulary at all: ${HIGHLIGHT_GAP_COUNT} of them have no Untitled UI equivalent to fall back to.`}
        >
            <Container>
                <div className="mt-14 max-w-[420px]">
                    <IgHighlightRail />
                </div>
                <IgHighlightBoard />
            </Container>
        </Section>

        <Section
            id="design-system"
            eyebrow="Section 15"
            heading="What makes it Instagram"
            lede="The glyph set above is one atom of twelve. This is the rest of the vocabulary every surface on this page is assembled from — palette, type, radii, geometry, proportions, the alpha ramp, and twelve composed pieces split into the six that carry the recognition and the six that carry the state. Read back out of the surfaces rather than declared over them."
        >
            <Container>
                <div className="mt-14">
                    <IgSystemBoard avatar={cohost.profile.avatar} />
                </div>
            </Container>
        </Section>
    </main>
);
