import api from "./api";

const DOCUMENT_EXTENSION_PATTERN = /\.(pdf|docx|txt|md)$/i;

export const uploadDocument = async (file, { onUploadProgress } = {}) => {
  const formData = new FormData();
  formData.append("document", file);
  formData.append("title", file.name.replace(DOCUMENT_EXTENSION_PATTERN, ""));

  const response = await api.post("/upload/document", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress,
  });

  return response.data.data.document;
};

export const uploadPdf = uploadDocument;
