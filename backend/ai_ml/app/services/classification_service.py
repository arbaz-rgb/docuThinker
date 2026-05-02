import math
import re
from collections import Counter

TOKEN_PATTERN = re.compile(r"[a-zA-Z][a-zA-Z0-9+#.-]*")
CLASSIFIER_STOPWORDS = {
    "a",
    "about",
    "and",
    "for",
    "from",
    "in",
    "of",
    "the",
    "to",
    "with",
    "without",
    "this",
    "that",
    "is",
    "are",
    "be",
    "by",
}

DOCUMENT_PROFILES = {
    "Resume": (
        "skills experience education projects internship certification objective "
        "summary employment achievements responsibilities profile curriculum vitae "
        "linkedin professional work experience"
    ),
    "Cover Letter": (
        "cover letter dear hiring manager application position role company "
        "i am writing to apply sincerely regards hiring"
    ),
    "SOP": (
        "statement of purpose sop graduate program academic goals career goals "
        "motivation university admission research interests pursue"
    ),
    "Interview Prep": (
        "interview questions answer points follow-up questions mock interview "
        "behavioral questions technical questions hr round preparation expected "
        "answers tell me about yourself"
    ),
    "Question Bank": (
        "question bank mcq multiple choice choose the correct answer the following "
        "short questions long questions previous year questions practice questions "
        "question paper marks"
    ),
    "Exam Notes": (
        "exam notes exam preparation important questions marks short answer long "
        "answer model answer expected questions unit test semester exam"
    ),
    "Revision Notes": (
        "revision notes revision quick revision remember important points key points "
        "summary recap cheat sheet last minute"
    ),
    "Notes": (
        "definition concept topic chapter lecture notes examples formula explanation "
        "important remember overview learning revision unit module key points"
    ),
    "Research Paper": (
        "abstract introduction methodology literature review experiment results "
        "discussion conclusion references dataset analysis citation hypothesis doi"
    ),
    "Lab Manual": (
        "lab manual experiment apparatus procedure precautions observation table "
        "viva questions practical manual laboratory aim"
    ),
    "Lab Report": (
        "lab report experiment observation result apparatus procedure calculation "
        "conclusion laboratory report readings"
    ),
    "Project Report": (
        "project report project overview implementation modules requirements "
        "objectives scope system analysis future scope project"
    ),
    "Case Study": (
        "case study case analysis scenario problem statement stakeholders "
        "recommendations decision background outcome"
    ),
    "Presentation Slides": (
        "slide presentation agenda thank you overview bullet points ppt outline "
        "objectives q&a"
    ),
    "API Documentation": (
        "api documentation endpoint request response http rest api authentication "
        "authorization status code payload json headers"
    ),
    "System Design Notes": (
        "system design architecture scalability load balancer database design cache "
        "microservices availability throughput latency"
    ),
    "Programming Notes": (
        "programming code function class variable algorithm data structure loop array "
        "object javascript python java react node"
    ),
    "Technical Documentation": (
        "technical documentation installation configuration setup deployment usage "
        "troubleshooting requirements workflow integration repository cli"
    ),
    "Assignment": (
        "assignment question answer submitted subject problem solution task "
        "exercise practical experiment roll number submitted by submitted to"
    ),
    "Article": (
        "article author published introduction opinion essay paragraph read more "
        "editorial"
    ),
    "Reference Material": (
        "reference material reference bibliography glossary appendix manual handbook "
        "guide resources"
    ),
    "Documentation": (
        "documentation overview guide manual instructions usage features "
        "configuration steps"
    ),
    "Study Material": (
        "study material syllabus learning objectives course module unit exam mcq "
        "short answer long answer student subject tutorial worksheet handout "
        "chapter concept definition revision"
    ),
}

SPECIFIC_MIN_SCORE = {
    "Resume": 0.014,
    "Cover Letter": 0.012,
    "SOP": 0.012,
    "Interview Prep": 0.012,
    "Question Bank": 0.014,
    "Exam Notes": 0.012,
    "Revision Notes": 0.01,
    "Research Paper": 0.014,
    "Lab Manual": 0.012,
    "Lab Report": 0.012,
    "Project Report": 0.012,
    "Case Study": 0.012,
    "Presentation Slides": 0.012,
    "Programming Notes": 0.01,
    "Technical Documentation": 0.012,
    "API Documentation": 0.012,
    "System Design Notes": 0.012,
    "Assignment": 0.012,
    "Article": 0.012,
    "Reference Material": 0.01,
    "Documentation": 0.01,
    "Notes": 0.01,
    "Study Material": 0.008,
}

EDUCATIONAL_PATTERN = re.compile(
    r"\b("
    r"study|student|course|subject|chapter|unit|module|topic|concept|definition|"
    r"lecture|notes|exam|question|answer|assignment|syllabus|revision|learning|"
    r"tutorial|worksheet|handout|semester|university|college|class|paper|lab|practical"
    r")\b",
    re.IGNORECASE,
)
CODING_PATTERN = re.compile(
    r"\b("
    r"code|coding|programming|function|class|variable|algorithm|array|object|"
    r"javascript|typescript|python|java|react|node|express|database|sql|html|"
    r"css|git|debugging"
    r")\b",
    re.IGNORECASE,
)
TECHNICAL_PATTERN = re.compile(
    r"\b("
    r"api|endpoint|server|client|deployment|configuration|installation|"
    r"architecture|system|workflow|integration|authentication|authorization|"
    r"repository|documentation|technical"
    r")\b",
    re.IGNORECASE,
)


def _tokenize(text: str) -> list[str]:
    return [
        token.lower()
        for token in TOKEN_PATTERN.findall(text)
        if token.lower() not in CLASSIFIER_STOPWORDS
    ]


def _cosine_similarity(left: Counter, right: Counter) -> float:
    shared_terms = set(left) & set(right)
    numerator = sum(left[term] * right[term] for term in shared_terms)
    left_norm = math.sqrt(sum(value * value for value in left.values()))
    right_norm = math.sqrt(sum(value * value for value in right.values()))

    if not left_norm or not right_norm:
        return 0.0

    return numerator / (left_norm * right_norm)


def _profile_hits(document_terms: Counter, profile: str) -> int:
    return len(set(document_terms) & set(_tokenize(profile)))


def classify_document(text: str, keywords: list[str]) -> str:
    document_text = f"{text} {' '.join(keywords)}".strip()
    if not document_text:
        return "Unknown"

    document_terms = Counter(_tokenize(document_text))
    if not document_terms:
        return "Unknown"

    scores = {
        label: _cosine_similarity(document_terms, Counter(_tokenize(profile)))
        for label, profile in DOCUMENT_PROFILES.items()
    }

    best_label, best_score = max(scores.items(), key=lambda item: item[1])

    if (
        best_score >= SPECIFIC_MIN_SCORE.get(best_label, 0.012)
        and _profile_hits(document_terms, DOCUMENT_PROFILES[best_label]) >= 2
    ):
        return best_label

    if CODING_PATTERN.search(document_text):
        return "Programming Notes"

    if TECHNICAL_PATTERN.search(document_text):
        return "Technical Documentation"

    if EDUCATIONAL_PATTERN.search(document_text):
        return "Study Material"

    return "Miscellaneous" if len(document_text) > 200 else "Unknown"
