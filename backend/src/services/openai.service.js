const OpenAI = require("openai");
const {
  formatAiResponse,
  formatExamQuestions,
  formatStudyNotes,
  normalizeRepeatedWords,
} = require("../utils/aiResponseFormatting.util");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 30000);

const DEFAULT_GENERATION_OPTIONS = {
  temperature: 0.3,
  max_output_tokens: 1200,
};

const SYSTEM_PROMPTS = {
  documentAssistant:
    "You are DocuThinker, a precise document assistant. Use only the document content provided. Return clean plain text study notes. Do not use markdown symbols, markdown bold, or markdown heading syntax.",
  insights:
    "You are DocuThinker, a document analysis assistant. Extract grounded insights only from the provided document. Return clean plain text study notes. Do not use markdown symbols, markdown bold, or markdown heading syntax.",
  askPdf:
    "You are DocuThinker, a PDF question-answering assistant. Answer from the document only. If the answer is not present, say that the document does not contain enough information. Return clean plain text study notes. Do not use markdown symbols, markdown bold, or markdown heading syntax.",
  interview:
    "You are DocuThinker, helping a user prepare for an interview based on a document. Return clean plain text study notes. Do not use markdown symbols, markdown bold, or markdown heading syntax.",
  exam:
    "You are DocuThinker, helping a student study from a document for an exam. Return a clean plain-text exam sheet only. Do not use markdown symbols, markdown bold, or markdown heading syntax.",
};

const TASK_PROMPTS = {
  shortSummary:
    [
      "Rewrite the document as a clean, student-friendly summary.",
      "Return exactly this structure:",
      "→ Overview",
      "One clean overview paragraph.",
      "→ Key Concepts",
      "- 3-5 concise bullet points.",
      "→ Important Definitions",
      "- Term: simple definition for important terms found in the document.",
      "→ Conclusion",
      "1-2 sentences.",
      "Remove OCR fragments, repeated phrases, slide footer/header text, and raw extraction noise. Use natural language, not copied slide fragments.",
      "Do not use ##, ###, **, or any markdown formatting.",
    ].join("\n"),
  detailedSummary:
    [
      "Rewrite the document as a clean ChatGPT-style study summary for students.",
      "Return exactly this structure:",
      "→ Overview",
      "One readable overview paragraph explaining what the document is about.",
      "→ Key Concepts",
      "- 5-8 bullets covering the main ideas without repetition.",
      "→ Important Definitions",
      "- Term: simple definition for important terms in the document.",
      "→ Conclusion",
      "A short final takeaway.",
      "Do not paste raw slide/OCR text. Merge broken fragments into complete sentences. Remove duplicate ideas, page numbers, headers, footers, and irrelevant extraction artifacts.",
      "Keep the tone natural, concise, informative, and easy for students to understand.",
      "Do not use ##, ###, **, or any markdown formatting.",
    ].join("\n"),
  simplifiedSummary:
    [
      "Rewrite the document in simple student-friendly language.",
      "Return exactly this structure:",
      "→ Overview",
      "One easy overview paragraph.",
      "→ Key Concepts",
      "- 4-6 plain-language bullet points.",
      "→ Important Definitions",
      "- Simple term-definition bullets for the most important terms.",
      "→ Conclusion",
      "1 short takeaway.",
      "Remove repeated OCR fragments and broken slide text. Explain ideas naturally and avoid jargon unless it is defined.",
      "Do not use ##, ###, **, or any markdown formatting.",
    ].join("\n"),
  keyInsights:
    "List the key insights from this document under → Key Concepts. Return practical, high-signal bullet points and avoid repeating generic summary lines. Do not use markdown formatting.",
  askPdf:
    "Answer the user's question clearly using → Overview, → Important Definitions when relevant, and → Conclusion. Cite the relevant document idea in plain language. Do not use markdown formatting.",
  interviewQuestions:
    "Generate interview preparation content from this document. Use these section headers where relevant: → Likely Interview Questions, → Ideal Answer Points, → Follow-up Questions, → Revision Notes, → Conclusion. Use numbered lists for questions and hyphen bullets for answer points. Do not use markdown formatting.",
  examQuestions:
    [
      "Generate exam preparation material from this document as a strict clean exam sheet.",
      "Return exactly these section headers in this order:",
      "\u2192 MCQs",
      "\u2192 Short Questions",
      "\u2192 Long Questions",
      "MCQ rules:",
      "Every MCQ must start with Q<number>.",
      "Every MCQ must contain exactly 4 options.",
      "Options must always be labeled exactly A), B), C), D).",
      "Only one option should be correct; make the other three options plausible but clearly incorrect.",
      "Do not include answer keys, explanations, bullets, or raw numbering.",
      "Short Questions rules:",
      "Every short question must start with Q<number>.",
      "Use Q1., Q2., Q3. format only. Do not use 1., 2., 3. numbering.",
      "Long Questions rules:",
      "Every long question must start with Q<number>.",
      "Use Q1., Q2., Q3. format only. Do not use 1., 2., 3. numbering.",
      "General rules:",
      "Do not use ##, ###, **, markdown bullets, answer labels, or extra sections.",
      "Keep clean spacing and plain text formatting.",
    ].join("\n"),
};

let openaiClient;

const getOpenAIClient = () => {
  if (!OPENAI_API_KEY) {
    const error = new Error("OPENAI_API_KEY is missing from environment variables");
    error.statusCode = 500;
    throw error;
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: OPENAI_API_KEY,
      timeout: OPENAI_TIMEOUT_MS,
    });
  }

  return openaiClient;
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

const isExtractionNoise = (line) => {
  const normalized = line.toLowerCase();

  if (/^(slide|page)\s*\d+(\s*of\s*\d+)?$/.test(normalized)) {
    return true;
  }

  if (/^\d+$/.test(normalized) || /^[-_*=\s]{3,}$/.test(line)) {
    return true;
  }

  if (/^(copyright|confidential|all rights reserved)\b/.test(normalized)) {
    return true;
  }

  return false;
};

const cleanDocumentTextForSummary = (text, maxChars = 45000) => {
  if (!text || typeof text !== "string") {
    return "";
  }

  const lines = text
    .replace(/\r/g, "\n")
    .replace(/[ \t]*-\n[ \t]*/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) =>
      normalizeRepeatedWords(
        line
          .replace(/\s+/g, " ")
          .replace(/\s+([,.;:!?])/g, "$1")
          .trim()
      )
    )
    .filter((line) => line && !isExtractionNoise(line));

  const seen = new Set();
  const cleanedLines = [];

  for (const line of lines) {
    const key = line.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    cleanedLines.push(line);
  }

  return trimDocumentText(cleanedLines.join("\n"), maxChars);
};

const buildUserPrompt = ({ task, documentText, question }) => {
  const sections = [
    task,
    documentText ? `Document:\n${trimDocumentText(documentText)}` : "",
    question ? `User question:\n${question.trim()}` : "",
  ];

  return sections.filter(Boolean).join("\n\n");
};

const extractResponseText = (response) => {
  if (response.output_text) {
    return response.output_text.trim();
  }

  return (response.output || [])
    .flatMap((item) => item.content || [])
    .map((content) => content.text)
    .filter(Boolean)
    .join("\n")
    .trim();
};

const generateOpenAIResponse = async ({ systemPrompt, task, documentText, question }, options = {}) => {
  const client = getOpenAIClient();
  const model = options.model || OPENAI_MODEL;

  try {
    const response = await client.responses.create({
      model,
      input: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: buildUserPrompt({ task, documentText, question }),
        },
      ],
      ...DEFAULT_GENERATION_OPTIONS,
      ...(options.generationOptions || {}),
    });

    const text = extractResponseText(response);

    if (!text) {
      const error = new Error("OpenAI returned an empty response");
      error.statusCode = 502;
      throw error;
    }

    return {
      text: options.formatter ? options.formatter(text) : formatAiResponse(text),
      model,
      usageMetadata: response.usage,
    };
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = error.status === 401 || error.status === 403 ? 500 : 502;
      error.message = `OpenAI service unavailable: ${error.message}`;
    }

    throw error;
  }
};

const generateShortSummary = (documentText, options = {}) =>
  generateOpenAIResponse(
    {
      systemPrompt: SYSTEM_PROMPTS.documentAssistant,
      task: TASK_PROMPTS.shortSummary,
      documentText: cleanDocumentTextForSummary(documentText),
    },
    {
      ...options,
      formatter: formatStudyNotes,
    }
  );

const generateDetailedSummary = (documentText, options = {}) =>
  generateOpenAIResponse(
    {
      systemPrompt: SYSTEM_PROMPTS.documentAssistant,
      task: TASK_PROMPTS.detailedSummary,
      documentText: cleanDocumentTextForSummary(documentText),
    },
    {
      ...options,
      formatter: formatStudyNotes,
    }
  );

const generateSimplifiedSummary = (documentText, options = {}) =>
  generateOpenAIResponse(
    {
      systemPrompt: SYSTEM_PROMPTS.documentAssistant,
      task: TASK_PROMPTS.simplifiedSummary,
      documentText: cleanDocumentTextForSummary(documentText),
    },
    {
      ...options,
      formatter: formatStudyNotes,
    }
  );

const generateSummary = (documentText, options = {}) => {
  const summaryType = options.summaryType || "detailed";

  if (summaryType === "short") {
    return generateShortSummary(documentText, options);
  }

  if (summaryType === "simplified") {
    return generateSimplifiedSummary(documentText, options);
  }

  return generateDetailedSummary(documentText, options);
};

const generateKeyInsights = (documentText, options = {}) =>
  generateOpenAIResponse(
    {
      systemPrompt: SYSTEM_PROMPTS.insights,
      task: TASK_PROMPTS.keyInsights,
      documentText,
    },
    {
      ...options,
      formatter: (text) => formatAiResponse(text, { fallbackHeading: "Key Concepts" }),
    }
  );

const askPdf = (documentText, question, options = {}) =>
  generateOpenAIResponse(
    {
      systemPrompt: SYSTEM_PROMPTS.askPdf,
      task: TASK_PROMPTS.askPdf,
      documentText,
      question,
    },
    {
      ...options,
      formatter: (text) => formatAiResponse(text, { fallbackHeading: "Overview" }),
    }
  );

const generateInterviewQuestions = (documentText, options = {}) =>
  generateOpenAIResponse(
    {
      systemPrompt: SYSTEM_PROMPTS.interview,
      task: TASK_PROMPTS.interviewQuestions,
      documentText,
    },
    {
      ...options,
      formatter: (text) =>
        formatAiResponse(text, { fallbackHeading: "Likely Interview Questions" }),
    }
  );

const generateExamQuestions = (documentText, options = {}) =>
  generateOpenAIResponse(
    {
      systemPrompt: SYSTEM_PROMPTS.exam,
      task: TASK_PROMPTS.examQuestions,
      documentText,
    },
    {
      ...options,
      formatter: formatExamQuestions,
    }
  );

module.exports = {
  askPdf,
  generateDetailedSummary,
  generateExamQuestions,
  generateInterviewQuestions,
  generateKeyInsights,
  generateShortSummary,
  generateSimplifiedSummary,
  generateSummary,
};
