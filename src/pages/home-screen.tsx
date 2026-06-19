import { type ReactNode, useState } from "react";
import type { Key } from "react-aria-components";
import { ArrowRight, Check, Copy01, InfoCircle, MessageChatCircle } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { Tabs } from "@/components/application/tabs/tabs";
import { useClipboard } from "@/hooks/use-clipboard";
import { cx } from "@/utils/cx";
import { PIXEL_CODE, platforms } from "@/data/platforms";

/** Where the "Contact" button sends the client's email. */
const SUPPORT_EMAIL = "anhtuan@hiddengem.media";

/** Pre-filled email so the client only has to fill in a couple of blanks before sending. */
const CONTACT_SUBJECT = "Meta Pixel Setup — I'd like some help";
const CONTACT_BODY = `Hi HiddenGem Team,

I'm following the Meta Pixel Setup Guide and could use a hand.

• My website platform:
• What I'm trying to do / where I'm stuck:
• Anything else you should know:

Thanks!`;

const CONTACT_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(CONTACT_SUBJECT)}&body=${encodeURIComponent(CONTACT_BODY)}`;

/** Numbered section marker — small brand square + label, with a trailing hairline. */
const SectionEyebrow = ({ number }: { number: string }) => (
    <div className="flex items-center gap-3">
        <span className="flex size-7 items-center justify-center rounded-md bg-brand-solid text-xs font-semibold text-white tabular-nums">
            {number}
        </span>
        <span className="h-px flex-1 bg-border-secondary" />
    </div>
);

const SectionHeading = ({ children }: { children: ReactNode }) => (
    <h2 className="mt-4 text-display-xs font-semibold text-primary md:text-display-sm">{children}</h2>
);

/** Lightweight token tinting for the Meta Pixel snippet preview. */
const HighlightedCode = ({ code }: { code: string }) => (
    <code className="block font-mono text-xs leading-relaxed whitespace-pre-wrap text-gray-300 md:text-sm">
        {code.split("\n").map((line, i) => {
            const isComment = line.trim().startsWith("<!--");
            return (
                <span key={i} className={cx("block", isComment && "text-emerald-400/80")}>
                    {isComment
                        ? line
                        : line.split(/(YOUR_PIXEL_ID|'[^']*'|"[^"]*")/g).map((part, j) => {
                              if (part === "YOUR_PIXEL_ID")
                                  return (
                                      <span key={j} className="rounded bg-amber-400/15 px-1 text-amber-300">
                                          {part}
                                      </span>
                                  );
                              if (/^['"].*['"]$/.test(part))
                                  return (
                                      <span key={j} className="text-sky-300">
                                          {part}
                                      </span>
                                  );
                              return part;
                          })}
                </span>
            );
        })}
    </code>
);

export const HomeScreen = () => {
    const { copied, copy } = useClipboard();
    const [selectedPlatform, setSelectedPlatform] = useState<Key>("wordpress");

    return (
        <main className="min-h-dvh bg-secondary px-4 py-8 md:px-8 md:py-14">
            <article className="mx-auto max-w-4xl overflow-hidden rounded-2xl bg-primary shadow-xl ring-1 ring-secondary md:rounded-3xl">
                <div className="px-6 py-8 md:px-14 md:py-12">
                    {/* Top bar */}
                    <header className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <span className="flex size-7 items-center justify-center rounded-md bg-brand-solid">
                                <span className="size-2.5 rounded-sm bg-white" />
                            </span>
                            <span className="text-md font-bold text-primary">HiddenGem</span>
                        </div>
                        <span className="text-xs font-medium text-quaternary">Agency Deliverable v1.2</span>
                    </header>

                    {/* Title */}
                    <div className="mt-10 md:mt-12">
                        <h1 className="text-display-md font-semibold tracking-tight text-primary md:text-display-lg">Meta Pixel Setup Guide</h1>
                        <p className="mt-3 text-md text-tertiary">A step-by-step implementation manual prepared by the HiddenGem Team.</p>
                    </div>

                    {/* Section 01 — What is Meta Pixel? */}
                    <section className="mt-14">
                        <SectionEyebrow number="01" />
                        <SectionHeading>What is Meta Pixel?</SectionHeading>
                        <p className="mt-4 text-md text-tertiary">
                            The Meta Pixel is a powerful analytical tool that consists of a small piece of code installed in your website's header. It
                            tracks visitor actions, measures the effectiveness of your advertising, and powers high-conversion retargeting campaigns.
                        </p>

                        <div className="mt-5 flex gap-3 rounded-xl bg-brand-50 p-4 ring-1 ring-brand-200 ring-inset">
                            <InfoCircle className="mt-0.5 size-5 shrink-0 text-fg-brand-primary" aria-hidden="true" />
                            <p className="text-sm text-brand-700">
                                <span className="font-semibold">Important Note:</span> Your unique Pixel ID has been generated and configured by the
                                HiddenGem Team. It is already pre-embedded in the code snippet provided in Section 2.
                            </p>
                        </div>
                    </section>

                    {/* Section 02 — Your Meta Pixel Code */}
                    <section className="mt-14">
                        <SectionEyebrow number="02" />
                        <SectionHeading>Your Meta Pixel Code</SectionHeading>
                        <p className="mt-4 text-md text-tertiary">
                            Copy the code below and share it with your web developer, or follow this guide in Section 3 to add it yourself.
                        </p>

                        <div className="mt-5 overflow-hidden rounded-xl bg-gray-950 ring-1 ring-gray-800 ring-inset">
                            <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2.5">
                                <div className="flex items-center gap-1.5">
                                    <span className="size-3 rounded-full bg-[#ff5f57]" />
                                    <span className="size-3 rounded-full bg-[#febc2e]" />
                                    <span className="size-3 rounded-full bg-[#28c840]" />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => copy(PIXEL_CODE, "pixel")}
                                    className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-gray-300 transition duration-100 ease-linear hover:bg-white/10 hover:text-white"
                                >
                                    {copied === "pixel" ? <Check className="size-3.5" /> : <Copy01 className="size-3.5" />}
                                    {copied === "pixel" ? "Copied!" : "Copy Code"}
                                </button>
                            </div>
                            <div className="overflow-x-auto p-4 md:p-5">
                                <HighlightedCode code={PIXEL_CODE} />
                            </div>
                        </div>
                    </section>

                    {/* Section 03 — How to Add the Code (interactive) */}
                    <section className="mt-14">
                        <SectionEyebrow number="03" />
                        <SectionHeading>How to Add the Code to Your Website</SectionHeading>

                        <Tabs selectedKey={selectedPlatform} onSelectionChange={setSelectedPlatform} className="mt-6 gap-0">
                            <p className="text-sm font-semibold text-primary">Step 1: Choose your website platform</p>
                            <Tabs.List type="button-border" size="md" className="mt-3 flex-wrap">
                                {platforms.map((platform) => (
                                    <Tabs.Item key={platform.id} id={platform.id} icon={platform.icon}>
                                        {platform.name}
                                    </Tabs.Item>
                                ))}
                            </Tabs.List>

                            <p className="mt-7 text-sm font-semibold text-primary">Step 2: Follow this instruction</p>

                            {platforms.map((platform) => (
                                <Tabs.Panel key={platform.id} id={platform.id} className="mt-3">
                                    <div className="rounded-xl p-5 ring-1 ring-secondary md:p-6">
                                        <div className="flex items-center gap-2.5">
                                            <FeaturedIcon icon={platform.icon} size="sm" color="brand" theme="light" />
                                            <h3 className="text-md font-semibold text-primary">{platform.name}</h3>
                                        </div>
                                        <ol className="mt-4 flex flex-col gap-2.5">
                                            {platform.steps.map((step, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-md bg-brand-50 text-xs font-semibold text-brand-700 tabular-nums">
                                                        {i + 1}
                                                    </span>
                                                    <span className="text-sm text-tertiary">{step}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                </Tabs.Panel>
                            ))}
                        </Tabs>
                    </section>

                    {/* Still need support? */}
                    <section className="mt-16">
                        <div className="flex items-center gap-3">
                            <FeaturedIcon icon={MessageChatCircle} size="sm" color="brand" theme="dark" />
                            <span className="h-px flex-1 bg-border-secondary" />
                        </div>
                        <h2 className="mt-4 text-display-xs font-semibold text-primary md:text-display-sm">Still need support?</h2>

                        <div className="mt-5 rounded-2xl bg-secondary px-6 py-8 text-center md:px-10 md:py-10">
                            <h3 className="text-lg font-semibold text-primary">Contact us</h3>
                            <p className="mx-auto mt-2 max-w-md text-sm text-tertiary">
                                Our team is here to help. Reach out to HiddenGem if you have any questions about the process.
                            </p>
                            <div className="mt-5 flex justify-center">
                                <Button href={CONTACT_MAILTO} size="lg" color="primary" iconTrailing={ArrowRight}>
                                    Contact HiddenGem Team
                                </Button>
                            </div>
                            <p className="mx-auto mt-5 max-w-md text-xs text-quaternary">
                                We're happy to install the pixel for you if you prefer — just send us your login credentials securely via your client
                                portal.
                            </p>
                        </div>
                    </section>

                    {/* Footer */}
                    <footer className="mt-14 flex flex-col gap-3 border-t border-secondary pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
                        <span className="font-semibold tracking-wider text-quaternary uppercase">HiddenGem Team</span>
                        <span className="text-quaternary">Prepared for [Client Name]</span>
                        <span className="font-semibold tracking-wider text-brand-secondary uppercase">Confidential</span>
                    </footer>
                </div>
            </article>
        </main>
    );
};
