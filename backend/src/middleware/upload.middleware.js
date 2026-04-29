const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadDir = path.join(__dirname, "..", "uploads", "documents");
const MAX_FILE_SIZE = 10 * 1024 * 1024;

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(
      file.originalname
    ).toLowerCase()}`;

    cb(null, uniqueName);
  },
});

const pdfFileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const isPdf = file.mimetype === "application/pdf" && extension === ".pdf";

  if (!isPdf) {
    const error = new Error("Only PDF files are allowed");
    error.statusCode = 400;
    return cb(error);
  }

  cb(null, true);
};

const uploadPdf = multer({
  storage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

module.exports = {
  uploadPdf,
  uploadDir,
  MAX_FILE_SIZE,
};
