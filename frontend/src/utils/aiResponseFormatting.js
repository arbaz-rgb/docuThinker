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

const cleanLine = (value) =>
  String(value || "")
    .replace(/\*\*/g, "")
    .replace(/#{2,}/g, "")
    .replace(/^\s*#{1,6}\s*/, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[ \t]+/g, " ")
    .trim();

const getHeading = (line) => {
  const normalized = cleanLine(line)
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
    return `${numberedMatch[1]}. ${cleanLine(numberedMatch[2])}`;
  }

  if (/^[-*\u2022]\s+/.test(line)) {
    return `- ${cleanLine(line.replace(/^[-*\u2022]\s+/, ""))}`;
  }

  return cleanLine(line);
};

export const formatAiResponseText = (text, fallbackHeading = "Overview") => {
  const lines = String(text || "")
    .replace(/\r/g, "\n")
    .replace(/```[\s\S]*?```/g, (match) =>
      match.replace(/^```[^\n]*\n?/, "").replace(/\n?```$/, "")
    )
    .split("\n")
    .map(cleanLine)
    .filter(Boolean);

  if (!lines.length) {
    return "";
  }

  const output = [];
  let hasHeading = false;

  for (const rawLine of lines) {
    const line = normalizeListLine(rawLine);
    const heading = getHeading(line);

    if (heading) {
      hasHeading = true;
      if (output.length && output[output.length - 1] !== "") {
        output.push("");
      }
      output.push(`→ ${heading}${line.endsWith(":") ? ":" : ""}`);
      continue;
    }

    const labelMatch = line.match(/^([^:]{2,64}):\s*(.*)$/);
    const labelHeading = labelMatch ? getHeading(labelMatch[1]) : null;

    if (labelHeading) {
      hasHeading = true;
      if (output.length && output[output.length - 1] !== "") {
        output.push("");
      }
      output.push(`→ ${labelHeading}${labelMatch[2] ? ":" : ""}`);

      if (labelMatch[2]) {
        output.push(cleanLine(labelMatch[2]));
      }
      continue;
    }

    output.push(line);
  }

  const formatted = output.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return hasHeading ? formatted : [`→ ${fallbackHeading}`, "", formatted].join("\n").trim();
};

export const parseAiResponse = (text, fallbackHeading = "Overview") => {
  const formattedText = formatAiResponseText(text, fallbackHeading);
  const sections = [];
  let currentSection = null;

  for (const line of formattedText.split("\n")) {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      continue;
    }

    if (trimmedLine.startsWith("→ ")) {
      currentSection = {
        heading: trimmedLine.replace(/^→\s*/, "").replace(/:$/, ""),
        lines: [],
      };
      sections.push(currentSection);
      continue;
    }

    if (!currentSection) {
      currentSection = { heading: fallbackHeading, lines: [] };
      sections.push(currentSection);
    }

    currentSection.lines.push(trimmedLine);
  }

  return sections;
};
