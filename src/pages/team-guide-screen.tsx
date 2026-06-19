import { useState } from "react";
import { AlertCircle, Lock01, LockUnlocked01, Plus, XClose } from "@untitledui/icons";
import { cx } from "@/utils/cx";

const PASSWORD = "ANHTUAN";

/* ─── Password gate ──────────────────────────────────────────────── */

const PasswordGate = ({ onUnlock }: { onUnlock: () => void }) => {
    const [value, setValue] = useState("");
    const [error, setError] = useState(false);
    const [success, setSuccess] = useState(false);

    const attempt = () => {
        if (value === PASSWORD) {
            setSuccess(true);
            setTimeout(onUnlock, 600);
        } else {
            setError(true);
            setValue("");
        }
    };

    return (
        <main className="flex min-h-dvh flex-col items-center justify-center bg-secondary px-4">
            <div
                className={cx(
                    "w-full max-w-sm rounded-2xl bg-primary p-8 shadow-xl ring-1 ring-secondary transition-all duration-500",
                    success && "scale-95 opacity-0",
                )}
            >
                {/* Logo */}
                <img
                    src="/hgm logo/Logo WIth Word Mark(Style 1).svg"
                    alt="HiddenGem Media"
                    className="h-8"
                    draggable={false}
                />

                <div className="mt-6">
                    <h1 className="text-lg font-semibold text-primary">Team Access</h1>
                    <p className="mt-1 text-sm text-tertiary">Enter the team password to view this guide.</p>
                </div>

                <div className="mt-5">
                    <input
                        type="password"
                        placeholder="Password"
                        value={value}
                        autoFocus
                        onChange={(e) => {
                            setValue(e.target.value);
                            setError(false);
                        }}
                        onKeyDown={(e) => e.key === "Enter" && attempt()}
                        className={cx(
                            "w-full rounded-lg border px-3 py-2.5 text-sm text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear",
                            error
                                ? "border-error-primary ring-1 ring-error-primary"
                                : "border-secondary focus:border-brand focus:ring-1 focus:ring-brand",
                        )}
                    />
                    {error && (
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-error-primary">
                            <XClose className="size-3.5" />
                            Incorrect password. Please try again.
                        </p>
                    )}
                </div>

                <button
                    type="button"
                    onClick={attempt}
                    className="mt-4 w-full rounded-lg bg-brand-solid px-4 py-2.5 text-sm font-semibold text-white transition duration-100 ease-linear hover:opacity-90"
                >
                    {success ? "Unlocking…" : "Unlock"}
                </button>
            </div>
        </main>
    );
};

/* ─── Step card ──────────────────────────────────────────────────── */

const Step = ({
    number,
    title,
    children,
}: {
    number: number;
    title: string;
    children: React.ReactNode;
}) => (
    <li className="flex gap-4">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-solid text-xs font-bold text-white tabular-nums">
            {number}
        </span>
        <div className="flex-1 pb-6">
            <p className="text-sm font-semibold text-primary">{title}</p>
            <div className="mt-1.5 text-sm text-tertiary">{children}</div>
        </div>
    </li>
);

/* ─── Callout ────────────────────────────────────────────────────── */

const Tip = ({ children }: { children: React.ReactNode }) => (
    <div className="flex gap-3 rounded-xl bg-brand-50 p-4 ring-1 ring-brand-200 ring-inset">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-fg-brand-primary" aria-hidden="true" />
        <p className="text-sm text-brand-700">{children}</p>
    </div>
);

/* ─── Main guide content ─────────────────────────────────────────── */

const GuideContent = () => (
    <main className="min-h-dvh bg-secondary px-4 py-10 md:px-8 md:py-14">
        <article className="mx-auto max-w-2xl overflow-hidden rounded-2xl bg-primary shadow-xl ring-1 ring-secondary md:rounded-3xl">
            <div className="px-6 py-8 md:px-12 md:py-12">

                {/* Header */}
                <header className="flex items-center justify-between">
                    <img
                        src="/hgm logo/Logo WIth Word Mark(Style 1).svg"
                        alt="HiddenGem Media"
                        className="h-8 opacity-80"
                        draggable={false}
                    />
                    <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 ring-inset">
                        Internal Use Only
                    </span>
                </header>

                {/* Title */}
                <div className="mt-10">
                    <p className="text-sm font-semibold uppercase tracking-widest text-brand-secondary">HGM Docs — Team Guide</p>
                    <h1 className="mt-2 text-display-sm font-semibold tracking-tight text-primary md:text-display-md">
                        How to Create a Client Document
                    </h1>
                    <p className="mt-3 text-md text-tertiary">
                        Follow these 5 steps to set up and share a Meta Pixel guide with a client.
                    </p>
                </div>

                <div className="mt-10 h-px bg-border-secondary" />

                {/* 5 Steps */}
                <ol className="mt-10 flex flex-col gap-0">
                    <Step number={1} title="Click the + icon in the footer">
                        On any HGM Docs page, scroll to the bottom-right and click the{" "}
                        <span className="inline-flex items-center gap-1 font-medium text-primary">
                            <Plus className="size-3.5" />
                            plus
                        </span>{" "}
                        icon. Enter the admin password when prompted.
                    </Step>

                    <Step number={2} title="Enter the client's name and website URL">
                        Fill in the <strong>Client Name</strong> (e.g. <em>Evergreen Coffee</em>) and
                        their <strong>Website URL</strong> (e.g. <em>evergreencoffee.com</em>). A
                        preview of the page URL will appear. Click <strong>Next</strong>.
                    </Step>

                    <Step number={3} title="Paste the Meta Pixel code">
                        Paste the client's Meta Pixel code from Meta Events Manager into the empty box.
                        Click <strong>Create Page</strong> — you'll be taken to the new page
                        automatically.
                    </Step>

                    <Step number={4} title="Lock the page">
                        Click the{" "}
                        <span className="inline-flex items-center gap-1 font-medium text-primary">
                            <LockUnlocked01 className="size-3.5" />
                            unlock
                        </span>{" "}
                        icon in the footer to lock the content so clients can't edit it. To make changes
                        later, click the{" "}
                        <span className="inline-flex items-center gap-1 font-medium text-primary">
                            <Lock01 className="size-3.5" />
                            lock
                        </span>{" "}
                        icon and enter the password.
                    </Step>

                    <Step number={5} title="Share the URL with the client">
                        Copy the page URL from the address bar and send it to the client. It will always
                        follow the format:{" "}
                        <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">
                            hgm-docs.netlify.app/client-name
                        </code>
                    </Step>
                </ol>

                {/* Note */}
                <div className="mt-8">
                    <Tip>
                        Pages are stored in the cloud — you can create a page in Canada and your
                        client in the US will see it immediately at their URL.
                    </Tip>
                </div>

                {/* Footer */}
                <footer className="mt-12 flex items-center justify-between border-t border-secondary pt-6">
                    <img
                        src="/hgm logo/Logo WIth Word Mark(Style 1).svg"
                        alt="HiddenGem Media"
                        className="h-8 opacity-50"
                        draggable={false}
                    />
                    <span className="text-xs font-semibold uppercase tracking-wider text-quaternary">
                        Internal Use Only
                    </span>
                </footer>
            </div>
        </article>
    </main>
);

/* ─── Page export ────────────────────────────────────────────────── */

export const TeamGuideScreen = () => {
    const [unlocked, setUnlocked] = useState(
        () => sessionStorage.getItem("hgm_team_unlocked") === "1",
    );

    const handleUnlock = () => {
        sessionStorage.setItem("hgm_team_unlocked", "1");
        setUnlocked(true);
    };

    return unlocked ? <GuideContent /> : <PasswordGate onUnlock={handleUnlock} />;
};
