const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { validateDocumentFileNameAndType } = require("../validations/document.validation");

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

const documentFileFilter = (req, file, cb) => {
  try {
    validateDocumentFileNameAndType(file);
    cb(null, true);
  } catch (error) {
    cb(error);
  }
};

const uploadDocument = multer({
  storage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

module.exports = {
  uploadDocument,
  uploadDir,
  MAX_FILE_SIZE,
};
