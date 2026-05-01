const { formatStudyNotes } = require("../utils/aiResponseFormatting.util");

const sanitizeFilename = (value) =>
  String(value || "document-summary")
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "document-summary";

const normalizeText = (value) =>
  String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const splitSentences = (text) => {
  const normalized = normalizeText(text).replace(/\n+/g, " ");
  return normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((sentence) => sentence.trim()) || [];
};

const buildExtractiveSummary = (text, maxSentences = 8) => {
  const sentences = splitSentences(text).filter((sentence) => sentence.length > 30);

  if (sentences.length === 0) {
    return normalizeText(text).slice(0, 1400);
  }

  return sentences.slice(0, maxSentences).join(" ");
};

const formatReadability = (score) => {
  if (score === null || score === undefined) {
    return "Not available";
  }

  return Number.isFinite(Number(score)) ? Number(score).toFixed(1) : String(score);
};

const createSummaryText = (document) => {
  const extractedText = normalizeText(document.extractedText);

  if (!extractedText) {
    const error = new Error("Document does not have extracted text available for export");
    error.statusCode = 422;
    throw error;
  }

  const keywords = document.keywords?.length ? document.keywords.join(", ") : "Not available";

  return formatStudyNotes(
    [
      "→ Overview",
      `Title: ${document.title}`,
      `Original file: ${document.originalName}`,
      `Classification: ${document.classification || "Unknown"}`,
      `Pages: ${document.pageCount || 0}`,
      `Word count: ${document.wordCount || 0}`,
      `Readability score: ${formatReadability(document.readabilityScore)}`,
      `Keywords: ${keywords}`,
      "",
      "→ Revision Notes",
      buildExtractiveSummary(extractedText),
      "",
      "→ Conclusion",
      "Use this export as a quick review copy of the document's main extracted content.",
    ].join("\n")
  );
};

const wrapText = (text, maxLength = 90) => {
  const lines = [];

  for (const paragraph of String(text).split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);

    if (words.length === 0) {
      lines.push("");
      continue;
    }

    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length > maxLength) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }

    if (line) {
      lines.push(line);
    }
  }

  return lines;
};

const escapePdfText = (value) =>
  String(value)
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const buildPdfPageContent = (lines) => {
  const commands = ["BT", "/F1 11 Tf", "50 792 Td", "14 TL"];

  for (const line of lines) {
    commands.push(`(${escapePdfText(line)}) Tj`, "T*");
  }

  commands.push("ET");
  return commands.join("\n");
};

const createPdfBuffer = (text) => {
  const lines = wrapText(text, 88);
  const pageLineLimit = 52;
  const pages = [];

  for (let index = 0; index < lines.length; index += pageLineLimit) {
    pages.push(lines.slice(index, index + pageLineLimit));
  }

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pages.map((_, index) => `${3 + index * 2} 0 R`).join(" ")}] /Count ${
      pages.length
    } >>`,
  ];

  pages.forEach((pageLines, index) => {
    const pageObjectNumber = 3 + index * 2;
    const contentObjectNumber = pageObjectNumber + 1;
    const content = buildPdfPageContent(pageLines);

    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents ${contentObjectNumber} 0 R >>`,
      `<< /Length ${Buffer.byteLength(content, "binary")} >>\nstream\n${content}\nendstream`
    );
  });

  let body = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(body, "binary"));
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(body, "binary");
  body += `xref\n0 ${objects.length + 1}\n`;
  body += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    body += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(body, "binary");
};

module.exports = {
  createPdfBuffer,
  createSummaryText,
  sanitizeFilename,
};
