import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, BookOpen01, Code02, CornerDownLeft, Inbox01, LayoutAlt01, Mail01, SearchLg, Share07, XClose } from "@untitledui/icons";
import type { FC } from "react";
import { supabase, type ClientPageData, type LeadCapturePageData, type OverviewCard } from "@/lib/supabase";
import { cx } from "@/utils/cx";

interface SearchItem {
    id: string;
    title: string;
    subtitle?: string;
    path: string; // internal path or full URL
    kind: string;
    icon: FC<{ className?: string }>;
}

/** Static, always-available destinations. */
const STATIC_ITEMS: SearchItem[] = [
    { id: "s-dashboard", title: "Dashboard", subtitle: "Client Support overview", path: "/dashboard", kind: "Page", icon: LayoutAlt01 },
    { id: "s-setup", title: "AI Website Setup", subtitle: "Web Team workflow", path: "/webteam/ai-website-setup", kind: "Page", icon: Code02 },
    { id: "s-owner", title: "Owner Guide", subtitle: "Client owner guide", path: "/owner-guide", kind: "Page", icon: BookOpen01 },
    { id: "s-requests", title: "Requests", subtitle: "Docs request queue", path: "/requests", kind: "Page", icon: Inbox01 },
    { id: "s-metapixel", title: "Meta Pixel template", subtitle: "New client pixel page", path: "/metapixel", kind: "Template", icon: Share07 },
    { id: "s-popup", title: "Popup template", subtitle: "New lead-capture page", path: "/popup", kind: "Template", icon: Mail01 },
];

export const SearchModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState("");
    const [dynamic, setDynamic] = useState<SearchItem[]>([]);
    const [activeIdx, setActiveIdx] = useState(0);

    // Load searchable rows from Supabase the first time the modal opens.
    useEffect(() => {
        if (!open) return;
        setQuery("");
        setActiveIdx(0);
        const t = setTimeout(() => inputRef.current?.focus(), 40);

        let cancelled = false;
        Promise.all([
            supabase.from("client_pages").select("slug, client_name, client_website"),
            supabase.from("leadcapture_pages").select("slug, client_name"),
            supabase.from("overview_cards").select("id, title, description, link, department"),
        ]).then(([clients, leads, cards]) => {
            if (cancelled) return;
            const items: SearchItem[] = [];
            (clients.data as ClientPageData[] | null)?.forEach((c) => {
                if (c.slug === "metapixel") return;
                items.push({ id: "c-" + c.slug, title: c.client_name || c.slug, subtitle: `Meta Pixel · /${c.slug}`, path: `/${c.slug}`, kind: "Meta Pixel", icon: Share07 });
            });
            (leads.data as LeadCapturePageData[] | null)?.forEach((l) => {
                items.push({ id: "l-" + l.slug, title: l.client_name || l.slug, subtitle: `Lead capture · /${l.slug}`, path: `/${l.slug}`, kind: "Lead Capture", icon: Mail01 });
            });
            (cards.data as OverviewCard[] | null)?.forEach((card) => {
                if (!card.link) return;
                items.push({ id: "card-" + card.id, title: card.title, subtitle: card.description, path: card.link, kind: "Card", icon: LayoutAlt01 });
            });
            setDynamic(items);
        });

        return () => { cancelled = true; clearTimeout(t); };
    }, [open]);

    const results = useMemo(() => {
        const all = [...STATIC_ITEMS, ...dynamic];
        const q = query.trim().toLowerCase();
        if (!q) return all;
        return all.filter((i) =>
            i.title.toLowerCase().includes(q) ||
            i.subtitle?.toLowerCase().includes(q) ||
            i.path.toLowerCase().includes(q) ||
            i.kind.toLowerCase().includes(q),
        );
    }, [query, dynamic]);

    useEffect(() => { setActiveIdx(0); }, [query]);

    const go = (item?: SearchItem) => {
        if (!item) return;
        onClose();
        const p = item.path;
        if (/^https?:\/\//i.test(p)) {
            try {
                const u = new URL(p);
                if (u.host === window.location.host) { navigate(u.pathname + u.search); return; }
            } catch { /* fall through */ }
            window.open(p, "_blank", "noopener");
            return;
        }
        navigate(p.startsWith("/") ? p : "/" + p);
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
        else if (e.key === "Enter") { e.preventDefault(); go(results[activeIdx]); }
        else if (e.key === "Escape") { e.preventDefault(); onClose(); }
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 px-4 pt-[12vh]"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}
                    onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
                >
                    <motion.div
                        className="flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-primary shadow-2xl ring-1 ring-secondary"
                        initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 8 }}
                        transition={{ type: "spring", stiffness: 320, damping: 28 }}
                    >
                        {/* Search field */}
                        <div className="flex items-center gap-3 border-b border-secondary px-4">
                            <SearchLg className="size-5 shrink-0 text-quaternary" aria-hidden="true" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={onKeyDown}
                                placeholder="Search pages, clients, cards…"
                                className="flex-1 bg-transparent py-4 text-md text-primary placeholder:text-placeholder outline-none"
                            />
                            <button type="button" onClick={onClose} className="flex size-7 shrink-0 items-center justify-center rounded-lg text-tertiary hover:bg-secondary">
                                <XClose className="size-4" />
                            </button>
                        </div>

                        {/* Results */}
                        <div className="flex-1 overflow-y-auto p-2">
                            {results.length === 0 ? (
                                <div className="px-4 py-10 text-center">
                                    <p className="text-sm font-medium text-secondary">No matches for “{query}”</p>
                                    <p className="mt-1 text-xs text-tertiary">Try a client name, page name, or “meta pixel”.</p>
                                </div>
                            ) : (
                                results.map((item, idx) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => go(item)}
                                        onMouseEnter={() => setActiveIdx(idx)}
                                        className={cx(
                                            "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition duration-100 ease-linear",
                                            idx === activeIdx ? "bg-secondary" : "hover:bg-secondary",
                                        )}
                                    >
                                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-quaternary ring-1 ring-secondary">
                                            <item.icon className="size-[18px]" />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-semibold text-primary">{item.title}</span>
                                            {item.subtitle && <span className="block truncate text-xs text-tertiary">{item.subtitle}</span>}
                                        </span>
                                        <span className="shrink-0 rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-tertiary group-hover:bg-primary">
                                            {item.kind}
                                        </span>
                                        <ArrowRight className="size-4 shrink-0 text-quaternary opacity-0 transition group-hover:opacity-100" />
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Footer tip */}
                        <div className="flex items-center justify-between border-t border-secondary px-4 py-2.5 text-[11px] text-tertiary">
                            <span className="flex items-center gap-1.5">
                                <CornerDownLeft className="size-3.5" /> to open · ↑↓ to navigate
                            </span>
                            <span>
                                Tip: press <kbd className="rounded border border-secondary bg-secondary px-1.5 py-0.5 font-semibold text-secondary">Shift</kbd> + <kbd className="rounded border border-secondary bg-secondary px-1.5 py-0.5 font-semibold text-secondary">F</kbd> to search
                            </span>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
