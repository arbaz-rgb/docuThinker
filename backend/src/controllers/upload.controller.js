const fs = require("fs");
const Document = require("../models/document.model");
const { analyzeDocumentText } = require("../services/analysis.service");
const { extractTextFromPdf } = require("../services/pdf.service");
const { validatePdfFile } = require("../validations/pdf.validation");

const VALID_CLASSIFICATIONS = new Set([
  "Resume",
  "Notes",
  "Research Paper",
  "Report",
  "Assignment",
  "Unknown",
]);

const normalizeAnalysis = (analysis = {}) => ({
  classification: VALID_CLASSIFICATIONS.has(analysis.classification)
    ? analysis.classification
    : "Unknown",
  keywords: Array.isArray(analysis.keywords)
    ? analysis.keywords.filter(Boolean).map(String).slice(0, 12)
    : [],
  readabilityScore: Number.isFinite(Number(analysis.readability?.score))
    ? Number(analysis.readability.score)
    : null,
});

const createDocumentFromUpload = async (req, res, next) => {
  try {
    validatePdfFile(req.file);

    const title = req.body.title?.trim() || req.file.originalname.replace(/\.pdf$/i, "");
    const extractedPdf = await extractTextFromPdf(req.file.path);
    const analysis = await analyzeDocumentText(extractedPdf.text);
    const normalizedAnalysis = normalizeAnalysis(analysis);

    const document = await Document.create({
      user: req.user._id,
      title,
      originalName: req.file.originalname,
      storedName: req.file.filename,
      filePath: req.file.path,
      mimeType: req.file.mimetype,
      size: req.file.size,
      status: "processed",
      extractedText: extractedPdf.text,
      pageCount: extractedPdf.pageCount,
      wordCount: extractedPdf.wordCount,
      extractionMetadata: extractedPdf.metadata,
      classification: normalizedAnalysis.classification,
      keywords: normalizedAnalysis.keywords,
      readabilityScore: normalizedAnalysis.readabilityScore,
    });

    res.status(201).json({
      success: true,
      message: "PDF uploaded successfully",
      data: {
        document,
      },
    });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    next(error);
  }
};

module.exports = {
  createDocumentFromUpload,
};
