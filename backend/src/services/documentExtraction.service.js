const fs = require("fs/promises");
const mammoth = require("mammoth");
const { PDFParse } = require("pdf-parse");
const { getWordCount, normalizeExtractedText } = require("../utils/textExtraction.util");
const { getDocumentType } = require("../validations/document.validation");

const WORDS_PER_PAGE = 450;
const PARAGRAPHS_PER_PAGE = 8;

const toPositiveInteger = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.ceil(number) : 0;
};

const countParagraphs = (text = "") =>
  String(text)
    .split(/\n{2,}|\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean).length;

const estimatePageCount = ({ text, wordCount, paragraphCount = 0 }) => {
  if (!text?.trim()) {
    return 0;
  }

  const estimatedFromWords = Math.ceil(Math.max(wordCount, 1) / WORDS_PER_PAGE);
  const estimatedFromParagraphs = paragraphCount
    ? Math.ceil(paragraphCount / PARAGRAPHS_PER_PAGE)
    : 0;

  return Math.max(1, estimatedFromWords, estimatedFromParagraphs);
};

const buildExtractionResult = ({ text, pageCount = 0, metadata = {} }) => {
  const extractedText = normalizeExtractedText(text);

  if (!extractedText) {
    const error = new Error("No readable text could be extracted from this document");
    error.statusCode = 422;
    throw error;
  }

  const wordCount = getWordCount(extractedText);
  const paragraphCount = countParagraphs(extractedText);
  const exactPageCount = toPositiveInteger(pageCount);
  const estimatedPageCount = estimatePageCount({
    text: extractedText,
    wordCount,
    paragraphCount,
  });
  const resolvedPageCount = exactPageCount || estimatedPageCount;

  return {
    text: extractedText,
    pageCount: resolvedPageCount,
    wordCount,
    metadata: {
      ...metadata,
      paragraphCount,
      estimatedPageCount,
      pageCountSource: exactPageCount ? "exact" : "estimated",
    },
  };
};

const extractTextFromPdf = async (filePath) => {
  const fileBuffer = await fs.readFile(filePath);
  const parser = new PDFParse({ data: fileBuffer });

  try {
    const textResult = await parser.getText();
    const infoResult = await parser.getInfo();

    return buildExtractionResult({
      text: textResult.text,
      pageCount: textResult.total || textResult.numpages || 0,
      metadata: infoResult.info || {},
    });
  } finally {
    await parser.destroy();
  }
};

const extractTextFromDocx = async (filePath) => {
  const result = await mammoth.extractRawText({ path: filePath });

  return buildExtractionResult({
    text: result.value,
    metadata: {
      warnings: result.messages || [],
    },
  });
};

const extractTextFile = async (filePath) => {
  const text = await fs.readFile(filePath, "utf8");

  return buildExtractionResult({
    text,
    metadata: {},
  });
};

const extractTextFromDocument = async (file) => {
  const documentType = getDocumentType(file);

  if (!documentType) {
    const error = new Error("Unsupported document type");
    error.statusCode = 400;
    throw error;
  }

  if (documentType.fileType === "pdf") {
    return extractTextFromPdf(file.path);
  }

  if (documentType.fileType === "docx") {
    return extractTextFromDocx(file.path);
  }

  return extractTextFile(file.path);
};

module.exports = {
  extractTextFromDocument,
  extractTextFromDocx,
  extractTextFromPdf,
  extractTextFile,
};
