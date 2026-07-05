/*
 * Supabase migration (run once in SQL editor):
 *
 * create table if not exists owner_onboarding (
 *   session_id  text        primary key,
 *   credentials jsonb       default '{}'::jsonb,
 *   checklist   jsonb       default '{}'::jsonb,
 *   notes       jsonb       default '{}'::jsonb,
 *   updated_at  timestamptz default now()
 * );
 * alter table owner_onboarding enable row level security;
 * create policy "allow_all" on owner_onboarding for all using (true) with check (true);
 */

import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { AppShell } from "@/components/application/icon-rail";
import { VideoAttach, VideoEmbed } from "@/components/application/video-block";
import { useTheme } from "@/providers/theme-provider";
import { compressImageFile } from "@/utils/compress-image";
import { cx } from "@/utils/cx";
import { supabase, type OwnerGuideMeta } from "@/lib/supabase";
import { readSopPage, writeSopPage } from "@/lib/db-sync";
import { dbLogger } from "@/lib/db-logger";
import { useEditShortcuts } from "@/hooks/use-edit-shortcuts";

// ── Types ─────────────────────────────────────────────────────────

type LensPos = { x: number; y: number };
type SaveStatus = "idle" | "saving" | "saved" | "error" | "empty";
type CredSection = "none" | "pms" | "netlify" | "hosting" | "supabase" | "resend" | "stripe" | "domain" | "cloudflare" | "overview";

interface StepImage { id: string; src: string; lensPos?: LensPos }
interface Instruction { text: string; image?: string; lensPos?: LensPos }

interface StepData {
    title: string;
    description: string;
    instructions: Instruction[];
    benefits?: string[];
    checklistLabels: [string, string][];
    images: StepImage[];
    video?: string;
    credSection: CredSection;
}

type Creds = Record<string, string>;
type Checklist = Record<string, boolean>;
type Notes = Record<string, string>;
interface OwnerData { credentials: Creds; checklist: Checklist; notes: Notes }

/**
 * Credential sections that render the uniform "Account User name + Password" form.
 * Includes the legacy section ids ("hosting", "stripe") used by guide content
 * saved before the simplification, so existing client guides keep their forms.
 */
const CRED_FORM_SECTIONS = ["pms", "netlify", "hosting", "supabase", "resend", "stripe", "domain", "cloudflare"];

/** Each service stores a `${section}_username` and `${section}_password`. */
function sectionFilledIn(credentials: Creds, sec: string): boolean {
    return !!(credentials[`${sec}_username`]?.trim() || credentials[`${sec}_password`]?.trim());
}

const CONTENT_KEY = "hgm_owner_content_v2";
const GUIDE_CONTENT_SLUG = "owner-guide-content";
const SESSION_KEY = "hgm_owner_session";

const uid = () => Math.random().toString(36).slice(2, 9);

function getOrCreateSession(): string {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
        id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : [uid(), uid(), uid()].join("-");
        localStorage.setItem(SESSION_KEY, id);
    }
    return id;
}

// ── Seed content ──────────────────────────────────────────────────

/**
 * Service steps added through the editor default to credSection "none", so they
 * never render a credential form. Infer the real section from the step title so
 * every service (incl. Resend / Cloudflare) shows the Account-login form.
 */
function inferSection(s: StepData): CredSection {
    if (s.credSection && s.credSection !== "none") return s.credSection;
    const t = (s.title ?? "").toLowerCase();
    if (/resend/.test(t)) return "resend";
    if (/cloudflare/.test(t)) return "cloudflare";
    if (/netlify/.test(t)) return "netlify";
    if (/supabase/.test(t)) return "supabase";
    if (/stripe/.test(t)) return "stripe";
    if (/\bpms\b|property management/.test(t)) return "pms";
    if (/domain|registrar/.test(t)) return "domain";
    return s.credSection ?? "none";
}

/** Convert legacy string instructions (and missing arrays) into the {text, image} shape. */
function normalizeSteps(steps: StepData[]): StepData[] {
    return steps.map((s) => ({
        ...s,
        credSection: inferSection(s),
        images: s.images ?? [],
        instructions: ((s.instructions ?? []) as (string | Instruction)[]).map((ins) =>
            typeof ins === "string" ? { text: ins } : { text: ins.text ?? "", image: ins.image, lensPos: ins.lensPos },
        ),
    }));
}

function seedContent(): StepData[] {
    return normalizeSteps([
        {
            title: "Welcome & Roles",
            credSection: "none",
            description: "This guide collects the logins for the handful of accounts that power your booking website. You — the business owner — own every account: your PMS, hosting, database, email, domain, and DNS. Your developer is only given access to configure them, never ownership.",
            benefits: [
                "You stay in control — every account is registered under your own name and email",
                "Secure by design — your logins are stored privately and can be changed at any time",
                "No lock-in — your developer can be swapped without ever losing an account",
            ],
            instructions: [
                "Confirm the accounts you'll need: PMS, Netlify, Supabase, Resend, your domain registrar, and Cloudflare",
                "Make sure each account is registered under your own business email so you keep full ownership",
                "Work through each step and enter the account user name and password so your developer can connect them",
            ],
            checklistLabels: [
                ["Confirm roles and accounts", "You'll own the PMS, Netlify, Supabase, Resend, domain, and Cloudflare accounts"],
                ["Gather your logins", "You have the user name and password ready for each account"],
            ],
            images: [],
        },
        {
            title: "Property Management System (PMS)",
            credSection: "pms",
            description: "Your PMS (Guesty, Hostaway, Lodgify, Hostfully, Smoobu, etc.) syncs availability, rates, and reservations to your direct booking website. Enter the account username and password you use to log in.",
            instructions: [
                "Open the login page for your PMS provider",
                "Enter the account user name (usually your email) and password you sign in with below",
                "Save — your developer uses this to connect the integration",
            ],
            checklistLabels: [
                ["Locate your PMS account login", "You know the account user name and password"],
                ["Enter and save your PMS login", "User name and password saved"],
            ],
            images: [],
        },
        {
            title: "Netlify Hosting",
            credSection: "netlify",
            description: "Netlify hosts your website code and serves the live site. Enter the account username and password you use to sign in at app.netlify.com.",
            instructions: [
                "Open app.netlify.com and find the account you sign in with",
                "Enter that user name (email) and password below",
                "Save — your developer uses this to manage deployments",
            ],
            checklistLabels: [
                ["Locate your Netlify account login", "You know the account user name and password"],
                ["Enter and save your Netlify login", "User name and password saved"],
            ],
            images: [],
        },
        {
            title: "Supabase Database",
            credSection: "supabase",
            description: "Supabase is the secure backend that stores your property details, reservations, and listing photos. Enter the account username and password you use to sign in at supabase.com.",
            instructions: [
                "Open supabase.com and find the account you sign in with",
                "Enter that user name (email) and password below",
                "Save — your developer uses this to manage your database",
            ],
            checklistLabels: [
                ["Locate your Supabase account login", "You know the account user name and password"],
                ["Enter and save your Supabase login", "User name and password saved"],
            ],
            images: [],
        },
        {
            title: "Resend Email",
            credSection: "resend",
            description: "Resend sends the transactional emails for your site — booking confirmations, lead notifications, and receipts. Enter the account username and password you use to sign in at resend.com.",
            instructions: [
                "Open resend.com and find the account you sign in with",
                "Enter that user name (email) and password below",
                "Save — your developer uses this to send emails from your domain",
            ],
            checklistLabels: [
                ["Locate your Resend account login", "You know the account user name and password"],
                ["Enter and save your Resend login", "User name and password saved"],
            ],
            images: [],
        },
        {
            title: "Domain Registrar",
            credSection: "domain",
            description: "Your domain registrar is where your web address is registered (GoDaddy, Namecheap, Google Domains, etc.). Enter the account username and password you use to sign in there.",
            instructions: [
                "Open the login page for the registrar where your domain is registered",
                "Enter the account user name (email) and password you sign in with below",
                "Save — your developer uses this to point the domain to your site",
            ],
            checklistLabels: [
                ["Locate your registrar account login", "You know the account user name and password"],
                ["Enter and save your registrar login", "User name and password saved"],
            ],
            images: [],
        },
        {
            title: "Cloudflare",
            credSection: "cloudflare",
            description: "Cloudflare manages your DNS and CDN — keeping the site fast and secure. Enter the account username and password you use to sign in at dash.cloudflare.com.",
            instructions: [
                "Open dash.cloudflare.com and find the account you sign in with",
                "Enter that user name (email) and password below",
                "Save — your developer uses this to manage DNS and security",
            ],
            checklistLabels: [
                ["Locate your Cloudflare account login", "You know the account user name and password"],
                ["Enter and save your Cloudflare login", "User name and password saved"],
            ],
            images: [],
        },
        {
            title: "Overview",
            credSection: "overview",
            description: "Review all the credentials you have entered. When everything looks correct, click Save — the guide will lock and all values will be partially hidden for security.",
            instructions: [],
            checklistLabels: [],
            images: [],
        },
    ] as unknown as StepData[]);
}

function loadContent(): StepData[] {
    try {
        const raw = localStorage.getItem(CONTENT_KEY);
        if (raw) {
            const d = JSON.parse(raw) as StepData[];
            if (Array.isArray(d) && d.length) return normalizeSteps(d);
        }
    } catch {}
    return seedContent();
}

function saveContent(steps: StepData[]) {
    try { localStorage.setItem(CONTENT_KEY, JSON.stringify(steps)); } catch {}
}

function emptyOwner(): OwnerData { return { credentials: {}, checklist: {}, notes: {} }; }

// ── Supabase helpers ──────────────────────────────────────────────

async function dbLoad(sessionId: string): Promise<OwnerData> {
    try {
        const { data, error } = await supabase
            .from("owner_onboarding")
            .select("credentials, checklist, notes")
            .eq("session_id", sessionId)
            .maybeSingle();
        if (error || !data) return emptyOwner();
        return {
            credentials: (data.credentials as Creds) ?? {},
            checklist: (data.checklist as Checklist) ?? {},
            notes: (data.notes as Notes) ?? {},
        };
    } catch { return emptyOwner(); }
}

async function dbSave(sessionId: string, data: OwnerData): Promise<boolean> {
    try {
        const { error } = await supabase
            .from("owner_onboarding")
            .upsert({
                session_id: sessionId,
                credentials: data.credentials,
                checklist: data.checklist,
                notes: data.notes,
                updated_at: new Date().toISOString(),
            }, { onConflict: "session_id" });
        return !error;
    } catch { return false; }
}

// ── Masking (for locked overview) ────────────────────────────────

function maskHalf(val: string): string {
    if (!val) return "—";
    if (val.length <= 6) return "••••••••";
    const show = Math.ceil(val.length / 2);
    return val.slice(0, show) + "•".repeat(val.length - show);
}

// ── Image magnifier ───────────────────────────────────────────────

const LENS = 72, ZOOM = 1.3;

const ImageMagnifier = ({ src, editing, lensPos, onLensPosChange, onRemove }: {
    src: string; editing: boolean; lensPos?: LensPos;
    onLensPosChange?: (p: LensPos) => void; onRemove?: () => void;
}) => {
    const imgRef = useRef<HTMLImageElement>(null);
    const lbImgRef = useRef<HTMLImageElement>(null);
    const [dims, setDims] = useState({ w: 0, h: 0 });
    const [lbDims, setLbDims] = useState({ w: 0, h: 0 });
    const [lightbox, setLightbox] = useState(false);
    const [pos, setPos] = useState<LensPos>(lensPos ?? { x: 0.5, y: 0.5 });
    const posRef = useRef(pos);
    const drag = useRef<"thumb" | "lb" | null>(null);

    const applyPos = (p: LensPos) => { setPos(p); posRef.current = p; };
    const computePos = (el: HTMLImageElement | null, cx: number, cy: number) => {
        const r = el?.getBoundingClientRect();
        if (!r?.width) return;
        applyPos({ x: Math.max(0, Math.min(1, (cx - r.left) / r.width)), y: Math.max(0, Math.min(1, (cy - r.top) / r.height)) });
    };

    useEffect(() => {
        const mv = (e: MouseEvent) => {
            if (drag.current === "thumb") computePos(imgRef.current, e.clientX, e.clientY);
            else if (drag.current === "lb") computePos(lbImgRef.current, e.clientX, e.clientY);
        };
        const up = () => { if (drag.current) onLensPosChange?.(posRef.current); drag.current = null; };
        window.addEventListener("mousemove", mv);
        window.addEventListener("mouseup", up);
        return () => { window.removeEventListener("mousemove", mv); window.removeEventListener("mouseup", up); };
    }, []);

    useEffect(() => {
        if (!lightbox) return;
        const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setLightbox(false); };
        window.addEventListener("keydown", esc);
        return () => window.removeEventListener("keydown", esc);
    }, [lightbox]);

    const lensStyle = (w: number, h: number): React.CSSProperties => ({
        position: "absolute", width: LENS, height: LENS,
        left: pos.x * w - LENS / 2, top: pos.y * h - LENS / 2,
        borderRadius: "50%", border: "2.5px solid rgba(255,255,255,0.9)",
        boxShadow: "0 0 0 1.5px rgba(0,0,0,0.18),0 3px 12px rgba(0,0,0,0.25)",
        backgroundImage: `url(${src})`,
        backgroundSize: `${w * ZOOM}px ${h * ZOOM}px`,
        backgroundPosition: `${-(pos.x * w * ZOOM - LENS / 2)}px ${-(pos.y * h * ZOOM - LENS / 2)}px`,
        backgroundRepeat: "no-repeat",
    });

    return (
        <>
            <div className="relative select-none">
                <img ref={imgRef} src={src} alt="reference"
                    className="block w-full cursor-zoom-in rounded-xl border border-secondary"
                    onLoad={() => { if (imgRef.current) setDims({ w: imgRef.current.offsetWidth, h: imgRef.current.offsetHeight }); }}
                    draggable={false} onClick={() => setLightbox(true)}
                />
                {dims.w > 0 && (
                    <div style={{ ...lensStyle(dims.w, dims.h), cursor: editing ? "grab" : "default" }}
                        onClick={e => e.stopPropagation()}
                        onMouseDown={editing ? e => { e.preventDefault(); drag.current = "thumb"; computePos(imgRef.current, e.clientX, e.clientY); } : undefined}
                    />
                )}
                {editing && onRemove && (
                    <button type="button" onClick={onRemove}
                        className="absolute right-2 top-2 z-10 flex size-7 items-center justify-center rounded-lg bg-black/70 text-white hover:bg-black/90">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                )}
            </div>
            <AnimatePresence>
                {lightbox && (
                    <motion.div onClick={() => setLightbox(false)}
                        className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/80 p-10 backdrop-blur-sm"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}>
                        <motion.div className="relative select-none" onClick={e => e.stopPropagation()}
                            initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 26 }}>
                            <img ref={lbImgRef} src={src} alt="full" className="block rounded-xl shadow-2xl"
                                style={{ maxHeight: "90vh", maxWidth: "90vw" }}
                                onLoad={() => { if (lbImgRef.current) setLbDims({ w: lbImgRef.current.offsetWidth, h: lbImgRef.current.offsetHeight }); }}
                                draggable={false}
                            />
                            {lbDims.w > 0 && (
                                <div style={{ ...lensStyle(lbDims.w, lbDims.h), cursor: "grab" }}
                                    onMouseDown={e => { e.preventDefault(); drag.current = "lb"; computePos(lbImgRef.current, e.clientX, e.clientY); }}
                                />
                            )}
                        </motion.div>
                        <button type="button" onClick={() => setLightbox(false)}
                            className="absolute right-6 top-6 flex size-10 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

// ── Credential field helpers ──────────────────────────────────────

const CredField = ({ label, placeholder, value, onChange }: {
    label: string; placeholder?: string; value: string; onChange: (v: string) => void;
}) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-quaternary">{label}</label>
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder ?? ""}
            className="w-full rounded-xl border border-secondary bg-primary px-3.5 py-2.5 text-[14px] text-primary outline-none transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-placeholder"
        />
    </div>
);

const SecretField = ({ label, placeholder, value, onChange }: {
    label: string; placeholder?: string; value: string; onChange: (v: string) => void;
}) => {
    const [show, setShow] = useState(false);
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-quaternary">{label}</label>
            <div className="relative">
                <input type={show ? "text" : "password"} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder ?? ""}
                    className="w-full rounded-xl border border-secondary bg-primary py-2.5 pl-3.5 pr-12 text-[14px] text-primary outline-none transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-placeholder"
                />
                <button type="button" onClick={() => setShow(s => !s)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-lg bg-error-solid text-white transition hover:opacity-80">
                    {show
                        ? <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" /></svg>
                        : <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    }
                </button>
            </div>
        </div>
    );
};

const SaveActions = ({ status, label, onSave, onClear }: {
    status: SaveStatus; label: string; onSave: () => void; onClear: () => void;
}) => (
    <div className="flex items-center gap-3 pt-2">
        <button type="button" onClick={onSave} disabled={status === "saving"}
            className="rounded-xl bg-primary-solid px-5 py-2.5 text-[14px] font-semibold text-white transition hover:opacity-90 disabled:opacity-50">
            {status === "saving" ? "Saving…" : status === "saved" ? "✓ Saved!" : `Save ${label}`}
        </button>
        <button type="button" onClick={onClear}
            className="rounded-xl border border-error px-5 py-2.5 text-[14px] font-semibold text-error-primary transition hover:bg-error-primary">
            Clear
        </button>
        {status === "error" && <span className="text-[13px] text-error-primary">Save failed — check connection</span>}
        {status === "empty" && <span className="text-[13px] text-warning-primary">Fill in the form before saving</span>}
    </div>
);

// ── Overview credential row ───────────────────────────────────────

const OverviewRow = ({ label, value, locked }: { label: string; value: string; locked: boolean }) => (
    <div className="flex items-start justify-between gap-4 border-b border-secondary py-2.5 last:border-0">
        <span className="shrink-0 text-[12px] font-semibold uppercase tracking-[0.05em] text-quaternary">{label}</span>
        <span className={cx("text-right font-mono text-[13px] break-all", value ? "text-primary" : "text-placeholder")}>
            {!value ? "—" : locked ? maskHalf(value) : value}
        </span>
    </div>
);

const OverviewSection = ({ title, rows, locked }: { title: string; rows: { label: string; value: string }[]; locked: boolean }) => {
    const hasAny = rows.some(r => r.value);
    return (
        <div className="rounded-xl border border-secondary bg-primary overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-secondary">
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-secondary">{title}</p>
                {hasAny
                    ? <span className="rounded-full bg-success-secondary px-2 py-0.5 text-[10px] font-semibold text-success-primary">Submitted</span>
                    : <span className="rounded-full bg-tertiary px-2 py-0.5 text-[10px] font-semibold text-quaternary">Empty</span>
                }
            </div>
            <div className="px-4">
                {rows.map((r, i) => <OverviewRow key={i} label={r.label} value={r.value} locked={locked} />)}
            </div>
        </div>
    );
};

// ── Sidebar ───────────────────────────────────────────────────────

const CRED_SECTION_LABEL: Record<CredSection, string> = {
    none: "", pms: "PMS", netlify: "Netlify", hosting: "Netlify", supabase: "Supabase", resend: "Resend", stripe: "Stripe", domain: "Domain", cloudflare: "Cloudflare", overview: "Overview",
};

const Sidebar = ({
    steps, credentials, visited, currentStep, editing,
    onSelect, onMoveStep, onDeleteStep, onAddStep, onNavigateOverview,
    canShare, sharePassword, showSharePw, onToggleSharePw, onCopyShareLink, shareCopied,
    canCreate, onCreate,
}: {
    steps: StepData[];
    credentials: Creds;
    visited: Set<number>;
    currentStep: number;
    editing: boolean;
    onSelect: (i: number) => void;
    onMoveStep: (from: number, dir: -1 | 1) => void;
    onDeleteStep: (i: number) => void;
    onAddStep: () => void;
    onNavigateOverview: () => void;
    /** Share controls (password + copy link) only apply to a real client guide. */
    canShare: boolean;
    sharePassword: string | null;
    showSharePw: boolean;
    onToggleSharePw: () => void;
    onCopyShareLink: () => void;
    shareCopied: boolean;
    /** "Create Owner Guide" action — team / template only. */
    canCreate: boolean;
    onCreate: () => void;
}) => {
    const { theme, setTheme } = useTheme();
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    // Progress = filled credential forms out of total forms.
    const formSteps = steps.filter(s => CRED_FORM_SECTIONS.includes(s.credSection));
    const filledForms = formSteps.filter(s => sectionFilledIn(credentials, s.credSection)).length;
    const progress = formSteps.length === 0 ? 0 : Math.round((filledForms / formSteps.length) * 100);

    // A step's status once it's been visited (clicked past via Next).
    const stepStatus = (i: number): "done" | "missing" | "todo" => {
        if (!visited.has(i)) return "todo";
        const sec = steps[i].credSection;
        if (CRED_FORM_SECTIONS.includes(sec) && !sectionFilledIn(credentials, sec)) return "missing";
        return "done";
    };

    const overviewIdx = steps.findIndex(s => s.credSection === "overview");

    return (
        <aside className="flex h-full w-[280px] shrink-0 flex-col border-r border-secondary bg-primary">
            {/* header */}
            <div className="flex items-center border-b border-secondary px-5 py-4">
                <img src={isDark ? "/hgm logo/LOGO ON Dark.svg" : "/hgm logo/Logo ON LIGHT.svg"}
                    alt="HiddenGem Media" className="h-14" draggable={false} />
            </div>

            {/* progress */}
            <div className="border-b border-secondary px-5 py-4">
                <div className="mb-2 flex items-center justify-between">
                    <p className="text-[12px] font-semibold text-secondary">Onboarding Progress</p>
                    <span className="text-[12px] font-bold text-brand-600">{progress}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-tertiary">
                    <div className="h-full rounded-full bg-brand-600 transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
            </div>

            {/* step list */}
            <motion.div
                className="flex-1 overflow-y-auto px-3 py-3"
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.05 } } }}
            >
                {steps.map((s, i) => {
                    const active = i === currentStep;
                    const status = stepStatus(i);
                    const isOverview = s.credSection === "overview";
                    const hasLabel = s.credSection !== "none" && s.credSection !== "overview" && !!CRED_SECTION_LABEL[s.credSection];
                    return (
                        <motion.div key={i}
                            variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } } }}
                            className={cx(
                            "group relative flex items-center gap-2 rounded-[9px] px-2 py-2 pl-[11px] transition-colors duration-100 ease-linear",
                            active ? "bg-brand-50 dark:bg-brand-950/40" : "hover:bg-secondary",
                        )}>
                            <span className={cx(
                                "absolute left-0 top-[7px] bottom-[7px] w-[3px] rounded-r-[3px] transition duration-100",
                                active ? "bg-brand-600 opacity-100" : "opacity-0",
                            )} />

                            {/* step icon / number */}
                            <button type="button" onClick={() => onSelect(i)}
                                className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
                                <span className={cx(
                                    "flex size-[26px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition",
                                    isOverview ? (active ? "bg-brand-600 text-white" : "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300") :
                                    status === "done" ? "bg-success-solid text-white" :
                                    status === "missing" ? "bg-error-solid text-white" :
                                    active ? "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300" : "bg-secondary text-quaternary",
                                )}>
                                    {isOverview
                                        ? <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>
                                        : status === "done"
                                            ? <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                                            : i + 1
                                    }
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className={cx("truncate text-[13px] font-semibold", active ? "text-primary" : "text-secondary")}>
                                        {hasLabel ? CRED_SECTION_LABEL[s.credSection] : s.title}
                                    </p>
                                    {hasLabel && (
                                        <p className="truncate text-[10.5px] text-quaternary">{s.title}</p>
                                    )}
                                </div>
                            </button>

                            {/* edit controls */}
                            {editing && (
                                <div className="flex shrink-0 items-center gap-0.5">
                                    <button type="button" title="Move up" onClick={() => onMoveStep(i, -1)} disabled={i === 0}
                                        className="flex size-6 items-center justify-center rounded-md text-quaternary transition hover:bg-secondary hover:text-primary disabled:opacity-20">
                                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 15l-6-6-6 6" /></svg>
                                    </button>
                                    <button type="button" title="Move down" onClick={() => onMoveStep(i, 1)} disabled={i === steps.length - 1}
                                        className="flex size-6 items-center justify-center rounded-md text-quaternary transition hover:bg-secondary hover:text-primary disabled:opacity-20">
                                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
                                    </button>
                                    <button type="button" title="Delete step" onClick={() => onDeleteStep(i)}
                                        className="flex size-6 items-center justify-center rounded-md text-quaternary transition hover:bg-error-primary hover:text-error-primary">
                                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    );
                })}

                {/* add step button */}
                {editing && (
                    <button type="button" onClick={onAddStep}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-[9px] border border-dashed border-primary py-2.5 text-[13px] font-semibold text-tertiary transition duration-100 ease-linear hover:border-brand hover:bg-brand-50 hover:text-brand-700">
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                        Add Step
                    </button>
                )}

                {/* overview shortcut (edit mode only) */}
                {editing && overviewIdx !== -1 && (
                    <button type="button" onClick={onNavigateOverview}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-[9px] bg-brand-50 px-3 py-2.5 text-[13px] font-semibold text-brand-700 transition duration-100 ease-linear hover:bg-brand-100 dark:bg-brand-950/40 dark:text-brand-300">
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>
                        View Client Overview
                    </button>
                )}
            </motion.div>

            {/* bottom controls: share password, copy link, theme toggle */}
            <div className="flex flex-col gap-2 border-t border-secondary p-3">
                {canShare && sharePassword && (
                    <div className="flex items-center justify-between gap-1.5 rounded-lg border border-secondary bg-secondary px-2.5 py-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-quaternary">Password</span>
                        <div className="flex items-center gap-1.5">
                            <code className="text-[12px] text-primary">{showSharePw ? sharePassword : "••••••"}</code>
                            <button type="button" onClick={onToggleSharePw} title={showSharePw ? "Hide" : "Show"}
                                className="flex size-6 items-center justify-center rounded-md text-tertiary hover:bg-primary hover:text-primary">
                                <EyeIcon off={!showSharePw} />
                            </button>
                        </div>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    {canShare && (
                        <button type="button" onClick={onCopyShareLink}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-secondary bg-primary px-3 py-2 text-[12px] font-semibold text-secondary transition hover:bg-secondary hover:text-primary">
                            {shareCopied ? "Link copied!" : "Copy share link"}
                        </button>
                    )}
                    {canCreate && (
                        <button type="button" onClick={onCreate}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-solid px-3 py-2 text-[12px] font-semibold text-white transition hover:opacity-90">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                            Create Owner Guide
                        </button>
                    )}
                    <button type="button" onClick={() => setTheme(isDark ? "light" : "dark")}
                        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                        className={cx(
                            "flex size-9 shrink-0 items-center justify-center rounded-lg border border-secondary bg-primary text-secondary transition duration-100 ease-linear hover:bg-secondary hover:text-primary",
                            !canShare && !canCreate && "ml-auto",
                        )}>
                        {isDark
                            ? <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>
                            : <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>}
                    </button>
                </div>
            </div>
        </aside>
    );
};

// ── Create-guide popup ────────────────────────────────────────────

/** Fixed product suffix appended to every owner-guide share link. */
const LINK_SUFFIX = "aiwebsite";

const CreateGuideModal = ({ open, onClose, onCreated }: {
    open: boolean; onClose: () => void; onCreated: (slug: string) => void;
}) => {
    const [clientName, setClientName] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const slugify = (s: string) =>
        s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

    const reset = () => { setClientName(""); setPassword(""); setShowPw(false); setError(""); };

    const submit = async () => {
        const name = clientName.trim();
        if (!name || saving) { if (!name) setError("Enter a client name."); return; }
        setSaving(true); setError("");
        const base = slugify(name) || "client";
        // Link is auto-built from the client name with a fixed product suffix,
        // e.g. "FLOHOM" → flohom-aiwebsite.
        const slug = `${base}-${LINK_SUFFIX}`;

        try {
            // 1. Create owner_guides metadata (with timeout, non-blocking fallback)
            const metaPromise = supabase.from("owner_guides").insert({
                slug, client_name: name, share_password: password.trim() || null,
            });
            const metaTimeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Metadata save timed out")), 8000)
            );
            try {
                await Promise.race([metaPromise, metaTimeout]);
                dbLogger.success(`Guide metadata created`);
            } catch (metaErr) {
                console.warn("[owner_guides insert timeout/fail — continuing]", metaErr);
                // Continue anyway — guide content is what matters
            }

            // 2. Copy master guide content to client slug (using fallback logic)
            try {
                const masterData = await readSopPage(GUIDE_CONTENT_SLUG);
                if (masterData?.data) {
                    await writeSopPage(slug, masterData.data);
                    dbLogger.success(`Guide content copied to ${slug}`);
                }
            } catch (contentErr) {
                console.warn("[copy guide content]", contentErr);
                // Don't fail if content copy fails — guide can be empty initially
            }

            // 3. Unlock the new guide for the creator so the share-password gate is skipped.
            try { sessionStorage.setItem(`og_unlock_${slug}`, "1"); } catch {}

            setSaving(false);
            reset();
            onCreated(slug);
        } catch (err) {
            console.error("[create guide]", err);
            setError("Could not create: " + (err instanceof Error ? err.message : "unknown error"));
            setSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 py-8"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
                    onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
                    <motion.div className="w-full max-w-md rounded-2xl bg-primary p-6 shadow-2xl ring-1 ring-secondary"
                        initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 10 }}
                        transition={{ type: "spring", stiffness: 300, damping: 26 }}>
                        <h3 className="text-md font-semibold text-primary">Create owner guide for a client</h3>
                        <p className="mt-1 text-sm text-tertiary">A private copy is created from this template. Share the link and password with your client.</p>

                        <div className="mt-4 flex flex-col gap-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-secondary">Client name <span className="text-error-primary">*</span></label>
                                <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. Sunset Villas" autoFocus
                                    className="w-full rounded-lg border border-secondary px-3 py-2 text-sm text-primary placeholder:text-placeholder outline-none transition focus:border-brand focus:ring-1 focus:ring-brand" />
                                {clientName.trim() && (
                                    <p className="mt-1.5 text-xs text-tertiary">
                                        Link: <span className="font-mono text-secondary">/owner-guide/{slugify(clientName) || "client"}-{LINK_SUFFIX}</span>
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-secondary">Share password <span className="font-normal text-quaternary">(client enters this to view)</span></label>
                                <div className="relative">
                                    <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Set a password to share"
                                        className="w-full rounded-lg border border-secondary py-2 pl-3 pr-11 text-sm text-primary placeholder:text-placeholder outline-none transition focus:border-brand focus:ring-1 focus:ring-brand" />
                                    <button type="button" onClick={() => setShowPw(s => !s)} title={showPw ? "Hide" : "Show"}
                                        className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-tertiary hover:bg-secondary hover:text-primary">
                                        <EyeIcon off={!showPw} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {error && <p className="mt-3 text-xs text-error-primary">{error}</p>}

                        <div className="mt-5 flex gap-3">
                            <button type="button" onClick={onClose} disabled={saving} className="flex-1 rounded-lg border border-secondary px-4 py-2 text-sm font-semibold text-secondary transition hover:bg-secondary disabled:opacity-50">Cancel</button>
                            <button type="button" onClick={submit} disabled={saving} className="flex-1 rounded-lg bg-brand-solid px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40">
                                {saving ? "Creating…" : "Create guide"}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Eye / eye-off icon (reused for password visibility toggles).
const EyeIcon = ({ off }: { off?: boolean }) =>
    off
        ? <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" /></svg>
        : <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;

// ── Main screen ───────────────────────────────────────────────────

export const OwnerGuideScreen = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigateTo = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const isTemplate = !slug;
    // Credentials are keyed by the guide slug for client guides, or the local
    // session for the template preview.
    const [sessionId] = useState(() => slug ?? getOrCreateSession());

    const mainRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const lockKey = `hgm_owner_locked_${sessionId}`;
    const [steps, setSteps] = useState<StepData[]>(loadContent);
    const [ownerData, setOwnerData] = useState<OwnerData>(emptyOwner);
    const [meta, setMeta] = useState<OwnerGuideMeta | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    // Template hint toast — appears top-right ~2s after the master template loads.
    const [showTemplateToast, setShowTemplateToast] = useState(false);
    const [showSharePw, setShowSharePw] = useState(false);
    const [shareCopied, setShareCopied] = useState(false);
    // Share-password gate: locked out until the client enters the password
    // (the team bypasses via sessionStorage when opening from the dashboard).
    const [gateOpen, setGateOpen] = useState(false);
    const [gateInput, setGateInput] = useState("");
    const [gateError, setGateError] = useState(false);
    const [locked, setLocked] = useState(() => {
        const s = localStorage.getItem(lockKey);
        return s !== null ? s === "true" : true;
    });
    const [loading, setLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);
    const [visited, setVisited] = useState<Set<number>>(new Set());
    const [saveStatus, setSaveStatus] = useState<Record<string, SaveStatus>>({});
    const [overviewSaveStatus, setOverviewSaveStatus] = useState<SaveStatus>("idle");
    const [showComplete, setShowComplete] = useState(false);
    // Editing is HGM-team only: the lock toggle is hidden from clients, and a
    // signed-in @hiddengem.media Supabase session is required to enter edit mode.
    const [isTeam, setIsTeam] = useState(false);

    useEffect(() => {
        const check = (email: string | undefined) => setIsTeam(!!email && email.toLowerCase().endsWith("@hiddengem.media"));
        supabase.auth.getSession().then(({ data }) => check(data.session?.user?.email));
        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => check(session?.user?.email));
        return () => sub.subscription.unsubscribe();
    }, []);

    const editing = isTeam && !locked;

    // Shift+E toggles the lock, Shift+S locks — team members only (edits save on change).
    useEditShortcuts({ enabled: isTeam, onToggle: () => setLocked((v) => !v), onSave: () => setLocked(true) });

    const contentHydrated = useRef(false);

    useEffect(() => {
        dbLoad(sessionId).then(data => {
            setOwnerData(data);
            setLoading(false);
        });
    }, [sessionId]);

    // Load the guide's client name + share password, and apply the gate.
    useEffect(() => {
        if (!slug) { setMeta(null); setGateOpen(false); return; }
        supabase
            .from("owner_guides")
            .select("*")
            .eq("slug", slug)
            .maybeSingle()
            .then(({ data }) => {
                const row = (data as OwnerGuideMeta | null) ?? null;
                setMeta(row);
                const unlocked = (() => { try { return sessionStorage.getItem(`og_unlock_${slug}`) === "1"; } catch { return false; } })();
                if (row?.share_password && !unlocked) setGateOpen(true);
            });
    }, [slug]);

    // Show the template hint toast 2 seconds after the master template opens.
    useEffect(() => {
        if (!isTemplate) return;
        const t = setTimeout(() => setShowTemplateToast(true), 2000);
        return () => clearTimeout(t);
    }, [isTemplate]);

    // Auto-open the create modal when arriving via /owner-guide?create=1.
    useEffect(() => {
        if (isTemplate && searchParams.get("create") === "1") {
            setCreateOpen(true);
            searchParams.delete("create");
            setSearchParams(searchParams, { replace: true });
        }
    }, [isTemplate, searchParams, setSearchParams]);

    const submitGate = () => {
        if (gateInput === (meta?.share_password ?? "")) {
            try { sessionStorage.setItem(`og_unlock_${slug}`, "1"); } catch {}
            setGateOpen(false); setGateError(false); setGateInput("");
        } else {
            setGateError(true);
        }
    };

    const copyShareLink = () => {
        const url = `${window.location.origin}/owner-guide/${slug}`;
        navigator.clipboard.writeText(url).then(() => { setShareCopied(true); setTimeout(() => setShareCopied(false), 2000); });
    };

    // Shared guide content lives in Supabase (with Firebase fallback) so every client sees the team's edits.
    useEffect(() => {
        readSopPage(GUIDE_CONTENT_SLUG)
            .then((data) => {
                if (data?.data && Array.isArray(data.data) && data.data.length) {
                    const norm = normalizeSteps(data.data as StepData[]);
                    setSteps(norm);
                    saveContent(norm);
                }
                contentHydrated.current = true;
            })
            .catch((err) => {
                dbLogger.error(`Failed to load guide content from both DBs`, err);
                contentHydrated.current = true;
            });
    }, []);

    // Debounced publish of guide content to Supabase + Firebase after edits.
    useEffect(() => {
        if (!contentHydrated.current) return;
        const t = setTimeout(() => {
            writeSopPage(GUIDE_CONTENT_SLUG, steps)
                .then(() => { dbLogger.success(`Guide content published`); })
                .catch((err) => { dbLogger.error(`Failed to save guide content`, err); });
        }, 800);
        return () => clearTimeout(t);
    }, [steps]);

    useEffect(() => { localStorage.setItem(lockKey, String(locked)); }, [locked, lockKey]);

    const navigate = (i: number) => {
        const clamped = Math.max(0, Math.min(steps.length - 1, i));
        setCurrentStep(clamped);
        mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    };

    // ── Content updaters ────────────────────────────────────────

    const updateField = (idx: number, field: keyof StepData, val: unknown) => {
        setSteps(prev => {
            const next = prev.map((s, i) => i === idx ? { ...s, [field]: val } : s);
            saveContent(next);
            return next;
        });
    };

    const updateInstruction = (si: number, ii: number, val: string) => {
        setSteps(prev => {
            const next = prev.map((s, i) => i !== si ? s : { ...s, instructions: s.instructions.map((ins, j) => j === ii ? { ...ins, text: val } : ins) });
            saveContent(next);
            return next;
        });
    };

    const patchInstruction = (si: number, ii: number, patch: Partial<Instruction>) => {
        setSteps(prev => {
            const next = prev.map((s, i) => i !== si ? s : { ...s, instructions: s.instructions.map((ins, j) => j === ii ? { ...ins, ...patch } : ins) });
            saveContent(next);
            return next;
        });
    };

    const handleInstructionImage = (si: number, ii: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        void compressImageFile(file).then((img) => patchInstruction(si, ii, { image: img }));
        e.target.value = "";
    };

    const updateBenefit = (si: number, bi: number, val: string) => {
        setSteps(prev => {
            const next = prev.map((s, i) => i !== si || !s.benefits ? s : { ...s, benefits: s.benefits.map((b, j) => j === bi ? val : b) });
            saveContent(next);
            return next;
        });
    };

    // ── Step management ──────────────────────────────────────────

    const moveStep = (from: number, dir: -1 | 1) => {
        const to = from + dir;
        if (to < 0 || to >= steps.length) return;
        setSteps(prev => {
            const next = [...prev];
            [next[from], next[to]] = [next[to], next[from]];
            saveContent(next);
            if (currentStep === from) setCurrentStep(to);
            else if (currentStep === to) setCurrentStep(from);
            return next;
        });
    };

    const deleteStep = (i: number) => {
        if (steps.length <= 1) return;
        setSteps(prev => {
            const next = prev.filter((_, idx) => idx !== i);
            saveContent(next);
            return next;
        });
        if (currentStep >= i) setCurrentStep(Math.max(0, currentStep - 1));
    };

    const addStep = () => {
        const newStep: StepData = {
            title: "New Step",
            description: "Describe what this step involves.",
            instructions: [{ text: "First instruction" }],
            checklistLabels: [["Complete this step", "Criteria for completion"]],
            images: [],
            credSection: "none",
        };
        setSteps(prev => {
            const next = [...prev.slice(0, currentStep + 1), newStep, ...prev.slice(currentStep + 1)];
            saveContent(next);
            return next;
        });
        navigate(currentStep + 1);
    };

    const navigateToOverview = () => {
        const idx = steps.findIndex(s => s.credSection === "overview");
        if (idx !== -1) navigate(idx);
    };

    // ── Image handlers ───────────────────────────────────────────

    const addImage = (si: number, src: string) => {
        setSteps(prev => {
            const next = prev.map((s, i) => i !== si ? s : { ...s, images: [...s.images, { id: uid(), src }] });
            saveContent(next);
            return next;
        });
    };

    const removeImage = (si: number, imgId: string) => {
        setSteps(prev => {
            const next = prev.map((s, i) => i !== si ? s : { ...s, images: s.images.filter(img => img.id !== imgId) });
            saveContent(next);
            return next;
        });
    };

    const updateLensPos = (si: number, imgId: string, lensPos: LensPos) => {
        setSteps(prev => {
            const next = prev.map((s, i) => i !== si ? s : { ...s, images: s.images.map(img => img.id === imgId ? { ...img, lensPos } : img) });
            saveContent(next);
            return next;
        });
    };

    const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        void compressImageFile(file).then((img) => addImage(currentStep, img));
        e.target.value = "";
    };

    // ── Credential handlers ──────────────────────────────────────

    const cred = (k: string) => ownerData.credentials[k] ?? "";
    const setCred = (k: string, v: string) => setOwnerData(prev => ({ ...prev, credentials: { ...prev.credentials, [k]: v } }));

    const StatusBadge = ({ sec }: { sec: string }) => {
        const filled = sectionFilledIn(ownerData.credentials, sec);
        return (
            <span className={cx(
                "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                filled ? "bg-success-secondary text-success-primary" : "bg-secondary text-quaternary",
            )}>
                <span className={cx("size-1.5 rounded-full", filled ? "bg-success-solid" : "bg-quaternary")} />
                {filled ? "Filled" : "Empty"}
            </span>
        );
    };

    const signalStatus = (key: string, ok: boolean) => {
        setSaveStatus(s => ({ ...s, [key]: ok ? "saved" : "error" }));
        setTimeout(() => setSaveStatus(s => ({ ...s, [key]: "idle" })), ok ? 3000 : 5000);
    };

    const doSave = async (key: string) => {
        // Nothing entered → don't pretend it saved.
        if (!sectionFilledIn(ownerData.credentials, key)) {
            setSaveStatus(s => ({ ...s, [key]: "empty" }));
            setTimeout(() => setSaveStatus(s => ({ ...s, [key]: "idle" })), 3000);
            return;
        }
        setSaveStatus(s => ({ ...s, [key]: "saving" }));
        const ok = await dbSave(sessionId, ownerData);
        signalStatus(key, ok);
    };

    const doClear = async (_key: string, clearKeys: string[]) => {
        const cleared = { ...ownerData.credentials };
        clearKeys.forEach(k => { cleared[k] = ""; });
        const next: OwnerData = { ...ownerData, credentials: cleared };
        setOwnerData(next);
        await dbSave(sessionId, next);
    };

    // ── Overview save & lock ─────────────────────────────────────

    const handleOverviewSave = async () => {
        setOverviewSaveStatus("saving");
        const ok = await dbSave(sessionId, ownerData);
        if (ok) {
            setLocked(true);
            setOverviewSaveStatus("saved");
        } else {
            setOverviewSaveStatus("error");
            setTimeout(() => setOverviewSaveStatus("idle"), 5000);
        }
    };

    const step = steps[currentStep] ?? steps[0];
    const formSteps = steps.filter(s => CRED_FORM_SECTIONS.includes(s.credSection));
    const filledForms = formSteps.filter(s => sectionFilledIn(ownerData.credentials, s.credSection)).length;

    return (
        <AppShell className="flex">
            <Sidebar
                steps={steps} credentials={ownerData.credentials} visited={visited}
                currentStep={currentStep} editing={editing}
                onSelect={navigate} onMoveStep={moveStep}
                onDeleteStep={deleteStep} onAddStep={addStep}
                onNavigateOverview={navigateToOverview}
                canShare={!isTemplate && !!meta}
                sharePassword={meta?.share_password ?? null}
                showSharePw={showSharePw}
                onToggleSharePw={() => setShowSharePw(s => !s)}
                onCopyShareLink={copyShareLink}
                shareCopied={shareCopied}
                canCreate={isTeam || isTemplate}
                onCreate={() => setCreateOpen(true)}
            />

            <main ref={mainRef} className="flex-1 overflow-y-auto scroll-smooth">
                {/* Client guide header — name only; share controls live in the sidebar. */}
                {!isTemplate && meta && (
                    <div className="border-b border-secondary bg-primary px-8 py-3.5">
                        <div className="mx-auto max-w-[760px]">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-quaternary">Owner guide for</p>
                            <p className="truncate text-[15px] font-bold text-primary">{meta.client_name}</p>
                        </div>
                    </div>
                )}

                <motion.div key={currentStep} className="mx-auto max-w-[760px] px-8 py-9 pb-24"
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>

                    {/* breadcrumb */}
                    <div className="mb-3 flex items-center gap-2 text-[12px] font-medium text-quaternary">
                        <span>Step {currentStep + 1} of {steps.length}</span>
                        <span>·</span>
                        <span>{filledForms} of {formSteps.length} forms filled</span>
                    </div>

                    {/* title */}
                    {editing ? (
                        <input type="text" value={step.title}
                            onChange={e => updateField(currentStep, "title", e.target.value)}
                            className="mb-4 w-full border-0 bg-transparent text-[32px] font-bold leading-10 tracking-tight text-primary outline-none"
                        />
                    ) : (
                        <h1 className="mb-4 text-[32px] font-bold leading-10 tracking-tight text-primary">{step.title}</h1>
                    )}

                    <hr className="mb-6 border-secondary" />

                    {/* ── Overview step ── */}
                    {step.credSection === "overview" ? (
                        <>
                            <p className="mb-6 text-[15px] leading-relaxed text-secondary">{step.description}</p>

                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="size-5 animate-spin rounded-full border-2 border-secondary border-t-brand-600" />
                                    <span className="ml-3 text-[14px] text-tertiary">Loading…</span>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {steps.filter(s => CRED_FORM_SECTIONS.includes(s.credSection)).map((s, i) => (
                                        <OverviewSection key={i} title={s.title} locked={locked} rows={[
                                            { label: "Account User name", value: cred(`${s.credSection}_username`) },
                                            { label: "Password", value: cred(`${s.credSection}_password`) },
                                        ]} />
                                    ))}

                                    <div className="mt-2 rounded-2xl border border-secondary bg-primary p-6 text-center">
                                        {locked ? (
                                            <>
                                                <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-success-secondary">
                                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-success-primary"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>
                                                </div>
                                                <p className="mb-1 text-[16px] font-bold text-primary">Submission Locked</p>
                                                <p className="mb-4 text-[13px] text-tertiary">Your credentials are saved and partially hidden for security. Click the unlock button (bottom-right) to make changes.</p>
                                                <span className="inline-flex items-center gap-2 rounded-xl border border-success-primary/30 bg-success-primary/5 px-5 py-2.5 text-[14px] font-semibold text-success-primary">
                                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                                                    Locked
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <p className="mb-1 text-[16px] font-bold text-primary">Ready to submit?</p>
                                                <p className="mb-4 text-[13px] text-tertiary">Click Save to lock your submission. Values will be partially hidden and your developer will be able to retrieve them securely.</p>
                                                <button type="button" onClick={handleOverviewSave}
                                                    disabled={overviewSaveStatus === "saving"}
                                                    className="rounded-xl bg-primary-solid px-8 py-3 text-[15px] font-semibold text-white transition hover:opacity-90 disabled:opacity-50">
                                                    {overviewSaveStatus === "saving" ? "Saving…" : overviewSaveStatus === "saved" ? "✓ Saved & Locked!" : "Save"}
                                                </button>
                                                {overviewSaveStatus === "error" && <p className="mt-3 text-[13px] text-error-primary">Save failed — check your connection</p>}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        /* ── Regular step ── */
                        <>
                            {/* description */}
                            <section className="mb-6 rounded-2xl border border-secondary bg-primary p-6">
                                {editing ? (
                                    <textarea value={step.description}
                                        onChange={e => updateField(currentStep, "description", e.target.value)}
                                        rows={3}
                                        className="w-full resize-y bg-transparent text-[15px] leading-relaxed text-secondary outline-none"
                                    />
                                ) : (
                                    <p className="text-[15px] leading-relaxed text-secondary">{step.description}</p>
                                )}

                                {step.benefits && (
                                    <div className="mt-4 flex flex-col gap-2.5">
                                        {step.benefits.map((b, i) => (
                                            <div key={i} className="flex items-start gap-3">
                                                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success-solid">
                                                    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                                                </span>
                                                {editing ? (
                                                    <input type="text" value={b}
                                                        onChange={e => updateBenefit(currentStep, i, e.target.value)}
                                                        className="flex-1 bg-transparent text-[14px] font-medium text-primary outline-none border-b border-transparent focus:border-brand"
                                                    />
                                                ) : (
                                                    <p className="text-[14px] font-medium text-primary">{b}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* instructions */}
                            {step.instructions.length > 0 && (
                                <section className="mb-6">
                                    <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-quaternary">Step-by-Step Instructions</h2>
                                    <div className="flex flex-col gap-3">
                                        {step.instructions.map((ins, i) => (
                                            <div key={i} className="rounded-xl border border-secondary bg-primary px-4 py-3.5">
                                                <div className="flex items-start gap-3.5">
                                                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[12px] font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                                                        {i + 1}
                                                    </span>
                                                    {editing ? (
                                                        <textarea value={ins.text}
                                                            onChange={e => updateInstruction(currentStep, i, e.target.value)}
                                                            rows={2} className="flex-1 resize-y bg-transparent text-[14px] leading-relaxed text-secondary outline-none"
                                                        />
                                                    ) : (
                                                        <p className="flex-1 text-[14px] leading-relaxed text-secondary">{ins.text}</p>
                                                    )}
                                                </div>

                                                {/* Per-instruction reference image with magnify circle */}
                                                {ins.image ? (
                                                    <div className="mt-3 pl-[38px]">
                                                        <ImageMagnifier
                                                            src={ins.image}
                                                            editing={editing}
                                                            lensPos={ins.lensPos}
                                                            onLensPosChange={p => patchInstruction(currentStep, i, { lensPos: p })}
                                                            onRemove={() => patchInstruction(currentStep, i, { image: undefined, lensPos: undefined })}
                                                        />
                                                    </div>
                                                ) : editing ? (
                                                    <label className="mt-3 ml-[38px] flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed border-primary px-3 py-1.5 text-[12px] font-medium text-tertiary transition hover:border-brand hover:text-brand-700">
                                                        <input type="file" accept="image/*" className="hidden" onChange={e => handleInstructionImage(currentStep, i, e)} />
                                                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                                                        Add image
                                                    </label>
                                                ) : null}
                                            </div>
                                        ))}
                                        {editing && (
                                            <button type="button"
                                                onClick={() => updateField(currentStep, "instructions", [...step.instructions, { text: "New instruction" }])}
                                                className="flex items-center gap-2 rounded-xl border border-dashed border-primary py-2.5 text-[13px] font-medium text-tertiary transition hover:border-brand hover:text-brand-700">
                                                <span className="flex-1 text-center">+ Add instruction</span>
                                            </button>
                                        )}
                                    </div>
                                </section>
                            )}

                            {/* images */}
                            {(step.images.length > 0 || editing) && (
                                <section className="mb-6">
                                    {step.images.length > 0 && (
                                        <div className="mb-3 flex flex-col gap-3">
                                            {step.images.map(img => (
                                                <ImageMagnifier key={img.id} src={img.src} editing={editing}
                                                    lensPos={img.lensPos}
                                                    onLensPosChange={p => updateLensPos(currentStep, img.id, p)}
                                                    onRemove={() => removeImage(currentStep, img.id)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                    {editing && (
                                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-primary bg-primary py-6 text-[13px] font-medium text-tertiary transition hover:border-brand hover:bg-brand-50 hover:text-brand-700">
                                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
                                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                                            Add reference image
                                        </label>
                                    )}
                                </section>
                            )}

                            {/* tutorial video */}
                            {(step.video || editing) && (
                                <section className="mb-6">
                                    {editing ? (
                                        <VideoAttach value={step.video} onChange={(url) => updateField(currentStep, "video", url)} />
                                    ) : (
                                        step.video && <VideoEmbed url={step.video} className="mt-4" />
                                    )}
                                </section>
                            )}

                            {/* ── Credential form — uniform Account User name + Password per service ── */}
                            {!loading && CRED_FORM_SECTIONS.includes(step.credSection) && (() => {
                                const sec = step.credSection;
                                const uKey = `${sec}_username`;
                                const pKey = `${sec}_password`;
                                return (
                                    <section className="mb-6 rounded-2xl border border-secondary bg-primary p-6">
                                        <div className="mb-4 flex items-center justify-between gap-3">
                                            <h2 className="text-[15px] font-bold text-primary">Enter your account login</h2>
                                            <StatusBadge sec={sec} />
                                        </div>
                                        <div className="flex flex-col gap-4">
                                            <p className="rounded-lg bg-secondary px-4 py-3 text-[13px] text-tertiary">Enter the account user name and password you use to sign in to this service.</p>
                                            <CredField label="Account User name" placeholder="you@email.com" value={cred(uKey)} onChange={v => setCred(uKey, v)} />
                                            <SecretField label="Password" placeholder="Account password" value={cred(pKey)} onChange={v => setCred(pKey, v)} />
                                            <SaveActions status={saveStatus[sec] ?? "idle"} label="Login" onSave={() => doSave(sec)} onClear={() => doClear(sec, [uKey, pKey])} />
                                        </div>
                                    </section>
                                );
                            })()}

                        </>
                    )}

                    {/* back / next */}
                    <div className="flex items-center justify-between">
                        <button type="button" onClick={() => navigate(currentStep - 1)} disabled={currentStep === 0}
                            className="flex items-center gap-2 rounded-xl border border-secondary bg-primary px-5 py-2.5 text-[14px] font-semibold text-secondary transition hover:bg-secondary disabled:pointer-events-none disabled:opacity-30">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
                            Back
                        </button>
                        {currentStep < steps.length - 1 ? (
                            <button type="button" onClick={() => { setVisited(v => new Set(v).add(currentStep)); navigate(currentStep + 1); }}
                                className="flex items-center gap-2 rounded-xl bg-primary-solid px-5 py-2.5 text-[14px] font-semibold text-white transition hover:opacity-90">
                                Next
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                            </button>
                        ) : (
                            <button type="button" onClick={() => setShowComplete(true)}
                                className="flex items-center gap-2 rounded-xl bg-success-solid px-5 py-2.5 text-[14px] font-semibold text-white transition hover:opacity-90">
                                Complete Onboarding 🎉
                            </button>
                        )}
                    </div>
                </motion.div>
            </main>

            {/* floating lock/unlock — HGM team only */}
            {isTeam && (
                <button type="button" onClick={() => setLocked(l => !l)}
                    title={locked ? "Unlock editing" : "Lock editing"}
                    className={cx(
                        "fixed bottom-5 right-5 z-40 flex size-11 items-center justify-center rounded-full shadow-lg ring-1 transition duration-100 ease-linear",
                        editing ? "bg-brand-600 ring-brand-600 text-white hover:bg-brand-700" : "bg-primary ring-secondary text-quaternary hover:bg-secondary hover:text-secondary",
                    )}>
                    {locked ? (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>
                    ) : (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 017.5-1.9" /></svg>
                    )}
                </button>
            )}

            {/* template hint toast — top-right, appears after 2s, dismissible */}
            <AnimatePresence>
                {isTemplate && showTemplateToast && (
                    <motion.div
                        className="fixed right-5 top-5 z-[55] w-[340px] max-w-[calc(100vw-2.5rem)] rounded-xl border border-secondary bg-primary p-4 shadow-lg ring-1 ring-black/5"
                        initial={{ opacity: 0, y: -12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 320, damping: 26 }}>
                        <div className="flex items-start gap-3">
                            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950/40">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
                            </span>
                            <div className="flex-1">
                                <p className="text-[13px] font-semibold text-primary">Master template</p>
                                <p className="mt-0.5 text-[12.5px] leading-relaxed text-tertiary">This is the master template. Use <span className="font-semibold text-secondary">Create Owner Guide</span> in the sidebar to make a private copy to share with a client.</p>
                            </div>
                            <button type="button" onClick={() => setShowTemplateToast(false)} title="Dismiss"
                                className="flex size-6 shrink-0 items-center justify-center rounded-md text-quaternary transition hover:bg-secondary hover:text-secondary">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* completion modal */}
            <AnimatePresence>
                {showComplete && (
                    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm" onClick={() => setShowComplete(false)}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}>
                        <motion.div className="w-full max-w-sm rounded-2xl bg-primary p-8 text-center shadow-2xl" onClick={e => e.stopPropagation()}
                            initial={{ scale: 0.9, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 8 }}
                            transition={{ type: "spring", stiffness: 320, damping: 26 }}>
                            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-success-secondary text-4xl">🎉</div>
                            <h2 className="mb-2 text-[22px] font-bold text-primary">Onboarding Complete!</h2>
                            <p className="mb-6 text-[14px] leading-relaxed text-tertiary">Your PMS, Netlify, Supabase, Resend, domain, and Cloudflare logins are saved securely for your developer to configure.</p>
                            <button type="button" onClick={() => setShowComplete(false)}
                                className="w-full rounded-xl bg-success-solid py-3 text-[15px] font-semibold text-white transition hover:opacity-90">
                                Done
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* create-guide popup */}
            <CreateGuideModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={(s) => { setCreateOpen(false); navigateTo(`/owner-guide/${s}`); }} />

            {/* share-password gate */}
            <AnimatePresence>
                {gateOpen && (
                    <motion.div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                        <motion.div className="w-full max-w-sm rounded-2xl bg-primary p-7 text-center shadow-2xl ring-1 ring-secondary"
                            initial={{ opacity: 0, scale: 0.94, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ type: "spring", stiffness: 300, damping: 26 }}>
                            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950/40">
                                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>
                            </div>
                            <h2 className="text-[18px] font-bold text-primary">{meta?.client_name ?? "Owner guide"}</h2>
                            <p className="mt-1 text-[13px] text-tertiary">Enter the password your team shared with you to view this guide.</p>
                            <input type="password" value={gateInput} autoFocus
                                onChange={e => { setGateInput(e.target.value); setGateError(false); }}
                                onKeyDown={e => { if (e.key === "Enter") submitGate(); }}
                                placeholder="Password"
                                className={cx(
                                    "mt-4 w-full rounded-lg border px-3 py-2.5 text-sm text-primary placeholder:text-placeholder outline-none transition focus:ring-1",
                                    gateError ? "border-error focus:border-error focus:ring-error" : "border-secondary focus:border-brand focus:ring-brand",
                                )} />
                            {gateError && <p className="mt-2 text-[12px] text-error-primary">Incorrect password.</p>}
                            <button type="button" onClick={submitGate}
                                className="mt-4 w-full rounded-lg bg-brand-solid py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
                                View guide
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AppShell>
    );
};
