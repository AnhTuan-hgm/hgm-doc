import { type FC, type ReactNode, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bell01, Check, LogOut01, Monitor01, Moon01, Settings01, Sun, User01, Users01 } from "@untitledui/icons";

type IconComponent = FC<{ className?: string }>;
import { useNavigate } from "react-router";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { Toggle } from "@/components/base/toggle/toggle";
import { useAuthUser } from "@/hooks/use-auth-user";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/providers/theme-provider";
import { cx } from "@/utils/cx";

type Section = "general" | "profile" | "team" | "notifications";

const NAV: { id: Section; label: string; icon: IconComponent }[] = [
    { id: "general", label: "General", icon: Settings01 },
    { id: "profile", label: "Profile", icon: User01 },
    { id: "team", label: "Team", icon: Users01 },
    { id: "notifications", label: "Notifications", icon: Bell01 },
];

const NOTIFICATIONS_KEY = "hgm_notification_prefs";

interface NotificationPrefs {
    productUpdates: boolean;
    weeklyDigest: boolean;
    mentions: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = { productUpdates: true, weeklyDigest: true, mentions: false };

const loadPrefs = (): NotificationPrefs => {
    try {
        const raw = localStorage.getItem(NOTIFICATIONS_KEY);
        return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
    } catch {
        return DEFAULT_PREFS;
    }
};

/* ── Reusable bits ─────────────────────────────────────────────────── */

const SectionHeader = ({ title, description }: { title: string; description: string }) => (
    <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-primary">{title}</h2>
        <p className="text-sm text-tertiary">{description}</p>
    </div>
);

const Card = ({ children }: { children: ReactNode }) => (
    <div className="divide-y divide-secondary overflow-hidden rounded-xl border border-secondary bg-primary">{children}</div>
);

const Row = ({ children }: { children: ReactNode }) => (
    <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5">{children}</div>
);

/* ── Theme (appearance) control ────────────────────────────────────── */

const THEME_OPTIONS: { value: "light" | "dark" | "system"; label: string; icon: IconComponent }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon01 },
    { value: "system", label: "System", icon: Monitor01 },
];

const AppearanceCard = () => {
    const { theme, setTheme } = useTheme();
    return (
        <Card>
            <Row>
                <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-medium text-primary">Default mode</p>
                    <p className="text-sm text-tertiary">Choose the theme this site opens in.</p>
                </div>
                <div className="grid grid-cols-3 gap-1 rounded-lg bg-secondary p-1">
                    {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
                        const active = theme === value;
                        return (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setTheme(value)}
                                aria-pressed={active}
                                className={cx(
                                    "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition duration-100 ease-linear",
                                    active ? "bg-primary text-primary shadow-sm" : "text-tertiary hover:text-secondary",
                                )}
                            >
                                <Icon className="size-4" aria-hidden="true" />
                                {label}
                            </button>
                        );
                    })}
                </div>
            </Row>
        </Card>
    );
};

/* ── Panel (shared by the /settings page and the dashboard popup) ──── */

export const SettingsPanel = ({ onCancel, sticky = false }: { onCancel: () => void; sticky?: boolean }) => {
    const { user } = useAuthUser();
    const [active, setActive] = useState<Section>("general");

    const [name, setName] = useState(user?.name ?? "");
    const [prefs, setPrefs] = useState<NotificationPrefs>(loadPrefs);
    const [saved, setSaved] = useState(false);

    // Keep the editable name in sync once the async user lookup resolves.
    const [nameTouched, setNameTouched] = useState(false);
    if (!nameTouched && user && name === "") setName(user.name);

    const initials = (user?.name ?? "")
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        // Clear the dashboard view-gate bypass too, so the login screen reappears.
        try { sessionStorage.removeItem("hgm_dashboard_unlocked"); } catch { /* ignore */ }
        window.location.assign("/dashboard");
    };

    const handleSave = () => {
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(prefs));
        // Name/email come from the Google identity and aren't editable server-side here,
        // so the draft name is only kept locally for this view.
        setSaved(true);
        // Show the "Saved" confirmation briefly, then close (popup) / return (page).
        setTimeout(onCancel, 1500);
    };

    const profileCard = (
        <Card>
            <Row>
                <p className="text-sm font-medium text-primary">Photo</p>
                <Avatar size="lg" src={user?.avatarUrl} alt={user?.name} initials={initials} />
            </Row>
            <div className="flex items-center gap-4 px-4 py-4 sm:px-5">
                <label htmlFor="settings-name" className="w-28 shrink-0 text-sm font-medium text-primary">
                    Name
                </label>
                <input
                    id="settings-name"
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        setNameTouched(true);
                    }}
                    className="min-w-0 flex-1 rounded-lg border border-primary bg-primary px-3.5 py-2.5 text-sm text-primary shadow-sm outline-focus-ring transition duration-100 ease-linear focus:outline-2 focus:outline-offset-2"
                />
            </div>
            <div className="flex items-center gap-4 px-4 py-4 sm:px-5">
                <label htmlFor="settings-email" className="w-28 shrink-0 text-sm font-medium text-primary">
                    Email
                </label>
                <input
                    id="settings-email"
                    value={user?.email ?? ""}
                    readOnly
                    title="Email comes from your Google account"
                    className="min-w-0 flex-1 cursor-not-allowed rounded-lg border border-primary bg-secondary px-3.5 py-2.5 text-sm text-tertiary shadow-sm"
                />
            </div>
        </Card>
    );

    const notificationsCard = (
        <Card>
            {(
                [
                    { key: "productUpdates", label: "Product updates", hint: "News and feature announcements." },
                    { key: "weeklyDigest", label: "Weekly digest", hint: "A summary of activity every Monday." },
                    { key: "mentions", label: "Mentions", hint: "When a teammate @mentions you." },
                ] as const
            ).map(({ key, label, hint }) => (
                <Row key={key}>
                    <div className="flex flex-col gap-0.5">
                        <p className="text-sm font-medium text-primary">{label}</p>
                        <p className="text-sm text-tertiary">{hint}</p>
                    </div>
                    <Toggle isSelected={prefs[key]} onChange={(v) => setPrefs((p) => ({ ...p, [key]: v }))} />
                </Row>
            ))}
        </Card>
    );

    const teamCard = (
        <Card>
            <Row>
                <div className="flex items-center gap-3">
                    <Avatar size="md" src={user?.avatarUrl} alt={user?.name} initials={initials} />
                    <div className="flex flex-col">
                        <p className="text-sm font-medium text-primary">{user?.name ?? "—"}</p>
                        <p className="text-sm text-tertiary">{user?.email ?? ""}</p>
                    </div>
                </div>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary">You · Owner</span>
            </Row>
        </Card>
    );

    return (
        <div className="flex flex-col gap-8 md:flex-row md:gap-12">
                {/* Sidebar */}
                <nav className={cx("flex shrink-0 flex-row gap-1 overflow-x-auto md:w-56 md:flex-col", sticky && "bg-primary pt-6 sm:pt-8 md:sticky md:top-0 md:self-start")}>
                    {NAV.map(({ id, label, icon: Icon }) => {
                        const isActive = active === id;
                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setActive(id)}
                                className={cx(
                                    "flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition duration-100 ease-linear",
                                    isActive ? "bg-primary text-brand-secondary shadow-sm" : "text-secondary hover:bg-primary_hover hover:text-primary",
                                )}
                            >
                                <Icon className={cx("size-5", isActive ? "text-brand-secondary" : "text-fg-quaternary")} aria-hidden="true" />
                                {label}
                                {id === "team" && (
                                    <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-tertiary">1</span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Content */}
                <div className="flex min-w-0 flex-1 flex-col gap-8">
                    <div className={cx("flex flex-col gap-4 border-b border-secondary pb-5 sm:flex-row sm:items-start sm:justify-between", sticky && "sticky top-0 z-20 bg-primary pt-6 sm:pt-8")}>
                        <div className="flex flex-col gap-1">
                            <h1 className="text-2xl font-semibold text-primary">Settings</h1>
                            <p className="text-sm text-tertiary">Manage your workspace, profile, and notifications.</p>
                        </div>
                        <div className="flex gap-3">
                            {user && (
                                <Button color="secondary-destructive" size="md" iconLeading={LogOut01} onClick={handleLogout}>
                                    Log out
                                </Button>
                            )}
                            <Button color="secondary" size="md" onClick={onCancel}>
                                Cancel
                            </Button>
                            <Button color="primary" size="md" iconLeading={Check} onClick={handleSave} isDisabled={saved}>
                                {saved ? "Saved!" : "Save changes"}
                            </Button>
                        </div>
                    </div>

                    {active === "general" && (
                        <>
                            <div className="flex flex-col gap-4">
                                <SectionHeader title="Profile" description="This information is shown on your public profile." />
                                {profileCard}
                            </div>
                            <div className="flex flex-col gap-4">
                                <SectionHeader title="Appearance" description="Set the default light or dark mode." />
                                <AppearanceCard />
                            </div>
                            <div className="flex flex-col gap-4">
                                <SectionHeader title="Notifications" description="Choose what you're emailed about." />
                                {notificationsCard}
                            </div>
                        </>
                    )}

                    {active === "profile" && (
                        <div className="flex flex-col gap-4">
                            <SectionHeader title="Profile" description="This information is shown on your public profile." />
                            {profileCard}
                            <div className="flex flex-col gap-4 pt-2">
                                <SectionHeader title="Appearance" description="Set the default light or dark mode." />
                                <AppearanceCard />
                            </div>
                        </div>
                    )}

                    {active === "team" && (
                        <div className="flex flex-col gap-4">
                            <SectionHeader title="Team" description="People with access to this workspace." />
                            {teamCard}
                        </div>
                    )}

                    {active === "notifications" && (
                        <div className="flex flex-col gap-4">
                            <SectionHeader title="Notifications" description="Choose what you're emailed about." />
                            {notificationsCard}
                        </div>
                    )}
                </div>
        </div>
    );
};

/* ── Page ──────────────────────────────────────────────────────────── */

export const SettingsScreen = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-dvh bg-secondary_subtle">
            <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 md:py-14">
                <SettingsPanel onCancel={() => navigate(-1)} />
            </div>
        </div>
    );
};

/* ── Popup (used from the dashboard avatar) ────────────────────────── */

export const SettingsDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-[5vh]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.16 }}
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) onClose();
                    }}
                >
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        className="relative flex w-full max-w-[888px] min-h-[700px] max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-primary shadow-2xl ring-1 ring-secondary"
                        initial={{ opacity: 0, scale: 0.97, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 8 }}
                        transition={{ type: "spring", stiffness: 320, damping: 28 }}
                    >
                        {/* Scroll container — header + sidebar stick to its top. Top
                            padding lives on the sticky header/sidebar (not here) so their
                            solid background covers content scrolling beneath them. */}
                        <div className="flex-1 overflow-y-auto px-6 pb-6 sm:px-8 sm:pb-8">
                            <SettingsPanel onCancel={onClose} sticky />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
