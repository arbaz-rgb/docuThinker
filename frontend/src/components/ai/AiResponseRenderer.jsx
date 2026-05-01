import { parseAiResponse } from "../../utils/aiResponseFormatting";

const IMPORTANT_WORDS =
  /\b(definition|important|note|warning|remember|answer|concept|question|conclusion|example|term)\b/gi;

const getSectionTone = (heading) => {
  const normalized = heading.toLowerCase();

  if (normalized.includes("definition")) {
    return "definition";
  }

  if (normalized.includes("concept") || normalized.includes("term")) {
    return "term";
  }

  if (normalized.includes("note") || normalized.includes("revision")) {
    return "note";
  }

  if (normalized.includes("conclusion")) {
    return "conclusion";
  }

  return "default";
};

const isImportantWord = (value) =>
  /^(definition|important|note|warning|remember|answer|concept|question|conclusion|example|term)$/i.test(
    value
  );

const HighlightedText = ({ text }) => {
  const parts = String(text || "").split(IMPORTANT_WORDS);

  return parts.map((part, index) =>
    isImportantWord(part) ? (
      <span key={`${part}-${index}`} className="ai-keyword">
        {part}
      </span>
    ) : (
      part
    )
  );
};

const DefinitionLine = ({ text }) => {
  const match = text.match(/^([^:]{2,60}):\s+(.+)$/);

  if (!match) {
    return <HighlightedText text={text} />;
  }

  return (
    <>
      <span className="ai-term">{match[1]}:</span> <HighlightedText text={match[2]} />
    </>
  );
};

const renderLineGroups = (lines) => {
  const groups = [];

  for (const line of lines) {
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/);
    const bulletMatch = line.match(/^-\s+(.*)$/);
    const type = numberedMatch ? "numbered" : bulletMatch ? "bullet" : "paragraph";
    const text = numberedMatch?.[2] || bulletMatch?.[1] || line;
    const number = numberedMatch?.[1] || "";
    const lastGroup = groups[groups.length - 1];

    if (lastGroup?.type === type && type !== "paragraph") {
      lastGroup.items.push({ number, text });
    } else {
      groups.push({ type, items: [{ number, text }] });
    }
  }

  return groups.map((group, groupIndex) => {
    if (group.type === "numbered") {
      return (
        <ol key={`group-${groupIndex}`} className="ai-list ai-numbered-list">
          {group.items.map((item) => (
            <li key={`${item.number}-${item.text}`}>
              <DefinitionLine text={item.text} />
            </li>
          ))}
        </ol>
      );
    }

    if (group.type === "bullet") {
      return (
        <ul key={`group-${groupIndex}`} className="ai-list ai-bullet-list">
          {group.items.map((item) => (
            <li key={item.text}>
              <DefinitionLine text={item.text} />
            </li>
          ))}
        </ul>
      );
    }

    return group.items.map((item) => (
      <p key={item.text} className="ai-paragraph">
        <DefinitionLine text={item.text} />
      </p>
    ));
  });
};

const AiResponseRenderer = ({ text, fallbackHeading = "Overview", compact = false }) => {
  const sections = parseAiResponse(text, fallbackHeading);

  if (!sections.length) {
    return null;
  }

  return (
    <div className={`ai-response ${compact ? "compact" : ""}`}>
      {sections.map((section) => (
        <section
          key={`${section.heading}-${section.lines.join("").slice(0, 24)}`}
          className={`ai-response-section ${getSectionTone(section.heading)}`}
        >
          <h4>→ {section.heading}</h4>
          <div className="ai-response-body">{renderLineGroups(section.lines)}</div>
        </section>
      ))}
    </div>
  );
};

export default AiResponseRenderer;
