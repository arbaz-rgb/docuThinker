const Document = require("../models/document.model");
const {
  askPdf,
  generateExamMode,
  generateInterviewMode,
  generateKeyInsights,
  generateSummary,
} = require("../services/gemini.service");

const getUserDocument = async (documentId, userId) => {
  const document = await Document.findOne({
    _id: documentId,
    user: userId,
  });

  if (!document) {
    const error = new Error("Document not found");
    error.statusCode = 404;
    throw error;
  }

  if (!document.extractedText?.trim()) {
    const error = new Error("Document does not have extracted text available");
    error.statusCode = 422;
    throw error;
  }

  return document;
};

const sendAiResponse = (res, { document, feature, result }) => {
  res.status(200).json({
    success: true,
    data: {
      document: {
        id: document._id,
        title: document.title,
      },
      feature,
      result: result.text,
      model: result.model,
      usageMetadata: result.usageMetadata,
    },
  });
};

const summarizeDocument = async (req, res, next) => {
  try {
    const document = await getUserDocument(req.params.documentId, req.user._id);
    const result = await generateSummary(document.extractedText);

    sendAiResponse(res, {
      document,
      feature: "summary",
      result,
    });
  } catch (error) {
    next(error);
  }
};

const getKeyInsights = async (req, res, next) => {
  try {
    const document = await getUserDocument(req.params.documentId, req.user._id);
    const result = await generateKeyInsights(document.extractedText);

    sendAiResponse(res, {
      document,
      feature: "key_insights",
      result,
    });
  } catch (error) {
    next(error);
  }
};

const askDocumentQuestion = async (req, res, next) => {
  try {
    const question = req.body.question?.trim();

    if (!question) {
      const error = new Error("Question is required");
      error.statusCode = 400;
      throw error;
    }

    const document = await getUserDocument(req.params.documentId, req.user._id);
    const result = await askPdf(document.extractedText, question);

    sendAiResponse(res, {
      document,
      feature: "ask_pdf",
      result,
    });
  } catch (error) {
    next(error);
  }
};

const getInterviewMode = async (req, res, next) => {
  try {
    const document = await getUserDocument(req.params.documentId, req.user._id);
    const result = await generateInterviewMode(document.extractedText);

    sendAiResponse(res, {
      document,
      feature: "interview_mode",
      result,
    });
  } catch (error) {
    next(error);
  }
};

const getExamMode = async (req, res, next) => {
  try {
    const document = await getUserDocument(req.params.documentId, req.user._id);
    const result = await generateExamMode(document.extractedText);

    sendAiResponse(res, {
      document,
      feature: "exam_mode",
      result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  askDocumentQuestion,
  getExamMode,
  getInterviewMode,
  getKeyInsights,
  summarizeDocument,
};
