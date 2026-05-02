const fs = require("fs");
const path = require("path");

const SUPPORTED_DOCUMENT_TYPES = {
  ".pdf": {
    label: "PDF",
    mimeTypes: ["application/pdf"],
    fileType: "pdf",
  },
  ".docx": {
    label: "Word document",
    mimeTypes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    fileType: "docx",
  },
  ".txt": {
    label: "Text document",
    mimeTypes: ["text/plain"],
    fileType: "txt",
  },
  ".md": {
    label: "Markdown document",
    mimeTypes: ["text/markdown", "text/plain"],
    fileType: "md",
  },
};

const SUPPORTED_EXTENSIONS = Object.keys(SUPPORTED_DOCUMENT_TYPES);
const SUPPORTED_MIME_TYPES = [
  ...new Set(Object.values(SUPPORTED_DOCUMENT_TYPES).flatMap((type) => type.mimeTypes)),
];
const SUPPORTED_TYPES_MESSAGE = "Supported document types are PDF, DOCX, TXT, and MD.";

const getDocumentType = (file) => {
  const extension = path.extname(file?.originalname || "").toLowerCase();
  return SUPPORTED_DOCUMENT_TYPES[extension] || null;
};

const validateDocumentFileNameAndType = (file) => {
  if (!file) {
    const error = new Error("Document file is required");
    error.statusCode = 400;
    throw error;
  }

  const documentType = getDocumentType(file);

  if (!documentType) {
    const error = new Error(`Unsupported file extension. ${SUPPORTED_TYPES_MESSAGE}`);
    error.statusCode = 400;
    throw error;
  }

  if (!documentType.mimeTypes.includes(file.mimetype)) {
    const error = new Error(`Unsupported file type. ${SUPPORTED_TYPES_MESSAGE}`);
    error.statusCode = 400;
    throw error;
  }

  return documentType;
};

const readFileSignature = (filePath, length) => {
  const buffer = Buffer.alloc(length);
  const fd = fs.openSync(filePath, "r");
  const bytesRead = fs.readSync(fd, buffer, 0, length, 0);
  fs.closeSync(fd);
  return buffer.subarray(0, bytesRead);
};

const validateDocumentFile = (file) => {
  const documentType = validateDocumentFileNameAndType(file);

  if (documentType.fileType === "pdf") {
    const signature = readFileSignature(file.path, 4).toString();

    if (signature !== "%PDF") {
      const error = new Error("Invalid PDF file content");
      error.statusCode = 400;
      throw error;
    }
  }

  if (documentType.fileType === "docx") {
    const signature = readFileSignature(file.path, 2).toString();

    if (signature !== "PK") {
      const error = new Error("Invalid DOCX file content");
      error.statusCode = 400;
      throw error;
    }
  }

  return documentType;
};

module.exports = {
  SUPPORTED_DOCUMENT_TYPES,
  SUPPORTED_EXTENSIONS,
  SUPPORTED_MIME_TYPES,
  SUPPORTED_TYPES_MESSAGE,
  getDocumentType,
  validateDocumentFile,
  validateDocumentFileNameAndType,
};
