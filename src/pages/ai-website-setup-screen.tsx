import { useEffect, useRef, useState } from "react";
import { cx } from "@/utils/cx";

/* ── Types ───────────────────────────────────────────────────────── */

type Step = { id: string; heading: string; tool: string; command: string; image: string };
type Stage = { id: string; name: string; steps: Step[] };
type SOPState = { stages: Stage[]; selectedId: string | null; locked: boolean };

const STORAGE_KEY = "hgm_sop_v2";

/* ── Helpers ─────────────────────────────────────────────────────── */

const uid = () => "id" + Math.random().toString(36).slice(2, 9);

function mkStep(heading = "New step"): Step {
    return { id: uid(), heading, tool: "", command: "", image: "" };
}

function seed(): SOPState {
    const S = (heading: string, tool: string, command: string): Step => ({ id: uid(), heading, tool, command, image: "" });
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
            if (Array.isArray(d.stages) && d.stages.length) return d;
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

/* ── Step card ───────────────────────────────────────────────────── */

const StepCard = ({
    step, index, editing, onUpdate, onDelete, onMove, onInsert,
}: {
    step: Step;
    index: number;
    editing: boolean;
    onUpdate: (id: string, field: keyof Step, val: string) => void;
    onDelete: (id: string) => void;
    onMove: (id: string, dir: -1 | 1) => void;
    onInsert: (id: string, pos: "before" | "after") => void;
}) => {
    const fileRef = useRef<HTMLInputElement>(null);

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

                {/* tool */}
                <div className="mt-3.5 flex flex-col gap-1.5 px-5 pl-[69px]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-quaternary">Tool</p>
                    {editing ? (
                        <input
                            type="text"
                            value={step.tool}
                            onChange={(e) => onUpdate(step.id, "tool", e.target.value)}
                            placeholder="e.g. Figma"
                            className="w-auto self-start rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1 text-[13px] font-semibold text-brand-800 outline-none focus:border-brand focus:ring-1 focus:ring-brand dark:border-brand-700/50 dark:bg-brand-950/30 dark:text-brand-300"
                        />
                    ) : step.tool ? (
                        <span className="self-start rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1 text-[13px] font-semibold text-brand-800 dark:border-brand-700/50 dark:bg-brand-950/30 dark:text-brand-300">{step.tool}</span>
                    ) : (
                        <span className="text-sm text-placeholder">—</span>
                    )}
                </div>

                {/* command */}
                <div className="mt-3.5 flex flex-col gap-1.5 px-5 pb-5 pl-[69px]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-quaternary">Command / Instruction</p>
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

                {/* image */}
                {step.image ? (
                    <div className="relative mx-5 mb-5 ml-[69px]">
                        <img src={step.image} alt="reference" className="block w-full rounded-xl border border-secondary" />
                        {editing && (
                            <button type="button" onClick={() => onUpdate(step.id, "image", "")} title="Remove image"
                                className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-[7px] bg-black/70 text-white backdrop-blur hover:bg-black/90">
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
}) => (
    <aside className="flex h-dvh w-[300px] shrink-0 flex-col border-r border-secondary bg-primary">
        {/* header */}
        <div className="flex items-center gap-3.5 border-b border-secondary px-5 py-[22px]">
            <DiamondLogo />
            <div className="flex flex-col gap-0.5 leading-none">
                <span className="text-[22px] font-semibold tracking-[-0.01em] text-primary" style={{ fontFamily: "var(--font-display, inherit)" }}>
                    Hidden<span className="text-brand-600">Gem</span>
                </span>
                <span className="text-[9.5px] font-semibold uppercase tracking-[0.22em] text-quaternary">
                    MEDIA · SOP LIBRARY
                </span>
            </div>
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

/* ── Main screen ─────────────────────────────────────────────────── */

export const AiWebsiteSetupScreen = () => {
    const [state, setState] = useState<SOPState>(() => load());
    const [lightbox, setLightbox] = useState("");

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
        if (st) (st as Record<string, string>)[field] = val;
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
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-100">
                            <DiamondLogo />
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

            {/* lightbox */}
            {lightbox && (
                <div onClick={() => setLightbox("")}
                    className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/80 p-12 backdrop-blur-sm">
                    <img src={lightbox} alt="full reference" className="max-h-[90vh] max-w-[92vw] rounded-xl shadow-2xl" />
                    <button type="button" onClick={() => setLightbox("")} title="Close"
                        className="absolute right-6 top-6 flex size-10 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                </div>
            )}
        </div>
    );
};
