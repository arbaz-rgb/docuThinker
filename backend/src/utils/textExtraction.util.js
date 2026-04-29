const normalizeExtractedText = (text = "") => {
  return text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const getWordCount = (text = "") => {
  if (!text.trim()) {
    return 0;
  }

  return text.trim().split(/\s+/).length;
};

module.exports = {
  normalizeExtractedText,
  getWordCount,
};
