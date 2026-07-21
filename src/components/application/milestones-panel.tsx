import type { FC } from "react";
import { Check, ClockStopwatch, Flag05, Plus, Trash01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { cx } from "@/utils/cx";
import { renderHighlights } from "@/utils/highlight";

/**
 * Milestones + "Waiting on" panel shared by the project-log pages: two stat
 * tiles (milestones done, waiting-on count) above a Milestones card and a
 * Waiting-on card. Fully editable in page edit mode; the arrays live inside
 * each page's sop_pages row so everything persists through the page's own
 * autosave path.
 */

export type MilestoneStatus = "done" | "progress" | "next";
export type Milestone = { id: string; label: string; status: MilestoneStatus };
export type WaitingItem = { id: string; text: string };

const uid = () => "id" + Math.random().toString(36).slice(2, 9);

const STATUS_META: Record<MilestoneStatus, { label: string; color: "success" | "blue" | "gray" }> = {
    done: { label: "Done", color: "success" },
    progress: { label: "In progress", color: "blue" },
    next: { label: "Up next", color: "gray" },
};
const STATUS_CYCLE: MilestoneStatus[] = ["done", "progress", "next"];

const CardLabel = ({ children }: { children: string }) => (
    <p className="text-xs font-semibold uppercase tracking-widest text-quaternary">{children}</p>
);

const StatTile = ({ icon, iconClasses, label, value }: { icon: FC<{ className?: string }>; iconClasses: string; label: string; value: string }) => {
    const Icon = icon;
    return (
        <div className="rounded-2xl bg-primary p-4 ring-1 ring-secondary">
            <div className="flex items-center gap-2.5">
                <span className={cx("flex size-8 shrink-0 items-center justify-center rounded-lg", iconClasses)}>
                    <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="text-sm font-medium text-secondary">{label}</span>
            </div>
            <p className="mt-2 text-3xl font-semibold text-primary tabular-nums">{value}</p>
        </div>
    );
};

const AddRowButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button
        type="button"
        onClick={onClick}
        className="mt-1 flex w-full items-center gap-2 rounded-lg border border-dashed border-primary px-2.5 py-2 text-sm font-medium text-tertiary transition duration-100 ease-linear hover:border-brand hover:text-brand-secondary"
    >
        <Plus className="size-4 shrink-0" aria-hidden="true" />
        {label}
    </button>
);

export const MilestonesPanel = ({
    milestones,
    waiting,
    editing,
    onMilestones,
    onWaiting,
}: {
    milestones: Milestone[];
    waiting: WaitingItem[];
    editing: boolean;
    onMilestones: (next: Milestone[]) => void;
    onWaiting: (next: WaitingItem[]) => void;
}) => {
    const doneCount = milestones.filter((m) => m.status === "done").length;

    const patchMilestone = (id: string, patch: Partial<Milestone>) =>
        onMilestones(milestones.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    const patchWaiting = (id: string, text: string) => onWaiting(waiting.map((w) => (w.id === id ? { ...w, text } : w)));

    return (
        <div className="flex flex-col gap-4">
            {/* Stat tiles */}
            <div className="grid grid-cols-2 gap-4">
                <StatTile icon={Flag05} iconClasses="bg-success-secondary text-fg-success-primary" label="Milestones done" value={`${doneCount}/${milestones.length}`} />
                <StatTile icon={ClockStopwatch} iconClasses="bg-warning-secondary text-fg-warning-primary" label="Waiting on" value={`${waiting.length}`} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                {/* Milestones */}
                <div className="rounded-2xl bg-primary p-5 ring-1 ring-secondary">
                    <CardLabel>Milestones</CardLabel>
                    <div className="mt-4 flex flex-col gap-4">
                        {milestones.map((m) => (
                            <div key={m.id} className="flex items-start gap-3">
                                <span
                                    className={cx(
                                        "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                                        m.status === "done" ? "bg-success-secondary text-fg-success-primary" : "bg-primary ring-1 ring-inset ring-primary",
                                    )}
                                >
                                    {m.status === "done" && <Check className="size-3" strokeWidth={3} aria-hidden="true" />}
                                </span>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={m.label}
                                        placeholder="Milestone…"
                                        onChange={(e) => patchMilestone(m.id, { label: e.target.value })}
                                        className="min-w-0 flex-1 rounded-lg border border-secondary bg-primary px-3 py-1.5 text-sm text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand"
                                    />
                                ) : (
                                    <p className="min-w-0 flex-1 text-sm leading-[1.4] text-primary">{renderHighlights(m.label)}</p>
                                )}
                                <button
                                    type="button"
                                    disabled={!editing}
                                    title={editing ? "Click to change status" : undefined}
                                    onClick={() =>
                                        patchMilestone(m.id, { status: STATUS_CYCLE[(STATUS_CYCLE.indexOf(m.status) + 1) % STATUS_CYCLE.length] })
                                    }
                                    className={cx("shrink-0", editing && "cursor-pointer")}
                                >
                                    <Badge size="sm" type="pill-color" color={STATUS_META[m.status].color}>
                                        {STATUS_META[m.status].label}
                                    </Badge>
                                </button>
                                {editing && (
                                    <button
                                        type="button"
                                        title="Remove milestone"
                                        onClick={() => onMilestones(milestones.filter((x) => x.id !== m.id))}
                                        className="mt-0.5 shrink-0 text-fg-quaternary transition duration-100 ease-linear hover:text-fg-error-secondary"
                                    >
                                        <Trash01 className="size-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                        {editing && (
                            <AddRowButton label="Add milestone" onClick={() => onMilestones([...milestones, { id: uid(), label: "", status: "next" }])} />
                        )}
                    </div>
                </div>

                {/* Waiting on */}
                <div className="rounded-2xl bg-primary p-5 ring-1 ring-secondary">
                    <CardLabel>Waiting on client / team</CardLabel>
                    <div className="mt-4 flex flex-col gap-4">
                        {waiting.map((w) => (
                            <div key={w.id} className="flex items-start gap-3">
                                <ClockStopwatch className="mt-0.5 size-4 shrink-0 text-fg-warning-secondary" aria-hidden="true" />
                                {editing ? (
                                    <>
                                        <textarea
                                            value={w.text}
                                            rows={2}
                                            placeholder="What is this project waiting on?"
                                            onChange={(e) => patchWaiting(w.id, e.target.value)}
                                            className="min-w-0 flex-1 resize-y rounded-lg border border-secondary bg-primary px-3 py-1.5 text-sm text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand"
                                        />
                                        <button
                                            type="button"
                                            title="Remove item"
                                            onClick={() => onWaiting(waiting.filter((x) => x.id !== w.id))}
                                            className="mt-0.5 shrink-0 text-fg-quaternary transition duration-100 ease-linear hover:text-fg-error-secondary"
                                        >
                                            <Trash01 className="size-4" />
                                        </button>
                                    </>
                                ) : (
                                    <p className="min-w-0 flex-1 text-sm leading-[1.4] text-secondary">{renderHighlights(w.text)}</p>
                                )}
                            </div>
                        ))}
                        {waiting.length === 0 && !editing && <p className="text-sm italic text-quaternary">Nothing blocked — full speed ahead.</p>}
                        {editing && <AddRowButton label="Add item" onClick={() => onWaiting([...waiting, { id: uid(), text: "" }])} />}
                    </div>
                </div>
            </div>
        </div>
    );
};
