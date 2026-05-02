const express = require("express");
const { createDocumentFromUpload } = require("../controllers/upload.controller");
const { protect } = require("../middleware/auth.middleware");
const { uploadDocument } = require("../middleware/upload.middleware");

const router = express.Router();

router.post("/document", protect, uploadDocument.single("document"), createDocumentFromUpload);
router.post("/pdf", protect, uploadDocument.single("pdf"), createDocumentFromUpload);

module.exports = router;
