type PdfTable = {
  headers: string[];
  rows: Array<Array<string | number | null | undefined>>;
};

export type PdfReportSection =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "details"; rows: Array<[string, string | number | null | undefined]> }
  | { kind: "table"; title?: string; table: PdfTable };

const pageWidth = 612;
const pageHeight = 792;
const margin = 54;
const bottomMargin = 56;
const lineHeight = 14;

export function downloadPdfReport(filename: string, title: string, sections: PdfReportSection[]) {
  const lines = layoutReport(title, sections);
  const pages = paginate(lines);
  const pageStreams = pages.map((pageLines, index) => renderPage(pageLines, index, pages.length));
  const pdfBytes = buildPdf(pageStreams);
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function layoutReport(title: string, sections: PdfReportSection[]) {
  const output: Array<{ text: string; size: number; bold?: boolean; gap?: number }> = [
    { text: title, size: 18, bold: true, gap: 10 },
  ];

  sections.forEach((section) => {
    if (section.kind === "heading") {
      output.push({ text: section.text, size: 13, bold: true, gap: 8 });
      return;
    }
    if (section.kind === "paragraph") {
      wrap(section.text, 88).forEach((text) => output.push({ text, size: 10 }));
      output.push({ text: "", size: 10, gap: 5 });
      return;
    }
    if (section.kind === "details") {
      section.rows.forEach(([label, value]) => {
        output.push({ text: `${label}: ${formatPdfValue(value)}`, size: 10 });
      });
      output.push({ text: "", size: 10, gap: 5 });
      return;
    }
    if (section.title) output.push({ text: section.title, size: 12, bold: true, gap: 5 });
    output.push({ text: section.table.headers.join(" | "), size: 9, bold: true });
    output.push({ text: "-".repeat(96), size: 9 });
    section.table.rows.forEach((row) => {
      const text = row.map(formatPdfValue).join(" | ");
      wrap(text, 110).forEach((line) => output.push({ text: line, size: 8 }));
    });
    output.push({ text: "", size: 9, gap: 6 });
  });

  return output;
}

function paginate(lines: Array<{ text: string; size: number; bold?: boolean; gap?: number }>) {
  const pages: typeof lines[] = [];
  let current: typeof lines = [];
  let y = pageHeight - margin;

  lines.forEach((line) => {
    const height = lineHeight + (line.gap ?? 0);
    if (y - height < bottomMargin && current.length > 0) {
      pages.push(current);
      current = [];
      y = pageHeight - margin;
    }
    current.push(line);
    y -= height;
  });
  if (current.length > 0) pages.push(current);
  return pages;
}

function renderPage(lines: Array<{ text: string; size: number; bold?: boolean; gap?: number }>, pageIndex: number, totalPages: number) {
  let y = pageHeight - margin;
  const commands = [
    "BT",
    "/F1 9 Tf",
    `1 0 0 1 ${margin} ${bottomMargin - 20} Tm`,
    `(${escapePdfText(`SmartFlood Historical Report | Page ${pageIndex + 1} of ${totalPages}`)}) Tj`,
    "ET",
  ];

  lines.forEach((line) => {
    commands.push("BT");
    commands.push(`/${line.bold ? "F2" : "F1"} ${line.size} Tf`);
    commands.push(`1 0 0 1 ${margin} ${y} Tm`);
    commands.push(`(${escapePdfText(line.text)}) Tj`);
    commands.push("ET");
    y -= lineHeight + (line.gap ?? 0);
  });

  return commands.join("\n");
}

function buildPdf(pageStreams: string[]) {
  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pageStreams.map((_, index) => `${3 + index * 2} 0 R`).join(" ")}] /Count ${pageStreams.length} >>`,
  ];

  pageStreams.forEach((stream, index) => {
    const pageObject = 3 + index * 2;
    const contentObject = pageObject + 1;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >> /Contents ${contentObject} 0 R >>`);
    objects.push(`<< /Length ${byteLength(stream)} >>\nstream\n${stream}\nendstream`);
  });

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}

function wrap(value: string, length: number) {
  const text = value.replace(/\s+/g, " ").trim();
  if (!text) return [""];
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  words.forEach((word) => {
    if (`${current} ${word}`.trim().length > length) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  });
  if (current) lines.push(current);
  return lines;
}

function formatPdfValue(value: string | number | null | undefined) {
  const text = String(value ?? "").trim();
  return text || "-";
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function byteLength(value: string) {
  return new TextEncoder().encode(value).length;
}
