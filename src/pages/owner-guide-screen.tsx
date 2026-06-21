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
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "@/providers/theme-provider";
import { cx } from "@/utils/cx";
import { supabase } from "@/lib/supabase";

// ── Types ─────────────────────────────────────────────────────────

type LensPos = { x: number; y: number };
type PMSTab = "guesty" | "hostaway" | "lodgify" | "hostfully" | "smoobu" | "ical";
type SaveStatus = "idle" | "saving" | "saved" | "error" | "empty";
type CredSection = "none" | "stripe" | "pms" | "hosting" | "supabase" | "domain" | "overview";

interface StepImage { id: string; src: string; lensPos?: LensPos }
interface Instruction { text: string; image?: string; lensPos?: LensPos }

interface StepData {
    title: string;
    description: string;
    instructions: Instruction[];
    benefits?: string[];
    checklistLabels: [string, string][];
    images: StepImage[];
    credSection: CredSection;
}

type Creds = Record<string, string>;
type Checklist = Record<string, boolean>;
type Notes = Record<string, string>;
interface OwnerData { credentials: Creds; checklist: Checklist; notes: Notes }

/** Credential sections that have a fillable form. */
const CRED_FORM_SECTIONS = ["pms", "hosting", "supabase", "stripe", "domain"];
const SECTION_PREFIXES: Record<string, string[]> = {
    stripe: ["stripe_"],
    pms: ["guesty_", "hostaway_", "lodgify_", "hostfully_", "smoobu_", "ical_"],
    hosting: ["netlify_", "vercel_"],
    supabase: ["supabase_"],
    domain: ["domain_"],
};
function sectionFilledIn(credentials: Creds, sec: string): boolean {
    return Object.entries(credentials).some(
        ([k, v]) => v && v.trim() !== "" && (SECTION_PREFIXES[sec] ?? []).some(p => k.startsWith(p)),
    );
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

/** Convert legacy string instructions (and missing arrays) into the {text, image} shape. */
function normalizeSteps(steps: StepData[]): StepData[] {
    return steps.map((s) => ({
        ...s,
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
            description: "This system is a custom booking portal that requires you to set up a few accounts. As the business owner, you will own all financial accounts, hosting, and database — not your developer. Developers should never own the financial accounts or hosting contracts for your business.",
            benefits: [
                "Direct Payouts — Stripe sends payments directly to your bank account",
                "Hosting Control — the website server is under your credit card and login",
                "API Confidentiality — your credentials are encrypted and can be rotated at any time",
            ],
            instructions: [
                "Confirm roles and project roadmap — agree to register personal/business Stripe, PMS, and Netlify accounts under your own name",
                "Locate domain registration accounts — ensure you have access to GoDaddy, Namecheap, or Google Domains",
            ],
            checklistLabels: [
                ["Confirm roles and project roadmap", "Agree to register personal/business Stripe, PMS, and Netlify accounts"],
                ["Locate domain registration accounts", "Ensure access to GoDaddy, Namecheap, or Google Domains"],
            ],
            images: [],
        },
        {
            title: "Property Management System (PMS)",
            credSection: "pms",
            description: "Your PMS syncs listing availability, rates, and reservations across Airbnb, VRBO, Booking.com and your direct booking website. Select your platform below and enter your API credentials.",
            instructions: [
                "Log in to your PMS dashboard as the primary administrator",
                "Navigate to Integrations or API Keys in the settings",
                "Generate a new key named 'Website' and copy the credentials",
                "Select your platform tab below and paste the credentials",
            ],
            checklistLabels: [
                ["Select your PMS platform and locate API credentials", "You know which system manages reservations and have access to settings"],
                ["Enter and save PMS credentials", "API keys or calendar feeds entered and saved for developer configuration"],
            ],
            images: [],
        },
        {
            title: "Netlify Hosting",
            credSection: "hosting",
            description: "Owning your Netlify workspace ensures you control the website code, assets, and deployment. This gives you full authority over the live website — independent of your developer.",
            instructions: [
                "Register at netlify.com with your business email — the free Starter plan is all you need",
                "Create a team named after your property",
                "Go to Team Settings → Members → Invite your developer as a Collaborator",
                "Ask your developer to connect the code repository, then copy the credentials below from Site Settings",
            ],
            checklistLabels: [
                ["Create your Netlify team account", "Your Netlify team workspace is active under your email"],
                ["Enter and save Netlify credentials", "Site ID and Build Hook URL are copied and saved"],
            ],
            images: [],
        },
        {
            title: "Supabase Database",
            credSection: "supabase",
            description: "Supabase acts as the secure backend holding your property details, reservation logs, and listing photos. As the business owner, you should create and own this project for full security of your guest database.",
            instructions: [
                "Create a Supabase Account at database.supabase.com using your email or GitHub account",
                "Create a New Project — name it your property name, set a secure database password, choose a region close to your property",
                "Locate API Credentials — wait 1–2 minutes for provisioning, then go to Settings (gear icon) → API",
                "Copy your Project URL and Anon API Key and paste them in the form below",
            ],
            checklistLabels: [
                ["Create your Supabase account and database project", "Supabase project is active and database is provisioned"],
                ["Enter and save Supabase credentials", "Project URL and Anon API Key are saved"],
            ],
            images: [],
        },
        {
            title: "Stripe Payments",
            credSection: "stripe",
            description: "Stripe processes card checkouts, manages deposits, and transfers payouts directly to your business bank account. You need to register Stripe under your own name and connect your bank account before the booking website can go live.",
            instructions: [
                "Register your Account at stripe.com/register with your business details and bank account for payouts",
                "Verify your identity — Stripe may request a government-issued ID for KYC compliance",
                "Go to Developers → API keys — toggle Test Mode OFF for real bookings, or keep ON for testing",
                "Paste your Stripe Credentials in the form below",
            ],
            checklistLabels: [
                ["Activate and verify your Stripe merchant profile", "Stripe activation emails verified and payouts enabled"],
                ["Enter and save Stripe credentials", "Credentials input and saved securely"],
            ],
            images: [],
        },
        {
            title: "Domain Setup",
            credSection: "domain",
            description: "Point your custom domain to your Netlify site by adding a CNAME record in your registrar's DNS settings. SSL is provisioned automatically by Netlify within minutes.",
            instructions: [
                "Log in to your domain registrar (GoDaddy, Namecheap, Google Domains, Cloudflare, etc.)",
                "Go to DNS settings and add a CNAME record: www → your-site.netlify.app",
                "In Netlify → Site Settings → Domain management, click Add custom domain and enter your domain",
                "Wait 10–30 minutes for DNS propagation — Netlify will auto-provision your SSL certificate",
            ],
            checklistLabels: [
                ["Add CNAME record in your domain registrar", "DNS record is pointing to your Netlify site"],
                ["Verify custom domain is live with SSL", "Site is accessible on your custom domain with HTTPS"],
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
            className="rounded-xl border border-red-300 px-5 py-2.5 text-[14px] font-semibold text-red-600 transition hover:bg-red-50">
            Clear
        </button>
        {status === "error" && <span className="text-[13px] text-error-primary">Save failed — check connection</span>}
        {status === "empty" && <span className="text-[13px] text-warning-primary">Fill in the form before saving</span>}
    </div>
);

// ── PMS / Hosting tabs ────────────────────────────────────────────

const PMS_TABS: { id: PMSTab; label: string }[] = [
    { id: "guesty", label: "Guesty" },
    { id: "hostaway", label: "Hostaway" },
    { id: "lodgify", label: "Lodgify" },
    { id: "hostfully", label: "Hostfully" },
    { id: "smoobu", label: "Smoobu" },
    { id: "ical", label: "iCal / Other" },
];

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
    none: "", stripe: "Stripe", pms: "PMS", hosting: "Netlify", supabase: "Supabase", domain: "Domain", overview: "Overview",
};

const Sidebar = ({
    steps, credentials, visited, currentStep, editing,
    onSelect, onMoveStep, onDeleteStep, onAddStep, onNavigateOverview,
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
}) => {
    const { theme } = useTheme();
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const [sessionCopied, setSessionCopied] = useState(false);
    const sessionId = getOrCreateSession();

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

    const copySession = () => {
        navigator.clipboard.writeText(sessionId).then(() => { setSessionCopied(true); setTimeout(() => setSessionCopied(false), 2000); });
    };

    return (
        <aside className="flex h-dvh w-[280px] shrink-0 flex-col border-r border-secondary bg-primary">
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
                                        className="flex size-6 items-center justify-center rounded-md text-quaternary transition hover:bg-red-50 hover:text-red-600">
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

            {/* session id */}
            <div className="border-t border-secondary px-4 py-3.5">
                <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-quaternary">Session ID</p>
                <div className="flex items-center gap-2 rounded-lg border border-secondary bg-secondary px-2.5 py-2">
                    <code className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[10px] text-tertiary">{sessionId}</code>
                    <button type="button" onClick={copySession}
                        className={cx("shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold transition", sessionCopied ? "text-success-primary" : "text-brand-600 hover:bg-brand-50")}>
                        {sessionCopied ? "Copied!" : "Copy"}
                    </button>
                </div>
                <p className="mt-1.5 text-[10.5px] text-quaternary">Share this ID with your developer to retrieve your saved credentials.</p>
            </div>
        </aside>
    );
};

// ── Main screen ───────────────────────────────────────────────────

export const OwnerGuideScreen = () => {
    const mainRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [steps, setSteps] = useState<StepData[]>(loadContent);
    const [ownerData, setOwnerData] = useState<OwnerData>(emptyOwner);
    const [sessionId] = useState(getOrCreateSession);
    const [locked, setLocked] = useState(() => {
        const s = localStorage.getItem("hgm_owner_locked");
        return s !== null ? s === "true" : true;
    });
    const [loading, setLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);
    const [visited, setVisited] = useState<Set<number>>(new Set());
    const [pmsTab, setPmsTab] = useState<PMSTab>("guesty");
    const [saveStatus, setSaveStatus] = useState<Record<string, SaveStatus>>({});
    const [overviewSaveStatus, setOverviewSaveStatus] = useState<SaveStatus>("idle");
    const [showComplete, setShowComplete] = useState(false);

    const editing = !locked;

    const contentHydrated = useRef(false);

    useEffect(() => {
        dbLoad(sessionId).then(data => {
            setOwnerData(data);
            if (data.credentials.pms_platform) setPmsTab(data.credentials.pms_platform as PMSTab);
            setLoading(false);
        });
    }, [sessionId]);

    // Shared guide content lives in Supabase so every client sees the team's edits.
    useEffect(() => {
        supabase
            .from("sop_pages")
            .select("data")
            .eq("slug", GUIDE_CONTENT_SLUG)
            .maybeSingle()
            .then(({ data, error }) => {
                if (!error && Array.isArray(data?.data) && data.data.length) {
                    const norm = normalizeSteps(data.data as StepData[]);
                    setSteps(norm);
                    saveContent(norm);
                }
                contentHydrated.current = true;
            });
    }, []);

    // Debounced publish of guide content to Supabase after edits.
    useEffect(() => {
        if (!contentHydrated.current) return;
        const t = setTimeout(() => {
            supabase
                .from("sop_pages")
                .upsert({ slug: GUIDE_CONTENT_SLUG, data: steps, updated_at: new Date().toISOString() }, { onConflict: "slug" })
                .then(({ error }) => { if (error) console.error("[owner-guide content save]", error); });
        }, 800);
        return () => clearTimeout(t);
    }, [steps]);

    useEffect(() => { localStorage.setItem("hgm_owner_locked", String(locked)); }, [locked]);

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
        const reader = new FileReader();
        reader.onload = () => patchInstruction(si, ii, { image: reader.result as string });
        reader.readAsDataURL(file);
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
        const reader = new FileReader();
        reader.onload = () => addImage(currentStep, reader.result as string);
        reader.readAsDataURL(file);
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
        <div className="flex h-dvh overflow-hidden bg-secondary">
            <Sidebar
                steps={steps} credentials={ownerData.credentials} visited={visited}
                currentStep={currentStep} editing={editing}
                onSelect={navigate} onMoveStep={moveStep}
                onDeleteStep={deleteStep} onAddStep={addStep}
                onNavigateOverview={navigateToOverview}
            />

            <main ref={mainRef} className="flex-1 overflow-y-auto scroll-smooth">
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
                                    <OverviewSection title="Stripe Payments" locked={locked} rows={[
                                        { label: "Account ID", value: cred("stripe_account_id") },
                                        { label: "Publishable Key", value: cred("stripe_publishable_key") },
                                        { label: "Secret Key", value: cred("stripe_secret_key") },
                                        { label: "Webhook Secret", value: cred("stripe_webhook_secret") },
                                    ]} />
                                    <OverviewSection title={`PMS / Calendar (${cred("pms_platform") || "not selected"})`} locked={locked} rows={[
                                        { label: "Guesty Client ID", value: cred("guesty_client_id") },
                                        { label: "Guesty Client Secret", value: cred("guesty_client_secret") },
                                        { label: "Guesty Listing ID", value: cred("guesty_listing_id") },
                                        { label: "Hostaway Account ID", value: cred("hostaway_account_id") },
                                        { label: "Hostaway API Key", value: cred("hostaway_api_key") },
                                        { label: "Lodgify API Key", value: cred("lodgify_api_key") },
                                        { label: "Smoobu API Key", value: cred("smoobu_api_key") },
                                        { label: "Airbnb iCal URL", value: cred("ical_airbnb") },
                                        { label: "VRBO iCal URL", value: cred("ical_vrbo") },
                                    ].filter(r => r.value)} />
                                    <OverviewSection title="Netlify Hosting" locked={locked} rows={[
                                        { label: "Site Domain", value: cred("netlify_domain") },
                                        { label: "Site ID", value: cred("netlify_site_id") },
                                        { label: "Build Hook URL", value: cred("netlify_build_hook") },
                                        { label: "Vercel Domain", value: cred("vercel_domain") },
                                        { label: "Vercel Project ID", value: cred("vercel_project_id") },
                                    ].filter(r => r.value)} />
                                    <OverviewSection title="Supabase Database" locked={locked} rows={[
                                        { label: "Project URL", value: cred("supabase_project_url") },
                                        { label: "Anon API Key", value: cred("supabase_anon_key") },
                                    ]} />
                                    <OverviewSection title="Domain" locked={locked} rows={[
                                        { label: "Custom Domain", value: cred("domain_custom") },
                                        { label: "Registrar", value: cred("domain_registrar") },
                                        { label: "Registrar Email", value: cred("domain_email") },
                                    ]} />

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
                                                <p className="mb-4 text-[13px] text-tertiary">Click Save to lock your submission. Values will be partially hidden and your developer will be able to retrieve them using your Session ID.</p>
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

                            {/* ── Credential forms ── */}
                            {!loading && (
                                <>
                                    {/* PMS */}
                                    {step.credSection === "pms" && (
                                        <section className="mb-6 rounded-2xl border border-secondary bg-primary p-6">
                                            <div className="mb-4 flex items-center justify-between gap-3">
                                                <h2 className="text-[15px] font-bold text-primary">Select your PMS platform:</h2>
                                                <StatusBadge sec="pms" />
                                            </div>
                                            <div className="mb-5 flex flex-wrap gap-2">
                                                {PMS_TABS.map(t => (
                                                    <button key={t.id} type="button"
                                                        onClick={() => { setPmsTab(t.id); setCred("pms_platform", t.id); }}
                                                        className={cx(
                                                            "rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition duration-100 ease-linear",
                                                            pmsTab === t.id ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300" : "border-secondary text-secondary hover:border-primary hover:text-primary",
                                                        )}>
                                                        {t.label}
                                                    </button>
                                                ))}
                                            </div>
                                            {pmsTab === "guesty" && (
                                                <div className="flex flex-col gap-4">
                                                    <p className="rounded-lg bg-secondary px-4 py-3 text-[13px] text-tertiary">app.guesty.com → Integrations → Open API → Generate API Key → name it "Website". Copy the Client ID, Client Secret, and Listing ID.</p>
                                                    <CredField label="API Base URL" placeholder="https://open-api.guesty.com" value={cred("guesty_base_url")} onChange={v => setCred("guesty_base_url", v)} />
                                                    <CredField label="Client ID" value={cred("guesty_client_id")} onChange={v => setCred("guesty_client_id", v)} />
                                                    <SecretField label="Client Secret" value={cred("guesty_client_secret")} onChange={v => setCred("guesty_client_secret", v)} />
                                                    <CredField label="Listing ID" value={cred("guesty_listing_id")} onChange={v => setCred("guesty_listing_id", v)} />
                                                    <SaveActions status={saveStatus["pms"] ?? "idle"} label="Guesty" onSave={() => doSave("pms")} onClear={() => doClear("pms", ["guesty_base_url", "guesty_client_id", "guesty_client_secret", "guesty_listing_id"])} />
                                                </div>
                                            )}
                                            {pmsTab === "hostaway" && (
                                                <div className="flex flex-col gap-4">
                                                    <p className="rounded-lg bg-secondary px-4 py-3 text-[13px] text-tertiary">dashboard.hostaway.com → Settings → API Keys → Create New Key, name it "Website".</p>
                                                    <CredField label="Account ID" value={cred("hostaway_account_id")} onChange={v => setCred("hostaway_account_id", v)} />
                                                    <SecretField label="API Key" value={cred("hostaway_api_key")} onChange={v => setCred("hostaway_api_key", v)} />
                                                    <CredField label="Listing ID" value={cred("hostaway_listing_id")} onChange={v => setCred("hostaway_listing_id", v)} />
                                                    <SaveActions status={saveStatus["pms"] ?? "idle"} label="Hostaway" onSave={() => doSave("pms")} onClear={() => doClear("pms", ["hostaway_account_id", "hostaway_api_key", "hostaway_listing_id"])} />
                                                </div>
                                            )}
                                            {pmsTab === "lodgify" && (
                                                <div className="flex flex-col gap-4">
                                                    <p className="rounded-lg bg-secondary px-4 py-3 text-[13px] text-tertiary">Lodgify → Account → API Access → Generate new API key.</p>
                                                    <SecretField label="API Key" value={cred("lodgify_api_key")} onChange={v => setCred("lodgify_api_key", v)} />
                                                    <CredField label="Property ID" value={cred("lodgify_property_id")} onChange={v => setCred("lodgify_property_id", v)} />
                                                    <SaveActions status={saveStatus["pms"] ?? "idle"} label="Lodgify" onSave={() => doSave("pms")} onClear={() => doClear("pms", ["lodgify_api_key", "lodgify_property_id"])} />
                                                </div>
                                            )}
                                            {pmsTab === "hostfully" && (
                                                <div className="flex flex-col gap-4">
                                                    <p className="rounded-lg bg-secondary px-4 py-3 text-[13px] text-tertiary">Hostfully → Agency Settings → API → Create new token.</p>
                                                    <CredField label="Agency UID" value={cred("hostfully_agency_uid")} onChange={v => setCred("hostfully_agency_uid", v)} />
                                                    <SecretField label="API Token" value={cred("hostfully_api_token")} onChange={v => setCred("hostfully_api_token", v)} />
                                                    <CredField label="Property UID" value={cred("hostfully_property_uid")} onChange={v => setCred("hostfully_property_uid", v)} />
                                                    <SaveActions status={saveStatus["pms"] ?? "idle"} label="Hostfully" onSave={() => doSave("pms")} onClear={() => doClear("pms", ["hostfully_agency_uid", "hostfully_api_token", "hostfully_property_uid"])} />
                                                </div>
                                            )}
                                            {pmsTab === "smoobu" && (
                                                <div className="flex flex-col gap-4">
                                                    <p className="rounded-lg bg-secondary px-4 py-3 text-[13px] text-tertiary">Smoobu → Settings → API Keys.</p>
                                                    <SecretField label="API Key" value={cred("smoobu_api_key")} onChange={v => setCred("smoobu_api_key", v)} />
                                                    <CredField label="Apartment ID" value={cred("smoobu_apartment_id")} onChange={v => setCred("smoobu_apartment_id", v)} />
                                                    <SaveActions status={saveStatus["pms"] ?? "idle"} label="Smoobu" onSave={() => doSave("pms")} onClear={() => doClear("pms", ["smoobu_api_key", "smoobu_apartment_id"])} />
                                                </div>
                                            )}
                                            {pmsTab === "ical" && (
                                                <div className="flex flex-col gap-4">
                                                    <p className="rounded-lg bg-secondary px-4 py-3 text-[13px] text-tertiary">Airbnb: Calendar → Export Calendar. VRBO: Calendar → Import/Export.</p>
                                                    <CredField label="Airbnb iCal URL" placeholder="https://www.airbnb.com/calendar/ical/..." value={cred("ical_airbnb")} onChange={v => setCred("ical_airbnb", v)} />
                                                    <CredField label="VRBO iCal URL" placeholder="https://www.vrbo.com/icalendar/..." value={cred("ical_vrbo")} onChange={v => setCred("ical_vrbo", v)} />
                                                    <CredField label="Other iCal URL #1" value={cred("ical_other1")} onChange={v => setCred("ical_other1", v)} />
                                                    <CredField label="Other iCal URL #2" value={cred("ical_other2")} onChange={v => setCred("ical_other2", v)} />
                                                    <SaveActions status={saveStatus["pms"] ?? "idle"} label="iCal Feeds" onSave={() => doSave("pms")} onClear={() => doClear("pms", ["ical_airbnb", "ical_vrbo", "ical_other1", "ical_other2"])} />
                                                </div>
                                            )}
                                        </section>
                                    )}

                                    {/* Hosting (Netlify/Vercel) */}
                                    {step.credSection === "hosting" && (
                                        <section className="mb-6 rounded-2xl border border-secondary bg-primary p-6">
                                            <div className="mb-4 flex items-center justify-between gap-3">
                                                <h2 className="text-[15px] font-bold text-primary">Paste your hosting credentials:</h2>
                                                <StatusBadge sec="hosting" />
                                            </div>
                                            <div className="flex flex-col gap-4">
                                                <CredField label="Netlify Site Domain (e.g. site.netlify.app)" placeholder="your-site.netlify.app" value={cred("netlify_domain")} onChange={v => setCred("netlify_domain", v)} />
                                                <CredField label="Netlify Site ID" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" value={cred("netlify_site_id")} onChange={v => setCred("netlify_site_id", v)} />
                                                <SecretField label="Netlify Build Hook URL" placeholder="https://api.netlify.com/build_hooks/..." value={cred("netlify_build_hook")} onChange={v => setCred("netlify_build_hook", v)} />
                                                <SaveActions status={saveStatus["hosting"] ?? "idle"} label="Netlify Info" onSave={() => doSave("hosting")} onClear={() => doClear("hosting", ["netlify_domain", "netlify_site_id", "netlify_build_hook"])} />
                                            </div>
                                        </section>
                                    )}

                                    {/* Supabase */}
                                    {step.credSection === "supabase" && (
                                        <section className="mb-6 rounded-2xl border border-secondary bg-primary p-6">
                                            <div className="mb-4 flex items-center justify-between gap-3">
                                                <h2 className="text-[15px] font-bold text-primary">Copy & Paste Credentials Below:</h2>
                                                <StatusBadge sec="supabase" />
                                            </div>
                                            <div className="flex flex-col gap-4">
                                                <CredField label="Supabase Project URL" placeholder="https://xxxxxxxxxxxx.supabase.co" value={cred("supabase_project_url")} onChange={v => setCred("supabase_project_url", v)} />
                                                <SecretField label="Supabase Anon API Key" placeholder="eyJhbGciOiJIUzI1NiIs..." value={cred("supabase_anon_key")} onChange={v => setCred("supabase_anon_key", v)} />
                                                <SaveActions status={saveStatus["supabase"] ?? "idle"} label="Supabase Credentials" onSave={() => doSave("supabase")} onClear={() => doClear("supabase", ["supabase_project_url", "supabase_anon_key"])} />
                                            </div>
                                        </section>
                                    )}

                                    {/* Stripe */}
                                    {step.credSection === "stripe" && (
                                        <section className="mb-6 rounded-2xl border border-secondary bg-primary p-6">
                                            <div className="mb-4 flex items-center justify-between gap-3">
                                                <h2 className="text-[15px] font-bold text-primary">Paste your Stripe Credentials here:</h2>
                                                <StatusBadge sec="stripe" />
                                            </div>
                                            <div className="flex flex-col gap-4">
                                                <CredField label="Account ID (e.g. acct_1Msz...)" placeholder="acct_1Msz..." value={cred("stripe_account_id")} onChange={v => setCred("stripe_account_id", v)} />
                                                <CredField label="Publishable Key (pk_live_...)" placeholder="pk_live_..." value={cred("stripe_publishable_key")} onChange={v => setCred("stripe_publishable_key", v)} />
                                                <SecretField label="Secret Key (sk_live_...)" placeholder="sk_live_..." value={cred("stripe_secret_key")} onChange={v => setCred("stripe_secret_key", v)} />
                                                <SecretField label="Webhook Signing Secret (whsec_...)" placeholder="whsec_..." value={cred("stripe_webhook_secret")} onChange={v => setCred("stripe_webhook_secret", v)} />
                                                <SaveActions status={saveStatus["stripe"] ?? "idle"} label="Stripe Credentials" onSave={() => doSave("stripe")} onClear={() => doClear("stripe", ["stripe_account_id", "stripe_publishable_key", "stripe_secret_key", "stripe_webhook_secret"])} />
                                            </div>
                                        </section>
                                    )}

                                    {/* Domain */}
                                    {step.credSection === "domain" && (
                                        <section className="mb-6 rounded-2xl border border-secondary bg-primary p-6">
                                            <div className="mb-4 flex items-center justify-between gap-3">
                                                <h2 className="text-[15px] font-bold text-primary">Save your domain details:</h2>
                                                <StatusBadge sec="domain" />
                                            </div>
                                            <div className="flex flex-col gap-4">
                                                <CredField label="Custom Domain (e.g. yourcabin.com)" placeholder="yourcabin.com" value={cred("domain_custom")} onChange={v => setCred("domain_custom", v)} />
                                                <CredField label="Domain Registrar (e.g. GoDaddy, Namecheap)" placeholder="GoDaddy" value={cred("domain_registrar")} onChange={v => setCred("domain_registrar", v)} />
                                                <CredField label="Registrar Login Email" placeholder="you@email.com" value={cred("domain_email")} onChange={v => setCred("domain_email", v)} />
                                                <SaveActions status={saveStatus["domain"] ?? "idle"} label="Domain Info" onSave={() => doSave("domain")} onClear={() => doClear("domain", ["domain_custom", "domain_registrar", "domain_email"])} />
                                            </div>
                                        </section>
                                    )}
                                </>
                            )}

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

            {/* floating lock/unlock */}
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
                            <p className="mb-6 text-[14px] leading-relaxed text-tertiary">Your Stripe, PMS calendar API, and Netlify environments are connected under your secure ownership.</p>
                            <button type="button" onClick={() => setShowComplete(false)}
                                className="w-full rounded-xl bg-success-solid py-3 text-[15px] font-semibold text-white transition hover:opacity-90">
                                Done
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
