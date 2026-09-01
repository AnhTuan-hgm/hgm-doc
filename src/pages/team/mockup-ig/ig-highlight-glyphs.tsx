import type { ReactNode } from "react";
import {
    Armchair,
    Barbell,
    Bathtub,
    Bed,
    Bicycle,
    Binoculars,
    BookOpenText,
    Broom,
    Camera as CameraPh,
    Campfire,
    CarProfile,
    ChatCircleText,
    ClipboardText,
    ClockCountdown,
    Coffee,
    CookingPot,
    Desk,
    Dog,
    FlowerLotus,
    ForkKnife,
    Gift as GiftPh,
    HandCoins,
    Handshake,
    HouseLine,
    Island,
    Key as KeyPh,
    Leaf,
    MapPinArea,
    MapTrifold,
    Martini,
    Medal,
    Mountains,
    Newspaper,
    PicnicTable,
    PingPong,
    SealCheck,
    SealPercent,
    SealQuestion,
    Shower,
    Signpost,
    Suitcase,
    SunHorizon,
    SwimmingPool,
    Tree,
    Trophy,
    UsersThree,
    VideoCamera,
    WashingMachine,
    Waves,
    WifiHigh,
    Wine,
} from "@phosphor-icons/react/ssr";
import {
    Award01,
    Bell01,
    BookOpen01,
    CalendarCheck01,
    Camera01,
    Car01,
    CheckVerified01,
    ClockFastForward,
    File02,
    Gift01,
    HelpCircle,
    Home05,
    Key01,
    Luggage02,
    Mail01,
    Map01,
    MarkerPin01,
    MessageChatCircle,
    Route,
    Send01,
    ShieldTick,
    Snowflake01,
    Star01,
    Tag01,
    Trophy01,
    User01,
    Users03,
    UsersPlus,
    VideoRecorder,
} from "@untitledui-pro/icons/line";
import { SvgDownloadButton } from "./svg-download-button";

/* -------------------------------------------------------------------------- */
/* HIGHLIGHT COVER GLYPHS — the travel and short-let vocabulary                */
/* -------------------------------------------------------------------------- */

/**
 * Instagram story-highlight covers, for the one industry this agency actually
 * sells to: short-let and vacation-rental management, boutique stays, and the
 * hotels and destination brands next to them.
 *
 * WHY THIS IS A SEPARATE SET FROM SECTION 13. Those glyphs are Instagram's own
 * chrome — a fixed list, drawn at 24px, and wrong if they deviate. These are
 * artwork we make FOR a client: the cover is a 60px circle the client supplies,
 * so the glyph inside it is a design decision every account makes about forty
 * times over and almost always makes badly, by pulling forty icons from forty
 * sources. A named set is the fix, and it is the fix the better reference
 * accounts arrived at by hand.
 *
 * WHERE THE LABELS COME FROM. Three real profiles, read off screenshots: a
 * Joshua Tree manager (SAVE 10% · Creators · Reviews · Local Favs · About Us),
 * a villa brand (SAVE $250 · FAQs · Lifestyle · About · Our Homes · Reviews ·
 * Destinations) and a cabin operator (Reviews · Activities · Top Cabins · FAQs
 * · About Us · SAVE $100). Every one of those labels is in the set below, which
 * is the point — this is a reading of the industry, not a wishlist. The rest of
 * the set is the gap those three leave: amenities, guest ops, sustainability.
 *
 * TWO PACKAGES, ON PURPOSE.
 *   · `@untitledui-pro/icons` is the house set. It carries commerce, proof and
 *     comms well — Percent, Sale, Award, CheckVerified, Mail — and it ships
 *     /line and /solid, so a filled cover costs no new asset. It has almost no
 *     hospitality vocabulary: no bed, no bath, no pool, no dog, no fork, no
 *     mountain, no leaf. Verified, not assumed — those names are absent from
 *     `node_modules/@untitledui-pro/icons/dist/line/index.d.ts`.
 *   · `@phosphor-icons/react` fills exactly that gap and is why it was added.
 *     Imported from `/ssr`, the variant without "use client", so these stay
 *     server components like the rest of this page.
 *
 * `pack` on each entry records where the glyph came from, and `alt` records the
 * other package's nearest equivalent where one exists — so a brand standardised
 * on one set can rebuild most of the board from it and see, in the same table,
 * the places where it cannot.
 *
 * WEIGHT. Phosphor is drawn at 1.5px on a 24px grid, Untitled UI at 2px, so a
 * mixed row reads uneven at cover size. Every Phosphor glyph here is set to
 * `bold` and every Untitled UI one to 2. Compare against a default-weight row
 * before changing it.
 */

/**
 * Cover fills, eyedropped from the reference profiles. PLACEHOLDERS — a real
 * cover carries the client's own palette, and the value of a highlight rail is
 * that it does. One tone per family here so the catalogue reads in groups; a
 * live account picks one or two and holds them.
 *
 * `ink` is set per tone rather than derived: two tones need white and six need
 * near-black, and a computed contrast pick is a lot of machinery to arrive at
 * the same eight answers.
 */
const TONES = {
    olive: { fill: "#9A9A5E", ink: "#141414" },
    sage: { fill: "#CDD2A8", ink: "#141414" },
    taupe: { fill: "#C6BAB2", ink: "#141414" },
    blush: { fill: "#E7DCD7", ink: "#141414" },
    pale: { fill: "#EFEFEF", ink: "#141414" },
    forest: { fill: "#17332C", ink: "#FFFFFF" },
    clay: { fill: "#4A2C1B", ink: "#FFFFFF" },
    gold: { fill: "#B98D5B", ink: "#FFFFFF" },
} as const;

type Tone = keyof typeof TONES;

type Glyph = {
    /** The caption under the cover, as these accounts actually write it. */
    label: string;
    node: ReactNode;
    /** Export name, so the board is copy-pasteable into an import. */
    icon: string;
    pack: "Phosphor" | "Untitled UI";
    /** The other package's nearest match — or absent, which is the useful case. */
    alt?: string;
};

/** Phosphor at bold to meet Untitled UI's 2px line. See the weight note above. */
const ph = (Icon: typeof Bed) => <Icon weight="bold" />;

const FAMILIES: { name: string; tone: Tone; note: string; glyphs: Glyph[] }[] = [
    {
        name: "Offer and booking",
        tone: "olive",
        note: "The money covers. Every reference profile leads its rail with one, and it is always first — the discount is the reason the rail gets tapped at all.",
        glyphs: [
            { label: "SAVE 10%", node: ph(SealPercent), icon: "SealPercent", pack: "Phosphor", alt: "Percent03" },
            { label: "Book Now", node: <CalendarCheck01 strokeWidth={2} />, icon: "CalendarCheck01", pack: "Untitled UI", alt: "CalendarCheck" },
            { label: "Deals", node: <Tag01 strokeWidth={2} />, icon: "Tag01", pack: "Untitled UI", alt: "Tag" },
            { label: "Gift Cards", node: <Gift01 strokeWidth={2} />, icon: "Gift01", pack: "Untitled UI", alt: "Gift" },
            { label: "Packages", node: <Luggage02 strokeWidth={2} />, icon: "Luggage02", pack: "Untitled UI", alt: "Suitcase" },
            { label: "Book Direct", node: ph(HandCoins), icon: "HandCoins", pack: "Phosphor", alt: "CoinsHand" },
            { label: "Refer a Friend", node: <UsersPlus strokeWidth={2} />, icon: "UsersPlus", pack: "Untitled UI", alt: "UserPlus" },
            { label: "Last Minute", node: ph(ClockCountdown), icon: "ClockCountdown", pack: "Phosphor", alt: "ClockFastForward" },
        ],
    },
    {
        name: "The property",
        tone: "forest",
        note: "What is being let. `Our Homes` and `Top Cabins` are the same cover with the client's own noun in it — the label changes, the glyph does not.",
        glyphs: [
            { label: "Our Homes", node: ph(HouseLine), icon: "HouseLine", pack: "Phosphor", alt: "Home05" },
            { label: "Top Cabins", node: <Home05 strokeWidth={2} />, icon: "Home05", pack: "Untitled UI", alt: "HouseLine" },
            { label: "Rooms", node: ph(Bed), icon: "Bed", pack: "Phosphor" },
            { label: "Bathrooms", node: ph(Shower), icon: "Shower", pack: "Phosphor" },
            { label: "Interiors", node: ph(Armchair), icon: "Armchair", pack: "Phosphor" },
            { label: "The Kitchen", node: ph(CookingPot), icon: "CookingPot", pack: "Phosphor" },
            { label: "The Grounds", node: ph(Tree), icon: "Tree", pack: "Phosphor" },
            { label: "Coming Soon", node: <ClockFastForward strokeWidth={2} />, icon: "ClockFastForward", pack: "Untitled UI", alt: "ClockCounterClockwise" },
        ],
    },
    {
        name: "Amenities",
        tone: "sage",
        note: "The largest gap in the house set — ten of these twelve have no Untitled UI equivalent at all, which is the whole argument for a second package.",
        glyphs: [
            { label: "Hot Tub", node: ph(Bathtub), icon: "Bathtub", pack: "Phosphor" },
            { label: "The Pool", node: ph(SwimmingPool), icon: "SwimmingPool", pack: "Phosphor" },
            { label: "Fire Pit", node: ph(Campfire), icon: "Campfire", pack: "Phosphor" },
            { label: "Pet Friendly", node: ph(Dog), icon: "Dog", pack: "Phosphor" },
            { label: "Fast Wifi", node: ph(WifiHigh), icon: "WifiHigh", pack: "Phosphor", alt: "Wifi" },
            { label: "Workspace", node: ph(Desk), icon: "Desk", pack: "Phosphor" },
            { label: "Parking", node: <Car01 strokeWidth={2} />, icon: "Car01", pack: "Untitled UI", alt: "CarProfile" },
            { label: "Laundry", node: ph(WashingMachine), icon: "WashingMachine", pack: "Phosphor" },
            { label: "BBQ", node: ph(PicnicTable), icon: "PicnicTable", pack: "Phosphor" },
            { label: "Spa & Sauna", node: ph(FlowerLotus), icon: "FlowerLotus", pack: "Phosphor" },
            { label: "Gym", node: ph(Barbell), icon: "Barbell", pack: "Phosphor" },
            { label: "Games Room", node: ph(PingPong), icon: "PingPong", pack: "Phosphor" },
        ],
    },
    {
        name: "Place and things to do",
        tone: "taupe",
        note: "`Local Favs` and `Destinations` are the two commonest covers after the discount, and the ones an agency actually earns its fee on.",
        glyphs: [
            { label: "Local Favs", node: ph(MapPinArea), icon: "MapPinArea", pack: "Phosphor", alt: "MarkerPin01" },
            { label: "Destinations", node: ph(MapTrifold), icon: "MapTrifold", pack: "Phosphor", alt: "Map01" },
            { label: "Activities", node: ph(Binoculars), icon: "Binoculars", pack: "Phosphor" },
            { label: "Eat & Drink", node: ph(ForkKnife), icon: "ForkKnife", pack: "Phosphor" },
            { label: "Coffee", node: ph(Coffee), icon: "Coffee", pack: "Phosphor" },
            { label: "Wineries", node: ph(Wine), icon: "Wine", pack: "Phosphor" },
            { label: "Nightlife", node: ph(Martini), icon: "Martini", pack: "Phosphor" },
            { label: "Hikes", node: ph(Mountains), icon: "Mountains", pack: "Phosphor" },
            { label: "Beaches", node: ph(Island), icon: "Island", pack: "Phosphor" },
            { label: "On the Water", node: ph(Waves), icon: "Waves", pack: "Phosphor", alt: "Waves" },
            { label: "Cycling", node: ph(Bicycle), icon: "Bicycle", pack: "Phosphor" },
            { label: "Getting Here", node: ph(Signpost), icon: "Signpost", pack: "Phosphor", alt: "Route" },
            { label: "The Route", node: <Route strokeWidth={2} />, icon: "Route", pack: "Untitled UI", alt: "Signpost" },
            { label: "The Map", node: <Map01 strokeWidth={2} />, icon: "Map01", pack: "Untitled UI", alt: "MapTrifold" },
            { label: "Best Season", node: ph(SunHorizon), icon: "SunHorizon", pack: "Phosphor", alt: "SunSetting02" },
            { label: "In Winter", node: <Snowflake01 strokeWidth={2} />, icon: "Snowflake01", pack: "Untitled UI", alt: "Snowflake" },
        ],
    },
    {
        name: "Proof",
        tone: "gold",
        note: "The covers a booking decision actually turns on. `Reviews` is on every reference profile without exception.",
        glyphs: [
            { label: "Reviews", node: <Star01 strokeWidth={2} />, icon: "Star01", pack: "Untitled UI", alt: "Star" },
            { label: "Guest Words", node: ph(ChatCircleText), icon: "ChatCircleText", pack: "Phosphor", alt: "MessageChatCircle" },
            { label: "Testimonials", node: <MessageChatCircle strokeWidth={2} />, icon: "MessageChatCircle", pack: "Untitled UI", alt: "ChatCircleText" },
            { label: "As Seen In", node: ph(Newspaper), icon: "Newspaper", pack: "Phosphor" },
            { label: "Awards", node: <Award01 strokeWidth={2} />, icon: "Award01", pack: "Untitled UI", alt: "Medal" },
            { label: "Superhost", node: ph(SealCheck), icon: "SealCheck", pack: "Phosphor", alt: "CheckVerified01" },
            { label: "Verified", node: <CheckVerified01 strokeWidth={2} />, icon: "CheckVerified01", pack: "Untitled UI", alt: "SealCheck" },
            { label: "Top Rated", node: <Trophy01 strokeWidth={2} />, icon: "Trophy01", pack: "Untitled UI", alt: "Trophy" },
            { label: "Our Numbers", node: ph(Medal), icon: "Medal", pack: "Phosphor", alt: "Award01" },
            { label: "Milestones", node: ph(Trophy), icon: "Trophy", pack: "Phosphor", alt: "Trophy01" },
        ],
    },
    {
        name: "Brand and people",
        tone: "blush",
        note: "`About Us` is the second-commonest cover in the industry and the most often wasted — a stock silhouette where a face would do the work.",
        glyphs: [
            { label: "About Us", node: <User01 strokeWidth={2} />, icon: "User01", pack: "Untitled UI", alt: "User" },
            { label: "Our Story", node: ph(BookOpenText), icon: "BookOpenText", pack: "Phosphor", alt: "BookOpen01" },
            { label: "The Journal", node: <BookOpen01 strokeWidth={2} />, icon: "BookOpen01", pack: "Untitled UI", alt: "BookOpenText" },
            { label: "The Team", node: ph(UsersThree), icon: "UsersThree", pack: "Phosphor", alt: "Users03" },
            { label: "Meet Us", node: <Users03 strokeWidth={2} />, icon: "Users03", pack: "Untitled UI", alt: "UsersThree" },
            { label: "Creators", node: ph(CameraPh), icon: "Camera", pack: "Phosphor", alt: "Camera01" },
            { label: "UGC", node: <Camera01 strokeWidth={2} />, icon: "Camera01", pack: "Untitled UI", alt: "Camera" },
            { label: "Behind Scenes", node: ph(VideoCamera), icon: "VideoCamera", pack: "Phosphor", alt: "VideoRecorder" },
            { label: "Lifestyle", node: <VideoRecorder strokeWidth={2} />, icon: "VideoRecorder", pack: "Untitled UI", alt: "VideoCamera" },
            { label: "Partners", node: ph(Handshake), icon: "Handshake", pack: "Phosphor" },
            { label: "Sustainability", node: ph(Leaf), icon: "Leaf", pack: "Phosphor" },
        ],
    },
    {
        name: "Guest info and ops",
        tone: "pale",
        note: "The covers that exist to stop a DM. `FAQs` and `Check-In` between them answer most of what an inbox otherwise carries by hand.",
        glyphs: [
            { label: "FAQs", node: ph(SealQuestion), icon: "SealQuestion", pack: "Phosphor", alt: "HelpCircle" },
            { label: "Questions", node: <HelpCircle strokeWidth={2} />, icon: "HelpCircle", pack: "Untitled UI", alt: "SealQuestion" },
            { label: "Check-In", node: ph(KeyPh), icon: "Key", pack: "Phosphor", alt: "Key01" },
            { label: "Access", node: <Key01 strokeWidth={2} />, icon: "Key01", pack: "Untitled UI", alt: "Key" },
            { label: "House Rules", node: ph(ClipboardText), icon: "ClipboardText", pack: "Phosphor", alt: "File02" },
            { label: "Policies", node: <File02 strokeWidth={2} />, icon: "File02", pack: "Untitled UI", alt: "ClipboardText" },
            { label: "Contact", node: <Mail01 strokeWidth={2} />, icon: "Mail01", pack: "Untitled UI", alt: "EnvelopeSimple" },
            { label: "Concierge", node: <Bell01 strokeWidth={2} />, icon: "Bell01", pack: "Untitled UI", alt: "Bell" },
            { label: "Housekeeping", node: ph(Broom), icon: "Broom", pack: "Phosphor" },
            { label: "Safety", node: <ShieldTick strokeWidth={2} />, icon: "ShieldTick", pack: "Untitled UI", alt: "ShieldCheck" },
            { label: "Newsletter", node: <Send01 strokeWidth={2} />, icon: "Send01", pack: "Untitled UI", alt: "PaperPlaneTilt" },
            { label: "Parking Info", node: ph(CarProfile), icon: "CarProfile", pack: "Phosphor", alt: "Car01" },
            { label: "Gifting", node: ph(GiftPh), icon: "Gift", pack: "Phosphor", alt: "Gift01" },
            { label: "Pack a Bag", node: ph(Suitcase), icon: "Suitcase", pack: "Phosphor", alt: "Luggage02" },
            { label: "Neighbourhood", node: <MarkerPin01 strokeWidth={2} />, icon: "MarkerPin01", pack: "Untitled UI", alt: "MapPinArea" },
        ],
    },
];

/** Counted, never typed — the page's rule for every number it prints. */
export const HIGHLIGHT_GLYPH_COUNT = FAMILIES.reduce((sum, family) => sum + family.glyphs.length, 0);
export const HIGHLIGHT_FAMILY_COUNT = FAMILIES.length;
export const HIGHLIGHT_PHOSPHOR_COUNT = FAMILIES.reduce((sum, f) => sum + f.glyphs.filter((g) => g.pack === "Phosphor").length, 0);
/** Phosphor glyphs with no Untitled UI equivalent — the reason for the dependency. */
export const HIGHLIGHT_GAP_COUNT = FAMILIES.reduce((sum, f) => sum + f.glyphs.filter((g) => g.pack === "Phosphor" && !g.alt).length, 0);

/* -------------------------------------------------------------------------- */
/* The cover                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * One highlight cover: a thin grey ring, a gap, then the filled circle — the
 * same construction as `IgHighlights` in ig-profile.tsx, so a cover built here
 * drops straight into the profile mock.
 *
 * The glyph is 42% of the circle. Instagram crops covers to a circle and a rail
 * is scanned at speed, so anything larger reads as a shape rather than a sign;
 * the reference profiles all sit between 38% and 45%.
 */
export const HighlightCover = ({ tone, size = 60, children }: { tone: Tone; size?: number; children: ReactNode }) => (
    <span className="rounded-full p-[1.5px] ring-1 ring-(--ig-text)/25">
        <span
            aria-hidden="true"
            className="flex items-center justify-center rounded-full"
            style={{ width: size, height: size, background: TONES[tone].fill, color: TONES[tone].ink }}
        >
            <span className="flex items-center justify-center [&>svg]:size-full" style={{ width: size * 0.42, height: size * 0.42 }}>
                {children}
            </span>
        </span>
    </span>
);

/* -------------------------------------------------------------------------- */
/* The board                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Every glyph at cover size, grouped by family, each carrying its export name
 * and package underneath — so the board IS the catalogue and there is no second
 * list to drift out of step with it.
 *
 * Laid out on the Instagram canvas rather than ours, for the same reason
 * section 13 is: a cover is only ever seen against black, and a pale tone that
 * looks gentle on a white page is a lamp on a phone.
 */
export const IgHighlightBoard = () => (
    <div className="ig-surface mt-14 flex flex-col gap-12">
        {FAMILIES.map((family) => (
            <section key={family.name}>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="text-md font-semibold text-primary">{family.name}</h3>
                    <span className="font-mono text-xs text-quaternary">{family.glyphs.length}</span>
                </div>
                <p className="mt-1.5 max-w-[68ch] text-sm text-tertiary">{family.note}</p>

                <ul className="mt-6 grid grid-cols-3 gap-x-4 gap-y-7 rounded-2xl bg-(--ig-canvas) p-6 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {family.glyphs.map((glyph) => (
                        // `data-glyph` is the contract with SvgDownloadButton: it
                        // clones the <svg> inside this element rather than being
                        // handed one, so the cover and its button stay decoupled.
                        <li key={`${family.name}-${glyph.label}`} data-glyph className="flex flex-col items-center gap-2 text-center">
                            <HighlightCover tone={family.tone}>{glyph.node}</HighlightCover>
                            <span className="w-full truncate text-[11px] leading-[14px] text-(--ig-text)">{glyph.label}</span>
                            <span className="flex w-full flex-col items-center gap-0.5">
                                {/* The export name IS the download control — a
                                    separate button would add a fourth row to
                                    eighty cells to say what one already says. */}
                                <SvgDownloadButton
                                    name={glyph.icon}
                                    ink={TONES[family.tone].ink}
                                    className="max-w-full font-mono text-[11px] text-(--ig-text-secondary)"
                                />
                                <span className="truncate text-[10px] text-(--ig-text-tertiary)">
                                    {glyph.pack}
                                    {glyph.alt ? ` · ${glyph.alt}` : " · no equivalent"}
                                </span>
                            </span>
                        </li>
                    ))}
                </ul>
            </section>
        ))}
    </div>
);

/* -------------------------------------------------------------------------- */
/* The rail, as the profile draws it                                           */
/* -------------------------------------------------------------------------- */

/**
 * The five covers off the Joshua Tree reference, at the 60px the profile screen
 * actually renders them at, in one tone the way a real account holds one. This
 * is the check on the board above: a glyph that survives a six-column grid on a
 * desktop page can still turn to mud in a 62px column on a phone, and this is
 * the only place that shows.
 */
const RAIL: { label: string; node: ReactNode }[] = [
    { label: "SAVE 10%", node: ph(SealPercent) },
    { label: "Creators", node: ph(CameraPh) },
    { label: "Reviews", node: <Star01 strokeWidth={2} /> },
    { label: "Local Favs", node: ph(MapPinArea) },
    { label: "About Us", node: <User01 strokeWidth={2} /> },
];

export const IgHighlightRail = ({ tone = "olive" }: { tone?: Tone }) => (
    <div className="ig-surface flex items-start gap-4 overflow-x-auto rounded-2xl bg-(--ig-canvas) px-4 py-5 text-(--ig-text)">
        {RAIL.map((item) => (
            <span key={item.label} className="flex w-[62px] shrink-0 flex-col items-center gap-1.5">
                <HighlightCover tone={tone}>{item.node}</HighlightCover>
                <span className="w-full truncate text-center text-[11px] leading-[14px]">{item.label}</span>
            </span>
        ))}
    </div>
);
