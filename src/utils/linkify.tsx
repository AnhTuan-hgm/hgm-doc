import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const URL_RE = /(https?:\/\/[^\s<>"']+)/g;

/** In-page preview of a link: the site loads in a framed popup the user can scroll,
 *  dismissed by clicking the backdrop, the ✕, or Esc. Sites that forbid embedding
 *  (X-Frame-Options / CSP) render blank in the frame — the header keeps a real
 *  open-in-new-tab link as the escape hatch, plus the hint text under the title. */
const LinkPreviewModal = ({ url, onClose }: { url: string; onClose: () => void }) => {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="flex h-[94vh] w-[98vw] flex-col overflow-hidden rounded-2xl bg-primary shadow-2xl ring-1 ring-secondary">
                <div className="flex items-center gap-3 border-b border-secondary px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-primary">{url}</p>
                        <p className="text-[11px] text-quaternary">Blank page? That site doesn't allow embedding — use ↗ to open it in a new tab.</p>
                    </div>
                    <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        title="Open in new tab"
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-tertiary transition duration-100 ease-linear hover:bg-secondary hover:text-primary"
                    >
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" /></svg>
                    </a>
                    <button
                        type="button"
                        aria-label="Close preview"
                        onClick={onClose}
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-tertiary transition duration-100 ease-linear hover:bg-secondary hover:text-primary"
                    >
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                </div>
                <iframe src={url} title={url} className="h-full w-full flex-1 border-0 bg-white" />
            </div>
        </div>,
        document.body,
    );
};

/** Plain text with bare http(s) URLs rendered as links that open an in-page preview
 *  popup (see LinkPreviewModal). Trailing punctuation ("…/edit).", "…?usp=sharing,")
 *  stays text, so a URL at the end of a sentence still resolves. */
export const Linkified = ({ text }: { text: string }) => {
    const [preview, setPreview] = useState<string | null>(null);
    return (
        <>
            {text.split(URL_RE).map((part, i) => {
                if (!/^https?:\/\//.test(part)) return part;
                const [, url, trail] = part.match(/^(.*?)([.,;:!?)\]]*)$/)!;
                return (
                    <span key={i}>
                        <a
                            href={url}
                            onClick={(e) => {
                                e.preventDefault();
                                setPreview(url);
                            }}
                            className="break-all text-brand-secondary underline transition duration-100 ease-linear hover:text-brand-secondary_hover"
                        >
                            {url}
                        </a>
                        {trail}
                    </span>
                );
            })}
            {preview && <LinkPreviewModal url={preview} onClose={() => setPreview(null)} />}
        </>
    );
};
