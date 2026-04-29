const fs = require("fs/promises");
const { PDFParse } = require("pdf-parse");
const { normalizeExtractedText, getWordCount } = require("../utils/textExtraction.util");

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
      pageCount: textResult.total || 0,
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
