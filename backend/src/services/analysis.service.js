const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";
const ANALYSIS_TIMEOUT_MS = Number(process.env.AI_SERVICE_TIMEOUT_MS || 15000);

const STOP_WORDS = new Set([
  "about",
  "after",
  "also",
  "because",
  "been",
  "being",
  "between",
  "from",
  "have",
  "into",
  "that",
  "their",
  "there",
  "these",
  "this",
  "through",
  "using",
  "were",
  "with",
  "would",
]);

const getFallbackKeywords = (text) => {
  const counts = new Map();
  const words = String(text || "")
    .toLowerCase()
    .match(/[a-z][a-z-]{3,}/g) || [];

  for (const word of words) {
    if (!STOP_WORDS.has(word)) {
      counts.set(word, (counts.get(word) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word]) => word);
};

const classifyFallback = (text) => {
  const content = String(text || "").toLowerCase();

  if (/\b(resume|curriculum vitae|experience|education|skills)\b/.test(content)) {
    return "Resume";
  }

  if (/\b(assignment|submitted by|question|answer)\b/.test(content)) {
    return "Assignment";
  }

  if (/\b(abstract|methodology|experiment|references|literature review)\b/.test(content)) {
    return "Research Paper";
  }

  if (/\b(report|executive summary|findings|recommendations)\b/.test(content)) {
    return "Report";
  }

  if (/\b(notes|chapter|lecture|revision)\b/.test(content)) {
    return "Notes";
  }

  return "Unknown";
};

const countSyllables = (word) => {
  const normalized = String(word || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

  if (!normalized) {
    return 0;
  }

  const groups = normalized.replace(/e$/i, "").match(/[aeiouy]+/g);
  return Math.max(groups?.length || 1, 1);
};

const analyzeLocally = (text) => {
  const words = String(text || "").match(/\b[\w'-]+\b/g) || [];
  const sentences = String(text || "").match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
  const syllables = words.reduce((total, word) => total + countSyllables(word), 0);
  const wordCount = Math.max(words.length, 1);
  const sentenceCount = Math.max(sentences.length, 1);
  const score = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllables / wordCount);

  return {
    classification: classifyFallback(text),
    keywords: getFallbackKeywords(text),
    readability: {
      score: Math.max(0, Math.min(100, Number(score.toFixed(1)))),
    },
  };
};

const analyzeDocumentText = async (text) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS);

  try {
    const response = await fetch(`${AI_SERVICE_URL}/api/analysis/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      const error = new Error(`AI analysis failed with status ${response.status}: ${errorBody}`);
      error.statusCode = 502;
      throw error;
    }

    return response.json();
  } catch (error) {
    return analyzeLocally(text);
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = {
  analyzeDocumentText,
  analyzeLocally,
};
