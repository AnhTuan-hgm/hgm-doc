import { useRef } from "react";
import { Download01 } from "@untitledui-pro/icons/line";
import { cx } from "@/utils/cx";

/**
 * Downloads the icon rendered beside it as a standalone `.svg` file. Ported
 * from hiddengem-media's `components/hgm/svg-download-button.tsx`.
 *
 * WHERE THE FILE COMES FROM. The DOM, not the package. The glyph is already on
 * the page as a real `<svg>`, so the button walks up to the nearest ancestor
 * marked `data-glyph`, clones the `<svg>` inside it, and serialises that. What
 * downloads is what you are looking at, so it cannot drift.
 *
 * FOUR REPAIRS ON THE WAY OUT, each one a file that would otherwise open wrong:
 *   · `xmlns` — implied in an HTML document, required in a standalone file.
 *   · `width`/`height` from the `viewBox` — on the page the size comes from
 *     CSS, which does not survive the trip.
 *   · `class` removed — Tailwind class names resolve to nothing outside.
 *   · `color` set to `ink` — pins what `currentColor` resolves to while
 *     leaving the inheritance intact.
 *
 * `XMLSerializer` rather than `outerHTML`: the output is XML, and the HTML
 * serialiser is happy to emit unclosed tags no SVG parser will accept.
 *
 * The object URL is revoked on the next frame rather than immediately — Safari
 * has not started the download by the time the handler returns, and revoking in
 * the same tick cancels it.
 */
export const SvgDownloadButton = ({
    name,
    ink = "#141414",
    className,
    children,
}: {
    /** Export name of the icon; becomes the filename and the visible label. */
    name: string;
    /** What `currentColor` should resolve to in the downloaded file. */
    ink?: string;
    className?: string;
    /** Defaults to the name — pass a node to label it differently. */
    children?: React.ReactNode;
}) => {
    const ref = useRef<HTMLButtonElement>(null);

    const download = () => {
        const svg = ref.current?.closest("[data-glyph]")?.querySelector("svg");
        if (!svg) return;

        const clone = svg.cloneNode(true) as SVGSVGElement;
        const [, , width = "24", height = "24"] = (clone.getAttribute("viewBox") ?? "0 0 24 24").split(/\s+/);
        clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        clone.setAttribute("width", width);
        clone.setAttribute("height", height);
        clone.setAttribute("color", ink);
        clone.removeAttribute("class");

        const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = `${name}.svg`;
        link.click();
        requestAnimationFrame(() => URL.revokeObjectURL(url));
    };

    return (
        <button
            ref={ref}
            type="button"
            onClick={download}
            title={`Download ${name}.svg`}
            className={cx(
                // NO COLOUR HERE, deliberately. The button inherits from its
                // cell, so it works on the Instagram canvas (private --ig-*
                // properties) and on our own surfaces (semantic tokens) without
                // either one leaking into the other. The hover affordance is
                // the glyph's opacity, which is colour-agnostic.
                "group/dl flex min-w-0 items-center gap-1 rounded outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2",
                className,
            )}
        >
            <span className="truncate">{children ?? name}</span>
            <Download01 aria-hidden="true" className="size-3 shrink-0 opacity-50 transition duration-100 ease-linear group-hover/dl:opacity-100" />
            <span className="sr-only">Download {name} as SVG</span>
        </button>
    );
};
