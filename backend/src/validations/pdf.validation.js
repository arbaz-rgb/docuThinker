const fs = require("fs");
const path = require("path");

const PDF_SIGNATURE = "%PDF";

const validatePdfFile = (file) => {
  if (!file) {
    const error = new Error("PDF file is required");
    error.statusCode = 400;
    throw error;
  }

  if (file.mimetype !== "application/pdf") {
    const error = new Error("Uploaded file must be a PDF");
    error.statusCode = 400;
    throw error;
  }

  if (path.extname(file.originalname).toLowerCase() !== ".pdf") {
    const error = new Error("File extension must be .pdf");
    error.statusCode = 400;
    throw error;
  }

  const buffer = Buffer.alloc(4);
  const fd = fs.openSync(file.path, "r");
  fs.readSync(fd, buffer, 0, 4, 0);
  fs.closeSync(fd);

  if (buffer.toString() !== PDF_SIGNATURE) {
    const error = new Error("Invalid PDF file content");
    error.statusCode = 400;
    throw error;
  }
};

module.exports = {
  validatePdfFile,
};
