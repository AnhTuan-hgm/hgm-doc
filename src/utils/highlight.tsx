import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

/**
 * Yellow text highlighting for the project pages (/roadmap, /welcome-email-flow-overview).
 *
 * Storage: highlighted ranges are wrapped in ==double equals== markers inside the
 * plain text (same idea as the **bold** markers on the popup page), so they persist
 * to Supabase with the rest of the content — no schema change needed.
 *
 * - renderHighlights(text) → render ==…== as a yellow <mark> (shown locked AND unlocked).
 * - <HighlightPen enabled={editing} /> → while editing, selecting text inside any
 *   input/textarea within a [data-highlight-scope] container shows a floating
 *   "Highlight" button that wraps/unwraps the selection.
 */

/** Render ==marked== ranges as a yellow highlight; plain text passes through. */
export function renderHighlights(text: string): ReactNode {
    if (!text || !text.includes("==")) return text;
    const parts = text.split(/(==[^=]+?==)/g);
    if (parts.length === 1) return text;
    return parts.map((part, i) =>
        part.startsWith("==") && part.endsWith("==") && part.length > 4 ? (
            // Fixed black text (not an adaptive token): the mark's bg stays yellow/gold
            // in BOTH modes, so black is the readable pairing in both — an adaptive
            // token would flip to white-on-gold in dark mode and lose contrast.
            <mark key={i} className="rounded-sm bg-warning-secondary px-0.5 text-black">
                {part.slice(2, -2)}
            </mark>
        ) : (
            part
        ),
    );
}

type Field = HTMLInputElement | HTMLTextAreaElement;

/** Only plain text fields inside an opted-in page — never dates, URLs or global modals. */
const isHighlightable = (el: Element | null): el is Field =>
    !!el &&
    (el instanceof HTMLTextAreaElement || (el instanceof HTMLInputElement && el.type === "text")) &&
    !!el.closest("[data-highlight-scope]");

/** Wrap (or unwrap) the field's current selection with ==…== and notify React. */
function toggleSelection(el: Field) {
    const { selectionStart: start, selectionEnd: end, value } = el;
    if (start == null || end == null || start === end) return;
    const sel = value.slice(start, end);
    let next: string;
    let selStart = start;
    let selEnd = end;
    if (sel.startsWith("==") && sel.endsWith("==") && sel.length >= 5) {
        // Selection includes the markers — strip them.
        next = value.slice(0, start) + sel.slice(2, -2) + value.slice(end);
        selEnd = end - 4;
    } else if (value.slice(Math.max(0, start - 2), start) === "==" && value.slice(end, end + 2) === "==") {
        // Markers sit just outside the selection — strip those.
        next = value.slice(0, start - 2) + sel + value.slice(end + 2);
        selStart = start - 2;
        selEnd = end - 2;
    } else {
        next = value.slice(0, start) + "==" + sel + "==" + value.slice(end);
        selEnd = end + 4;
    }
    // Set through the native setter + input event so React's controlled onChange fires.
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, next);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.focus();
    el.setSelectionRange(selStart, selEnd);
}

/**
 * Floating "Highlight" pen. Mount once per page; renders nothing until the user
 * selects text in a highlightable field while editing mode is on.
 */
export const HighlightPen = ({ enabled }: { enabled: boolean }) => {
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
    const fieldRef = useRef<Field | null>(null);

    useEffect(() => {
        if (!enabled) {
            setPos(null);
            fieldRef.current = null;
            return;
        }
        const update = () => {
            const el = document.activeElement;
            if (isHighlightable(el) && el.selectionStart !== el.selectionEnd) {
                fieldRef.current = el;
                const r = el.getBoundingClientRect();
                setPos({
                    top: Math.max(8, r.top - 40),
                    left: Math.min(window.innerWidth - 130, Math.max(8, r.left + r.width / 2 - 56)),
                });
            } else {
                fieldRef.current = null;
                setPos(null);
            }
        };
        // Shift + H highlights the current field selection — keyboard equivalent of
        // the pen button (ignored when Cmd/Ctrl/Alt are held). Works wherever an
        // editable, highlightable field is focused with a non-empty selection.
        const onKey = (e: KeyboardEvent) => {
            if (!e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return;
            if (e.key !== "H" && e.key !== "h") return;
            const el = document.activeElement;
            if (isHighlightable(el) && el.selectionStart !== el.selectionEnd) {
                e.preventDefault();
                toggleSelection(el);
            }
        };
        document.addEventListener("selectionchange", update);
        document.addEventListener("select", update, true);
        document.addEventListener("keydown", onKey);
        window.addEventListener("scroll", update, true);
        window.addEventListener("resize", update);
        return () => {
            document.removeEventListener("selectionchange", update);
            document.removeEventListener("select", update, true);
            document.removeEventListener("keydown", onKey);
            window.removeEventListener("scroll", update, true);
            window.removeEventListener("resize", update);
        };
    }, [enabled]);

    if (!enabled || !pos) return null;

    return (
        <button
            type="button"
            title="Highlight the selected text (yellow) · Shift + H"
            // preventDefault keeps focus + selection inside the text field.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => fieldRef.current && toggleSelection(fieldRef.current)}
            style={{ top: pos.top, left: pos.left }}
            className="fixed z-[70] flex items-center gap-1.5 rounded-full bg-primary-solid px-3 py-1.5 text-xs font-semibold text-white shadow-lg transition duration-100 ease-linear hover:opacity-90"
        >
            <span className="inline-block size-3 rounded-[3px] bg-warning-solid" aria-hidden="true" />
            Highlight
        </button>
    );
};
