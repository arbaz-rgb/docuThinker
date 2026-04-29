import math
import re
from collections import Counter

TOKEN_PATTERN = re.compile(r"[a-zA-Z][a-zA-Z0-9+#.-]*")

DOCUMENT_PROFILES = {
    "Resume": (
        "skills experience education projects internship certification objective "
        "summary employment achievements responsibilities profile"
    ),
    "Notes": (
        "definition concept topic chapter lecture notes examples formula explanation "
        "important remember overview learning"
    ),
    "Research Paper": (
        "abstract introduction methodology literature review experiment results "
        "discussion conclusion references dataset analysis"
    ),
    "Report": (
        "executive summary findings analysis recommendation objective scope "
        "background conclusion report observations"
    ),
    "Assignment": (
        "assignment question answer submitted subject problem solution task "
        "exercise practical experiment"
    ),
}


def _tokenize(text: str) -> list[str]:
    return [token.lower() for token in TOKEN_PATTERN.findall(text)]


def _cosine_similarity(left: Counter, right: Counter) -> float:
    shared_terms = set(left) & set(right)
    numerator = sum(left[term] * right[term] for term in shared_terms)
    left_norm = math.sqrt(sum(value * value for value in left.values()))
    right_norm = math.sqrt(sum(value * value for value in right.values()))

    if not left_norm or not right_norm:
        return 0.0

    return numerator / (left_norm * right_norm)


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

    if best_score < 0.02:
        return "Unknown"

    return best_label
