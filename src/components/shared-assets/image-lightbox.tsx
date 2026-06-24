import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { XClose } from "@untitledui/icons";

/**
 * Full-screen image viewer. Opens when `src` is set, closes on backdrop click,
 * the ✕ button, or Escape. The image renders at a fixed width (default 1120px,
 * capped to the viewport) and the overlay scrolls vertically for tall images,
 * with the close button pinned to the top-right.
 */
export const ImageLightbox = ({
    src,
    onClose,
    alt = "Full view",
    width = 1120,
}: {
    src: string | null;
    onClose: () => void;
    alt?: string;
    width?: number;
}) => {
    useEffect(() => {
        if (!src) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [src, onClose]);

    return (
        <AnimatePresence>
            {src && (
                <motion.div
                    className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                >
                    {/* Scroll layer: centered when short, scrolls vertically when the image is tall */}
                    <div
                        className="absolute inset-0 flex cursor-zoom-out items-start justify-center overflow-y-auto p-6 md:py-10"
                        onClick={onClose}
                    >
                        <div className="flex min-h-full items-start">
                            <motion.img
                                src={src}
                                alt={alt}
                                style={{ width }}
                                className="max-w-[92vw] cursor-default rounded-xl shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                                draggable={false}
                                initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 26 }}
                            />
                        </div>
                    </div>
                    {/* Pinned close button — sits on the non-scrolling overlay, always top-right */}
                    <button
                        type="button"
                        onClick={onClose}
                        title="Close"
                        className="absolute right-5 top-5 z-10 flex size-10 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
                    >
                        <XClose className="size-5" />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
