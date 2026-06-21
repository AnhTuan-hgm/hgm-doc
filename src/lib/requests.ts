/* Shared options + helpers for docs requests (footer modal + /requests page). */

export const REQUEST_EMAIL = "anhtuan@hiddengem.media";

/** Who the request is for. */
export const REQUEST_FOR_OPTIONS = [
    { id: "clients", label: "Clients" },
    { id: "webteam", label: "Web Team" },
    { id: "am", label: "Account Managers" },
    { id: "ma", label: "Marketing Assistant" },
] as const;

/** Priority levels, ordered low → urgent. `rank` is used for sorting. */
export const PRIORITY_OPTIONS = [
    { id: "low", label: "Low", rank: 1, badge: "bg-secondary text-tertiary" },
    { id: "medium", label: "Medium", rank: 2, badge: "bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300" },
    { id: "high", label: "High", rank: 3, badge: "bg-warning-secondary text-warning-primary" },
    { id: "urgent", label: "Urgent", rank: 4, badge: "bg-error-secondary text-error-primary" },
] as const;

export const requestForLabel = (id: string) => REQUEST_FOR_OPTIONS.find((o) => o.id === id)?.label ?? id;
export const priorityMeta = (id: string) => PRIORITY_OPTIONS.find((o) => o.id === id);
export const priorityLabel = (id: string) => priorityMeta(id)?.label ?? id;
export const priorityRank = (id: string) => priorityMeta(id)?.rank ?? 0;
