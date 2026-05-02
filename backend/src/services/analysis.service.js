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

const CLASSIFICATION_PROFILES = [
  {
    label: "Resume",
    minScore: 6,
    terms: [
      "resume",
      "curriculum vitae",
      "work experience",
      "professional experience",
      "employment",
      "skills",
      "education",
      "projects",
      "internship",
      "certification",
      "objective",
      "linkedin",
    ],
  },
  {
    label: "Cover Letter",
    minScore: 5,
    terms: [
      "cover letter",
      "dear hiring manager",
      "i am writing to apply",
      "application for",
      "position",
      "role",
      "company",
      "sincerely",
      "regards",
      "hiring",
    ],
  },
  {
    label: "SOP",
    minScore: 5,
    terms: [
      "statement of purpose",
      "sop",
      "graduate program",
      "academic goals",
      "career goals",
      "motivation",
      "university",
      "admission",
      "research interests",
      "pursue",
    ],
  },
  {
    label: "Interview Prep",
    minScore: 5,
    terms: [
      "interview",
      "interview questions",
      "asked questions",
      "answer points",
      "follow-up questions",
      "behavioral questions",
      "technical questions",
      "mock interview",
      "hr round",
      "preparation",
      "tell me about yourself",
    ],
  },
  {
    label: "Question Bank",
    minScore: 6,
    terms: [
      "question bank",
      "mcq",
      "multiple choice",
      "choose the correct",
      "answer the following",
      "short questions",
      "long questions",
      "previous year questions",
      "practice questions",
      "question paper",
      "marks",
    ],
  },
  {
    label: "Exam Notes",
    minScore: 5,
    terms: [
      "exam notes",
      "exam preparation",
      "important questions",
      "marks",
      "short answer",
      "long answer",
      "model answer",
      "expected questions",
      "exam",
      "unit test",
      "semester exam",
    ],
  },
  {
    label: "Revision Notes",
    minScore: 4,
    terms: [
      "revision notes",
      "revision",
      "quick revision",
      "remember",
      "important points",
      "key points",
      "summary",
      "recap",
      "cheat sheet",
      "last minute",
    ],
  },
  {
    label: "Research Paper",
    minScore: 6,
    terms: [
      "abstract",
      "literature review",
      "methodology",
      "research methodology",
      "experiment",
      "dataset",
      "results",
      "discussion",
      "references",
      "citation",
      "hypothesis",
      "doi",
    ],
  },
  {
    label: "Lab Manual",
    minScore: 5,
    terms: [
      "lab manual",
      "experiment",
      "apparatus",
      "procedure",
      "precautions",
      "observation table",
      "viva questions",
      "practical manual",
      "laboratory",
      "aim",
    ],
  },
  {
    label: "Lab Report",
    minScore: 5,
    terms: [
      "lab report",
      "experiment",
      "observation",
      "result",
      "apparatus",
      "procedure",
      "calculation",
      "conclusion",
      "laboratory report",
      "readings",
    ],
  },
  {
    label: "Project Report",
    minScore: 5,
    terms: [
      "project report",
      "project overview",
      "implementation",
      "modules",
      "requirements",
      "objectives",
      "scope",
      "system analysis",
      "future scope",
      "project",
    ],
  },
  {
    label: "Case Study",
    minScore: 5,
    terms: [
      "case study",
      "case analysis",
      "scenario",
      "problem statement",
      "stakeholders",
      "recommendations",
      "decision",
      "background",
      "outcome",
    ],
  },
  {
    label: "Presentation Slides",
    minScore: 5,
    terms: [
      "slide",
      "presentation",
      "agenda",
      "thank you",
      "overview",
      "bullet points",
      "ppt",
      "outline",
      "objectives",
      "q&a",
    ],
  },
  {
    label: "API Documentation",
    minScore: 5,
    terms: [
      "api documentation",
      "endpoint",
      "request",
      "response",
      "http",
      "rest api",
      "authentication",
      "authorization",
      "status code",
      "payload",
      "json",
      "headers",
    ],
  },
  {
    label: "System Design Notes",
    minScore: 5,
    terms: [
      "system design",
      "architecture",
      "scalability",
      "load balancer",
      "database design",
      "cache",
      "microservices",
      "availability",
      "throughput",
      "latency",
    ],
  },
  {
    label: "Programming Notes",
    minScore: 4,
    terms: [
      "programming",
      "code",
      "function",
      "class",
      "variable",
      "algorithm",
      "data structure",
      "loop",
      "array",
      "object",
      "javascript",
      "python",
      "java",
      "react",
      "node",
    ],
  },
  {
    label: "Technical Documentation",
    minScore: 5,
    terms: [
      "technical documentation",
      "installation",
      "configuration",
      "setup",
      "deployment",
      "usage",
      "troubleshooting",
      "requirements",
      "workflow",
      "integration",
      "repository",
      "cli",
    ],
  },
  {
    label: "Assignment",
    minScore: 5,
    terms: [
      "assignment",
      "submitted by",
      "submitted to",
      "question",
      "answer",
      "problem",
      "solution",
      "task",
      "exercise",
      "practical",
      "roll number",
    ],
  },
  {
    label: "Article",
    minScore: 5,
    terms: [
      "article",
      "author",
      "published",
      "introduction",
      "opinion",
      "essay",
      "paragraph",
      "read more",
      "editorial",
    ],
  },
  {
    label: "Notes",
    minScore: 4,
    terms: [
      "notes",
      "lecture",
      "chapter",
      "unit",
      "definition",
      "concept",
      "topic",
      "examples",
      "formula",
      "remember",
      "revision",
      "important points",
    ],
  },
  {
    label: "Reference Material",
    minScore: 4,
    terms: [
      "reference material",
      "reference",
      "bibliography",
      "glossary",
      "appendix",
      "manual",
      "handbook",
      "guide",
      "resources",
    ],
  },
  {
    label: "Documentation",
    minScore: 4,
    terms: [
      "documentation",
      "overview",
      "guide",
      "manual",
      "instructions",
      "usage",
      "features",
      "configuration",
      "steps",
    ],
  },
  {
    label: "Study Material",
    minScore: 3,
    terms: [
      "syllabus",
      "learning objectives",
      "course",
      "module",
      "exam",
      "mcq",
      "short answer",
      "long answer",
      "study",
      "student",
      "subject",
      "tutorial",
      "worksheet",
      "handout",
    ],
  },
];

const EDUCATIONAL_TERMS =
  /\b(study|student|course|subject|chapter|unit|module|topic|concept|definition|lecture|notes|exam|question|answer|assignment|syllabus|revision|learning|tutorial|worksheet|handout|semester|university|college|class|paper|lab|practical)\b/;
const CODING_TERMS =
  /\b(code|coding|programming|function|class|variable|algorithm|array|object|javascript|typescript|python|java|react|node|express|database|sql|html|css|git|debugging)\b/;
const TECHNICAL_TERMS =
  /\b(api|endpoint|server|client|deployment|configuration|installation|architecture|system|workflow|integration|authentication|authorization|repository|documentation|technical)\b/;

const scoreProfile = (content, terms) =>
  terms.reduce((score, term) => {
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = content.match(new RegExp(`\\b${escapedTerm}\\b`, "g")) || [];
    const weight = term.includes(" ") ? 3 : 1;
    return score + matches.length * weight;
  }, 0);

const classifyFallback = (text) => {
  const content = String(text || "").toLowerCase();

  if (!content.trim()) {
    return "Unknown";
  }

  const rankedProfiles = CLASSIFICATION_PROFILES.map((profile) => ({
    ...profile,
    score: scoreProfile(content, profile.terms),
  })).sort((a, b) => b.score - a.score);
  const bestProfile = rankedProfiles[0];

  if (bestProfile?.score >= bestProfile.minScore) {
    return bestProfile.label;
  }

  const isAcademic = EDUCATIONAL_TERMS.test(content);
  const isCoding = CODING_TERMS.test(content);
  const isTechnical = TECHNICAL_TERMS.test(content);

  if (isCoding) {
    return "Programming Notes";
  }

  if (isTechnical) {
    return "Technical Documentation";
  }

  if (isAcademic) {
    return "Study Material";
  }

  return content.length > 200 ? "Miscellaneous" : "Unknown";
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
