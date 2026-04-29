import api from "./api";

export const fetchDocuments = async (params = {}) => {
  const response = await api.get("/documents", { params });
  return response.data.data;
};

export const fetchDocumentDetails = async (documentId) => {
  const response = await api.get(`/documents/${documentId}`);
  return response.data.data.document;
};

export const deleteDocument = async (documentId) => {
  const response = await api.delete(`/documents/${documentId}`);
  return response.data.data;
};
