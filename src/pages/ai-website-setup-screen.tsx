import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/providers/theme-provider";
import { cx } from "@/utils/cx";

/* ── Types ───────────────────────────────────────────────────────── */

type Step = { id: string; heading: string; tools: string[]; command: string; note?: string; image: string };
type Stage = { id: string; name: string; steps: Step[] };
type SOPState = { stages: Stage[]; selectedId: string | null; locked: boolean };

const STORAGE_KEY = "hgm_sop_v2";

/* ── Tools ───────────────────────────────────────────────────────── */

type ToolDef = { name: string; color: string; bg: string; border: string; Icon: () => React.ReactElement };

const TOOLS: ToolDef[] = [
    {
        name: "Git", color: "#D92D20", bg: "#FEF3F2", border: "rgba(217,45,32,0.30)",
        Icon: () => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="6" r="3" /><path d="M18 9a6 6 0 01-6 6H6" /></svg>,
    },
    {
        name: "VS Code", color: "#2563EB", bg: "#EFF6FF", border: "rgba(37,99,235,0.30)",
        Icon: () => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6" /></svg>,
    },
    {
        name: "Claude", color: "#D97757", bg: "#FAF0EB", border: "rgba(217,119,87,0.32)",
        Icon: () => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.5v19M2.5 12h19M5.4 5.4l13.2 13.2M18.6 5.4L5.4 18.6" /></svg>,
    },
    {
        name: "Netlify", color: "#16A34A", bg: "#ECFDF3", border: "rgba(22,163,74,0.30)",
        Icon: () => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 010 18a15 15 0 010-18" /></svg>,
    },
    {
        name: "Supabase", color: "#7F56D9", bg: "#F9F5FF", border: "rgba(127,86,217,0.30)",
        Icon: () => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" /></svg>,
    },
    {
        name: "Stripe", color: "#635BFF", bg: "#F0EFFF", border: "rgba(99,91,255,0.30)",
        Icon: () => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>,
    },
    {
        name: "Terminal", color: "#0EA5E9", bg: "#F0F9FF", border: "rgba(14,165,233,0.30)",
        Icon: () => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 17l6-6-6-6M12 19h8" /></svg>,
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
    const S = (heading: string, tool: string, command: string): Step => ({ id: uid(), heading, tools: tool ? [tool] : [], command, image: "" });
    const stages: Stage[] = [
        {
            id: uid(), name: "1. Workflow & Roles", steps: [
                S("Owner account ownership", "Security", "The Website Owner registers and retains absolute ownership of the financial (Stripe), PMS (Guesty/Hostaway), and hosting (Netlify) accounts. Owner also provides DNS / domain registrar access."),
                S("Builder / developer duties", "Dev Team", "The Developer acts as builder only: assemble HTML/JS with Claude, initialize Git and push to GitHub, expose local servers for preview, and configure webhooks & build settings — inserting keys without owning the accounts."),
                S("Confirm the architecture", "Notion", "You are deploying a static HTML + client-side JavaScript portal. No backend database setup is required — all credentials live in the browser's localStorage or are injected as Netlify environment variables."),
            ],
        },
        {
            id: uid(), name: "2. Install Dev Tools", steps: [
                S("Install Visual Studio Code", "VS Code", "Download and install the primary code editor from code.visualstudio.com"),
                S("Install Node.js (LTS)", "Node.js", "Download the LTS build from nodejs.org — required to run JavaScript packages and CLI utilities."),
                S("Install Git", "Git", "Download the version control engine from git-scm.com/downloads — this pushes files to GitHub."),
                S("Verify the installs", "Terminal", "node -v\ngit --version\n\nBoth commands should return version numbers."),
            ],
        },
        {
            id: uid(), name: "3. Folder & Workspace", steps: [
                S("Create the project directory", "Terminal", "mkdir -p ~/projects/my-admin\ncd ~/projects/my-admin"),
                S("Open the folder in VS Code", "VS Code", "code .\n\nIf this fails, open VS Code manually → File → Open Folder → select the folder."),
                S("Open the integrated terminal", "VS Code", "Use the shortcut Ctrl + ` or select Terminal → New Terminal. All subsequent commands are typed into this terminal window."),
            ],
        },
        {
            id: uid(), name: "4. Local Git Setup", steps: [
                S("Initialize Git", "Git", "git init\n\n⚠️ Run strictly from inside your project directory so Git is not initialized in your home path."),
                S("Configure name & email", "Git", 'git config --global user.name "Your Name"\ngit config --global user.email "you@example.com"'),
                S("Create a .gitignore file", "VS Code", "Right-click the files sidebar → New File → name it exactly .gitignore, then add:\n\n.env\nnode_modules/\n.DS_Store\n*.log"),
            ],
        },
        {
            id: uid(), name: "5. Connect to GitHub", steps: [
                S("Create a private repository", "GitHub", "On GitHub, create a new private repo. Do NOT add a README or license."),
                S("Stage & commit locally", "Git", 'git add .\ngit commit -m "initial commit"'),
                S("Add remote & push", "Git", "git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git\ngit branch -M main\ngit push -u origin main"),
            ],
        },
        {
            id: uid(), name: "6. Prompting Claude", steps: [
                S("Aesthetic styling prompt", "Claude", '"Can you review the design styles in my index.html and update the colors to use a premium, warm stone and soft charcoal aesthetic? Use HSL curated colors, Inter font, Cormorant Garamond for serif headers, and subtle amber (#c9a96e) for active borders and buttons. Provide the complete modified HTML file."'),
                S("Feature insertion prompt", "Claude", '"I want to add a settings form into my index.html settings panel to save PMS and Stripe keys in the browser\'s localStorage. Please provide the HTML forms and the JavaScript functions to read the keys on load, save them when clicking \'Save\', and clear them when clicking \'Reset\'. Write the complete updated file."'),
            ],
        },
        {
            id: uid(), name: "7. Deploy to Netlify", steps: [
                S("Link the repo", "Netlify", "Authorize Netlify to read your GitHub repo, choose your project, leave build commands blank, set publish directory to \".\" and click Deploy."),
                S("Set environment variables", "Netlify", "Site Settings → Environment variables. Inject keys like STRIPE_SECRET_KEY securely without writing them in code."),
                S("Custom domain & DNS", "Netlify", "Link your custom domain under Netlify Domain Settings, then add a CNAME at your registrar pointing to the Netlify subdomain. SSL is generated automatically."),
            ],
        },
        {
            id: uid(), name: "8. Supabase Setup", steps: [
                S("Create a Supabase project", "Supabase", "Sign in to database.supabase.com, create a project, choose a nearby region, and define a database password."),
                S("Run the SQL migration", "Supabase SQL", "-- Create your tables\nCREATE TABLE public.listings (\n  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,\n  title text NOT NULL,\n  created_at timestamptz DEFAULT now() NOT NULL\n);\n\nALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;\nCREATE POLICY \"Allow public read\" ON public.listings FOR SELECT TO public USING (true);"),
                S("Copy URL & anon key", "Supabase", "Project Settings → API → copy the Project URL and the anon / public key, then paste them into your Netlify environment variables."),
            ],
        },
        {
            id: uid(), name: "9. Analytics & Tracking", steps: [
                S("Google Analytics (GA4)", "Google Analytics", '<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag(\'js\', new Date());\n  gtag(\'config\', \'G-XXXXXXXXXX\');\n</script>'),
                S("Facebook Pixel (Meta)", "Meta Pixel", '<!-- Meta Pixel Code -->\n<script>\n  !function(f,b,e,v,n,t,s)\n  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?\n  n.callMethod.apply(n,arguments):n.queue.push(arguments)};\n  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version=\'2.0\';\n  n.queue=[];t=b.createElement(e);t.async=!0;\n  t.src=v;s=b.getElementsByTagName(e)[0];\n  s.parentNode.insertBefore(t,s)}(window, document,\'script\',\n  \'https://connect.facebook.net/en_US/fbevents.js\');\n  fbq(\'init\', \'YOUR_PIXEL_ID\');\n  fbq(\'track\', \'PageView\');\n</script>'),
            ],
        },
        {
            id: uid(), name: "10. Handoff & Verification", steps: [
                S("Simulate a test checkout", "Stripe", "Perform a mock reservation with Stripe test card 4242 4242 4242 4242 and verify it registers on the dashboard reservations tab."),
                S("Security handoff", "Netlify", "Demote developer accounts in the Netlify site workspace. Verify the owner is the sole owner and administrator of all production accounts."),
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
                // migrate old tool: string → tools: string[]
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

/* ── Diamond logo SVG ────────────────────────────────────────────── */

const DiamondLogo = () => (
    <svg viewBox="0 0 32 32" width="32" height="32" className="shrink-0" style={{ filter: "drop-shadow(0 4px 10px rgba(127,86,217,0.45))" }}>
        <path d="M16 2 L30 13 L16 30 L2 13 Z" fill="#7F56D9" />
        <path d="M16 2 L30 13 L16 13 Z" fill="#ffffff" opacity="0.28" />
        <path d="M2 13 L16 13 L16 30 Z" fill="#000000" opacity="0.16" />
        <path d="M16 13 L30 13 L16 30 Z" fill="#000000" opacity="0.30" />
        <path d="M9 13 L23 13" stroke="#ffffff" strokeWidth="0.6" opacity="0.35" />
    </svg>
);

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

const ImageWithMagnifier = ({ src, editing }: { src: string; editing: boolean }) => {
    const imgRef    = useRef<HTMLImageElement>(null);
    const lbImgRef  = useRef<HTMLImageElement>(null);
    const lbWrapRef = useRef<HTMLDivElement>(null);

    const [dims,   setDims]   = useState({ w: 0, h: 0 });
    const [lbDims, setLbDims] = useState({ w: 0, h: 0 });
    const [lightbox, setLightbox] = useState(false);
    const [pos, setPos] = useState({ x: 0.5, y: 0.5 });

    const dragMode = useRef<"thumb" | "lb" | null>(null);

    // normalize against the image element itself — perfectly consistent with offsetWidth/Height
    const computePos = (el: HTMLImageElement | null, clientX: number, clientY: number) => {
        const rect = el?.getBoundingClientRect();
        if (!rect || rect.width === 0) return;
        setPos({
            x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
            y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)),
        });
    };

    // window-level drag: mouse can leave the element freely
    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (dragMode.current === "thumb") computePos(imgRef.current, e.clientX, e.clientY);
            else if (dragMode.current === "lb") computePos(lbImgRef.current, e.clientX, e.clientY);
        };
        const onUp = () => { dragMode.current = null; };
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

    // no didDrag guard — clicking the image always opens the lightbox
    // (the lens circle has stopPropagation so clicks on it never reach the img)
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
            {/* thumbnail */}
            <div
                className="relative select-none"
                onTouchMove={(e) => { if (dragMode.current === "thumb") { e.preventDefault(); computePos(imgRef.current, e.touches[0].clientX, e.touches[0].clientY); } }}
                onTouchEnd={() => { dragMode.current = null; }}
            >
                <img
                    ref={imgRef}
                    src={src}
                    alt="reference"
                    className="block w-full cursor-zoom-in rounded-xl border border-secondary"
                    onLoad={() => { if (imgRef.current) setDims({ w: imgRef.current.offsetWidth, h: imgRef.current.offsetHeight }); }}
                    draggable={false}
                    onClick={openLightbox}
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

            {/* lightbox */}
            {lightbox && (
                <div onClick={closeLightbox} className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/80 p-10 backdrop-blur-sm">
                    <div
                        ref={lbWrapRef}
                        className="relative select-none"
                        onClick={(e) => e.stopPropagation()}
                        onTouchMove={(e) => { if (dragMode.current === "lb") computePos(lbImgRef.current, e.touches[0].clientX, e.touches[0].clientY); }}
                        onTouchEnd={() => { dragMode.current = null; }}
                    >
                        <img
                            ref={lbImgRef}
                            src={src}
                            alt="full view"
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
    step, index, editing, onUpdate, onUpdateTools, onDelete, onMove, onInsert,
}: {
    step: Step;
    index: number;
    editing: boolean;
    onUpdate: (id: string, field: keyof Step, val: string) => void;
    onUpdateTools: (id: string, tools: string[]) => void;
    onDelete: (id: string) => void;
    onMove: (id: string, dir: -1 | 1) => void;
    onInsert: (id: string, pos: "before" | "after") => void;
}) => {
    const fileRef = useRef<HTMLInputElement>(null);
    const customInputRef = useRef<HTMLInputElement>(null);
    const [customDraft, setCustomDraft] = useState<string | null>(null);

    // auto-focus the custom tool input when it opens
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
            {/* insert above */}
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
                        <input
                            type="text"
                            value={step.heading}
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
                            {/* predefined tool chips — multi-select */}
                            {TOOLS.map((t) => {
                                const active = step.tools.includes(t.name);
                                return (
                                    <button
                                        key={t.name}
                                        type="button"
                                        onClick={() => onUpdateTools(step.id,
                                            active
                                                ? step.tools.filter((x) => x !== t.name)
                                                : [...step.tools, t.name],
                                        )}
                                        style={{
                                            color: t.color,
                                            background: active ? t.bg : "transparent",
                                            border: `1.5px solid ${active ? t.color : t.border}`,
                                        }}
                                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold transition duration-100 ease-linear hover:opacity-80"
                                    >
                                        <t.Icon />
                                        {t.name}
                                    </button>
                                );
                            })}

                            {/* custom (non-predefined) chips */}
                            {step.tools.map((name, idx) =>
                                KNOWN_TOOL_NAMES.has(name) ? null : (
                                    <span
                                        key={idx}
                                        style={{ color: "#525252", background: "#F5F5F5", border: "1.5px solid rgba(82,82,82,0.30)" }}
                                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold"
                                    >
                                        {name}
                                        <button
                                            type="button"
                                            onClick={() => onUpdateTools(step.id, step.tools.filter((_, j) => j !== idx))}
                                            className="ml-0.5 leading-none text-[#888] hover:text-[#333]"
                                        >
                                            <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                        </button>
                                    </span>
                                ),
                            )}

                            {/* "Other" chip (no icon) and "+" button — both add a custom entry */}
                            {customDraft === null ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setCustomDraft("")}
                                        style={{ color: "#525252", border: "1.5px dashed rgba(82,82,82,0.40)" }}
                                        className="inline-flex items-center rounded-full bg-transparent px-3 py-1 text-[12px] font-semibold transition duration-100 ease-linear hover:opacity-70"
                                    >
                                        Other
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCustomDraft("")}
                                        style={{ color: "#525252", border: "1.5px dashed rgba(82,82,82,0.40)" }}
                                        className="inline-flex size-[27px] items-center justify-center rounded-full bg-transparent text-[16px] font-medium leading-none transition duration-100 ease-linear hover:opacity-70"
                                    >
                                        +
                                    </button>
                                </>
                            ) : (
                                <div
                                    style={{ border: "1.5px solid rgba(82,82,82,0.50)" }}
                                    className="inline-flex items-center rounded-full px-2.5 py-0.5"
                                >
                                    <input
                                        ref={customInputRef}
                                        value={customDraft}
                                        onChange={(e) => setCustomDraft(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") commitCustom();
                                            if (e.key === "Escape") cancelCustom();
                                        }}
                                        onBlur={commitCustom}
                                        placeholder="Tool name…"
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
                                    <span
                                        key={i}
                                        style={{ color: t.color, background: t.bg, border: `1.5px solid ${t.border}` }}
                                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
                                    >
                                        <t.Icon />
                                        {t.name}
                                    </span>
                                ) : (
                                    <span
                                        key={i}
                                        style={{ color: "#525252", background: "#F5F5F5", border: "1.5px solid rgba(82,82,82,0.30)" }}
                                        className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold"
                                    >
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
                        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-quaternary">Command / Prompt</p>
                        {step.command && <CopyButton text={step.command} />}
                    </div>
                    {editing ? (
                        <textarea
                            value={step.command}
                            onChange={(e) => onUpdate(step.id, "command", e.target.value)}
                            placeholder="Describe exactly what to do…"
                            rows={3}
                            className="w-full resize-y rounded-lg border border-secondary bg-secondary px-3.5 py-3 font-mono text-[13.5px] leading-[22px] text-secondary outline-none focus:border-brand focus:bg-primary focus:ring-1 focus:ring-brand"
                        />
                    ) : step.command ? (
                        <pre className="whitespace-pre-wrap rounded-lg border border-secondary bg-secondary px-3.5 py-3 font-mono text-[13.5px] leading-[22px] text-secondary">{step.command}</pre>
                    ) : (
                        <span className="text-sm text-placeholder">—</span>
                    )}
                </div>

                {/* note */}
                <div className="mt-3.5 flex flex-col gap-1.5 px-5 pb-5 pl-[69px]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-quaternary">Note</p>
                    {editing ? (
                        <textarea
                            value={step.note ?? ""}
                            onChange={(e) => onUpdate(step.id, "note", e.target.value)}
                            placeholder="Add a note…"
                            rows={2}
                            className="w-full resize-y border-0 bg-transparent px-0 py-0 text-[13.5px] leading-[22px] text-secondary outline-none placeholder:text-placeholder"
                        />
                    ) : step.note ? (
                        <p className="text-[13.5px] leading-[22px] text-secondary">{step.note}</p>
                    ) : null}
                </div>

                {/* image */}
                {step.image ? (
                    <div className="relative mx-5 mb-5 ml-[69px]">
                        <ImageWithMagnifier src={step.image} editing={editing} />
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
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="M21 15l-5-5L5 21" />
                        </svg>
                        Add reference image
                    </label>
                ) : null}
            </div>

            {/* insert below */}
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
        {/* header */}
        <div className="flex items-center justify-between border-b border-secondary px-5 py-4">
            <img
                src={isDark ? "/hgm logo/LOGO ON Dark.svg" : "/hgm logo/Logo ON LIGHT.svg"}
                alt="HiddenGem Media"
                className="h-11"
                draggable={false}
            />
            <button
                type="button"
                onClick={() => setTheme(isDark ? "light" : "dark")}
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                className="flex size-9 shrink-0 items-center justify-center rounded-full border border-secondary bg-secondary text-secondary transition duration-100 ease-linear hover:bg-tertiary hover:text-primary"
            >
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

        {/* stage list */}
        <div className="flex-1 overflow-y-auto px-3 py-3.5">
            <p className="mb-3 px-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-quaternary">Workflow</p>
            <div className="flex flex-col gap-[3px]">
                {stages.map((s, i) => {
                    const active = s.id === selectedId;
                    return (
                        <div
                            key={s.id}
                            onClick={() => onSelect(s.id)}
                            className={cx(
                                "relative flex cursor-pointer items-center gap-[11px] rounded-[9px] px-3 py-[9px] pl-[13px] transition duration-100 ease-linear",
                                active
                                    ? "bg-brand-50 dark:bg-brand-950/40"
                                    : "hover:bg-secondary hover:text-primary",
                            )}
                        >
                            {/* active bar */}
                            <span className={cx(
                                "absolute left-0 top-[7px] bottom-[7px] w-[3px] rounded-r-[3px] bg-brand-600 transition duration-100",
                                active ? "opacity-100" : "opacity-0",
                            )} />
                            {/* number */}
                            <span className={cx(
                                "shrink-0 font-mono text-[11px] font-semibold",
                                active ? "text-brand-600 dark:text-brand-400" : "text-quaternary",
                            )}>
                                {String(i + 1).padStart(2, "0")}
                            </span>
                            {/* name */}
                            <span className={cx(
                                "flex-1 min-w-0 truncate text-[14px] font-medium",
                                active ? "text-primary" : "text-secondary",
                            )}>
                                {s.name}
                            </span>
                            {/* step count badge */}
                            {locked && (
                                <span className={cx(
                                    "shrink-0 rounded-full px-[7px] py-[1px] text-[11px] font-semibold",
                                    active
                                        ? "bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300"
                                        : "bg-secondary text-quaternary",
                                )}>
                                    {s.steps.length}
                                </span>
                            )}
                            {/* editing controls */}
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

        {/* footer */}
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

export const AiWebsiteSetupScreen = () => {
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

    // auto-select first stage on load
    useEffect(() => {
        if (!selectedId && stages.length) {
            update((d) => { d.selectedId = d.stages[0].id; });
        }
    }, []);

    /* ── Stage handlers ── */
    const handleSelect = (id: string) => update((d) => { d.selectedId = id; });
    const handleToggleLock = () => update((d) => { d.locked = !d.locked; });

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

    /* ── Step handlers ── */
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
                stages={stages}
                selectedId={selectedId}
                locked={locked}
                editing={editing}
                onSelect={handleSelect}
                onToggleLock={handleToggleLock}
                onAddStage={handleAddStage}
                onDeleteStage={handleDeleteStage}
                onMoveStage={handleMoveStage}
            />

            <main className="flex-1 overflow-y-auto">
                {sel ? (
                    <div className="mx-auto max-w-[840px] px-10 py-9 pb-20">
                        {/* stage header */}
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
                                    <input
                                        type="text"
                                        value={sel.name}
                                        onChange={(e) => handleUpdateStageName(e.target.value)}
                                        className="w-full rounded-xl border border-secondary bg-transparent px-2.5 py-1 text-[34px] font-semibold leading-10 tracking-[-0.02em] text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand -ml-2.5"
                                    />
                                ) : (
                                    <h1 className="text-[34px] font-semibold leading-10 tracking-[-0.02em] text-primary">
                                        {sel.name}
                                    </h1>
                                )}
                            </div>
                            <span className={cx(
                                "shrink-0 mt-1 inline-flex items-center rounded-full border px-3 py-1.5 text-[12px] font-semibold whitespace-nowrap",
                                editing
                                    ? "border-brand-200 bg-brand-50 text-brand-700"
                                    : "border-secondary bg-secondary text-tertiary",
                            )}>
                                {editing ? "Editing on — fields are live" : "Locked — read only"}
                            </span>
                        </div>

                        <hr className="my-6 border-secondary" />

                        {/* steps */}
                        {sel.steps.length > 0 ? (
                            <div className={cx("flex flex-col", editing ? "gap-9" : "gap-4")}>
                                {sel.steps.map((step, i) => (
                                    <StepCard
                                        key={step.id}
                                        step={step}
                                        index={i}
                                        editing={editing}
                                        onUpdate={handleUpdateStep}
                                        onUpdateTools={handleUpdateTools}
                                        onDelete={handleDeleteStep}
                                        onMove={handleMoveStep}
                                        onInsert={handleInsertStep}
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
                            <p className="mt-1 max-w-xs text-[14px] text-tertiary">
                                Add your first workflow stage from the sidebar to start building your SOP.
                            </p>
                        </div>
                    </div>
                )}
            </main>

        </div>
    );
};
