const express = require("express");
const {
  deleteDocument,
  exportSummaryPdf,
  exportSummaryTxt,
  fetchDocuments,
  getDocumentDetails,
  searchDocuments,
} = require("../controllers/document.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect);

router.get("/", fetchDocuments);
router.get("/search", searchDocuments);
router.get("/:documentId/export/summary.pdf", exportSummaryPdf);
router.get("/:documentId/export/summary.txt", exportSummaryTxt);
router.get("/:documentId", getDocumentDetails);
router.delete("/:documentId", deleteDocument);

module.exports = router;
