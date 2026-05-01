const SECTION_ALIASES = new Map(
  [
    ["overview", "Overview"],
    ["summary", "Overview"],
    ["key concepts", "Key Concepts"],
    ["key points", "Key Concepts"],
    ["important definitions", "Important Definitions"],
    ["definitions", "Important Definitions"],
    ["likely interview questions", "Likely Interview Questions"],
    ["interview questions", "Likely Interview Questions"],
    ["ideal answer points", "Ideal Answer Points"],
    ["ideal answers", "Ideal Answer Points"],
    ["answer points", "Ideal Answer Points"],
    ["follow-up", "Follow-up Questions"],
    ["follow up", "Follow-up Questions"],
    ["follow-up questions", "Follow-up Questions"],
    ["follow up questions", "Follow-up Questions"],
    ["mcqs", "MCQs"],
    ["multiple choice questions", "MCQs"],
    ["short questions", "Short Questions"],
    ["short-answer questions", "Short Questions"],
    ["short answer questions", "Short Questions"],
    ["long questions", "Long Questions"],
    ["long-answer questions", "Long Questions"],
    ["long answer questions", "Long Questions"],
    ["revision notes", "Revision Notes"],
    ["revision checklist", "Revision Notes"],
    ["important topics to revise", "Revision Notes"],
    ["conclusion", "Conclusion"],
  ].map(([alias, heading]) => [alias, heading])
);

const SECTION_ORDER = [
  "Overview",
  "Key Concepts",
  "Important Definitions",
  "Likely Interview Questions",
  "Ideal Answer Points",
  "Follow-up Questions",
  "MCQs",
  "Short Questions",
  "Long Questions",
  "Revision Notes",
  "Conclusion",
];

const normalizeRepeatedWords = (text) =>
  text.replace(/\b([A-Za-z][A-Za-z0-9+#.-]*)\b(?:\s+\1\b)+/gi, "$1");

const normalizeSpaces = (value) =>
  normalizeRepeatedWords(
    String(value || "")
      .replace(/[ \t]+/g, " ")
      .replace(/\s+([,.;:!?])/g, "$1")
      .trim()
  );

const stripMarkdownDecoration = (text) =>
  String(text || "")
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
    .replace(/[*#]/g, "");

const getHeadingName = (value) => {
  const normalized = normalizeSpaces(value)
    .replace(/^[-\u2022]\s*/, "")
    .replace(/^\d+[.)]\s*/, "")
    .replace(/^→\s*/, "")
    .replace(/:$/, "")
    .toLowerCase();

  return SECTION_ALIASES.get(normalized) || null;
};

const normalizeListLine = (line) => {
  const numberedMatch = line.match(/^(\d+)[.)]\s+(.*)$/);

  if (numberedMatch) {
    return `${numberedMatch[1]}. ${normalizeSpaces(numberedMatch[2])}`;
  }

  if (/^[-\u2022]\s+/.test(line)) {
    return `- ${normalizeSpaces(line.replace(/^[-\u2022]\s+/, ""))}`;
  }

  return normalizeSpaces(line);
};

const dedupeLines = (lines) => {
  const seen = new Set();
  const output = [];

  for (const line of lines) {
    if (!line) {
      if (output.length && output[output.length - 1] !== "") {
        output.push("");
      }
      continue;
    }

    const key = line
      .toLowerCase()
      .replace(/^→\s*/, "")
      .replace(/^[-\u2022]\s*/, "")
      .replace(/^\d+[.)]\s*/, "")
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

const pushSectionHeading = (output, heading, useColon = false) => {
  const line = `→ ${heading}${useColon ? ":" : ""}`;

  if (output.length && output[output.length - 1] !== "") {
    output.push("");
  }

  if (output[output.length - 1] !== line) {
    output.push(line);
  }
};

const normalizeAiResponseText = (text, options = {}) => {
  const lines = stripMarkdownDecoration(text)
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map(normalizeSpaces)
    .filter(Boolean);

  if (!lines.length) {
    return "";
  }

  const output = [];
  let sawHeading = false;

  for (const rawLine of lines) {
    const line = normalizeListLine(rawLine);
    const directHeading = getHeadingName(line);

    if (directHeading) {
      sawHeading = true;
      pushSectionHeading(output, directHeading, /:$/.test(line));
      continue;
    }

    const labelMatch = line.match(/^([^:]{2,64}):\s*(.*)$/);
    const labelHeading = labelMatch ? getHeadingName(labelMatch[1]) : null;

    if (labelHeading) {
      sawHeading = true;
      pushSectionHeading(output, labelHeading, Boolean(labelMatch[2]));

      if (labelMatch[2]) {
        output.push(normalizeListLine(labelMatch[2]));
      }

      continue;
    }

    output.push(line);
  }

  const cleanOutput = dedupeLines(output).join("\n").replace(/\n{3,}/g, "\n\n").trim();

  if (sawHeading || !options.fallbackHeading) {
    return cleanOutput;
  }

  return [`→ ${options.fallbackHeading}`, "", cleanOutput].join("\n").trim();
};

const formatAiResponse = (text, options = {}) =>
  normalizeAiResponseText(text, options)
    .replace(/\*\*/g, "")
    .replace(/#{2,}/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const formatStudyNotes = (text) => formatAiResponse(text, { fallbackHeading: "Overview" });

module.exports = {
  SECTION_ORDER,
  formatAiResponse,
  formatStudyNotes,
  normalizeRepeatedWords,
  stripMarkdownDecoration,
};
