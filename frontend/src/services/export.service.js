import api from "./api";

const getFilenameFromDisposition = (contentDisposition, fallback) => {
  const match = contentDisposition?.match(/filename="?([^"]+)"?/i);
  return match?.[1] || fallback;
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const exportSummary = async (documentId, format) => {
  const extension = format === "pdf" ? "pdf" : "txt";
  const response = await api.get(`/documents/${documentId}/export/summary.${extension}`, {
    responseType: "blob",
  });
  const filename = getFilenameFromDisposition(
    response.headers["content-disposition"],
    `document-summary.${extension}`
  );

  downloadBlob(response.data, filename);
};
