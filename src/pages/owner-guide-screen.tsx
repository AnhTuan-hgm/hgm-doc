import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/providers/theme-provider";
import { cx } from "@/utils/cx";

/* ── Types ───────────────────────────────────────────────────────── */

type LensPos = { x: number; y: number };
type Step = { id: string; heading: string; tools: string[]; command: string; note?: string; image: string; lensPos?: LensPos };
type Stage = { id: string; name: string; steps: Step[] };
type SOPState = { stages: Stage[]; selectedId: string | null; locked: boolean };

const STORAGE_KEY = "hgm_owner_guide_v1";

/* ── Tools ───────────────────────────────────────────────────────── */

type ToolDef = { name: string; color: string; bg: string; border: string; Icon: () => React.ReactElement };

const TOOLS: ToolDef[] = [
    {
        name: "Stripe", color: "#635BFF", bg: "#F0EFFF", border: "rgba(99,91,255,0.30)",
        Icon: () => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>,
    },
    {
        name: "Supabase", color: "#7F56D9", bg: "#F9F5FF", border: "rgba(127,86,217,0.30)",
        Icon: () => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" /></svg>,
    },
    {
        name: "Netlify", color: "#16A34A", bg: "#ECFDF3", border: "rgba(22,163,74,0.30)",
        Icon: () => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 010 18a15 15 0 010-18" /></svg>,
    },
    {
        name: "Guesty", color: "#0EA5E9", bg: "#F0F9FF", border: "rgba(14,165,233,0.30)",
        Icon: () => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><path d="M9 22V12h6v10" /></svg>,
    },
    {
        name: "Hostaway", color: "#D97757", bg: "#FAF0EB", border: "rgba(217,119,87,0.32)",
        Icon: () => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>,
    },
    {
        name: "GoDaddy", color: "#D92D20", bg: "#FEF3F2", border: "rgba(217,45,32,0.30)",
        Icon: () => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></svg>,
    },
    {
        name: "Airbnb", color: "#FF385C", bg: "#FFF0F3", border: "rgba(255,56,92,0.28)",
        Icon: () => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8 8 4 11 4 15a8 8 0 0016 0c0-4-4-7-8-13z" /></svg>,
    },
    {
        name: "GitHub", color: "#171717", bg: "#F5F5F5", border: "rgba(23,23,23,0.20)",
        Icon: () => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" /></svg>,
    },
];

const KNOWN_TOOL_NAMES = new Set(TOOLS.map((t) => t.name));
const findTool = (name: string) => TOOLS.find((t) => t.name === name);

/* ── Helpers ─────────────────────────────────────────────────────── */

const uid = () => "id" + Math.random().toString(36).slice(2, 9);

function mkStep(heading = "New step"): Step {
    return { id: uid(), heading, tools: [], command: "", note: "", image: "" };
}

function seed(): SOPState {
    const S = (heading: string, tools: string[], command: string, note?: string): Step => ({
        id: uid(), heading, tools, command, image: "", note: note ?? "",
    });

    const stages: Stage[] = [
        {
            id: uid(), name: "1. Welcome & Roles", steps: [
                S("Understand the setup",
                    [],
                    "You (the owner) will register and own all business accounts — Stripe for payments, a PMS for reservations, and Netlify for hosting. Developers will be invited as team members only.",
                    "💡 You can always rotate or revoke API keys later to remove developer access — without losing your website."),
                S("Review this guide together",
                    [],
                    "Schedule a short call with your developer. Walk through each step in this guide so both parties understand who does what."),
                S("Confirm account ownership",
                    [],
                    "Make sure every account you create uses your personal business email. Never create accounts under your developer's email."),
                S("Locate domain registration accounts",
                    ["GoDaddy"],
                    "Check your email inbox for a welcome email from GoDaddy, Namecheap, Google Domains, Cloudflare, or similar registrars. Log in and confirm you can see your domain listed under 'My Domains'.",
                    "💡 If you bought your domain through your website agency, ask them to transfer the domain to a registrar account in your own name."),
                S("Prepare DNS access",
                    [],
                    "Your developer will need access to add/edit DNS records (CNAME or A records). Find the DNS settings panel in your registrar and be ready to share a screenshot."),
            ],
        },
        {
            id: uid(), name: "2. Stripe Payments Setup", steps: [
                S("Register your Stripe account",
                    ["Stripe"],
                    "Navigate to stripe.com/register and sign up. Enter your email address and create a password. Confirm your email via the link Stripe sends you.",
                    "💡 Make sure you switch from Test Mode to Live Mode in the top-right toggle before your website goes live."),
                S("Fill in your business details",
                    ["Stripe"],
                    "Stripe will ask for your business type (individual or company), legal name, address, and phone number. Fill in all fields accurately — this is required for payouts."),
                S("Add your bank account",
                    ["Stripe"],
                    "Go to Settings → Bank Accounts and add your business checking account. Stripe uses this to send you guest payments."),
                S("Verify your identity",
                    ["Stripe"],
                    "Stripe may ask for a government-issued ID (driver's license or passport) for KYC compliance. Upload clearly photographed front and back images."),
                S("Confirm payouts enabled",
                    ["Stripe"],
                    "In the Stripe dashboard, check the top banner. It should say 'Payouts enabled'. If it says pending, wait 1–2 business days for review."),
                S("Locate your Stripe API credentials",
                    ["Stripe"],
                    "Go to dashboard.stripe.com → Developers → API keys. Make sure the 'Live mode' toggle (top right) is ON.\n\nCopy:\n• Publishable Key (pk_live_...)\n• Secret Key — click 'Reveal live key' (sk_live_...)\n• Account ID — found in Account settings (acct_...)\n• Webhook Signing Secret (whsec_...)",
                    "💡 Never share your Secret Key by email or text. Only enter it directly in this secure guide page."),
            ],
        },
        {
            id: uid(), name: "3. PMS / Calendar API", steps: [
                S("Identify your PMS platform",
                    [],
                    "Select the platform you use to manage your property reservations:\n• Guesty\n• Hostaway\n• Lodgify\n• Hostfully\n• Smoobu\n• iCal / Other (Airbnb, VRBO, etc.)",
                    "💡 Not sure which PMS you use? Check your email inbox for invoices from Guesty, Hostaway, Lodgify, or similar platforms."),
                S("Generate Guesty API credentials",
                    ["Guesty"],
                    "1. Log in to app.guesty.com as the primary administrator.\n2. Go to Integrations → OAuth applications → New application.\n3. Name it 'Website'.\n4. Copy: Client ID, Client Secret, and your Listing ID.",
                    "💡 Use this step if you are on Guesty. Skip to the next step for other platforms."),
                S("Generate Hostaway API credentials",
                    ["Hostaway"],
                    "1. Log in to dashboard.hostaway.com.\n2. Go to Settings → API Keys → Create New Key.\n3. Name it 'Website'.\n4. Copy: Account ID and API Key, plus your Listing ID."),
                S("Set up iCal feeds (Airbnb / VRBO)",
                    ["Airbnb"],
                    "Use this if you manage calendars via iCal feed URLs.\n\n• Airbnb: Calendar → Export Calendar → copy the URL\n• VRBO: Calendar → Import/Export → copy the URL\n\nProvide these URLs to your developer."),
                S("Save PMS credentials securely",
                    [],
                    "Paste your API keys / calendar feeds into a secure password manager (1Password, LastPass) and share them with your developer through a secure channel.\n\nNever send credentials via email or text message."),
            ],
        },
        {
            id: uid(), name: "4. Supabase Setup", steps: [
                S("Create a Supabase account",
                    ["Supabase"],
                    "Navigate to database.supabase.com and sign up using your business email or GitHub account.\n\nAs the business owner, you should create and own the Supabase project to ensure full security of your guest database and uploaded photos."),
                S("Create a new project",
                    ["Supabase"],
                    "1. Click New Project.\n2. Pick your organization.\n3. Name the project (e.g. 'Property DB').\n4. Set a secure database password — save this in your password manager.\n5. Choose a server region close to your main property location.\n\nWait 1–2 minutes for the database to provision."),
                S("Locate your API credentials",
                    ["Supabase"],
                    "Once provisioned, go to Settings (gear icon) → API in the left sidebar.\n\nCopy:\n• Project URL (https://your-project.supabase.co)\n• Anon / public API key (eyJhbGciOi...)",
                    "💡 Never share your service_role key. Only the anon key is needed for the website frontend."),
                S("Save Supabase credentials",
                    ["Supabase"],
                    "Provide the Project URL and anon API key to your developer via a secure password manager. Your developer will add these as environment variables in Netlify so they never appear in the code."),
            ],
        },
        {
            id: uid(), name: "5. Hosting & Domain", steps: [
                S("Register with Netlify",
                    ["Netlify"],
                    "Navigate to netlify.com and sign up for a free Starter account.\n\nUse your business email address. Avoid signing up with GitHub or Google if you want direct credential control.",
                    "💡 The Starter plan is free and supports custom domains — it's all you need for your booking website."),
                S("Create a named team",
                    ["Netlify"],
                    "In the Netlify dashboard, create a named team (e.g. 'Property Name') under which your developer will deploy the website."),
                S("Invite your developer",
                    ["Netlify"],
                    "Go to Team Settings → Members → Invite.\nEnter your developer's email and set their role to 'Collaborator' or 'Developer'."),
                S("Find your Netlify credentials",
                    ["Netlify"],
                    "In your Netlify site, collect:\n\n• Site Domain (e.g. your-site.netlify.app) — shown on the site overview\n• Site ID — Site Settings → General → Site details\n• Build Hook URL — Site Settings → Build & Deploy → Build hooks → Add build hook (name it 'Admin Trigger')\n\nProvide these to your developer.",
                    "💡 The build hook URL allows the admin dashboard to trigger a site rebuild. Keep it private."),
                S("Connect your custom domain",
                    ["Netlify", "GoDaddy"],
                    "In Netlify → Domain settings, add your custom domain.\n\nThen log into your domain registrar (GoDaddy, Namecheap, etc.) and add a CNAME record pointing to your Netlify subdomain.\n\nSSL certificate is generated automatically by Netlify within minutes."),
            ],
        },
        {
            id: uid(), name: "6. Review & Launch", steps: [
                S("Run a test booking",
                    ["Stripe"],
                    "Open your live booking website and go through the full checkout process.\n\nTest credit card: 4242 4242 4242 4242\nExpiry: any future date\nCVC: any 3 digits",
                    "💡 Run these tests before announcing your website is live. Real guests should never be the first to discover a payment issue."),
                S("Verify in Stripe dashboard",
                    ["Stripe"],
                    "Log in to dashboard.stripe.com → Payments.\nThe test payment should appear within seconds.\n\nAlso check that the amount and currency are correct."),
                S("Verify admin dashboard",
                    [],
                    "Open your admin panel and navigate to the Reservations tab.\nThe test booking should appear in the list with correct guest details and dates."),
                S("Verify calendar blocking",
                    ["Guesty", "Airbnb"],
                    "Open your PMS (Guesty, Hostaway, etc.) and confirm the booked dates are now blocked on your listing calendar.\n\nAlso check Airbnb and VRBO directly to ensure those dates show as unavailable."),
                S("Change your Stripe password",
                    ["Stripe"],
                    "Log in to stripe.com → click your profile icon → Profile → Password.\nChange it to a strong password only you know."),
                S("Revoke developer Netlify access",
                    ["Netlify"],
                    "Go to Netlify → Team Settings → Members.\nFind your developer and change their role to 'Viewer' or remove them entirely.",
                    "💡 A good developer will expect and support this security handoff."),
                S("Rotate PMS API keys",
                    ["Guesty"],
                    "Log into your PMS (e.g. Guesty) → Integrations → API Keys.\nDelete or rotate any keys that were shared during development.\nProvide the new keys to your developer via environment variables only."),
            ],
        },
    ];

    return { stages, selectedId: stages[0].id, locked: true };
}

function load(): SOPState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const d = JSON.parse(raw) as SOPState;
            if (Array.isArray(d.stages) && d.stages.length) {
                d.stages.forEach((stage) => {
                    stage.steps.forEach((step: Step & { tool?: string }) => {
                        if (!Array.isArray(step.tools)) {
                            step.tools = step.tool ? [step.tool] : [];
                        }
                        delete step.tool;
                    });
                });
                return d;
            }
        }
    } catch {}
    return seed();
}

function save(s: SOPState) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

/* ── Lock icon ───────────────────────────────────────────────────── */

const LockIcon = ({ open }: { open: boolean }) => open ? (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 7.5-1.9" />
    </svg>
) : (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
);

/* ── Icon buttons ────────────────────────────────────────────────── */

const IconBtn = ({ onClick, title, danger, className, children }: {
    onClick: (e: React.MouseEvent) => void;
    title: string;
    danger?: boolean;
    className?: string;
    children: React.ReactNode;
}) => (
    <button
        type="button"
        title={title}
        onClick={onClick}
        className={cx(
            "flex size-[30px] shrink-0 items-center justify-center rounded-[7px] border border-secondary bg-primary text-tertiary transition duration-100 ease-linear",
            danger ? "hover:border-red-300 hover:bg-red-50 hover:text-red-600" : "hover:border-primary hover:bg-secondary hover:text-primary",
            className,
        )}
    >
        {children}
    </button>
);

/* ── Copy button ─────────────────────────────────────────────────── */

const CopyButton = ({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        <button
            type="button"
            onClick={copy}
            title="Copy to clipboard"
            className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-quaternary transition duration-100 ease-linear hover:bg-secondary hover:text-secondary"
        >
            {copied ? (
                <>
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-success-primary"><path d="M20 6L9 17l-5-5" /></svg>
                    <span className="text-success-primary">Copied</span>
                </>
            ) : (
                <>
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                    Copy
                </>
            )}
        </button>
    );
};

/* ── Image with magnifier ────────────────────────────────────────── */

const LENS = 72;
const ZOOM = 1.3;

const ImageWithMagnifier = ({ src, editing, lensPos, onLensPosChange }: {
    src: string;
    editing: boolean;
    lensPos?: LensPos;
    onLensPosChange?: (pos: LensPos) => void;
}) => {
    const imgRef    = useRef<HTMLImageElement>(null);
    const lbImgRef  = useRef<HTMLImageElement>(null);
    const lbWrapRef = useRef<HTMLDivElement>(null);

    const [dims,   setDims]   = useState({ w: 0, h: 0 });
    const [lbDims, setLbDims] = useState({ w: 0, h: 0 });
    const [lightbox, setLightbox] = useState(false);
    const [pos, setPos] = useState<LensPos>(lensPos ?? { x: 0.5, y: 0.5 });
    const posRef = useRef(pos);

    const dragMode = useRef<"thumb" | "lb" | null>(null);

    const applyPos = (newPos: LensPos) => {
        setPos(newPos);
        posRef.current = newPos;
    };

    const computePos = (el: HTMLImageElement | null, clientX: number, clientY: number) => {
        const rect = el?.getBoundingClientRect();
        if (!rect || rect.width === 0) return;
        applyPos({
            x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
            y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)),
        });
    };

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (dragMode.current === "thumb") computePos(imgRef.current, e.clientX, e.clientY);
            else if (dragMode.current === "lb") computePos(lbImgRef.current, e.clientX, e.clientY);
        };
        const onUp = () => {
            if (dragMode.current !== null) onLensPosChange?.(posRef.current);
            dragMode.current = null;
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    }, []);

    useEffect(() => {
        const refresh = () => { if (imgRef.current) setDims({ w: imgRef.current.offsetWidth, h: imgRef.current.offsetHeight }); };
        window.addEventListener("resize", refresh);
        return () => window.removeEventListener("resize", refresh);
    }, []);

    useEffect(() => {
        if (!lightbox) return;
        const esc = (e: KeyboardEvent) => { if (e.key === "Escape") closeLightbox(); };
        window.addEventListener("keydown", esc);
        return () => window.removeEventListener("keydown", esc);
    }, [lightbox]);

    const openLightbox  = () => setLightbox(true);
    const closeLightbox = () => { dragMode.current = null; setLightbox(false); };

    const lensStyle = (w: number, h: number): React.CSSProperties => ({
        position: "absolute",
        width: LENS, height: LENS,
        left: pos.x * w - LENS / 2,
        top:  pos.y * h - LENS / 2,
        borderRadius: "50%",
        border: "2.5px solid rgba(255,255,255,0.9)",
        boxShadow: "0 0 0 1.5px rgba(0,0,0,0.18), 0 3px 12px rgba(0,0,0,0.25)",
        backgroundImage: `url(${src})`,
        backgroundSize: `${w * ZOOM}px ${h * ZOOM}px`,
        backgroundPosition: `${-(pos.x * w * ZOOM - LENS / 2)}px ${-(pos.y * h * ZOOM - LENS / 2)}px`,
        backgroundRepeat: "no-repeat",
    });

    return (
        <>
            <div
                className="relative select-none"
                onTouchMove={(e) => { if (dragMode.current === "thumb") { e.preventDefault(); computePos(imgRef.current, e.touches[0].clientX, e.touches[0].clientY); } }}
                onTouchEnd={() => { dragMode.current = null; }}
            >
                <img ref={imgRef} src={src} alt="reference"
                    className="block w-full cursor-zoom-in rounded-xl border border-secondary"
                    onLoad={() => { if (imgRef.current) setDims({ w: imgRef.current.offsetWidth, h: imgRef.current.offsetHeight }); }}
                    draggable={false} onClick={openLightbox}
                />
                {dims.w > 0 && (
                    <div
                        style={{ ...lensStyle(dims.w, dims.h), cursor: editing ? "grab" : "default" }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={editing ? (e) => { e.preventDefault(); dragMode.current = "thumb"; computePos(imgRef.current, e.clientX, e.clientY); } : undefined}
                        onTouchStart={editing ? (e) => { e.preventDefault(); dragMode.current = "thumb"; computePos(imgRef.current, e.touches[0].clientX, e.touches[0].clientY); } : undefined}
                    />
                )}
            </div>
            {lightbox && (
                <div onClick={closeLightbox} className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/80 p-10 backdrop-blur-sm">
                    <div ref={lbWrapRef} className="relative select-none"
                        onClick={(e) => e.stopPropagation()}
                        onTouchMove={(e) => { if (dragMode.current === "lb") computePos(lbImgRef.current, e.touches[0].clientX, e.touches[0].clientY); }}
                        onTouchEnd={() => { dragMode.current = null; }}
                    >
                        <img ref={lbImgRef} src={src} alt="full view"
                            className="block rounded-xl shadow-2xl"
                            style={{ maxHeight: "90vh", maxWidth: "90vw" }}
                            onLoad={() => { if (lbImgRef.current) setLbDims({ w: lbImgRef.current.offsetWidth, h: lbImgRef.current.offsetHeight }); }}
                            draggable={false}
                        />
                        {lbDims.w > 0 && (
                            <div
                                style={{ ...lensStyle(lbDims.w, lbDims.h), cursor: "grab" }}
                                onMouseDown={(e) => { e.preventDefault(); dragMode.current = "lb"; computePos(lbImgRef.current, e.clientX, e.clientY); }}
                                onTouchStart={(e) => { e.preventDefault(); dragMode.current = "lb"; computePos(lbImgRef.current, e.touches[0].clientX, e.touches[0].clientY); }}
                            />
                        )}
                    </div>
                    <button type="button" onClick={closeLightbox} title="Close"
                        className="absolute right-6 top-6 flex size-10 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                </div>
            )}
        </>
    );
};

/* ── Step card ───────────────────────────────────────────────────── */

const StepCard = ({
    step, index, editing, onUpdate, onUpdateTools, onUpdateLensPos, onDelete, onMove, onInsert,
}: {
    step: Step;
    index: number;
    editing: boolean;
    onUpdate: (id: string, field: keyof Step, val: string) => void;
    onUpdateTools: (id: string, tools: string[]) => void;
    onUpdateLensPos: (id: string, pos: LensPos) => void;
    onDelete: (id: string) => void;
    onMove: (id: string, dir: -1 | 1) => void;
    onInsert: (id: string, pos: "before" | "after") => void;
}) => {
    const fileRef = useRef<HTMLInputElement>(null);
    const customInputRef = useRef<HTMLInputElement>(null);
    const [customDraft, setCustomDraft] = useState<string | null>(null);

    useEffect(() => {
        if (customDraft === "") customInputRef.current?.focus();
    }, [customDraft]);

    const commitCustom = () => {
        const v = (customDraft ?? "").trim();
        if (v) onUpdateTools(step.id, [...step.tools, v]);
        setCustomDraft(null);
    };
    const cancelCustom = () => setCustomDraft(null);

    const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => onUpdate(step.id, "image", reader.result as string);
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    return (
        <div className="group/step relative">
            {editing && index === 0 && (
                <div className="absolute -top-5 left-0 right-0 z-10 flex items-center gap-2.5 px-3.5 opacity-0 transition duration-100 ease-linear group-hover/step:opacity-100 pointer-events-none group-hover/step:pointer-events-auto">
                    <span className="h-0.5 flex-1 rounded-full bg-brand-200" />
                    <button type="button" onClick={() => onInsert(step.id, "before")} title="Insert step above"
                        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-md hover:brightness-110">
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                    </button>
                    <span className="h-0.5 flex-1 rounded-full bg-brand-200" />
                </div>
            )}

            <div className="rounded-2xl border border-secondary bg-primary shadow-xs">
                {/* title row */}
                <div className="flex items-start gap-3.5 p-5 pb-0">
                    <div className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-brand-100 font-bold text-[15px] text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
                        {index + 1}
                    </div>
                    {editing ? (
                        <input type="text" value={step.heading}
                            onChange={(e) => onUpdate(step.id, "heading", e.target.value)}
                            placeholder="Step title"
                            className="mt-0.5 flex-1 min-w-0 rounded-lg border border-secondary bg-transparent px-2.5 py-1 text-[18px] font-semibold leading-7 text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                        />
                    ) : (
                        <p className="mt-1 flex-1 min-w-0 text-[18px] font-semibold leading-7 text-primary">{step.heading}</p>
                    )}
                    {editing && (
                        <div className="flex shrink-0 gap-1 mt-0.5">
                            <IconBtn onClick={(e) => { e.stopPropagation(); onMove(step.id, -1); }} title="Move up">
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6" /></svg>
                            </IconBtn>
                            <IconBtn onClick={(e) => { e.stopPropagation(); onMove(step.id, 1); }} title="Move down">
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                            </IconBtn>
                            <IconBtn onClick={(e) => { e.stopPropagation(); onDelete(step.id); }} title="Delete step" danger>
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
                            </IconBtn>
                        </div>
                    )}
                </div>

                {/* tool selector */}
                <div className="mt-3.5 px-5 pl-[69px]">
                    {editing ? (
                        <div className="flex flex-wrap items-center gap-2">
                            {TOOLS.map((t) => {
                                const active = step.tools.includes(t.name);
                                return (
                                    <button key={t.name} type="button"
                                        onClick={() => onUpdateTools(step.id, active ? step.tools.filter((x) => x !== t.name) : [...step.tools, t.name])}
                                        style={{ color: t.color, background: active ? t.bg : "transparent", border: `1.5px solid ${active ? t.color : t.border}` }}
                                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold transition duration-100 ease-linear hover:opacity-80"
                                    >
                                        <t.Icon />{t.name}
                                    </button>
                                );
                            })}
                            {step.tools.map((name, idx) =>
                                KNOWN_TOOL_NAMES.has(name) ? null : (
                                    <span key={idx} style={{ color: "#525252", background: "#F5F5F5", border: "1.5px solid rgba(82,82,82,0.30)" }}
                                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold">
                                        {name}
                                        <button type="button" onClick={() => onUpdateTools(step.id, step.tools.filter((_, j) => j !== idx))}
                                            className="ml-0.5 leading-none text-[#888] hover:text-[#333]">
                                            <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                        </button>
                                    </span>
                                ),
                            )}
                            {customDraft === null ? (
                                <>
                                    <button type="button" onClick={() => setCustomDraft("")}
                                        style={{ color: "#525252", border: "1.5px dashed rgba(82,82,82,0.40)" }}
                                        className="inline-flex items-center rounded-full bg-transparent px-3 py-1 text-[12px] font-semibold transition duration-100 ease-linear hover:opacity-70">
                                        Other
                                    </button>
                                    <button type="button" onClick={() => setCustomDraft("")}
                                        style={{ color: "#525252", border: "1.5px dashed rgba(82,82,82,0.40)" }}
                                        className="inline-flex size-[27px] items-center justify-center rounded-full bg-transparent text-[16px] font-medium leading-none transition duration-100 ease-linear hover:opacity-70">
                                        +
                                    </button>
                                </>
                            ) : (
                                <div style={{ border: "1.5px solid rgba(82,82,82,0.50)" }} className="inline-flex items-center rounded-full px-2.5 py-0.5">
                                    <input ref={customInputRef} value={customDraft}
                                        onChange={(e) => setCustomDraft(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === "Enter") commitCustom(); if (e.key === "Escape") cancelCustom(); }}
                                        onBlur={commitCustom} placeholder="Tool name…"
                                        className="w-24 bg-transparent text-[12px] text-secondary outline-none placeholder:text-placeholder"
                                    />
                                </div>
                            )}
                        </div>
                    ) : step.tools.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {step.tools.map((name, i) => {
                                const t = findTool(name);
                                return t ? (
                                    <span key={i} style={{ color: t.color, background: t.bg, border: `1.5px solid ${t.border}` }}
                                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold">
                                        <t.Icon />{t.name}
                                    </span>
                                ) : (
                                    <span key={i} style={{ color: "#525252", background: "#F5F5F5", border: "1.5px solid rgba(82,82,82,0.30)" }}
                                        className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold">
                                        {name}
                                    </span>
                                );
                            })}
                        </div>
                    ) : null}
                </div>

                {/* command */}
                <div className="mt-3.5 flex flex-col gap-1.5 px-5 pl-[69px]">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-quaternary">Instructions</p>
                        {step.command && <CopyButton text={step.command} />}
                    </div>
                    {editing ? (
                        <textarea value={step.command}
                            onChange={(e) => onUpdate(step.id, "command", e.target.value)}
                            placeholder="Describe exactly what to do…" rows={3}
                            className="w-full resize-y rounded-lg border border-secondary bg-secondary px-3.5 py-3 font-mono text-[13.5px] leading-[22px] text-secondary outline-none focus:border-brand focus:bg-primary focus:ring-1 focus:ring-brand"
                        />
                    ) : step.command ? (
                        <pre className="whitespace-pre-wrap rounded-lg border border-secondary bg-secondary px-3.5 py-3 font-mono text-[13.5px] leading-[22px] text-secondary">{step.command}</pre>
                    ) : (
                        <span className="text-sm text-placeholder">—</span>
                    )}
                </div>

                {/* note */}
                {(editing || !!step.note) && (
                    <div className="mt-3.5 flex flex-col gap-1.5 px-5 pb-5 pl-[69px]">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-quaternary">Note</p>
                        {editing ? (
                            <textarea value={step.note ?? ""}
                                onChange={(e) => onUpdate(step.id, "note", e.target.value)}
                                placeholder="Add a note…" rows={2}
                                className="w-full resize-y border-0 bg-transparent px-0 py-0 text-[13.5px] leading-[22px] text-secondary outline-none placeholder:text-placeholder"
                            />
                        ) : (
                            <p className="text-[13.5px] leading-[22px] text-secondary">{step.note}</p>
                        )}
                    </div>
                )}

                {/* image */}
                {step.image ? (
                    <div className="relative mx-5 mb-5 ml-[69px]">
                        <ImageWithMagnifier src={step.image} editing={editing} lensPos={step.lensPos}
                            onLensPosChange={(p) => onUpdateLensPos(step.id, p)} />
                        {editing && (
                            <button type="button" onClick={() => onUpdate(step.id, "image", "")} title="Remove image"
                                className="absolute right-2 top-2 z-10 flex size-7 items-center justify-center rounded-[7px] bg-black/70 text-white backdrop-blur hover:bg-black/90">
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                            </button>
                        )}
                    </div>
                ) : editing ? (
                    <label className="mx-5 mb-5 ml-[69px] flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-primary bg-secondary py-8 text-[13px] font-medium text-tertiary transition duration-100 ease-linear hover:border-brand hover:bg-brand-50 hover:text-brand-700">
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                        </svg>
                        Add reference image
                    </label>
                ) : null}
            </div>

            {editing && (
                <div className="absolute -bottom-5 left-0 right-0 z-10 flex items-center gap-2.5 px-3.5 opacity-0 transition duration-100 ease-linear group-hover/step:opacity-100 pointer-events-none group-hover/step:pointer-events-auto">
                    <span className="h-0.5 flex-1 rounded-full bg-brand-200" />
                    <button type="button" onClick={() => onInsert(step.id, "after")} title="Insert step below"
                        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-md hover:brightness-110">
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                    </button>
                    <span className="h-0.5 flex-1 rounded-full bg-brand-200" />
                </div>
            )}
        </div>
    );
};

/* ── Sidebar ─────────────────────────────────────────────────────── */

const Sidebar = ({
    stages, selectedId, locked, editing,
    onSelect, onToggleLock, onAddStage, onDeleteStage, onMoveStage,
}: {
    stages: Stage[];
    selectedId: string | null;
    locked: boolean;
    editing: boolean;
    onSelect: (id: string) => void;
    onToggleLock: () => void;
    onAddStage: () => void;
    onDeleteStage: (id: string) => void;
    onMoveStage: (id: string, dir: -1 | 1) => void;
}) => {
    const { theme, setTheme } = useTheme();
    const isDark =
        theme === "dark" ||
        (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    return (
        <aside className="flex h-dvh w-[300px] shrink-0 flex-col border-r border-secondary bg-primary">
            <div className="flex items-center justify-between border-b border-secondary px-5 py-4">
                <img
                    src={isDark ? "/hgm logo/LOGO ON Dark.svg" : "/hgm logo/Logo ON LIGHT.svg"}
                    alt="HiddenGem Media" className="h-11" draggable={false}
                />
                <button type="button" onClick={() => setTheme(isDark ? "light" : "dark")}
                    title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                    className="flex size-9 shrink-0 items-center justify-center rounded-full border border-secondary bg-secondary text-secondary transition duration-100 ease-linear hover:bg-tertiary hover:text-primary">
                    {isDark ? (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                    )}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3.5">
                <p className="mb-3 px-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-quaternary">Owner Guide</p>
                <div className="flex flex-col gap-[3px]">
                    {stages.map((s, i) => {
                        const active = s.id === selectedId;
                        return (
                            <div key={s.id} onClick={() => onSelect(s.id)}
                                className={cx(
                                    "relative flex cursor-pointer items-center gap-[11px] rounded-[9px] px-3 py-[9px] pl-[13px] transition duration-100 ease-linear",
                                    active ? "bg-brand-50 dark:bg-brand-950/40" : "hover:bg-secondary hover:text-primary",
                                )}>
                                <span className={cx(
                                    "absolute left-0 top-[7px] bottom-[7px] w-[3px] rounded-r-[3px] bg-brand-600 transition duration-100",
                                    active ? "opacity-100" : "opacity-0",
                                )} />
                                <span className={cx("shrink-0 font-mono text-[11px] font-semibold", active ? "text-brand-600 dark:text-brand-400" : "text-quaternary")}>
                                    {String(i + 1).padStart(2, "0")}
                                </span>
                                <span className={cx("flex-1 min-w-0 truncate text-[14px] font-medium", active ? "text-primary" : "text-secondary")}>
                                    {s.name}
                                </span>
                                {locked && (
                                    <span className={cx(
                                        "shrink-0 rounded-full px-[7px] py-[1px] text-[11px] font-semibold",
                                        active ? "bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300" : "bg-secondary text-quaternary",
                                    )}>
                                        {s.steps.length}
                                    </span>
                                )}
                                {editing && (
                                    <div className="flex shrink-0 gap-px" onClick={(e) => e.stopPropagation()}>
                                        <button type="button" title="Move up" onClick={() => onMoveStage(s.id, -1)}
                                            className="flex size-[22px] items-center justify-center rounded-md text-quaternary transition duration-100 hover:bg-secondary hover:text-primary">
                                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6" /></svg>
                                        </button>
                                        <button type="button" title="Move down" onClick={() => onMoveStage(s.id, 1)}
                                            className="flex size-[22px] items-center justify-center rounded-md text-quaternary transition duration-100 hover:bg-secondary hover:text-primary">
                                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                                        </button>
                                        <button type="button" title="Delete stage" onClick={() => onDeleteStage(s.id)}
                                            className="flex size-[22px] items-center justify-center rounded-md text-quaternary transition duration-100 hover:bg-red-50 hover:text-red-600">
                                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-secondary p-3.5">
                {editing && (
                    <button type="button" onClick={onAddStage}
                        className="flex items-center justify-center gap-2 rounded-[9px] border border-primary bg-primary px-2.5 py-2.5 text-[13px] font-semibold text-secondary transition duration-100 ease-linear hover:bg-secondary">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                        Add stage
                    </button>
                )}
                <button type="button" onClick={onToggleLock}
                    className={cx(
                        "flex items-center justify-center gap-2 rounded-[9px] px-2.5 py-2.5 text-[13px] font-semibold transition duration-100 ease-linear",
                        editing
                            ? "border border-brand-600 bg-brand-600 text-white"
                            : "border border-primary bg-primary text-tertiary hover:bg-secondary",
                    )}>
                    <LockIcon open={editing} />
                    {locked ? "Editing locked" : "Editing on"}
                </button>
            </div>
        </aside>
    );
};

/* ── Main screen ─────────────────────────────────────────────────── */

export const OwnerGuideScreen = () => {
    const [state, setState] = useState<SOPState>(() => load());

    const { stages, selectedId, locked } = state;
    const editing = !locked;

    const sel = stages.find((s) => s.id === selectedId) ?? stages[0] ?? null;
    const selIdx = sel ? stages.findIndex((s) => s.id === sel.id) : -1;

    const update = (mutator: (draft: SOPState) => SOPState | void) => {
        setState((prev) => {
            const next = JSON.parse(JSON.stringify(prev)) as SOPState;
            const result = mutator(next);
            const final = result ?? next;
            save(final);
            return final;
        });
    };

    useEffect(() => {
        if (!selectedId && stages.length) {
            update((d) => { d.selectedId = d.stages[0].id; });
        }
    }, []);

    const handleSelect       = (id: string) => update((d) => { d.selectedId = id; });
    const handleToggleLock   = () => update((d) => { d.locked = !d.locked; });

    const handleAddStage = () => update((d) => {
        const id = uid();
        d.stages.push({ id, name: "New Stage", steps: [] });
        d.selectedId = id;
        d.locked = false;
    });

    const handleDeleteStage = (id: string) => update((d) => {
        const i = d.stages.findIndex((s) => s.id === id);
        if (i < 0) return;
        d.stages.splice(i, 1);
        if (d.selectedId === id) {
            d.selectedId = d.stages[i]?.id ?? d.stages[i - 1]?.id ?? d.stages[0]?.id ?? null;
        }
    });

    const handleMoveStage = (id: string, dir: -1 | 1) => update((d) => {
        const i = d.stages.findIndex((s) => s.id === id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= d.stages.length) return;
        [d.stages[i], d.stages[j]] = [d.stages[j], d.stages[i]];
    });

    const handleUpdateStageName = (val: string) => update((d) => {
        const s = d.stages.find((x) => x.id === d.selectedId);
        if (s) s.name = val || "Untitled stage";
    });

    const handleUpdateStep = (stepId: string, field: keyof Step, val: string) => update((d) => {
        const s = d.stages.find((x) => x.id === d.selectedId);
        const st = s?.steps.find((x) => x.id === stepId);
        if (st) (st as Record<string, unknown>)[field as string] = val;
    });

    const handleUpdateTools = (stepId: string, tools: string[]) => update((d) => {
        const s = d.stages.find((x) => x.id === d.selectedId);
        const st = s?.steps.find((x) => x.id === stepId);
        if (st) st.tools = tools;
    });

    const handleUpdateLensPos = (stepId: string, pos: LensPos) => update((d) => {
        const s = d.stages.find((x) => x.id === d.selectedId);
        const st = s?.steps.find((x) => x.id === stepId);
        if (st) st.lensPos = pos;
    });

    const handleAddStep = () => update((d) => {
        const s = d.stages.find((x) => x.id === d.selectedId);
        if (s) s.steps.push(mkStep());
    });

    const handleDeleteStep = (stepId: string) => update((d) => {
        const s = d.stages.find((x) => x.id === d.selectedId);
        if (s) s.steps = s.steps.filter((st) => st.id !== stepId);
    });

    const handleMoveStep = (stepId: string, dir: -1 | 1) => update((d) => {
        const s = d.stages.find((x) => x.id === d.selectedId);
        if (!s) return;
        const i = s.steps.findIndex((st) => st.id === stepId);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= s.steps.length) return;
        [s.steps[i], s.steps[j]] = [s.steps[j], s.steps[i]];
    });

    const handleInsertStep = (stepId: string, pos: "before" | "after") => update((d) => {
        const s = d.stages.find((x) => x.id === d.selectedId);
        if (!s) return;
        const i = s.steps.findIndex((st) => st.id === stepId);
        if (i < 0) return;
        const at = pos === "before" ? i : i + 1;
        s.steps.splice(at, 0, mkStep());
    });

    return (
        <div className="flex h-dvh overflow-hidden bg-secondary">
            <Sidebar
                stages={stages} selectedId={selectedId} locked={locked} editing={editing}
                onSelect={handleSelect} onToggleLock={handleToggleLock}
                onAddStage={handleAddStage} onDeleteStage={handleDeleteStage} onMoveStage={handleMoveStage}
            />

            <main className="flex-1 overflow-y-auto">
                {sel ? (
                    <div className="mx-auto max-w-[840px] px-10 py-9 pb-20">
                        <div className="mb-1.5 flex items-start gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="mb-2 flex items-center gap-2.5">
                                    <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-600 dark:text-brand-400">
                                        Stage {String(selIdx + 1).padStart(2, "0")}
                                    </span>
                                    <span className="size-1 rounded-full bg-tertiary" />
                                    <span className="text-[12px] font-medium text-quaternary">
                                        {sel.steps.length} {sel.steps.length === 1 ? "step" : "steps"}
                                    </span>
                                </div>
                                {editing ? (
                                    <input type="text" value={sel.name}
                                        onChange={(e) => handleUpdateStageName(e.target.value)}
                                        className="w-full rounded-xl border border-secondary bg-transparent px-2.5 py-1 text-[34px] font-semibold leading-10 tracking-[-0.02em] text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand -ml-2.5"
                                    />
                                ) : (
                                    <h1 className="text-[34px] font-semibold leading-10 tracking-[-0.02em] text-primary">{sel.name}</h1>
                                )}
                            </div>
                            <span className={cx(
                                "shrink-0 mt-1 inline-flex items-center rounded-full border px-3 py-1.5 text-[12px] font-semibold whitespace-nowrap",
                                editing ? "border-brand-200 bg-brand-50 text-brand-700" : "border-secondary bg-secondary text-tertiary",
                            )}>
                                {editing ? "Editing on — fields are live" : "Locked — read only"}
                            </span>
                        </div>

                        <hr className="my-6 border-secondary" />

                        {sel.steps.length > 0 ? (
                            <div className={cx("flex flex-col", editing ? "gap-9" : "gap-4")}>
                                {sel.steps.map((step, i) => (
                                    <StepCard key={step.id} step={step} index={i} editing={editing}
                                        onUpdate={handleUpdateStep} onUpdateTools={handleUpdateTools}
                                        onUpdateLensPos={handleUpdateLensPos} onDelete={handleDeleteStep}
                                        onMove={handleMoveStep} onInsert={handleInsertStep}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-2xl border-[1.5px] border-dashed border-primary bg-primary p-14 text-center">
                                <p className="text-[17px] font-semibold text-primary">No steps in this stage yet</p>
                                <p className="mt-1.5 text-[14px] text-tertiary">Unlock editing and add the first step of this workflow.</p>
                            </div>
                        )}

                        {editing && (
                            <button type="button" onClick={handleAddStep}
                                className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-xl border-[1.5px] border-dashed border-primary bg-primary py-3.5 text-[14px] font-semibold text-secondary transition duration-100 ease-linear hover:border-brand hover:bg-brand-50 hover:text-brand-700">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                                Add step
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3.5 p-10 text-center">
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-950/30">
                            <svg viewBox="0 0 32 32" width="30" height="30">
                                <path d="M16 2 L30 13 L16 30 L2 13 Z" fill="#7F56D9" />
                                <path d="M16 2 L30 13 L16 13 Z" fill="#fff" opacity="0.3" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-[20px] font-semibold text-primary">No stages yet</p>
                            <p className="mt-1 max-w-xs text-[14px] text-tertiary">Add your first stage from the sidebar to get started.</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
