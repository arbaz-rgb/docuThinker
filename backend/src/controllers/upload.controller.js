const fs = require("fs");
const path = require("path");
const Document = require("../models/document.model");
const { analyzeDocumentText } = require("../services/analysis.service");
const { extractTextFromDocument } = require("../services/documentExtraction.service");
const { validateDocumentFile } = require("../validations/document.validation");

const VALID_CLASSIFICATIONS = new Set([
  "Resume",
  "Cover Letter",
  "SOP",
  "Notes",
  "Study Material",
  "Revision Notes",
  "Exam Notes",
  "Assignment",
  "Question Bank",
  "Interview Prep",
  "Lab Manual",
  "Lab Report",
  "Project Report",
  "Research Paper",
  "Case Study",
  "Presentation Slides",
  "Programming Notes",
  "Technical Documentation",
  "API Documentation",
  "System Design Notes",
  "Article",
  "Reference Material",
  "Documentation",
  "Miscellaneous",
  "Unknown",
]);

const CLASSIFICATION_ALIASES = new Map([
  ["Report", "Project Report"],
  ["Research", "Research Paper"],
  ["Study Notes", "Study Material"],
  ["Technical Notes", "Technical Documentation"],
  ["API Reference", "API Documentation"],
  ["System Design", "System Design Notes"],
  ["Lab", "Lab Report"],
  ["Questions", "Question Bank"],
]);

const normalizeClassificationLabel = (classification) => {
  const label = String(classification || "").trim();
  const mappedLabel = CLASSIFICATION_ALIASES.get(label) || label;
  return VALID_CLASSIFICATIONS.has(mappedLabel) ? mappedLabel : "Study Material";
};

const normalizeAnalysis = (analysis = {}) => ({
  classification: normalizeClassificationLabel(analysis.classification),
  keywords: Array.isArray(analysis.keywords)
    ? analysis.keywords.filter(Boolean).map(String).slice(0, 12)
    : [],
  readabilityScore: Number.isFinite(Number(analysis.readability?.score))
    ? Number(analysis.readability.score)
    : null,
});

const createDocumentFromUpload = async (req, res, next) => {
  try {
    const documentType = validateDocumentFile(req.file);

    const title =
      req.body.title?.trim() ||
      req.file.originalname.replace(new RegExp(`${path.extname(req.file.originalname)}$`, "i"), "");
    const extractedDocument = await extractTextFromDocument(req.file);
    const analysis = await analyzeDocumentText(extractedDocument.text);
    const normalizedAnalysis = normalizeAnalysis(analysis);

    const document = await Document.create({
      user: req.user._id,
      title,
      originalName: req.file.originalname,
      storedName: req.file.filename,
      filePath: req.file.path,
      mimeType: req.file.mimetype,
      fileType: documentType.fileType,
      size: req.file.size,
      status: "processed",
      extractedText: extractedDocument.text,
      pageCount: extractedDocument.pageCount,
      wordCount: extractedDocument.wordCount,
      extractionMetadata: extractedDocument.metadata,
      classification: normalizedAnalysis.classification,
      keywords: normalizedAnalysis.keywords,
      readabilityScore: normalizedAnalysis.readabilityScore,
    });

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
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
