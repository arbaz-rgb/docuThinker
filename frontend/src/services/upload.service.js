import api from "./api";

export const uploadPdf = async (file, { onUploadProgress } = {}) => {
  const formData = new FormData();
  formData.append("pdf", file);
  formData.append("title", file.name.replace(/\.pdf$/i, ""));

  const response = await api.post("/upload/pdf", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress,
  });

  return response.data.data.document;
};
