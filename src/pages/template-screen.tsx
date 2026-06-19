import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight } from "@untitledui/icons";
import { supabase } from "@/lib/supabase";
import { cx } from "@/utils/cx";

function slugify(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

export const TemplateScreen = () => {
    const navigate = useNavigate();

    const [clientName, setClientName] = useState("");
    const [clientWebsite, setClientWebsite] = useState("");
    const [pixelCode, setPixelCode] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const slug = slugify(clientName);
    const previewUrl = slug ? `hgm-docs.netlify.app/${slug}` : null;

    const handleGenerate = async () => {
        if (!slug) return;
        setIsSubmitting(true);
        setError("");

        const { error: sbError } = await supabase.from("client_pages").upsert({
            slug,
            client_name: clientName.trim(),
            client_website: clientWebsite.trim(),
            pixel_code: pixelCode,
        });

        setIsSubmitting(false);

        if (sbError) {
            setError("Could not save — check your connection and try again.");
            return;
        }

        navigate(`/${slug}`);
    };

    const inputClass = (extra?: string) =>
        cx(
            "w-full rounded-lg border border-secondary px-3.5 py-2.5 text-sm text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear",
            "focus:border-brand focus:ring-1 focus:ring-brand",
            extra,
        );

    return (
        <main className="flex min-h-dvh flex-col items-center justify-center bg-secondary px-4 py-12">
            <div className="w-full max-w-lg">

                {/* Logo */}
                <img
                    src="/hgm logo/Logo WIth Word Mark(Style 1).svg"
                    alt="HiddenGem Media"
                    className="h-8 opacity-80"
                    draggable={false}
                />

                {/* Heading */}
                <div className="mt-8">
                    <h1 className="text-display-sm font-semibold tracking-tight text-primary">
                        Create Client Page
                    </h1>
                    <p className="mt-2 text-sm text-tertiary">
                        Fill in the details below to generate a personalised Meta Pixel instruction page.
                    </p>
                </div>

                {/* Form card */}
                <div className="mt-8 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-secondary md:p-8">
                    <div className="flex flex-col gap-5">

                        {/* Client Name */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-secondary">
                                Client Name <span className="text-error-primary">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Evergreen Coffee"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                className={inputClass()}
                                autoFocus
                            />
                            {previewUrl && (
                                <p className="mt-1.5 text-xs text-tertiary">
                                    Page URL:{" "}
                                    <span className="font-medium text-brand-secondary">{previewUrl}</span>
                                </p>
                            )}
                        </div>

                        {/* Client Website */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-secondary">
                                Client Website
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. evergreencoffee.com"
                                value={clientWebsite}
                                onChange={(e) => setClientWebsite(e.target.value)}
                                className={inputClass()}
                            />
                        </div>

                        {/* Meta Pixel Code */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-secondary">
                                Meta Pixel Code
                            </label>
                            <textarea
                                placeholder="Paste the Meta Pixel code here…"
                                value={pixelCode}
                                onChange={(e) => setPixelCode(e.target.value)}
                                rows={10}
                                spellCheck={false}
                                className={inputClass("resize-none font-mono text-xs leading-relaxed")}
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <p className="text-sm text-error-primary">{error}</p>
                        )}

                        {/* Submit */}
                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={!slug || isSubmitting}
                            className={cx(
                                "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition duration-100 ease-linear",
                                slug && !isSubmitting
                                    ? "bg-brand-solid hover:opacity-90 cursor-pointer"
                                    : "bg-brand-solid opacity-40 cursor-not-allowed",
                            )}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Generating…
                                </>
                            ) : (
                                <>
                                    Generate Page
                                    <ArrowRight className="size-4" aria-hidden="true" />
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Footer hint */}
                <p className="mt-6 text-center text-xs text-quaternary">
                    The page will be immediately accessible at the URL above.
                </p>
            </div>
        </main>
    );
};
