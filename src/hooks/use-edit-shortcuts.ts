import { useEffect, useRef } from "react";

/**
 * Global editing shortcuts for internal team pages:
 *   Shift + E → toggle edit mode (unlock/lock)
 *   Shift + S → save immediately (optional flush callback) and lock
 * Ignored while typing in an input/textarea/contentEditable and when
 * Cmd/Ctrl/Alt are held — same conventions as the icon rail's Shift + F search.
 */
export function useEditShortcuts({
    enabled = true,
    onToggle,
    onSave,
}: {
    /** Gate the shortcuts (e.g. only for @hiddengem.media team members). */
    enabled?: boolean;
    /** Shift+E — toggle edit mode. */
    onToggle: () => void;
    /** Shift+S — flush pending saves; the hook locks editing via onLock afterwards. */
    onSave?: () => void;
}) {
    // Refs so the listener (bound once) always sees the latest callbacks/gate.
    const ref = useRef({ enabled, onToggle, onSave });
    ref.current = { enabled, onToggle, onSave };

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (!ref.current.enabled) return;
            const el = document.activeElement as HTMLElement | null;
            const typing = !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
            if (typing || !e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return;
            if (e.key === "E" || e.key === "e") {
                e.preventDefault();
                ref.current.onToggle();
            } else if ((e.key === "S" || e.key === "s") && ref.current.onSave) {
                e.preventDefault();
                ref.current.onSave();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);
}
