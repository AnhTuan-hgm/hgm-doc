import { ArrowRight } from "@untitledui-pro/icons/line";
import { cx } from "@/utils/cx";

/**
 * The layout primitives the Mockup-IG page shares with its source — ported from
 * the hiddengem-media marketing site's `(site)/_shared/site-primitives.tsx`,
 * trimmed to the three pieces this page actually uses. All HGM semantic tokens,
 * so they wear this project's blue rather than that site's gold.
 */

export const Container = ({ className, children }: { className?: string; children: React.ReactNode }) => (
    <div className={cx("mx-auto w-full max-w-[1152px] px-5 md:px-6", className)}>{children}</div>
);

export const Eyebrow = ({ className, children }: { className?: string; children: React.ReactNode }) => (
    <p className={cx("text-sm font-semibold tracking-[0.12em] text-brand-secondary uppercase", className)}>{children}</p>
);

export const SectionHeading = ({ className, children }: { className?: string; children: React.ReactNode }) => (
    <h2 className={cx("text-display-sm font-semibold text-primary md:text-display-lg", className)}>{children}</h2>
);

/** Solid brand pill, the source site’s primary action — brand-blue here, gold there. */
export const PrimaryAction = ({ className, href, children }: { className?: string; href: string; children: React.ReactNode }) => (
    <a
        href={href}
        className={cx(
            "inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand-solid px-6 text-md font-semibold text-primary_on-brand outline-focus-ring transition duration-100 ease-linear hover:bg-brand-solid_hover focus-visible:outline-2 focus-visible:outline-offset-2",
            className,
        )}
    >
        {children}
        <ArrowRight className="size-5" aria-hidden="true" />
    </a>
);
