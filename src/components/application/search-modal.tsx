import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, BookOpen01, Code02, Flag05, FolderClosed, Inbox01, LayoutAlt01, Mail01, MessageChatCircle, SearchLg, Share07 } from "@untitledui/icons";
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
    { id: "s-projectmgmt", title: "Project Management", subtitle: "Overview, to-dos, roadmap & timeline", path: "/roadmap", kind: "Page", icon: Flag05 },
    { id: "s-dashboard", title: "Dashboard", subtitle: "Client Support overview", path: "/dashboard", kind: "Page", icon: LayoutAlt01 },
    { id: "s-setup", title: "AI Website Setup", subtitle: "Web Team workflow", path: "/webteam/ai-website-setup", kind: "Page", icon: Code02 },
    { id: "s-owner", title: "Owner Guide", subtitle: "Client owner guide", path: "/owner-guide", kind: "Page", icon: BookOpen01 },
    { id: "s-requests", title: "Requests", subtitle: "Docs request queue", path: "/requests", kind: "Page", icon: Inbox01 },
    { id: "s-metapixel", title: "Meta Pixel template", subtitle: "New client pixel page", path: "/metapixel", kind: "Template", icon: Share07 },
    { id: "s-popup", title: "Popup template", subtitle: "New lead-capture page", path: "/popup", kind: "Template", icon: Mail01 },
    { id: "s-template1", title: "Template 1", subtitle: "Copyable document template", path: "/template-1", kind: "Template", icon: Code02 },
    { id: "s-emailflow", title: "Welcome Email Flow — Overview", subtitle: "AM email-flow builder project reference", path: "/welcome-email-flow-overview", kind: "Page", icon: Mail01 },
    { id: "s-chatoverview", title: "AI Chat Widget — Overview", subtitle: "Claude-powered chat project reference", path: "/chat-widget-overview", kind: "Page", icon: MessageChatCircle },
    { id: "s-dashoverview", title: "Client Dashboard — Overview", subtitle: "Master Document project reference", path: "/client-dashboard-overview", kind: "Page", icon: LayoutAlt01 },
    { id: "s-promptlib", title: "Prompt & Pattern Library", subtitle: "Your private prompt/pattern vault", path: "/prompt-library", kind: "Page", icon: BookOpen01 },
];

/** Client/card/template rows that only exist in Supabase — fetched once, the first time the dropdown opens. */
async function fetchDynamicSearchItems(): Promise<SearchItem[]> {
    const [clients, leads, cards, docs] = await Promise.all([
        supabase.from("client_pages").select("slug, client_name, client_website"),
        supabase.from("leadcapture_pages").select("slug, client_name"),
        supabase.from("overview_cards").select("id, title, description, link, department"),
        supabase.from("template_docs").select("slug, name"),
    ]);
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
    (docs.data as { slug: string; name?: string }[] | null)?.forEach((d) => {
        if (d.slug === "template-1") return; // the master is a static item
        items.push({ id: "tpl-" + d.slug, title: d.name || d.slug, subtitle: `Template doc · /${d.slug}`, path: `/${d.slug}`, kind: "Template", icon: Code02 });
    });
    return items;
}

/**
 * Global search — an inline combobox, not a modal. At rest it shows the
 * bordered pill that used to only appear on hover; clicking/focusing it
 * shows a brand-blue active ring and drops a results panel directly below
 * the input (Spotify-style), instead of opening a centered overlay.
 */
export const SearchBar = () => {
    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [dynamic, setDynamic] = useState<SearchItem[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [activeIdx, setActiveIdx] = useState(0);

    const openDropdown = () => {
        setOpen(true);
        if (!loaded) {
            setLoaded(true);
            fetchDynamicSearchItems().then(setDynamic);
        }
    };

    // Global shortcut: Shift + F focuses the bar (ignored while typing in a field).
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const el = document.activeElement as HTMLElement | null;
            const typing = !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
            if (e.shiftKey && (e.key === "F" || e.key === "f") && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // Close the dropdown on outside click.
    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
        };
        window.addEventListener("mousedown", onDown);
        return () => window.removeEventListener("mousedown", onDown);
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
        setOpen(false);
        setQuery("");
        inputRef.current?.blur();
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
        else if (e.key === "Escape") { e.preventDefault(); setOpen(false); inputRef.current?.blur(); }
    };

    return (
        <div ref={containerRef} className="relative flex flex-1 items-center justify-center px-1">
            <div
                className={cx(
                    "flex w-full max-w-xl items-center gap-2.5 rounded-full border bg-primary px-4 py-2.5 transition duration-100 ease-linear",
                    open ? "border-brand ring-2 ring-brand/15" : "border-secondary hover:border-primary hover:shadow-xs",
                )}
            >
                <SearchLg className={cx("size-4 shrink-0 transition duration-100 ease-linear", open ? "text-fg-brand-primary" : "text-quaternary")} aria-hidden="true" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); openDropdown(); }}
                    onFocus={openDropdown}
                    onKeyDown={onKeyDown}
                    placeholder="Search pages, clients, cards…"
                    className="flex-1 bg-transparent text-sm text-primary placeholder:text-placeholder outline-none"
                />
                {!open && (
                    <span className="hidden shrink-0 items-center gap-1 sm:flex">
                        <kbd className="rounded border border-secondary bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-tertiary">Shift</kbd>
                        <kbd className="rounded border border-secondary bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-tertiary">F</kbd>
                    </span>
                )}
            </div>

            {/* Results dropdown — anchored directly below the bar, not an overlay */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.14 }}
                        className="absolute left-1/2 top-full z-30 mt-2 w-full max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl bg-primary shadow-2xl ring-1 ring-secondary"
                    >
                        <div className="max-h-[60vh] overflow-y-auto p-2">
                            {results.length === 0 ? (
                                <div className="px-4 py-10 text-center">
                                    <p className="text-sm font-medium text-secondary">No matches for “{query}”</p>
                                    <p className="mt-1 text-xs text-tertiary">Try a client name, page name, or “meta pixel”.</p>
                                </div>
                            ) : (
                                results.map((item, idx) => {
                                    // Templates are copyable "folders" you duplicate for a new client — a
                                    // folder icon reads clearer there than each template's own page icon.
                                    const Icon = item.kind === "Template" ? FolderClosed : item.icon;
                                    return (
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
                                                <Icon className="size-[18px]" />
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
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
