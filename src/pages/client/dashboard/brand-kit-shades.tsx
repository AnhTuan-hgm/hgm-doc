import { useState } from "react";
import { Trash01 } from "@untitledui-pro/icons/line";
import { makeShadeScale } from "@/pages/client/dashboard/color-scale";

/**
 * Tailwind-style 50–950 shade rows, one per brand color — the uicolors.app treatment,
 * generated locally from each saved hex. Derived on render, so there is nothing to
 * store or keep in sync; click any shade to copy its hex. `onRemove` (edit mode only)
 * deletes the UNDERLYING brand color — a scale has no life of its own, so removing the
 * row and removing its swatch are the same act.
 */
export const ShadeScales = ({ colors, onRemove }: { colors: { name: string; hex: string }[]; onRemove?: (index: number) => void }) => {
    const [copied, setCopied] = useState("");
    const copy = (hex: string) => {
        void navigator.clipboard.writeText(hex).then(() => {
            setCopied(hex);
            setTimeout(() => setCopied(""), 1200);
        });
    };

    const rows = colors
        .map((c, index) => ({ ...c, index, scale: makeShadeScale(c.hex) }))
        .filter((r): r is typeof r & { scale: NonNullable<ReturnType<typeof makeShadeScale>> } => !!r.scale);
    if (!rows.length) return null;

    return (
        <div className="flex flex-col gap-5">
            {rows.map((row) => (
                <div key={`${row.name}-${row.hex}`}>
                    <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-primary">{row.name}</p>
                        {onRemove && (
                            <button
                                type="button"
                                title={`Remove ${row.name.trim() || "this color"} and its palette`}
                                onClick={() => onRemove(row.index)}
                                className="flex size-6 items-center justify-center rounded-md text-fg-quaternary transition duration-100 ease-linear hover:bg-secondary hover:text-error-primary"
                            >
                                <Trash01 className="size-3.5" aria-hidden="true" />
                            </button>
                        )}
                    </div>
                    <div className="mt-2 grid grid-cols-6 gap-1 sm:grid-cols-11">
                        {row.scale.map((s) => {
                            /* Label color comes from the scale itself (dark end for light chips,
                               light end for dark chips) — theme-independent, like the swatches. */
                            const light = s.step <= 400;
                            return (
                                <button
                                    key={s.step}
                                    type="button"
                                    title={`Copy ${s.hex}`}
                                    onClick={() => copy(s.hex)}
                                    className="flex h-14 flex-col items-center justify-center rounded-lg transition duration-100 ease-linear hover:scale-[1.04]"
                                    style={{ backgroundColor: s.hex, color: light ? row.scale[9].hex : row.scale[0].hex }}
                                >
                                    <span className="text-xs font-semibold">{copied === s.hex ? "✓" : s.step}</span>
                                    <span className="font-mono text-[10px] opacity-80">{s.hex.replace("#", "")}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};
