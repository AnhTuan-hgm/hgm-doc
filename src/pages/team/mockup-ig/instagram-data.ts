/**
 * The content the Instagram surfaces render. One account object drives all three
 * screens, so swapping to a different client — or to a fictional account — is a
 * change at one call site rather than a hunt through JSX.
 *
 * COUNTS ARE STRINGS, NOT NUMBERS, and that is deliberate. "26.4K" and "1,042"
 * are Instagram's own formatting of numbers we read off a screenshot, not values
 * from an API. Storing 26400 would need a formatter to get "26.4K" back, and that
 * formatter would be a second place for the mockup to be wrong.
 */

export type IgGridItem = {
    /** Absent = a still the team still owes; renders as IgTilePlaceholder. */
    src?: string;
    alt: string;
    kind: "photo" | "reel" | "carousel";
    /** Bottom-left, beside a play glyph. Reels only. */
    views?: string;
    pinned?: boolean;
};

export type IgHighlight = { label: string; src?: string };

export type IgPerson = { name: string; src?: string };

export type IgProfile = {
    handle: string;
    displayName: string;
    /** The grey line under the name — Instagram's account category. */
    category: string;
    verified: boolean;
    avatar: string;
    stats: { posts: string; followers: string; following: string };
    bio: string[];
    link: { label: string; href: string };
    followedBy?: { people: IgPerson[]; text: string };
    highlights: IgHighlight[];
    grid: IgGridItem[];
};

export type IgAuthor = Pick<IgProfile, "handle" | "verified" | "avatar">;

export type IgPost = {
    author: IgAuthor;
    /** Instagram's second header line: a location, or the reel's audio. */
    subtitle?: string;
    media: { src?: string; poster?: string; alt: string; aspect: "1/1" | "4/5" | "9/16"; count?: number };
    likes: string;
    caption: string;
    comments: string;
    posted: string;
};

export type IgReel = {
    author: IgAuthor;
    video: { src: string; poster: string; alt: string };
    caption: string;
    audio: string;
    counts: { likes: string; comments: string; sends: string };
};

export type IgAccount = {
    profile: IgProfile;
    stories: IgPerson[];
    feed: IgPost[];
    reel: IgReel;
};

const AVATAR = "/mockup-ig/avatar.jpg";

/**
 * Read off the supplied Figma, which is five screenshots of this account's real
 * profile. Every number here is a public fact on Instagram — but it is still a
 * real client's brand presence recreated on our domain, so if that ever needs to
 * stop being the case, replace this one export and nothing else moves.
 */
export const cohost: IgAccount = {
    profile: {
        handle: "thecohostcompany",
        displayName: "Cohost Company",
        category: "Vacation Home Rental",
        verified: true,
        avatar: AVATAR,
        stats: { posts: "325", followers: "26.4K", following: "205" },
        bio: ["🌵 Joshua Tree Airbnb Management", "📰 Featured: Netflix, NY Times, Dwell, Airbnb & more!", "SAVE 10% 👇"],
        link: { label: "bio.gocohostcompany.com/links", href: "https://bio.gocohostcompany.com/links" },
        followedBy: {
            people: [{ name: "inspiredretreats" }, { name: "away2pa" }, { name: "joshuatreehomes" }],
            text: "Followed by _inspiredretreats_, away2pa and 15 others",
        },
        highlights: [{ label: "SAVE 10%" }, { label: "Creators 👆" }, { label: "Reviews" }, { label: "Local Favs" }, { label: "About Us" }],
        grid: [
            // Row one is real client footage carrying the real counts off the Figma.
            {
                src: "/mockup-ig/reel-cabin-rose-turndown.jpg",
                alt: "Cabin turndown with rose petals",
                kind: "reel",
                views: "563K",
                pinned: true,
            },
            { src: "/mockup-ig/reel-barrel-sauna-riverside.jpg", alt: "Barrel sauna by the river", kind: "reel", views: "956" },
            { src: "/mockup-ig/reel-river-deer-autumn.jpg", alt: "Deer at the river in autumn", kind: "reel", views: "1,042" },
            // Rows two and three are owed. One AssetNote under the frame names them.
            ...Array.from({ length: 6 }, (_, index) => ({ alt: `Grid still ${index + 4}`, kind: "photo" as const })),
        ],
    },

    stories: [
        { name: "Your story", src: AVATAR },
        { name: "joshuatree" },
        { name: "away2pa" },
        { name: "inspiredretreats" },
        { name: "dwell" },
        { name: "airbnb" },
    ],

    feed: [
        {
            author: { handle: "thecohostcompany", verified: true, avatar: AVATAR },
            subtitle: "Joshua Tree, California",
            media: {
                src: "/mockup-ig/reel-river-deer-autumn.jpg",
                alt: "Deer at the river in autumn",
                aspect: "4/5",
                count: 3,
            },
            likes: "1,284",
            caption: "Peak season on the ridge. Three nights left in October 🍂",
            comments: "View all 86 comments",
            posted: "2 days ago",
        },
    ],

    reel: {
        author: { handle: "thecohostcompany", verified: true, avatar: AVATAR },
        video: {
            // The MP4 is gitignored, so this is a still in production and a video
            // in dev. ReelVideo falls back to the poster, which is committed.
            src: "/mockup-ig/reel-cabin-rose-turndown.mp4",
            poster: "/mockup-ig/reel-cabin-rose-turndown.jpg",
            alt: "Cabin turndown with rose petals",
        },
        caption: "Turndown service, Joshua Tree 🌵",
        audio: "Original audio · thecohostcompany",
        counts: { likes: "12.4K", comments: "86", sends: "1,204" },
    },
};

/* -------------------------------------------------------------------------- */
/* Meta ads                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * A paid placement. Read off the seven ad screenshots on the Figma's
 * "Instagram Ad Style 1" page, which are real competitor ads in the
 * vacation-rental and real-estate space.
 *
 * THE COPY IS DELIBERATELY GENERIC. These render as a format demo, not as a live
 * campaign, so nothing here should read as a claim any client is making.
 */
export type IgAdPlacement = "feed" | "story" | "reels";

export type IgAd = {
    placement: IgAdPlacement;
    author: IgAuthor;
    media: { src?: string; poster?: string; alt: string; aspect: "1/1" | "4/5" | "9/16" };
    /** The CTA bar's label. Instagram's own set: Learn more, Book now, Sign up, See details… */
    cta: string;
    /**
     * The CTA bar's background. Instagram samples a desaturated colour from the
     * creative rather than using a fixed grey or blue — measured #728598 on the
     * reference. So it belongs to the ad, not to the palette.
     */
    ctaTint: string;
    caption: string;
    counts: { likes: string; comments: string; sends: string };
};

/** A link-in-bio landing page — the destination `profile.link` points at. */
export type IgBioLink = {
    avatar: string;
    handle: string;
    tagline: string;
    links: { label: string; note?: string; featured?: boolean }[];
};

export const ads: Record<IgAdPlacement, IgAd> = {
    feed: {
        placement: "feed",
        author: { handle: "yourbrandhere", verified: false, avatar: AVATAR },
        media: { src: "/mockup-ig/reel-river-deer-autumn.jpg", alt: "Placeholder ad creative — a 4:5 still", aspect: "4/5" },
        cta: "Learn more",
        ctaTint: "#728598",
        caption: "Primary text sits here and truncates after two lines, the way a real caption does",
        counts: { likes: "214", comments: "2", sends: "19" },
    },
    story: {
        placement: "story",
        author: { handle: "yourbrandhere", verified: false, avatar: AVATAR },
        media: {
            src: "/mockup-ig/reel-barrel-sauna-riverside.mp4",
            poster: "/mockup-ig/reel-barrel-sauna-riverside.jpg",
            alt: "Placeholder ad creative — a 9:16 video",
            aspect: "9/16",
        },
        cta: "Book now",
        ctaTint: "#5c6f5a",
        caption: "Story placement — one full-screen frame",
        counts: { likes: "—", comments: "—", sends: "—" },
    },
    reels: {
        placement: "reels",
        author: { handle: "yourbrandhere", verified: false, avatar: AVATAR },
        media: {
            src: "/mockup-ig/reel-cabin-rose-turndown.mp4",
            poster: "/mockup-ig/reel-cabin-rose-turndown.jpg",
            alt: "Placeholder ad creative — a 9:16 reel",
            aspect: "9/16",
        },
        cta: "See details",
        ctaTint: "#8a6a55",
        caption: "Reels placement — the CTA is a strip above the tab bar",
        counts: { likes: "12.4K", comments: "86", sends: "1,204" },
    },
};

/**
 * The bio-link page. Structured as the Figma outline has it — one heading and two
 * body blocks: a featured offer, then the rest of the stack.
 */
export const bioLink: IgBioLink = {
    avatar: AVATAR,
    handle: "yourbrandhere",
    tagline: "Everything in one place",
    links: [
        { label: "Claim the offer", note: "Featured", featured: true },
        { label: "Book direct" },
        { label: "Browse the homes" },
        { label: "Read the reviews" },
        { label: "Local guide" },
        { label: "Contact us" },
    ],
};

/* -------------------------------------------------------------------------- */
/* Proof surfaces and further deliverables                                     */
/* -------------------------------------------------------------------------- */

/**
 * ⚠ EVERY NUMBER AND EVERY MESSAGE BELOW IS INVENTED.
 *
 * These four surfaces are the ones most likely to be mistaken for evidence — an
 * insights screen, a booking enquiry, a like count. They exist to demonstrate a
 * FORMAT. Screenshotting one and presenting it as a result, or as a real message
 * from a real guest, would be fabricating proof, and the fact that it renders
 * convincingly is exactly what makes that easy to do by accident.
 *
 * If any of these is ever used in a case study, the numbers must come from the
 * client's own Instagram insights and the messages from their own inbox, with
 * permission. Nothing here is a substitute for either.
 */

export type IgMetric = { label: string; value: string; delta: string; up: boolean };

export type IgInsights = {
    range: string;
    metrics: IgMetric[];
    /** Normalised 0-1, one bar per day. Shape only — not a real series. */
    reachByDay: number[];
    topPosts: { src?: string; alt: string; metric: string }[];
};

export type IgStoryOrganic = {
    author: IgAuthor;
    media: { src?: string; poster?: string; alt: string };
    location?: string;
    poll?: { question: string; options: [string, string]; split: [number, number] };
    question?: string;
    link?: string;
};

export type IgCarousel = {
    author: IgAuthor;
    location?: string;
    slides: { src?: string; alt: string }[];
    current: number;
    caption: string;
    likes: string;
    comments: string;
};

export type IgThread = {
    handle: string;
    avatar: string;
    status: string;
    messages: { from: "them" | "us"; text: string; time?: string }[];
};

export const insights: IgInsights = {
    range: "Last 30 days",
    metrics: [
        { label: "Accounts reached", value: "412K", delta: "+128%", up: true },
        { label: "Accounts engaged", value: "18.9K", delta: "+64%", up: true },
        { label: "Profile visits", value: "9,204", delta: "+41%", up: true },
        { label: "Follows", value: "1,867", delta: "-3%", up: false },
    ],
    // A plausible shape — a slow build, a spike, a plateau. Deliberately not flat,
    // because a flat chart tells you nothing about whether the component works.
    reachByDay: [
        0.18, 0.22, 0.2, 0.31, 0.28, 0.35, 0.42, 0.38, 0.47, 0.44, 0.52, 0.61, 0.58, 0.72, 0.95, 0.88, 0.81, 0.76, 0.79, 0.71, 0.68, 0.74, 0.66, 0.7, 0.64,
        0.69, 0.62, 0.67, 0.6, 0.65,
    ],
    topPosts: [
        { src: "/mockup-ig/reel-cabin-rose-turndown.jpg", alt: "Cabin turndown with rose petals", metric: "563K" },
        { src: "/mockup-ig/reel-river-deer-autumn.jpg", alt: "Deer at the river in autumn", metric: "94.2K" },
        { src: "/mockup-ig/reel-barrel-sauna-riverside.jpg", alt: "Barrel sauna by the river", metric: "31.8K" },
    ],
};

export const story: IgStoryOrganic = {
    author: { handle: "yourbrandhere", verified: false, avatar: AVATAR },
    media: { src: "/mockup-ig/reel-river-deer-autumn.mp4", poster: "/mockup-ig/reel-river-deer-autumn.jpg", alt: "Deer at the river in autumn" },
    location: "Joshua Tree, CA",
    poll: { question: "Sauna or hot tub first?", options: ["Sauna", "Hot tub"], split: [62, 38] },
    link: "Book the cabin",
};

export const carousel: IgCarousel = {
    author: { handle: "yourbrandhere", verified: false, avatar: AVATAR },
    location: "Joshua Tree, CA",
    slides: [
        { src: "/mockup-ig/reel-river-deer-autumn.jpg", alt: "Slide one — deer at the river" },
        { src: "/mockup-ig/reel-cabin-rose-turndown.jpg", alt: "Slide two — cabin turndown" },
        { src: "/mockup-ig/reel-barrel-sauna-riverside.jpg", alt: "Slide three — barrel sauna" },
        { alt: "Slide four — still owed", src: undefined },
        { alt: "Slide five — still owed", src: undefined },
    ],
    current: 1,
    caption: "Swipe for the whole property. Slide copy goes here and truncates the same way a single-image caption does",
    likes: "3,412",
    comments: "View all 128 comments",
};

export const thread: IgThread = {
    handle: "a_guest_account",
    avatar: "",
    status: "Active 2h ago",
    messages: [
        { from: "them", text: "Hi! Is the cabin free the weekend of the 14th?" },
        { from: "us", text: "It is — two nights left on that one. Want me to hold it?" },
        { from: "them", text: "Yes please 🙌 and is the sauna included?" },
        { from: "us", text: "Included, and the hot tub. I will send the direct link.", time: "2h" },
    ],
};
