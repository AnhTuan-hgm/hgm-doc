import { useEffect, useMemo, useState } from "react";
import { Trash01, UploadCloud02 } from "@untitledui-pro/icons/line";
import { editInput } from "@/pages/client/dashboard/dashboard-chrome";

export type BrandFontFile = { name: string; url: string };
export type BrandFontFiles = { heading?: BrandFontFile; body?: BrandFontFile };

/** The comma-separated fonts field, as up-to-4 trimmed family names. */
const splitFamilies = (fonts: string) =>
    fonts
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean)
        .slice(0, 4);

/**
 * Which family each role resolves to. An uploaded file wins over a typed name for its
 * role; the body falls back to the heading so one font still styles the whole scale.
 */
const resolveRoles = (fonts: string, files: BrandFontFiles | undefined) => {
    const typed = splitFamilies(fonts);
    const heading = files?.heading?.name ?? typed[0];
    const body = files?.body?.name ?? typed[1] ?? heading;
    return { heading, body, headingCustom: !!files?.heading, bodyCustom: !!files?.body };
};

/**
 * Load typed families from Google Fonts while mounted. A family Google doesn't host
 * simply falls back to sans-serif — the preview's job is "show me the typeface" and a
 * fallback rendering is visibly not it. Injected <link> tags are removed on unmount so
 * leaving Brand Kit doesn't leave client fonts on other pages.
 */
const useGoogleFonts = (families: string[]) => {
    useEffect(() => {
        const links = families.map((f) => {
            const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@400;600&display=swap`;
            if (document.head.querySelector(`link[href="${href}"]`)) return null;
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = href;
            document.head.appendChild(link);
            return link;
        });
        return () => links.forEach((l) => l?.remove());
    }, [families]);
};

/** Register uploaded font files (data URLs) with the browser while mounted. */
const useCustomFonts = (files: BrandFontFiles | undefined) => {
    useEffect(() => {
        const faces = [files?.heading, files?.body]
            .filter((f): f is BrandFontFile => !!f)
            .map((f) => {
                const face = new FontFace(f.name, `url(${f.url})`);
                void face.load().then(
                    () => document.fonts.add(face),
                    () => undefined, // a corrupt file just previews in the fallback face
                );
                return face;
            });
        return () => faces.forEach((face) => document.fonts.delete(face));
    }, [files]);
};

const ROLES = [
    { role: "heading" as const, label: "Heading font", note: "Used for the Display sizes", placeholder: "e.g. Cormorant Infant" },
    { role: "body" as const, label: "Body font", note: "Used for the Text sizes", placeholder: "e.g. Inter" },
];

/**
 * The two typeface cards, side by side — Heading and Body. Each previews its resolved
 * font and, in edit mode, takes a typed family name OR an uploaded font file (the
 * upload wins for that role until it's removed). Typed names live in the ONE stored
 * comma string (slot 0 heading, slot 1 body), so older rows and the generate-from-
 * website filler keep working unchanged; uploads live in brand.font_files.
 */
export const TypographyCards = ({
    fonts,
    files,
    isLocked,
    onFonts,
    onUpload,
    onClearUpload,
}: {
    fonts: string;
    files: BrandFontFiles | undefined;
    isLocked: boolean;
    onFonts: (fonts: string) => void;
    onUpload: (role: "heading" | "body", file: File) => void;
    onClearUpload: (role: "heading" | "body") => void;
}) => {
    const typed = useMemo(() => splitFamilies(fonts), [fonts]);
    useGoogleFonts(typed);
    useCustomFonts(files);
    const resolved = resolveRoles(fonts, files);

    /* Local input state keeps typing free (a trailing space would otherwise be trimmed
       away on the round trip); it resyncs only when the stored value changes from
       outside — e.g. the generate-from-website draft filling the field. */
    const [names, setNames] = useState<[string, string]>([typed[0] ?? "", typed[1] ?? ""]);
    const localJoin = names
        .map((f) => f.trim())
        .filter(Boolean)
        .join(", ");
    useEffect(() => {
        if (typed.slice(0, 2).join(", ") !== localJoin) setNames([typed[0] ?? "", typed[1] ?? ""]);
    }, [fonts]); // eslint-disable-line react-hooks/exhaustive-deps -- resync only on outside writes

    const setName = (i: 0 | 1, v: string) => {
        const next: [string, string] = i === 0 ? [v, names[1]] : [names[0], v];
        setNames(next);
        onFonts(
            next
                .map((f) => f.trim())
                .filter(Boolean)
                .join(", "),
        );
    };

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {ROLES.map(({ role, label, note, placeholder }, i) => {
                const family = resolved[role];
                const custom = role === "heading" ? files?.heading : files?.body;
                const fallbackToHeading = role === "body" && !custom && !typed[1] && !!resolved.heading;
                return (
                    <div key={role} className="rounded-2xl bg-primary p-5 ring-1 ring-secondary">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                            <p className="text-sm font-semibold text-primary">{label}</p>
                            <span className="text-xs text-quaternary">{note}</span>
                        </div>

                        {!isLocked &&
                            (custom ? (
                                <div className="mt-2 flex items-center gap-1.5">
                                    <span className="truncate text-sm text-tertiary">
                                        {custom.name} <span className="text-quaternary">(uploaded)</span>
                                    </span>
                                    <button
                                        type="button"
                                        title="Remove the uploaded font"
                                        onClick={() => onClearUpload(role)}
                                        className="flex size-6 shrink-0 items-center justify-center rounded-md text-fg-quaternary transition duration-100 ease-linear hover:bg-secondary hover:text-error-primary"
                                    >
                                        <Trash01 className="size-3.5" aria-hidden="true" />
                                    </button>
                                </div>
                            ) : (
                                <div className="mt-2 flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder={placeholder}
                                        value={names[i as 0 | 1]}
                                        onChange={(e) => setName(i as 0 | 1, e.target.value)}
                                        className={editInput("min-w-0 flex-1")}
                                    />
                                    <label
                                        title="Upload a font file (.woff2, .woff, .ttf, .otf)"
                                        className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-fg-quaternary transition duration-100 ease-linear hover:bg-secondary hover:text-brand-secondary"
                                    >
                                        <input
                                            type="file"
                                            accept=".woff2,.woff,.ttf,.otf"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) onUpload(role, file);
                                                e.target.value = "";
                                            }}
                                        />
                                        <UploadCloud02 className="size-4" aria-hidden="true" />
                                    </label>
                                </div>
                            ))}

                        {family ? (
                            <>
                                <p className="mt-3 text-display-md font-medium text-primary" style={{ fontFamily: `"${family}", sans-serif` }}>
                                    Aa Bb Cc
                                </p>
                                <p className="mt-2 truncate text-md text-tertiary" style={{ fontFamily: `"${family}", sans-serif` }}>
                                    The quick brown fox jumps over the lazy dog
                                </p>
                                <p className="mt-1 truncate font-mono text-xs text-quaternary" style={{ fontFamily: `"${family}", sans-serif` }}>
                                    ABCDEFGHIJKLM abcdefghijklm 0123456789
                                </p>
                                {isLocked && (
                                    <p className="mt-2 text-xs text-quaternary">
                                        {family}
                                        {fallbackToHeading ? " — same as heading" : custom ? " (uploaded)" : ""}
                                    </p>
                                )}
                                {!isLocked && fallbackToHeading && <p className="mt-2 text-xs text-quaternary">Falls back to the heading font.</p>}
                            </>
                        ) : (
                            <p className="mt-3 text-md text-quaternary italic">No font set yet.</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
