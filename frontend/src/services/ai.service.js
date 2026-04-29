import api from "./api";

export const askPdfQuestion = async (documentId, question) => {
  const response = await api.post(`/ai/documents/${documentId}/ask`, { question });
  return response.data.data;
};

export const generateInterviewMode = async (documentId) => {
  const response = await api.post(`/ai/documents/${documentId}/interview-mode`);
  return response.data.data;
};

export const generateExamMode = async (documentId) => {
  const response = await api.post(`/ai/documents/${documentId}/exam-mode`);
  return response.data.data;
};
