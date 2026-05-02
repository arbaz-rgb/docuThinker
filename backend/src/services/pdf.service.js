const fs = require("fs/promises");
const { PDFParse } = require("pdf-parse");
const { normalizeExtractedText, getWordCount } = require("../utils/textExtraction.util");

const WORDS_PER_PAGE = 450;

const resolvePageCount = (pageCount, text) => {
  const exactPageCount = Number(pageCount);

  if (Number.isFinite(exactPageCount) && exactPageCount > 0) {
    return Math.ceil(exactPageCount);
  }

  const wordCount = getWordCount(text);
  return text?.trim() ? Math.max(1, Math.ceil(Math.max(wordCount, 1) / WORDS_PER_PAGE)) : 0;
};

const extractTextFromPdf = async (filePath) => {
  const fileBuffer = await fs.readFile(filePath);
  const parser = new PDFParse({ data: fileBuffer });

  try {
    const textResult = await parser.getText();
    const infoResult = await parser.getInfo();
    const extractedText = normalizeExtractedText(textResult.text);

    if (!extractedText) {
      const error = new Error("No readable text could be extracted from this PDF");
      error.statusCode = 422;
      throw error;
    }

    return {
      text: extractedText,
      pageCount: resolvePageCount(textResult.total || textResult.numpages || 0, extractedText),
      wordCount: getWordCount(extractedText),
      metadata: infoResult.info || {},
    };
  } finally {
    await parser.destroy();
  }
};

module.exports = {
  extractTextFromPdf,
};
