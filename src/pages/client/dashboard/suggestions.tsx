/**
 * Master Brand Document suggestion mode — the React pieces.
 *
 * A client can't edit the document (and can't write dashboard_pages at all — they're
 * `anon` to Supabase). Instead they propose values, which land in the separate
 * dashboard_suggestions table via the Netlify function, and an AM accepts or declines
 * each one. Accepting routes the value through patchFoundation + the ordinary Save
 * button, so the document itself only ever changes through the existing save path.
 *
 * The pure model (field-key addressing, apply/read/label) lives in
 * suggestions-model.ts so suggestions.check.ts can run it without React.
 */
import { createContext, useContext } from "react";
import { Button } from "@/components/base/buttons/button";
import type { Suggestion, SuggestionItem } from "@/pages/client/dashboard/suggestions-model";
import { cx } from "@/utils/cx";

export type { Suggestion };

/* ── Context the field components read ── */

export interface SuggestionCtx {
    /** "review" = team viewing; "suggest" = client actively suggesting; "off" = anything else. */
    mode: "off" | "suggest" | "review";
    /** Pending suggestions grouped by field key. */
    pendingByKey: Map<string, Suggestion[]>;
    /** Latest resolved suggestion per key — the client's "what happened" note. */
    resolvedByKey: Map<string, Suggestion>;
    /** The client's in-progress edits, keyed by field key. Entries equal to the live value are dropped at send. */
    draft: Record<string, string>;
    setDraft: (key: string, value: string) => void;
    /** Accepted locally but not yet saved — flipped to accepted in the DB only after Save succeeds. */
    queuedAccepts: ReadonlySet<string>;
    accept: (s: Suggestion) => void;
    decline: (s: Suggestion) => void;
    withdraw: (s: Suggestion) => void;
    /** The client's own identity email (empty for team / anonymous unlocks). */
    viewerEmail: string;
}

export const SuggestionContext = createContext<SuggestionCtx | null>(null);

const shortDate = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

/**
 * Everything a field shows about its suggestions: the pending box with Accept/Decline
 * (team) or Withdraw (the suggesting client), the queued-but-unsaved state, the stale
 * note when the field changed since the client saw it, and the resolved outcome note.
 * Renders nothing when the field has no suggestion history — so it's safe under every
 * field in every mode.
 */
export const SuggestionBox = ({ sKey, liveValue }: { sKey: string; liveValue: string }) => {
    const ctx = useContext(SuggestionContext);
    if (!ctx) return null;
    const pending = ctx.pendingByKey.get(sKey) ?? [];
    const resolved = ctx.resolvedByKey.get(sKey);
    if (pending.length === 0 && !resolved) return null;

    return (
        <div className="mt-2 flex flex-col gap-2">
            {pending.map((s) => {
                const queued = ctx.queuedAccepts.has(s.id);
                const stale = s.current_value !== liveValue;
                const mine = !!ctx.viewerEmail && s.suggested_by === ctx.viewerEmail;
                return (
                    <div key={s.id} className={cx("rounded-xl p-3 ring-1 ring-secondary", queued ? "bg-success-primary" : "bg-brand-primary")}>
                        <p className="text-xs font-medium text-secondary">
                            {queued ? "Accepted — press Save changes to make it permanent" : `Suggested by ${s.suggested_by} · ${shortDate(s.created_at)}`}
                        </p>
                        <p className="mt-1 text-sm whitespace-pre-wrap text-primary">
                            {s.suggested_value.trim() ? s.suggested_value : <span className="text-quaternary italic">(cleared)</span>}
                        </p>
                        {ctx.mode === "review" && stale && !queued && (
                            <p className="mt-1.5 text-xs text-warning-primary">
                                This field has changed since the suggestion was made — it was “{s.current_value.trim() || "empty"}” then.
                            </p>
                        )}
                        {ctx.mode === "review" && !queued && (
                            <div className="mt-2 flex items-center gap-2">
                                <Button size="sm" color="primary" onClick={() => ctx.accept(s)}>
                                    Accept
                                </Button>
                                <Button size="sm" color="secondary" onClick={() => ctx.decline(s)}>
                                    Decline
                                </Button>
                            </div>
                        )}
                        {ctx.mode !== "review" && mine && (
                            <button
                                type="button"
                                onClick={() => ctx.withdraw(s)}
                                className="mt-1.5 text-xs font-semibold text-tertiary transition duration-100 ease-linear hover:text-error-primary"
                            >
                                Withdraw suggestion
                            </button>
                        )}
                    </div>
                );
            })}
            {pending.length === 0 && resolved && (
                <p className="text-xs text-quaternary">
                    Your suggestion from {shortDate(resolved.created_at)} was {resolved.status}
                    {resolved.resolved_at ? ` on ${shortDate(resolved.resolved_at)}` : ""}.
                </p>
            )}
        </div>
    );
};

/* ── API wrappers — all client traffic goes through the Netlify function, which holds
      the service-role key and re-validates the email against allowed_emails. ── */

const ENDPOINT = "/.netlify/functions/dashboard-suggestions";

const call = async (body: Record<string, unknown>): Promise<Record<string, unknown>> => {
    let res: Response;
    try {
        res = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } catch {
        throw new Error("Couldn't reach the server — check your connection and try again.");
    }
    const text = await res.text();
    let json: Record<string, unknown> = {};
    if (text) {
        try {
            json = JSON.parse(text) as Record<string, unknown>;
        } catch {
            /* Not JSON at all — a proxy error page, or this app's own index.html served by
               a dev server with no functions behind it. Both used to sail through as
               "success" and silently drop the suggestions, so they throw instead. */
            throw new Error(`The server didn't answer properly (${res.status}). Nothing was sent — please try again.`);
        }
    }
    if (!res.ok) throw new Error(String(json.error ?? `Request failed (${res.status})`));
    return json;
};

export const fetchSuggestions = async (slug: string, email: string): Promise<Suggestion[]> => {
    const json = await call({ action: "list", slug, email });
    return (json.suggestions as Suggestion[]) ?? [];
};

export const sendSuggestions = (slug: string, email: string, items: SuggestionItem[]) => call({ action: "create", slug, email, items });

export const withdrawSuggestion = (slug: string, email: string, id: string) => call({ action: "withdraw", slug, email, id });
