import { jsPDF } from "jspdf";

/**
 * A submitted client form → PDF, for the team to file or share.
 *
 * Takes the same section/row shape the dashboard's inline answers panel renders, so it
 * serves BOTH client-input forms (Onboarding and Brand Vision) without knowing anything
 * about either one's fields.
 *
 * Own module, reached by dynamic import() from the dashboard, so jsPDF stays out of the
 * page's chunk. Visual language matches master-document-pdf.ts deliberately — the two
 * currently keep their own copies of the layout helpers; worth extracting into a shared
 * primitive if a third PDF ever lands.
 *
 * Colors are literal hex: a PDF has no CSS variables, and the output must not change with
 * whoever happened to have dark mode on. Values mirror theme.css.
 */

export interface FormAnswerLine {
    text: string;
    /** A password or other credential. Masked unless the caller opts in. */
    secret?: boolean;
}

export interface FormAnswerRow {
    field: string;
    label: string;
    lines: FormAnswerLine[];
    mediaPath: string;
    mediaKind: "audio" | "video" | "";
    /** Transcript of the recording, when one exists. */
    transcript?: string;
}

export interface FormAnswerSection {
    id: string;
    title: string;
    rows: FormAnswerRow[];
}

export interface FormAnswersPdfInput {
    clientName: string;
    /** "Onboarding Form" / "Brand Vision Form" — printed under the client's name. */
    formTitle: string;
    generatedOn: string;
    submittedOn?: string;
    sections: FormAnswerSection[];
    /**
     * Print credentials in clear text. Default OFF: this file gets emailed and filed, which
     * is a far weaker place for a client's logins than the dashboard behind a session.
     */
    includeSecrets?: boolean;
}

/** theme.css --color-brand-600 (rgb(0 102 222)) — the app's primary interactive blue. */
const BRAND = "#0066DE";
const INK = "#101828";
const BODY = "#344054";
const MUTED = "#667085";
const HAIRLINE = "#EAECF0";

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 56;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_SPACE = 54;

export function buildFormAnswersPdf(input: FormAnswersPdfInput): jsPDF {
    const { clientName, formTitle, generatedOn, submittedOn, sections, includeSecrets = false } = input;
    const name = clientName.trim() || "Client";
    const doc = new jsPDF({ unit: "pt", format: "letter" });

    let y = MARGIN;

    const ensure = (needed: number): boolean => {
        if (y + needed <= PAGE_H - MARGIN - FOOTER_SPACE) return false;
        doc.addPage();
        y = MARGIN;
        return true;
    };

    const writeWrapped = (text: string, size: number, color: string, style: "normal" | "bold" | "italic", leading: number, indent = 0) => {
        doc.setFont("helvetica", style);
        doc.setFontSize(size);
        doc.setTextColor(color);
        for (const line of doc.splitTextToSize(text, CONTENT_W - indent) as string[]) {
            ensure(leading);
            doc.text(line, MARGIN + indent, y);
            y += leading;
        }
    };

    /* ── Header ── */
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(BRAND);
    doc.text(formTitle.toUpperCase(), MARGIN, y, { charSpace: 1.1 });
    y += 22;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(23);
    doc.setTextColor(INK);
    for (const line of doc.splitTextToSize(name, CONTENT_W) as string[]) {
        doc.text(line, MARGIN, y);
        y += 27;
    }
    y += 2;

    const answered = sections.flatMap((s) => s.rows).filter((r) => r.lines.length || r.mediaPath).length;
    const meta = [submittedOn ? `Submitted ${submittedOn}` : "Not submitted", `${answered} answered`, `Exported ${generatedOn}`].join("   ·   ");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(MUTED);
    doc.text(meta, MARGIN, y);
    y += 16;

    doc.setDrawColor(BRAND);
    doc.setLineWidth(2);
    doc.line(MARGIN, y, MARGIN + 42, y);
    y += 26;

    /* ── Sections ── */
    sections.forEach((section, si) => {
        // Keep a section heading with at least its first row.
        const broke = ensure(56);
        if (si > 0 && !broke) {
            doc.setDrawColor(HAIRLINE);
            doc.setLineWidth(0.75);
            doc.line(MARGIN, y - 14, PAGE_W - MARGIN, y - 14);
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(BRAND);
        doc.text(section.title.toUpperCase(), MARGIN, y, { charSpace: 0.9 });
        y += 18;

        section.rows.forEach((row) => {
            ensure(40);
            writeWrapped(row.label, 10.5, INK, "bold", 14);

            const empty = !row.lines.length && !row.mediaPath;
            if (empty) {
                writeWrapped("Not answered", 10, MUTED, "italic", 14, 10);
            }

            for (const line of row.lines) {
                if (line.secret && !includeSecrets) {
                    // Masked, but the fact a password EXISTS is still useful to a reader.
                    writeWrapped("Password on file — hidden from this export", 10, MUTED, "italic", 14, 10);
                } else {
                    writeWrapped(line.text, 10, BODY, "normal", 14, 10);
                }
            }

            if (row.mediaPath) {
                const kindLabel = row.mediaKind === "video" ? "Video answer" : "Voice answer";
                if (row.transcript?.trim()) {
                    writeWrapped(`${kindLabel} — transcript:`, 9.5, MUTED, "italic", 13, 10);
                    writeWrapped(row.transcript.trim(), 10, BODY, "normal", 14, 10);
                } else {
                    // No transcript stored for this recording. Say so plainly rather than
                    // leave the answer looking blank — the recording itself is on the
                    // dashboard, this export just can't carry audio.
                    writeWrapped(`${kindLabel} — no transcript available. Play it on the dashboard.`, 10, MUTED, "italic", 14, 10);
                }
            }

            y += 8;
        });

        y += 6;
    });

    /* ── Footers ── */
    const pages = doc.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
        doc.setPage(p);
        doc.setDrawColor(HAIRLINE);
        doc.setLineWidth(0.75);
        doc.line(MARGIN, PAGE_H - MARGIN - 20, PAGE_W - MARGIN, PAGE_H - MARGIN - 20);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(MUTED);
        doc.text(`${name} · ${formTitle}`, MARGIN, PAGE_H - MARGIN - 6);
        doc.text(`Page ${p} of ${pages}`, PAGE_W - MARGIN, PAGE_H - MARGIN - 6, { align: "right" });
    }

    return doc;
}

/** `north-star-resort-lodge-onboarding-form.pdf` */
export function formAnswersFileName(clientName: string, formTitle: string): string {
    const slug = (s: string) =>
        s
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
    return `${slug(clientName) || "client"}-${slug(formTitle) || "form"}.pdf`;
}
