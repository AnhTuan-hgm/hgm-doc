import { useRef, type ChangeEvent, type ReactNode } from "react";
import { Trash01, UploadCloud02 } from "@untitledui/icons";
import { PageBreadcrumb, type BreadcrumbItem } from "@/components/application/page-breadcrumb";
import { compressImageFile } from "@/utils/compress-image";

/**
 * Deterministic on-brand gradient generated from a seed string. Used as the banner
 * background until a cover image is uploaded (mirrors the dashboard-card pattern).
 */
function gradientFor(seed: string): string {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
    const h2 = (h + 42) % 360;
    return `linear-gradient(135deg, hsl(${h} 60% 46%), hsl(${h2} 58% 30%))`;
}

/**
 * Hero banner shown at the top of internal project / log pages: a full-width, ~12vh
 * cover with the breadcrumb, page title and subtitle overlaid in white over a
 * legibility scrim. In edit mode a cover image can be uploaded (compressed to WebP,
 * stored via the page's own persistence); a generated gradient shows until then.
 */
export const PageBanner = ({
    breadcrumb,
    title,
    subtitle,
    imageUrl,
    editing = false,
    onImageChange,
    actions,
}: {
    breadcrumb: BreadcrumbItem[];
    title: string;
    subtitle?: ReactNode;
    imageUrl?: string;
    editing?: boolean;
    /** Called with a compressed data URL on upload, or "" when the image is removed. */
    onImageChange?: (dataUrl: string) => void;
    /** Optional right-aligned content beside the breadcrumb (e.g. save badge / edit pill). */
    actions?: ReactNode;
}) => {
    const fileRef = useRef<HTMLInputElement>(null);

    const onPick = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file || !onImageChange) return;
        try {
            onImageChange(await compressImageFile(file));
        } catch {
            /* keep the current background if compression fails */
        }
    };

    return (
        <div
            className="relative isolate flex min-h-[20vh] w-full shrink-0 flex-col justify-end overflow-hidden border-b border-secondary px-6 py-4 md:px-8"
            style={imageUrl ? undefined : { background: gradientFor(title) }}
        >
            {/* Cover image + dark scrim so white text stays legible over any image. */}
            {imageUrl && <img src={imageUrl} alt="" aria-hidden="true" className="absolute inset-0 -z-10 size-full object-cover" draggable={false} />}
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/60 via-black/30 to-black/15" aria-hidden="true" />

            {/* Top row: breadcrumb + actions / upload controls. */}
            <div className="flex items-start justify-between gap-3">
                <PageBreadcrumb items={breadcrumb} tone="onImage" />
                <div className="flex shrink-0 items-center gap-2">
                    {actions}
                    {editing && onImageChange && (
                        <>
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                title={imageUrl ? "Replace banner image" : "Upload banner image"}
                                className="flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur transition duration-100 ease-linear hover:bg-white/25"
                            >
                                <UploadCloud02 className="size-3.5" aria-hidden="true" />
                                {imageUrl ? "Replace" : "Upload"}
                            </button>
                            {imageUrl && (
                                <button
                                    type="button"
                                    onClick={() => onImageChange("")}
                                    title="Remove banner image"
                                    aria-label="Remove banner image"
                                    className="flex size-7 items-center justify-center rounded-lg bg-white/15 text-white backdrop-blur transition duration-100 ease-linear hover:bg-error-solid"
                                >
                                    <Trash01 className="size-3.5" aria-hidden="true" />
                                </button>
                            )}
                            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
                        </>
                    )}
                </div>
            </div>

            {/* Heading. */}
            <div className="mt-3">
                <h1 className="text-display-xs font-semibold tracking-tight text-white md:text-display-lg">{title}</h1>
                {subtitle && <p className="mt-0.5 text-sm text-white/80">{subtitle}</p>}
            </div>
        </div>
    );
};
