const express = require("express");
const { createDocumentFromUpload } = require("../controllers/upload.controller");
const { protect } = require("../middleware/auth.middleware");
const { uploadPdf } = require("../middleware/upload.middleware");

const router = express.Router();

router.post("/pdf", protect, uploadPdf.single("pdf"), createDocumentFromUpload);

module.exports = router;
