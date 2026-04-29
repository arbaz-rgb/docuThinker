const fs = require("fs/promises");
const mongoose = require("mongoose");
const Document = require("../models/document.model");
const {
  createPdfBuffer,
  createSummaryText,
  sanitizeFilename,
} = require("../services/export.service");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const parsePagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || DEFAULT_PAGE, 1);
  const requestedLimit = Number.parseInt(query.limit, 10) || DEFAULT_LIMIT;
  const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const assertValidDocumentId = (documentId) => {
  if (!mongoose.Types.ObjectId.isValid(documentId)) {
    const error = new Error("Invalid document id");
    error.statusCode = 400;
    throw error;
  }
};

const buildDocumentSummaryProjection = () => ({
  extractedText: 0,
  extractionMetadata: 0,
  filePath: 0,
  storedName: 0,
});

const getDocumentForUser = async (documentId, userId) => {
  assertValidDocumentId(documentId);

  const document = await Document.findOne({
    _id: documentId,
    user: userId,
  });

  if (!document) {
    const error = new Error("Document not found");
    error.statusCode = 404;
    throw error;
  }

  return document;
};

const sendPaginatedDocuments = async (res, filter, pagination) => {
  const [documents, total] = await Promise.all([
    Document.find(filter, buildDocumentSummaryProjection())
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Document.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      documents,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    },
  });
};

const fetchDocuments = async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);

    await sendPaginatedDocuments(
      res,
      {
        user: req.user._id,
      },
      pagination
    );
  } catch (error) {
    next(error);
  }
};

const searchDocuments = async (req, res, next) => {
  try {
    const searchTerm = req.query.q?.trim();

    if (!searchTerm) {
      const error = new Error("Search query is required");
      error.statusCode = 400;
      throw error;
    }

    const pagination = parsePagination(req.query);
    const searchRegex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    await sendPaginatedDocuments(
      res,
      {
        user: req.user._id,
        $or: [
          { title: searchRegex },
          { originalName: searchRegex },
          { classification: searchRegex },
          { keywords: searchRegex },
        ],
      },
      pagination
    );
  } catch (error) {
    next(error);
  }
};

const getDocumentDetails = async (req, res, next) => {
  try {
    const document = await getDocumentForUser(req.params.documentId, req.user._id);

    res.status(200).json({
      success: true,
      data: {
        document,
      },
    });
  } catch (error) {
    next(error);
  }
};

const exportSummaryTxt = async (req, res, next) => {
  try {
    const document = await getDocumentForUser(req.params.documentId, req.user._id);
    const summaryText = createSummaryText(document);
    const filename = `${sanitizeFilename(document.title)}-summary.txt`;

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(summaryText);
  } catch (error) {
    next(error);
  }
};

const exportSummaryPdf = async (req, res, next) => {
  try {
    const document = await getDocumentForUser(req.params.documentId, req.user._id);
    const summaryText = createSummaryText(document);
    const pdfBuffer = createPdfBuffer(summaryText);
    const filename = `${sanitizeFilename(document.title)}-summary.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.status(200).send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

const deleteDocument = async (req, res, next) => {
  try {
    const document = await getDocumentForUser(req.params.documentId, req.user._id);

    await Document.deleteOne({ _id: document._id });

    if (document.filePath) {
      try {
        await fs.unlink(document.filePath);
      } catch (error) {
        if (error.code !== "ENOENT") {
          throw error;
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
      data: {
        documentId: document._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  deleteDocument,
  exportSummaryPdf,
  exportSummaryTxt,
  fetchDocuments,
  getDocumentDetails,
  searchDocuments,
};
