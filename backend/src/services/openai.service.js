const OpenAI = require("openai");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 30000);

const DEFAULT_GENERATION_OPTIONS = {
  temperature: 0.3,
  max_output_tokens: 1200,
};

const SUMMARY_SECTION_ORDER = [
  "Key Concepts",
  "Important Definitions",
  "Conclusion",
];

const SYSTEM_PROMPTS = {
  documentAssistant:
    "You are DocuThinker, a precise document assistant. Use only the document content provided.",
  insights:
    "You are DocuThinker, a document analysis assistant. Extract grounded insights only from the provided document.",
  askPdf:
    "You are DocuThinker, a PDF question-answering assistant. Answer from the document only. If the answer is not present, say that the document does not contain enough information.",
  interview:
    "You are DocuThinker, helping a user prepare for an interview based on a document.",
  exam: "You are DocuThinker, helping a student study from a document for an exam.",
};

const TASK_PROMPTS = {
  shortSummary:
    [
      "Rewrite the document as a clean, student-friendly summary.",
      "Return exactly this structure:",
      "1. A short title on the first line.",
      "2. One clean overview paragraph.",
      "3. Key Concepts: 3-5 concise bullet points.",
      "4. Important Definitions: include only important terms found in the document.",
      "5. Conclusion: 1-2 sentences.",
      "Remove OCR fragments, repeated phrases, slide footer/header text, and raw extraction noise. Use natural language, not copied slide fragments.",
    ].join("\n"),
  detailedSummary:
    [
      "Rewrite the document as a clean ChatGPT-style study summary for students.",
      "Return exactly this structure:",
      "1. A clear title on the first line.",
      "2. One readable overview paragraph explaining what the document is about.",
      "3. Key Concepts: 5-8 bullets covering the main ideas without repetition.",
      "4. Important Definitions: bullets in the format \"- Term: simple definition\" for important terms in the document.",
      "5. Conclusion: a short final takeaway.",
      "Do not paste raw slide/OCR text. Merge broken fragments into complete sentences. Remove duplicate ideas, page numbers, headers, footers, and irrelevant extraction artifacts.",
      "Keep the tone natural, concise, informative, and easy for students to understand.",
    ].join("\n"),
  simplifiedSummary:
    [
      "Rewrite the document in simple student-friendly language.",
      "Return exactly this structure:",
      "1. A simple title on the first line.",
      "2. One easy overview paragraph.",
      "3. Key Concepts: 4-6 plain-language bullet points.",
      "4. Important Definitions: simple term-definition bullets for the most important terms.",
      "5. Conclusion: 1 short takeaway.",
      "Remove repeated OCR fragments and broken slide text. Explain ideas naturally and avoid jargon unless it is defined.",
    ].join("\n"),
  keyInsights:
    "List the key insights from this document. Return practical, high-signal bullet points and avoid repeating generic summary lines.",
  askPdf:
    "Answer the user's question clearly and cite the relevant document idea in plain language.",
  interviewQuestions:
    "Generate interview preparation content from this document. Include likely interview questions, ideal answer points, follow-up questions, and important topics to revise.",
  examQuestions:
    "Generate exam preparation material from this document. Include short-answer questions, long-answer questions, MCQs with answers, and a compact revision checklist.",
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

const normalizeRepeatedWords = (text) =>
  text.replace(/\b([A-Za-z][A-Za-z0-9+#.-]*)\b(?:\s+\1\b)+/gi, "$1");

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

const stripMarkdownDecoration = (text) =>
  text
    .replace(/\r/g, "\n")
    .replace(/```[\s\S]*?```/g, (match) =>
      match.replace(/^```[^\n]*\n?/, "").replace(/\n?```$/, "")
    )
    .replace(/^\s*#{1,6}\s*/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/^\s*[-*_]{3,}\s*$/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[ \t]+/g, " ")
    .trim();

const normalizeSummaryHeading = (line) => {
  const cleaned = line
    .replace(/^\s*(?:[-*]|\d+[.)])\s*/, "")
    .replace(/:$/, "")
    .trim();
  const normalized = cleaned.toLowerCase();

  if (normalized === "overview" || normalized === "summary") {
    return "Overview";
  }

  if (normalized === "key concepts" || normalized === "key points") {
    return "Key Concepts";
  }

  if (normalized === "important definitions" || normalized === "definitions") {
    return "Important Definitions";
  }

  if (normalized === "conclusion" || normalized === "short conclusion") {
    return "Conclusion";
  }

  return null;
};

const normalizeListLine = (line) => {
  const cleaned = line.trim();
  const numberedMatch = cleaned.match(/^(\d+)[.)]\s+(.*)$/);

  if (numberedMatch) {
    return `${numberedMatch[1]}. ${numberedMatch[2].trim()}`;
  }

  return cleaned.replace(/^\s*(?:[-*\u2022])\s*/, "- ").trim();
};

const removeLeadingListMarker = (line) =>
  line.replace(/^\s*(?:[-*\u2022]|\d+[.)])\s*/, "").trim();

const dedupeSummaryLines = (lines) => {
  const seen = new Set();
  const output = [];

  for (const line of lines) {
    const key = line
      .toLowerCase()
      .replace(/^\s*(?:[-*\u2022]|\d+[.)])\s*/, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(line);
  }

  return output;
};

const cleanSummaryTitle = (line) =>
  removeLeadingListMarker(line).replace(/^\s*title\s*:\s*/i, "").trim();

const formatPlainTextSummaryLines = (lines) => {
  const [firstLine, ...bodyLines] = lines;
  const output = [cleanSummaryTitle(firstLine), ""];

  for (const line of dedupeSummaryLines(bodyLines)) {
    output.push(normalizeListLine(line));
  }

  return output.join("\n").replace(/\n{3,}/g, "\n\n").trim();
};

const formatSummaryText = (text) => {
  if (!text || typeof text !== "string") {
    return "";
  }

  const rawLines = stripMarkdownDecoration(text)
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
    .filter(Boolean);

  if (!rawLines.length) {
    return "";
  }

  const title = cleanSummaryTitle(rawLines[0]);
  const sections = {
    overview: [],
    "Key Concepts": [],
    "Important Definitions": [],
    Conclusion: [],
  };
  let currentSection = "overview";
  let hasStructuredSections = false;

  for (const line of rawLines.slice(1)) {
    const heading = normalizeSummaryHeading(line);

    if (heading) {
      hasStructuredSections = true;

      if (heading === "Overview") {
        currentSection = "overview";
        continue;
      }

      currentSection = heading;
      continue;
    }

    if (currentSection === "overview") {
      sections.overview.push(line);
      continue;
    }

    const normalizedLine =
      currentSection === "Conclusion" ? removeLeadingListMarker(line) : normalizeListLine(line);
    sections[currentSection].push(normalizedLine);
  }

  if (!hasStructuredSections) {
    return formatPlainTextSummaryLines(rawLines);
  }

  const output = [title, ""];
  const overview = dedupeSummaryLines(sections.overview).join(" ");

  if (overview) {
    output.push(overview, "");
  }

  for (const heading of SUMMARY_SECTION_ORDER) {
    const sectionLines = dedupeSummaryLines(sections[heading]);

    if (!sectionLines.length) {
      continue;
    }

    output.push(heading, "");

    if (heading === "Conclusion") {
      output.push(sectionLines.join(" "));
    } else {
      output.push(...sectionLines.map(normalizeListLine));
    }

    output.push("");
  }

  return output.join("\n").replace(/\n{3,}/g, "\n\n").trim();
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
      text: options.formatter ? options.formatter(text) : text,
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
      formatter: formatSummaryText,
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
      formatter: formatSummaryText,
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
      formatter: formatSummaryText,
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
    options
  );

const askPdf = (documentText, question, options = {}) =>
  generateOpenAIResponse(
    {
      systemPrompt: SYSTEM_PROMPTS.askPdf,
      task: TASK_PROMPTS.askPdf,
      documentText,
      question,
    },
    options
  );

const generateInterviewQuestions = (documentText, options = {}) =>
  generateOpenAIResponse(
    {
      systemPrompt: SYSTEM_PROMPTS.interview,
      task: TASK_PROMPTS.interviewQuestions,
      documentText,
    },
    options
  );

const generateExamQuestions = (documentText, options = {}) =>
  generateOpenAIResponse(
    {
      systemPrompt: SYSTEM_PROMPTS.exam,
      task: TASK_PROMPTS.examQuestions,
      documentText,
    },
    options
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
