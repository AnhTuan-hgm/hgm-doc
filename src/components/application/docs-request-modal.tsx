import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { XClose } from "@untitledui/icons";
import { supabase, type DocsRequest } from "@/lib/supabase";
import { PRIORITY_OPTIONS, REQUEST_EMAIL, REQUEST_FOR_OPTIONS, priorityLabel, requestForLabel } from "@/lib/requests";
import { cx } from "@/utils/cx";

const buildMailto = (r: DocsRequest) => {
    const subject = `New docs request: ${r.title} [${priorityLabel(r.priority)}]`;
    const body = [
        `Requester: ${r.requester || "—"}`,
        `Request for: ${requestForLabel(r.request_for)}`,
        `Priority: ${priorityLabel(r.priority)}`,
        "",
        "Details:",
        r.details?.trim() || "—",
        "",
        "— Sent from HGM Docs",
    ].join("\n");
    return `mailto:${REQUEST_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

export const DocsRequestModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
    const [requester, setRequester] = useState("");
    const [title, setTitle] = useState("");
    const [requestFor, setRequestFor] = useState<string>(REQUEST_FOR_OPTIONS[0].id);
    const [priority, setPriority] = useState<string>("medium");
    const [details, setDetails] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const valid = title.trim().length > 0;

    const reset = () => {
        setRequester(""); setTitle(""); setRequestFor(REQUEST_FOR_OPTIONS[0].id);
        setPriority("medium"); setDetails(""); setError("");
    };

    const submit = async () => {
        if (!valid || saving) return;
        setSaving(true);
        setError("");
        const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
        const row: DocsRequest = {
            id,
            requester: requester.trim(),
            title: title.trim(),
            request_for: requestFor,
            priority,
            details: details.trim(),
            status: "open",
        };
        const { error: dbError } = await supabase.from("docs_requests").insert(row);
        if (dbError) {
            console.error("[docs request insert] Supabase error:", dbError);
            setError("Could not save: " + dbError.message);
            setSaving(false);
            return;
        }
        // Open the user's mail client pre-filled for AnhTuan.
        window.location.href = buildMailto(row);
        setSaving(false);
        reset();
        onClose();
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
                    onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
                >
                    <motion.div
                        className="max-h-full w-full max-w-md overflow-y-auto rounded-2xl bg-primary p-6 shadow-2xl ring-1 ring-secondary"
                        initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 10 }}
                        transition={{ type: "spring", stiffness: 300, damping: 26 }}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-md font-semibold text-primary">Send new docs request</h3>
                                <p className="mt-1 text-sm text-tertiary">We'll log it and email AnhTuan.</p>
                            </div>
                            <button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded-lg text-tertiary hover:bg-secondary">
                                <XClose className="size-4" />
                            </button>
                        </div>

                        <div className="mt-4 flex flex-col gap-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-secondary">Your name</label>
                                <input type="text" value={requester} onChange={(e) => setRequester(e.target.value)} placeholder="e.g. Olivia"
                                    className="w-full rounded-lg border border-secondary px-3 py-2 text-sm text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand" />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-secondary">Request name <span className="text-error-primary">*</span></label>
                                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. New onboarding checklist doc" autoFocus
                                    className="w-full rounded-lg border border-secondary px-3 py-2 text-sm text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand" />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-secondary">Request for</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {REQUEST_FOR_OPTIONS.map((o) => (
                                        <button key={o.id} type="button" onClick={() => setRequestFor(o.id)}
                                            className={cx(
                                                "rounded-lg border px-3 py-2 text-sm font-medium transition duration-100 ease-linear",
                                                requestFor === o.id
                                                    ? "border-brand bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"
                                                    : "border-secondary text-secondary hover:bg-secondary",
                                            )}>
                                            {o.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-secondary">Priority</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {PRIORITY_OPTIONS.map((o) => (
                                        <button key={o.id} type="button" onClick={() => setPriority(o.id)}
                                            className={cx(
                                                "rounded-lg border px-2 py-2 text-xs font-semibold transition duration-100 ease-linear",
                                                priority === o.id
                                                    ? "border-brand bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"
                                                    : "border-secondary text-secondary hover:bg-secondary",
                                            )}>
                                            {o.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-secondary">Details <span className="font-normal text-quaternary">(optional)</span></label>
                                <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} placeholder="Anything that helps us scope it…"
                                    className="w-full resize-none rounded-lg border border-secondary px-3 py-2 text-sm text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand" />
                            </div>
                        </div>

                        {error && <p className="mt-3 text-xs text-error-primary">{error}</p>}

                        <div className="mt-5 flex gap-3">
                            <button type="button" onClick={onClose} disabled={saving} className="flex-1 rounded-lg border border-secondary px-4 py-2 text-sm font-semibold text-secondary transition hover:bg-secondary disabled:opacity-50">
                                Cancel
                            </button>
                            <button type="button" onClick={submit} disabled={!valid || saving} className="flex-1 rounded-lg bg-brand-solid px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40">
                                {saving ? "Sending…" : "Submit request"}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
