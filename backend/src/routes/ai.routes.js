const express = require("express");
const {
  askDocumentQuestion,
  getExamMode,
  getInterviewMode,
  getKeyInsights,
  summarizeDocument,
} = require("../controllers/ai.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect);

router.post("/documents/:documentId/summary", summarizeDocument);
router.post("/documents/:documentId/key-insights", getKeyInsights);
router.post("/documents/:documentId/ask", askDocumentQuestion);
router.post("/documents/:documentId/interview-mode", getInterviewMode);
router.post("/documents/:documentId/exam-mode", getExamMode);

module.exports = router;
