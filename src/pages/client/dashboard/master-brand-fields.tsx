/**
 * The field-level building blocks of the Master Brand Document.
 *
 * Each renders read-only prose when the dashboard is locked and an input when it is not,
 * so the page reads as a document rather than a form full of empty boxes. The section
 * metadata and the compiler they pair with live in master-brand-document.ts.
 */
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Check, Trash01 } from "@untitledui-pro/icons/line";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { editInput } from "@/pages/client/dashboard/dashboard-chrome";
import { type LocalFavorite, filled } from "@/pages/client/dashboard/dashboard-model";
import { FOUNDATION_SECTIONS, type FoundationSectionId, WORKFLOW_SECTION_COUNT } from "@/pages/client/dashboard/master-brand-document";
import { cx } from "@/utils/cx";

/** One of the eleven sections. Anchored by id so the in-page rail can jump to it;
 *  `scroll-mt-24` keeps the eyebrow clear of the sticky dashboard header on arrival. */
export const DocSection = ({
    id,
    label,
    badge,
    action,
    children,
}: {
    id: FoundationSectionId;
    label: string;
    badge?: ReactNode;
    action?: ReactNode;
    children: ReactNode;
}) => (
    <section id={`mbd-${id}`} className="scroll-mt-24 border-t border-secondary pt-8 first:border-t-0 first:pt-0">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="font-mono text-[11px] font-semibold tracking-[0.08em] text-quaternary uppercase">{label}</h3>
                {badge}
            </div>
            {action}
        </div>
        <div className="mt-4">{children}</div>
    </section>
);

/** Marks the four sections an AM pastes in from the brand messaging workflow. */
export const WorkflowBadge = () => (
    <BadgeWithDot color="warning" size="sm" type="pill-color">
        From brand messaging workflow
    </BadgeWithDot>
);

/** Marks where a section's content pulls from — the onboarding form, the client's
 *  website, or pasted guest reviews — so an AM can see each answer's source at a glance.
 *  Blue on purpose: yellow stays reserved for the workflow sections above. */
export const SourceBadge = ({ children }: { children: ReactNode }) => (
    <BadgeWithDot color="blue" size="sm" type="pill-color">
        {children}
    </BadgeWithDot>
);

/** A labelled field. Renders read-only prose when locked and an input when not, so the
 *  document reads as a document rather than as a form full of empty boxes. */
export const DocField = ({
    label,
    hint,
    value,
    placeholder,
    rows,
    isLocked,
    onChange,
    className,
    mono,
}: {
    label?: string;
    hint?: string;
    value: string;
    placeholder?: string;
    /** Present ⇒ textarea of this many rows; absent ⇒ single-line input. */
    rows?: number;
    isLocked: boolean;
    onChange: (v: string) => void;
    className?: string;
    mono?: boolean;
}) => (
    <div className={className}>
        {label && <p className="text-sm font-medium text-secondary">{label}</p>}
        {hint && <p className="mt-0.5 text-xs text-quaternary">{hint}</p>}
        {isLocked ? (
            <p className={cx("mt-1 text-md whitespace-pre-wrap", filled(value) ? "text-tertiary" : "text-quaternary italic", mono && "font-mono text-sm")}>
                {filled(value) ? value : "Not filled in"}
            </p>
        ) : rows ? (
            <textarea
                rows={rows}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={cx(editInput(), "mt-1.5 resize-y", mono && "font-mono")}
            />
        ) : (
            <input
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={cx(editInput(), "mt-1.5", mono && "font-mono")}
            />
        )}
    </div>
);

/** The boxed guests / bedrooms / beds / bathrooms counts on a focus property. */
export const DocStat = ({ label, value, isLocked, onChange }: { label: string; value: string; isLocked: boolean; onChange: (v: string) => void }) => (
    <div className="rounded-xl bg-primary p-3 ring-1 ring-secondary">
        <p className="text-xs font-medium text-secondary">{label}</p>
        {isLocked ? (
            <p className={cx("mt-1 text-md tabular-nums", filled(value) ? "text-tertiary" : "text-quaternary")}>{filled(value) ? value : "—"}</p>
        ) : (
            <input placeholder="—" value={value} onChange={(e) => onChange(e.target.value)} className={cx(editInput(), "mt-1 tabular-nums")} />
        )}
    </div>
);

/**
 * The document's own section rail — eleven entries is too many to scroll blind.
 *
 * Scroll-spy runs on one IntersectionObserver over all eleven anchors. The callback only
 * receives the entries that CHANGED, so a running map of what is on screen is kept and the
 * first section in document order wins; picking the topmost of a partial batch would make
 * the highlight jump to whichever section happened to cross the line last. The bottom
 * rootMargin keeps the highlight on the section you are reading rather than the one just
 * entering from below.
 */
export const DocRail = ({ progress, filledCount }: { progress: Record<FoundationSectionId, boolean>; filledCount: number }) => {
    const [active, setActive] = useState<FoundationSectionId>(FOUNDATION_SECTIONS[0].id);
    const onScreen = useRef(new Set<FoundationSectionId>());

    useEffect(() => {
        const els = FOUNDATION_SECTIONS.map((s) => document.getElementById(`mbd-${s.id}`)).filter((el): el is HTMLElement => Boolean(el));
        if (!els.length) return;

        const io = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    const id = e.target.id.replace("mbd-", "") as FoundationSectionId;
                    if (e.isIntersecting) onScreen.current.add(id);
                    else onScreen.current.delete(id);
                }
                const first = FOUNDATION_SECTIONS.find((s) => onScreen.current.has(s.id));
                if (first) setActive(first.id);
            },
            { rootMargin: "-96px 0px -55% 0px" },
        );
        els.forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, []);

    const jump = (id: FoundationSectionId) => {
        document.getElementById(`mbd-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
        setActive(id);
    };

    return (
        <nav aria-label="Master Brand Document sections" className="lg:sticky lg:top-6 lg:w-56 lg:shrink-0">
            <p className="font-mono text-[11px] font-semibold tracking-[0.08em] text-quaternary uppercase">Sections</p>
            <ul className="mt-3 flex flex-col gap-0.5">
                {FOUNDATION_SECTIONS.map((s, i) => (
                    <li key={s.id}>
                        <button
                            type="button"
                            onClick={() => jump(s.id)}
                            aria-current={active === s.id ? "true" : undefined}
                            className={cx(
                                "flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm transition duration-100 ease-linear",
                                active === s.id
                                    ? "bg-brand-primary_alt font-semibold text-brand-secondary"
                                    : "text-tertiary hover:bg-primary_hover hover:text-secondary",
                            )}
                        >
                            {/* Numbered to match the compiled document's "## 1. …" headings. */}
                            <span className="w-5 shrink-0 font-mono text-xs text-quaternary tabular-nums">{i + 1}.</span>
                            <span className="min-w-0 flex-1">{s.label}</span>
                            {progress[s.id] && <Check className="size-3.5 shrink-0 text-fg-success-secondary" aria-label="Has content" />}
                        </button>
                    </li>
                ))}
            </ul>
            <div className="mt-4 border-t border-secondary pt-3">
                <p className="flex items-start gap-2 text-xs text-tertiary">
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-fg-warning-secondary" aria-hidden="true" />
                    {WORKFLOW_SECTION_COUNT} sections pull from the brand messaging workflow
                </p>
                <p className="mt-2 text-xs text-quaternary tabular-nums">
                    {FOUNDATION_SECTIONS.length} sections ·{" "}
                    {filledCount === 0 ? "nothing filled in yet" : `${filledCount} of ${FOUNDATION_SECTIONS.length} filled`}
                </p>
            </div>
        </nav>
    );
};

/** A two-column name / short-description table (Restaurants, Activities). */
export const FavoriteTable = ({
    title,
    note,
    rows,
    isLocked,
    onChange,
    onAdd,
    onRemove,
}: {
    title: string;
    note: string;
    rows: LocalFavorite[];
    isLocked: boolean;
    onChange: (id: string, patch: Partial<LocalFavorite>) => void;
    onAdd: () => void;
    onRemove: (id: string) => void;
}) => (
    <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-md font-semibold text-primary">{title}</p>
            {isLocked ? (
                <span className="text-xs text-quaternary">{note}</span>
            ) : (
                <button
                    type="button"
                    onClick={onAdd}
                    className="text-sm font-semibold text-brand-secondary transition duration-100 ease-linear hover:underline"
                >
                    + Add row
                </button>
            )}
        </div>
        {!isLocked && <p className="mt-0.5 text-xs text-quaternary">{note}</p>}
        <div className="mt-2">
            {rows.length === 0 && (
                <p className="rounded-xl border border-dashed border-secondary px-4 py-3 text-sm text-quaternary italic">Nothing added yet.</p>
            )}
            {rows.map((r) => (
                <div
                    key={r.id}
                    className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_auto] items-center gap-3 border-b border-secondary py-2.5 last:border-b-0"
                >
                    {isLocked ? (
                        <>
                            <span className={cx("truncate text-md", filled(r.name) ? "text-primary" : "text-quaternary italic")}>
                                {filled(r.name) ? r.name : "Name"}
                            </span>
                            <span className={cx("text-md", filled(r.description) ? "text-tertiary" : "text-quaternary italic")}>
                                {filled(r.description) ? r.description : "Short description"}
                            </span>
                            <span />
                        </>
                    ) : (
                        <>
                            <input placeholder="Name" value={r.name} onChange={(e) => onChange(r.id, { name: e.target.value })} className={editInput()} />
                            <input
                                placeholder="Short description"
                                value={r.description}
                                onChange={(e) => onChange(r.id, { description: e.target.value })}
                                className={editInput()}
                            />
                            <button
                                type="button"
                                title={`Remove ${r.name.trim() || "row"}`}
                                onClick={() => onRemove(r.id)}
                                className="flex size-7 items-center justify-center rounded-lg text-fg-quaternary transition duration-100 ease-linear hover:bg-secondary hover:text-error-primary"
                            >
                                <Trash01 className="size-3.5" aria-hidden="true" />
                            </button>
                        </>
                    )}
                </div>
            ))}
        </div>
    </div>
);
