const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 30000);
const GEMINI_API_BASE_URL =
  process.env.GEMINI_API_BASE_URL || "https://generativelanguage.googleapis.com/v1beta";

const GENERATION_CONFIG = {
  temperature: 0.3,
  topP: 0.9,
  maxOutputTokens: 1200,
};

const assertGeminiConfigured = () => {
  if (!GEMINI_API_KEY) {
    const error = new Error("GEMINI_API_KEY is missing from environment variables");
    error.statusCode = 500;
    throw error;
  }
};

const trimDocumentText = (text, maxChars = 45000) => {
  if (!text || typeof text !== "string") {
    return "";
  }

  const normalizedText = text.replace(/\s+/g, " ").trim();
  return normalizedText.length > maxChars
    ? `${normalizedText.slice(0, maxChars)}\n\n[Document truncated for analysis]`
    : normalizedText;
};

const parseGeminiText = (payload) => {
  const parts = payload?.candidates?.[0]?.content?.parts || [];
  return parts
    .map((part) => part.text)
    .filter(Boolean)
    .join("\n")
    .trim();
};

const buildPrompt = ({ systemInstruction, task, documentText, question }) => {
  const sections = [
    systemInstruction,
    task,
    documentText ? `Document:\n${trimDocumentText(documentText)}` : "",
    question ? `User question:\n${question.trim()}` : "",
  ];

  return sections.filter(Boolean).join("\n\n");
};

const generateGeminiResponse = async (prompt, options = {}) => {
  assertGeminiConfigured();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || GEMINI_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${GEMINI_API_BASE_URL}/models/${options.model || GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            ...GENERATION_CONFIG,
            ...(options.generationConfig || {}),
          },
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      const error = new Error(`Gemini request failed with status ${response.status}: ${errorBody}`);
      error.statusCode = 502;
      throw error;
    }

    const payload = await response.json();
    const text = parseGeminiText(payload);

    if (!text) {
      const error = new Error("Gemini returned an empty response");
      error.statusCode = 502;
      throw error;
    }

    return {
      text,
      model: options.model || GEMINI_MODEL,
      usageMetadata: payload.usageMetadata,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error("Gemini request timed out");
      timeoutError.statusCode = 504;
      throw timeoutError;
    }

    if (!error.statusCode) {
      error.statusCode = 502;
      error.message = `Gemini service unavailable: ${error.message}`;
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

const generateSummary = async (documentText, options = {}) => {
  const prompt = buildPrompt({
    systemInstruction:
      "You are DocuThinker, a precise document assistant. Use only the document content provided.",
    task:
      "Create a clear summary of the document. Include the main topic, important arguments, and final takeaway. Keep it concise and structured.",
    documentText,
  });

  return generateGeminiResponse(prompt, options);
};

const generateKeyInsights = async (documentText, options = {}) => {
  const prompt = buildPrompt({
    systemInstruction:
      "You are DocuThinker, a document analysis assistant. Extract grounded insights only from the provided document.",
    task:
      "List the key insights from this document. Return practical, high-signal bullet points and avoid repeating generic summary lines.",
    documentText,
  });

  return generateGeminiResponse(prompt, options);
};

const askPdf = async (documentText, question, options = {}) => {
  const prompt = buildPrompt({
    systemInstruction:
      "You are DocuThinker, a PDF question-answering assistant. Answer from the document only. If the answer is not present, say that the document does not contain enough information.",
    task: "Answer the user's question clearly and cite the relevant document idea in plain language.",
    documentText,
    question,
  });

  return generateGeminiResponse(prompt, options);
};

const generateInterviewMode = async (documentText, options = {}) => {
  const prompt = buildPrompt({
    systemInstruction:
      "You are DocuThinker, helping a user prepare for an interview based on a document.",
    task:
      "Generate interview preparation content from this document. Include likely interview questions, ideal answer points, follow-up questions, and important topics to revise.",
    documentText,
  });

  return generateGeminiResponse(prompt, options);
};

const generateExamMode = async (documentText, options = {}) => {
  const prompt = buildPrompt({
    systemInstruction:
      "You are DocuThinker, helping a student study from a document for an exam.",
    task:
      "Generate exam preparation material from this document. Include short-answer questions, long-answer questions, MCQs with answers, and a compact revision checklist.",
    documentText,
  });

  return generateGeminiResponse(prompt, options);
};

module.exports = {
  generateSummary,
  generateKeyInsights,
  askPdf,
  generateInterviewMode,
  generateExamMode,
};
