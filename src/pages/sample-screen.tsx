import { ArrowNarrowLeft, ArrowRight, CheckCircle } from "@untitledui/icons";
import { motion } from "motion/react";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";

// A plain sample page — a real URL to point at when someone needs to see the
// component system rendering on the live site rather than in a screenshot.
// Deliberately public: no sign-in gate and no Supabase row, so there is nothing
// to set up before it works. It sits at the top level of `pages/` because it
// belongs to no group — it is neither client-facing material, a team tool, an
// overview, nor a template.
export function SampleScreen() {
    return (
        <section className="flex min-h-screen items-start bg-primary py-16 md:items-center md:py-24">
            <div className="mx-auto max-w-container grow px-4 md:px-8">
                <motion.div
                    className="flex w-full max-w-3xl flex-col gap-8 md:gap-12"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                    <div className="flex flex-col gap-4 md:gap-6">
                        <div className="flex flex-col items-start gap-3">
                            <Badge color="brand" size="md">
                                Sample
                            </Badge>
                            <h1 className="text-display-md font-semibold text-primary md:text-display-lg">Sample page</h1>
                        </div>
                        <p className="text-lg text-tertiary md:text-xl">
                            A live page on the real site, built from the same components and semantic colour tokens as everything else. Switch
                            light and dark with the floating control — every surface here follows the theme.
                        </p>
                    </div>

                    <ul className="flex flex-col gap-3">
                        {[
                            "Semantic colour tokens only, so light and dark both work",
                            "Untitled UI components on the React Aria foundation",
                            "A named route, registered ahead of the client-slug catch-all",
                        ].map((line) => (
                            <li key={line} className="flex items-start gap-3">
                                <CheckCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-fg-success-secondary" />
                                <span className="text-md text-secondary">{line}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="flex flex-col-reverse gap-3 sm:flex-row">
                        <Button href="/" color="secondary" size="xl" iconLeading={ArrowNarrowLeft}>
                            Back to start
                        </Button>
                        <Button href="/designsystem" size="xl" iconTrailing={ArrowRight}>
                            See the design system
                        </Button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
