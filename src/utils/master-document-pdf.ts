import { jsPDF } from "jspdf";

/**
 * Master Document → PDF, for the AM to download and share.
 *
 * Lives in its own module so `client-dashboard-page.tsx` can reach it through a
 * dynamic `import()` — jsPDF is only fetched when someone actually clicks
 * Download PDF, keeping it out of the initial bundle.
 *
 * Laid out from the structured sections rather than the compiled markdown, so
 * headings, wrapped body copy and Q/A pairs each get real typography instead of
 * a monospace dump.
 *
 * Colors are literal hex here, not semantic Tailwind tokens: a PDF has no CSS
 * variables to resolve, and the output must look identical regardless of whether
 * the AM had the dashboard in light or dark mode. Values mirror theme.css.
 */

export interface MasterDocSection {
    label: string;
    value: string;
}

export interface MasterDocFaq {
    question: string;
    answer: string;
}

export interface MasterDocPdfInput {
    clientName: string;
    clientWebsite: string;
    generatedOn: string;
    sections: MasterDocSection[];
    faqs: MasterDocFaq[];
}

const BRAND = "#7F56D9";
const INK = "#101828";
const BODY = "#344054";
const MUTED = "#667085";
const HAIRLINE = "#EAECF0";

// US Letter in points (jsPDF's default unit), since the audience is US-based.
const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 56;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_SPACE = 54;

export function buildMasterDocumentPdf(input: MasterDocPdfInput): jsPDF {
    const { clientName, clientWebsite, generatedOn, sections, faqs } = input;
    const name = clientName.trim() || "Client";
    const doc = new jsPDF({ unit: "pt", format: "letter" });

    let y = MARGIN;

    /**
     * Start a new page when `needed` points won't fit above the footer.
     * Returns true when it broke, so callers can skip a leading divider that
     * would otherwise be drawn above the top margin of the fresh page.
     */
    const ensure = (needed: number): boolean => {
        if (y + needed <= PAGE_H - MARGIN - FOOTER_SPACE) return false;
        doc.addPage();
        y = MARGIN;
        return true;
    };

    /** Hairline above the upcoming block, at a fixed offset from its heading. */
    const dividerAbove = () => {
        doc.setDrawColor(HAIRLINE);
        doc.setLineWidth(0.75);
        doc.line(MARGIN, y - 14, PAGE_W - MARGIN, y - 14);
    };

    /** Write wrapped text, paginating between lines so a paragraph can span pages. */
    const writeWrapped = (text: string, size: number, color: string, style: "normal" | "bold" | "italic", leading: number) => {
        doc.setFont("helvetica", style);
        doc.setFontSize(size);
        doc.setTextColor(color);
        for (const line of doc.splitTextToSize(text, CONTENT_W) as string[]) {
            ensure(leading);
            doc.text(line, MARGIN, y);
            y += leading;
        }
    };

    /* ── Header ── */
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(BRAND);
    doc.text("FOUNDATION · MASTER DOCUMENT", MARGIN, y, { charSpace: 1.1 });
    y += 22;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(23);
    doc.setTextColor(INK);
    for (const line of doc.splitTextToSize(name, CONTENT_W) as string[]) {
        doc.text(line, MARGIN, y);
        y += 27;
    }
    y += 2;

    const meta = [clientWebsite.trim(), `Generated ${generatedOn}`].filter(Boolean).join("   ·   ");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(MUTED);
    doc.text(meta, MARGIN, y);
    y += 16;

    doc.setDrawColor(BRAND);
    doc.setLineWidth(2);
    doc.line(MARGIN, y, MARGIN + 42, y);
    y += 26;

    /* ── Numbered sections ── */
    sections.forEach((s, i) => {
        // Keep a heading with at least its first body line — a heading alone at a
        // page bottom reads as a mistake. The divider is drawn AFTER the page
        // check and only when we didn't break, so a rule can never be left
        // stranded at the foot of a page with its section overleaf.
        const broke = ensure(46);
        if (i > 0 && !broke) dividerAbove();

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(INK);
        doc.text(`${i + 1}.  ${s.label}`, MARGIN, y);
        y += 15;

        const value = s.value.trim();
        if (value) {
            writeWrapped(value, 10, BODY, "normal", 14.5);
        } else {
            writeWrapped("Not provided yet.", 10, MUTED, "italic", 14.5);
        }
        y += 20;
    });

    /* ── FAQ bank ── */
    const faqBroke = ensure(52);
    if (!faqBroke) dividerAbove();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(INK);
    doc.text(`${sections.length + 1}.  FAQ bank${faqs.length ? ` (${faqs.length})` : ""}`, MARGIN, y);
    y += 16;

    if (!faqs.length) {
        writeWrapped("No FAQs yet.", 10, MUTED, "italic", 14.5);
    } else {
        faqs.forEach((q) => {
            ensure(44);
            writeWrapped(q.question.trim(), 10, INK, "bold", 14);
            const answer = q.answer.trim();
            writeWrapped(answer || "No answer yet.", 10, answer ? BODY : MUTED, answer ? "normal" : "italic", 14);
            y += 10;
        });
    }

    /* ── Footers (after pagination is known) ── */
    const pages = doc.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
        doc.setPage(p);
        doc.setDrawColor(HAIRLINE);
        doc.setLineWidth(0.75);
        doc.line(MARGIN, PAGE_H - MARGIN - 20, PAGE_W - MARGIN, PAGE_H - MARGIN - 20);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(MUTED);
        doc.text(`${name} · Master Document`, MARGIN, PAGE_H - MARGIN - 6);
        doc.text(`Page ${p} of ${pages}`, PAGE_W - MARGIN, PAGE_H - MARGIN - 6, { align: "right" });
    }

    return doc;
}

/** `canopy-at-moody-moon-master-document.pdf` */
export function masterDocumentFileName(clientName: string): string {
    const base =
        clientName
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "client";
    return `${base}-master-document.pdf`;
}
