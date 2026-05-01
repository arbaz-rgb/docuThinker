const ARROW = "\u2192";

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

const EXAM_SECTION_ORDER = ["MCQs", "Short Questions", "Long Questions"];

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

const stripArrowPrefix = (value) => value.replace(/^(\u2192|â†’)\s*/, "");

const getHeadingName = (value) => {
  const normalized = stripArrowPrefix(
    normalizeSpaces(value)
      .replace(/^[-\u2022]\s*/, "")
      .replace(/^\d+[.)]\s*/, "")
  )
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

    const key = stripArrowPrefix(line)
      .toLowerCase()
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
  const line = `${ARROW} ${heading}${useColon ? ":" : ""}`;

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

  return [`${ARROW} ${options.fallbackHeading}`, "", cleanOutput].join("\n").trim();
};

const cleanExamQuestionText = (value) =>
  normalizeSpaces(value)
    .replace(/^Question\s*\d+\s*[:.)-]\s*/i, "")
    .replace(/^Q\s*\d+\s*[:.)-]\s*/i, "")
    .replace(/^\d+\s*[:.)-]\s*/, "")
    .replace(/\?+$/, "?")
    .trim();

const isAnswerLine = (line) =>
  /^(answer|correct answer|correct option|solution|explanation)\s*[:.)-]/i.test(line);

const getOptionText = (line) => {
  const optionMatch = line.match(/^[\s(]*([A-Da-d])[\s).:-]+(.+)$/);

  if (optionMatch) {
    return normalizeSpaces(optionMatch[2]);
  }

  const numberedOptionMatch = line.match(/^[1-4][.)]\s+(.+)$/);
  return numberedOptionMatch ? normalizeSpaces(numberedOptionMatch[1]) : null;
};

const getQuestionText = (line) => {
  const questionMatch = line.match(/^(?:Question\s*)?Q?\s*\d+\s*[:.)-]\s+(.+)$/i);
  return questionMatch ? cleanExamQuestionText(questionMatch[1]) : null;
};

const parseExamSections = (text, fallbackHeading = "MCQs") => {
  const sections = new Map();
  let currentHeading = null;

  const ensureSection = (heading) => {
    if (!sections.has(heading)) {
      sections.set(heading, []);
    }

    currentHeading = heading;
  };

  const expandedLines = stripMarkdownDecoration(text)
    .split("\n")
    .flatMap((line) => line.replace(/(?=\s+[A-Da-d][).]\s+)/g, "\n").split("\n"));

  for (const rawLine of expandedLines) {
    const line = normalizeSpaces(rawLine);

    if (!line) {
      continue;
    }

    const heading = getHeadingName(line);

    if (heading) {
      ensureSection(heading);
      continue;
    }

    if (!currentHeading) {
      ensureSection(fallbackHeading);
    }

    sections.get(currentHeading).push(line);
  }

  return sections;
};

const formatQuestionLines = (lines) => {
  const questions = [];

  for (const line of lines) {
    if (isAnswerLine(line)) {
      continue;
    }

    const questionText = getQuestionText(line);

    if (questionText) {
      questions.push(questionText);
      continue;
    }

    if (line && !getHeadingName(line)) {
      questions.push(cleanExamQuestionText(line));
    }
  }

  return questions
    .filter(Boolean)
    .map((question, index) => `Q${index + 1}. ${question}`);
};

const formatMcqLines = (lines) => {
  const mcqs = [];
  let current = null;

  const pushCurrent = () => {
    if (!current || !current.question) {
      return;
    }

    mcqs.push({
      question: cleanExamQuestionText(current.question),
      options: current.options.map(normalizeSpaces).filter(Boolean).slice(0, 4),
    });
  };

  for (const line of lines) {
    if (isAnswerLine(line)) {
      continue;
    }

    const optionText = getOptionText(line);

    if (optionText && current) {
      current.options.push(optionText);
      continue;
    }

    const questionText = getQuestionText(line);

    if (questionText) {
      pushCurrent();
      current = { question: questionText, options: [] };
      continue;
    }

    if (!current) {
      current = { question: line, options: [] };
      continue;
    }

    if (current.options.length) {
      const lastIndex = current.options.length - 1;
      current.options[lastIndex] = normalizeSpaces(`${current.options[lastIndex]} ${line}`);
    } else {
      current.question = normalizeSpaces(`${current.question} ${line}`);
    }
  }

  pushCurrent();

  const validMcqs = mcqs.filter((mcq) => mcq.options.length === 4);

  return validMcqs.flatMap((mcq, index) => {
    const optionLabels = ["A", "B", "C", "D"];
    const output = [`Q${index + 1}. ${mcq.question}`];

    mcq.options.forEach((option, optionIndex) => {
      output.push(`${optionLabels[optionIndex]}) ${option}`);
    });

    return index < validMcqs.length - 1 ? [...output, ""] : output;
  });
};

const formatExamQuestions = (text) => {
  const sections = parseExamSections(text, "MCQs");
  const output = [];

  for (const heading of EXAM_SECTION_ORDER) {
    const lines = sections.get(heading) || [];
    const formattedLines = heading === "MCQs" ? formatMcqLines(lines) : formatQuestionLines(lines);

    if (!formattedLines.length) {
      continue;
    }

    if (output.length) {
      output.push("");
    }

    output.push(`${ARROW} ${heading}`, "", ...formattedLines);
  }

  return output.join("\n").replace(/\n{3,}/g, "\n\n").trim();
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
  formatExamQuestions,
  formatStudyNotes,
  normalizeRepeatedWords,
  stripMarkdownDecoration,
};
