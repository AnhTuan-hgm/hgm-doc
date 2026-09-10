import type { DashboardContent } from "@/lib/supabase";
import { fontStack, resolveRoles } from "@/pages/client/dashboard/brand-kit-typography";
import { INK, WHITE, contrastRatio, lightnessOf, normHex, readableTextOn } from "@/pages/client/dashboard/color-scale";

type Brand = DashboardContent["brand"];

/**
 * The kit in one picture — logo, heading font, body font and colours composed the way
 * they'd sit on a page, so a host sees "this is my brand" rather than four tiles and a
 * font list. Everything is derived from the saved kit; nothing here is stored.
 *
 * The canvas is fixed (white, or the palette's own lightest tint), not a theme token: the
 * point is to show the brand's colours as they are, and a dark-mode canvas would recolour
 * the demonstration. Same reasoning as the logo tiles.
 */
export const BrandPreview = ({ brand, clientName, tagline }: { brand: Brand; clientName: string; tagline?: string }) => {
    const colors = brand.colors.map((c) => ({ ...c, hex: normHex(c.hex) })).filter((c): c is { name: string; hex: string } => !!c.hex);
    const { heading, body } = resolveRoles(brand.fonts, brand.font_files);
    const logo = brand.logos?.[0];

    if (!colors.length && !heading && !logo) return null;

    /* Canvas: the palette's lightest colour if it is genuinely a tint (a neutral / off-
       white the brand actually uses), else plain white. */
    const lightest = [...colors].sort((a, b) => (lightnessOf(b.hex) ?? 0) - (lightnessOf(a.hex) ?? 0))[0];
    const canvas = lightest && (lightnessOf(lightest.hex) ?? 0) >= 0.9 ? lightest.hex : WHITE;
    const ink = readableTextOn(canvas)?.text ?? INK;

    /* Buttons: the first two colours that actually stand out from the canvas — a near-
       white "Neutral" swatch would otherwise become an invisible button. */
    const strong = colors.filter((c) => (contrastRatio(c.hex, canvas) ?? 0) >= 2);
    const primary = strong[0];
    const secondary = strong[1];
    const primaryText = primary ? (readableTextOn(primary.hex)?.text ?? WHITE) : WHITE;

    const headingFont = fontStack(heading);
    const bodyFont = fontStack(body) ?? headingFont;

    return (
        <div className="overflow-hidden rounded-2xl ring-1 ring-secondary">
            <div className="p-6 sm:p-8" style={{ background: canvas, color: ink }}>
                {logo ? (
                    <img src={logo.url} alt={`${clientName || "Client"} logo`} className="h-9 max-w-40 object-contain object-left" draggable={false} />
                ) : (
                    <p className="text-sm font-semibold tracking-wide uppercase" style={{ fontFamily: bodyFont, opacity: 0.7 }}>
                        {clientName || "Your brand"}
                    </p>
                )}
                <p className="mt-5 max-w-xl text-display-xs font-semibold sm:text-display-sm" style={{ fontFamily: headingFont }}>
                    {tagline?.trim() || "A place worth coming back to."}
                </p>
                <p className="mt-3 max-w-lg text-md" style={{ fontFamily: bodyFont, opacity: 0.8 }}>
                    This is how your headings and body text sit together in your own colours — the same pairing your website, emails and social posts should
                    use.
                </p>
                {primary && (
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                        <span
                            className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold"
                            style={{ background: primary.hex, color: primaryText, fontFamily: bodyFont }}
                        >
                            Book your stay
                        </span>
                        {secondary && (
                            <span
                                className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold ring-1 ring-current ring-inset"
                                style={{ color: secondary.hex, fontFamily: bodyFont }}
                            >
                                See the property
                            </span>
                        )}
                    </div>
                )}
            </div>
            {colors.length > 0 && (
                <div className="flex h-3" aria-hidden="true">
                    {colors.map((c, i) => (
                        <div key={`${c.hex}-${i}`} className="flex-1" style={{ background: c.hex }} title={`${c.name} ${c.hex}`} />
                    ))}
                </div>
            )}
        </div>
    );
};
