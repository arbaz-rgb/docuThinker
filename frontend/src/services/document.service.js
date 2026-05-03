import api from "./api";

export const fetchDocuments = async (params = {}) => {
  const response = await api.get("/api/documents", { params });
  return response.data.data;
};

export const fetchDocumentDetails = async (documentId) => {
  const response = await api.get(`/api/documents/${documentId}`);
  return response.data.data.document;
};

export const deleteDocument = async (documentId) => {
  const response = await api.delete(`/api/documents/${documentId}`);
  return response.data.data;
};
