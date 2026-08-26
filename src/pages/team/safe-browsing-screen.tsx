import { AlertTriangle, BookOpen01, CheckCircle, LayoutAlt01, LinkExternal01 } from "@untitledui/icons";

import { AppShell, CollapsedTopBar, IconRail, useNavCollapsed } from "@/components/application/icon-rail";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { DocRail, DocSection } from "@/pages/client/dashboard/master-brand-fields";

/**
 * Incident record: Google Safe Browsing flagged hgmportal.com on 2026-08-25.
 *
 * A static page on purpose — it's a record and a runbook, not living content. Update it
 * by editing this file (the status list at the bottom) when the review clears.
 */

/** The rail's list — same numbered table of contents the dashboard documents use. */
const SECTIONS = [
    { id: "seen", label: "What visitors see" },
    { id: "verified", label: "What we verified" },
    { id: "cause", label: "Likely cause" },
    { id: "fix", label: "The fix — step by step" },
    { id: "meanwhile", label: "Meanwhile" },
    { id: "status", label: "Status" },
];
const num = (id: string) => SECTIONS.findIndex((s) => s.id === id) + 1;
/** The rail's check marks are a progress signal on documents; this rail is purely a
 *  table of contents, so no section ever shows one. */
const NO_PROGRESS = {} as Record<string, boolean>;

/** A labelled RE-CREATION of Chrome's interstitial — not a screenshot. Fixed colors on
 *  purpose: it depicts Chrome's warning, which doesn't follow our theme. */
const WarningFigure = () => (
    <figure className="overflow-hidden rounded-2xl ring-1 ring-secondary">
        <div className="p-6 sm:p-10" style={{ background: "#B3261E" }}>
            <div className="mx-auto max-w-md" style={{ color: "#FFFFFF" }}>
                <div
                    className="flex size-12 items-center justify-center text-xl font-bold"
                    style={{ background: "#FFFFFF", color: "#B3261E", clipPath: "polygon(30% 0,70% 0,100% 30%,100% 70%,70% 100%,30% 100%,0 70%,0 30%)" }}
                >
                    ✕
                </div>
                <p className="mt-5 text-display-xs font-semibold">Dangerous site</p>
                <p className="mt-3 text-sm" style={{ color: "#FFD9D6" }}>
                    Attackers on the site you tried visiting might trick you into installing software or revealing things like your
                    passwords, phone, or credit card numbers. Chrome strongly recommends going back to safety.
                </p>
                <p className="mt-4 inline-block rounded-full px-3 py-1 font-mono text-xs" style={{ background: "#8C1D18" }}>
                    ⊗ Dangerous · https://hgmportal.com/log
                </p>
            </div>
        </div>
        <figcaption className="bg-primary px-4 py-2.5 text-xs text-quaternary">
            Re-creation of what visitors saw in Chrome on 25 Aug 2026 (the original screenshot lives in the team chat).
        </figcaption>
    </figure>
);

const FIX_STEPS: { title: string; body: string }[] = [
    {
        title: "Add hgmportal.com to Google Search Console",
        body: "Go to search.google.com/search-console (Google's free tool for site owners), sign in with the agency Google account, and add hgmportal.com as a Domain property.",
    },
    {
        title: "Verify ownership with a TXT record at GoDaddy",
        body: "Search Console shows a TXT record (a small text label on the domain's DNS). Our DNS is at GoDaddy: hgmportal.com → DNS → Add record → type TXT → paste Google's value. Verification usually completes within minutes.",
    },
    {
        title: "Read the Security Issues report",
        body: "In Search Console open Security & Manual Actions → Security Issues. It names the exact flagged URLs and the category (e.g. \"Deceptive pages\"). Paste that report into Claude to check whether anything on our side genuinely needs changing.",
    },
    {
        title: "Request a review",
        body: "Click Request Review and write one honest paragraph: this is Hidden Gem Media's client portal; the pages collect onboarding information from our own contracted clients; nothing impersonates another company. Reviews for this category typically clear in 1–3 days.",
    },
];

export const SafeBrowsingScreen = () => {
    const { collapsed: navCollapsed, toggle: toggleNav } = useNavCollapsed();

    return (
        <AppShell
            className="flex flex-col"
            rail={!navCollapsed && <IconRail activeDept="docs" />}
            breadcrumb={[
                { label: "Dashboard", to: "/dashboard", icon: LayoutAlt01 },
                { label: "Manual", to: "/manual", icon: BookOpen01 },
                { label: "Safe Browsing" },
            ]}
        >
            {navCollapsed && <CollapsedTopBar title="Safe Browsing incident" onExpand={toggleNav} />}

            <div className="min-h-0 flex-1 overflow-y-auto bg-secondary p-2">
                <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
                    <header>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-display-xs font-semibold text-primary">Safe Browsing incident</h1>
                            <BadgeWithDot color="error" size="md" type="pill-color">
                                Open — review not yet requested
                            </BadgeWithDot>
                        </div>
                        <p className="mt-2 max-w-2xl text-sm text-tertiary text-pretty">
                            25 Aug 2026 — Google Safe Browsing flagged <span className="font-semibold">hgmportal.com</span> as a
                            "deceptive site", so Chrome shows a full-page red warning to every visitor, clients included. This page
                            records what we verified and the exact steps to clear it.
                        </p>
                    </header>

                    {/* Rail beside the record on wide screens, above it on narrow ones —
                        the same table-of-contents treatment as the dashboard documents. */}
                    <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
                        <DocRail sections={SECTIONS} progress={NO_PROGRESS} />

                        <div className="flex min-w-0 flex-1 flex-col gap-8 rounded-2xl bg-primary p-6 ring-1 ring-secondary sm:p-8">
                        <DocSection id="seen" label="What visitors see" number={num("seen")}>
                            <WarningFigure />
                        </DocSection>

                        <DocSection id="verified" label="What we verified" number={num("verified")} action={<span className="text-xs text-quaternary">25 Aug 2026</span>}>
                            <ul className="flex flex-col gap-2 text-md text-tertiary">
                                {[
                                    "The site is NOT hacked — it's up, serving normally (HTTP 200), and the code is unchanged.",
                                    "docs-hgm.netlify.app — the exact same content on Netlify's own domain — checks out CLEAN in Google's database. The flag is on the hgmportal.com domain, not on our content.",
                                    "Google's Safe Browsing database confirms the flag is domain-wide, not just the /log URL in the screenshot.",
                                ].map((t) => (
                                    <li key={t} className="flex items-start gap-2">
                                        <CheckCircle className="mt-0.5 size-5 shrink-0 text-fg-success-secondary" aria-hidden="true" />
                                        <span>{t}</span>
                                    </li>
                                ))}
                            </ul>
                        </DocSection>

                        <DocSection id="cause" label="Likely cause" number={num("cause")}>
                            <p className="flex items-start gap-2 text-md text-tertiary">
                                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-fg-warning-secondary" aria-hidden="true" />
                                <span>
                                    Unconfirmed until Search Console shows the report, but the portal combines patterns phishing
                                    detectors are trained on: pages asking clients to enter passwords for other services (the owner
                                    guide collects PMS / Cloudflare / domain credentials), Meta-branded pixel setup pages, and
                                    sign-in gates. The same content being clean on the Netlify domain points to a false positive on
                                    the domain, not malicious content.
                                </span>
                            </p>
                        </DocSection>

                        <DocSection id="fix" label="The fix — step by step" number={num("fix")}>
                            <ol className="flex flex-col gap-4">
                                {FIX_STEPS.map((s, i) => (
                                    <li key={s.title} className="flex items-start gap-3">
                                        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-primary_alt text-xs font-semibold text-brand-secondary">
                                            {i + 1}
                                        </span>
                                        <div>
                                            <p className="text-md font-semibold text-primary">{s.title}</p>
                                            <p className="mt-0.5 text-md text-tertiary">{s.body}</p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                            <div className="mt-5 flex flex-wrap gap-3">
                                <Button
                                    href="https://search.google.com/search-console"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    color="primary"
                                    size="sm"
                                    iconTrailing={LinkExternal01}
                                >
                                    Open Search Console
                                </Button>
                                <Button
                                    href="https://dcc.godaddy.com/manage/hgmportal.com/dns"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    color="secondary"
                                    size="sm"
                                    iconTrailing={LinkExternal01}
                                >
                                    GoDaddy DNS
                                </Button>
                            </div>
                        </DocSection>

                        <DocSection id="meanwhile" label="Meanwhile" number={num("meanwhile")}>
                            <p className="text-md text-tertiary">
                                The identical portal is unflagged at{" "}
                                <a
                                    href="https://docs-hgm.netlify.app"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-semibold text-brand-secondary hover:underline"
                                >
                                    docs-hgm.netlify.app
                                </a>{" "}
                                — use that address if anything is urgent for a client. Visitors can also click Details → "visit this
                                unsafe site" on the warning, but don't ask clients to do that.
                            </p>
                        </DocSection>

                        <DocSection id="status" label="Status" number={num("status")}>
                            <ul className="flex flex-col gap-1.5 text-md text-tertiary">
                                <li>✅ 25 Aug 2026 — flag noticed, scope verified (domain-level; Netlify copy clean)</li>
                                <li>⬜ Verify hgmportal.com in Search Console (TXT record at GoDaddy)</li>
                                <li>⬜ Read the Security Issues report; fix anything it names</li>
                                <li>⬜ Request review</li>
                                <li>⬜ Confirm the warning is gone and mark this incident closed</li>
                            </ul>
                        </DocSection>
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
};
