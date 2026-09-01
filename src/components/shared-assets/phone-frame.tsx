import { cx } from "@/utils/cx";

/**
 * The iPhone 17 Pro frame — this project's own prepared bezel, not the one the
 * source page used.
 *
 * Ported from hiddengem-media's `components/hgm/phone-frame.tsx`, retargeted to
 * the bezel already committed here in `public/device-mockups/`. The two repos
 * hold DIFFERENT crops of the same device export (this one is 626 × 1290; the
 * marketing site's is 524 × 1082), so the aspect class and the screen inset
 * below are this file's numbers, recorded from the shared library's
 * manifest.json — see `src/pages/team/test-screen.tsx`, which uses the same
 * pair. Never copy the marketing repo's inset onto this bitmap.
 *
 * THE SCREEN IS A TRUE CUT-OUT — alpha 0 at its centre — so content sits BEHIND
 * the frame and the bezel's own edges fall over it. The corner radius on the
 * screen div only stops a square corner peeking through the frame's
 * antialiased inner edge.
 *
 * NOTE FOR THE 1:1 SECTIONS: the screen is 91.374% of the frame's width, so a
 * `w-[440px]` frame yields a 402.05px screen — scale 1.0001 against the 402pt
 * stage every Instagram surface is authored at. The source repo's crop needed
 * 439px for the same trick; the 1px difference is the different crop.
 */
const BEZEL = {
    src: "/device-mockups/iphone-17-pro-silver.png",
    inset: "left-[4.313%] top-[1.86%] h-[96.279%] w-[91.374%]",
} as const;

/** The owed-asset note, at screen scale. */
export const ScreenAssetNote = ({ children }: { children: React.ReactNode }) => (
    <span className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-primary/80 px-2.5 py-1 text-[0.625rem] font-semibold tracking-[0.08em] text-brand-secondary uppercase backdrop-blur-sm">
        <span aria-hidden="true" className="size-1.5 shrink-0 rotate-45 bg-border-brand" />
        {children}
    </span>
);

/** The brand-tagged stand-in for a screen capture we do not have yet. */
export const ScreenPlaceholder = ({ label }: { label: string }) => (
    <div className="flex size-full items-end overflow-hidden bg-linear-160 from-secondary via-primary to-secondary p-3">
        <ScreenAssetNote>{label}</ScreenAssetNote>
    </div>
);

/**
 * iPhone frame plus its screen. No caption — callers decide what sits under it.
 * `children` fills the screen with real content; without it the placeholder
 * stands in.
 */
export const PhoneFrame = ({ label, className, children }: { label: string; className?: string; children?: React.ReactNode }) => (
    // The cropped bezel's own proportion, so the inset percentages stay true.
    <div className={cx("relative aspect-626/1290 w-full", className)}>
        <div className={cx("absolute overflow-hidden rounded-[12%/5.5%] bg-linear-160 from-secondary via-primary to-secondary", BEZEL.inset)}>
            {children ?? <ScreenPlaceholder label={label} />}
        </div>

        <img src={BEZEL.src} alt="" className="pointer-events-none absolute inset-0 z-10 size-full object-contain select-none" />
    </div>
);
