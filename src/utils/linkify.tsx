import type { ReactNode } from "react";

const URL_RE = /(https?:\/\/[^\s<>"']+)/g;

/** Render plain text with bare http(s) URLs as links that open in a new tab.
 *  Trailing punctuation ("…docs.google.com/edit).", "…?usp=sharing,") stays text,
 *  so a URL at the end of a sentence still resolves. */
export const linkify = (text: string): ReactNode[] =>
    text.split(URL_RE).map((part, i) => {
        if (!/^https?:\/\//.test(part)) return part;
        const [, url, trail] = part.match(/^(.*?)([.,;:!?)\]]*)$/)!;
        return (
            <span key={i}>
                <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-brand-secondary underline transition duration-100 ease-linear hover:text-brand-secondary_hover"
                >
                    {url}
                </a>
                {trail}
            </span>
        );
    });
