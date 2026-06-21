import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Plus } from "@untitledui/icons";
import { supabase, type DocsRequest } from "@/lib/supabase";
import { DocsRequestModal } from "@/components/application/docs-request-modal";
import { priorityMeta, priorityRank, requestForLabel } from "@/lib/requests";
import { cx } from "@/utils/cx";

type SortKey = "priority" | "date";

const formatDate = (iso?: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const SortButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) => (
    <button
        type="button"
        onClick={onClick}
        className={cx(
            "rounded-lg border px-3 py-1.5 text-sm font-semibold transition duration-100 ease-linear",
            active
                ? "border-brand bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"
                : "border-secondary text-secondary hover:bg-secondary hover:text-primary",
        )}
    >
        {children}
    </button>
);

export const RequestsScreen = () => {
    const navigate = useNavigate();
    const [rows, setRows] = useState<DocsRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [sort, setSort] = useState<SortKey>("priority");
    const [modalOpen, setModalOpen] = useState(false);

    const load = () => {
        setLoading(true);
        supabase
            .from("docs_requests")
            .select("*")
            .then(({ data, error }) => {
                if (!error && data) setRows(data as DocsRequest[]);
                setLoading(false);
            });
    };

    useEffect(load, []);

    const sorted = useMemo(() => {
        const copy = [...rows];
        copy.sort((a, b) => {
            if (sort === "priority") {
                const diff = priorityRank(b.priority) - priorityRank(a.priority);
                if (diff !== 0) return diff;
            }
            // date desc (newest first) — also the tiebreaker for priority sort
            return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
        });
        return copy;
    }, [rows, sort]);

    return (
        <main className="min-h-dvh bg-secondary">
            <div className="mx-auto w-full max-w-[860px] px-6 py-10">
                {/* Header */}
                <button
                    type="button"
                    onClick={() => navigate("/dashboard")}
                    className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-tertiary transition hover:text-primary"
                >
                    <ArrowLeft className="size-4" /> Back to dashboard
                </button>

                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-display-xs font-semibold text-primary">Requests</h1>
                        <p className="mt-1 text-sm text-tertiary">
                            {loading ? "Loading…" : `${rows.length} request${rows.length !== 1 ? "s" : ""}`}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setModalOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-solid px-3.5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                        <Plus className="size-4" /> New request
                    </button>
                </div>

                {/* Sort */}
                <div className="mt-6 flex items-center gap-2">
                    <span className="text-sm text-tertiary">Sort by</span>
                    <SortButton active={sort === "priority"} onClick={() => setSort("priority")}>Priority</SortButton>
                    <SortButton active={sort === "date"} onClick={() => setSort("date")}>Date</SortButton>
                </div>

                {/* List */}
                <div className="mt-5 overflow-hidden rounded-xl border border-secondary bg-primary">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="size-6 animate-spin rounded-full border-2 border-brand border-t-transparent opacity-60" />
                        </div>
                    ) : sorted.length === 0 ? (
                        <div className="px-6 py-16 text-center">
                            <p className="text-sm font-medium text-secondary">No requests yet</p>
                            <p className="mt-1 text-sm text-tertiary">Submit one with the “New request” button above.</p>
                        </div>
                    ) : (
                        sorted.map((r) => {
                            const pm = priorityMeta(r.priority);
                            return (
                                <div key={r.id} className="flex items-start justify-between gap-4 border-b border-secondary px-5 py-4 last:border-0">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={cx("inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-semibold", pm?.badge)}>
                                                {pm?.label ?? r.priority}
                                            </span>
                                            <h3 className="truncate text-sm font-semibold text-primary">{r.title}</h3>
                                        </div>
                                        <p className="mt-1 text-xs text-tertiary">
                                            {requestForLabel(r.request_for)}
                                            {r.requester ? ` · ${r.requester}` : ""}
                                        </p>
                                        {r.details && <p className="mt-1.5 text-sm text-secondary">{r.details}</p>}
                                    </div>
                                    <span className="shrink-0 whitespace-nowrap text-xs text-quaternary">{formatDate(r.created_at)}</span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <DocsRequestModal open={modalOpen} onClose={() => { setModalOpen(false); load(); }} />
        </main>
    );
};
