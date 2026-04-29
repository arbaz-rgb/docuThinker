import re
from collections import Counter

from app.services.classification_service import classify_document
from app.utils.readability import calculate_readability

TOKEN_PATTERN = re.compile(r"[a-zA-Z][a-zA-Z0-9+#.-]*")
SENTENCE_PATTERN = re.compile(r"(?<=[.!?])\s+")
STOPWORDS = {
    "a",
    "about",
    "above",
    "after",
    "again",
    "against",
    "all",
    "am",
    "an",
    "and",
    "any",
    "are",
    "as",
    "at",
    "be",
    "because",
    "been",
    "before",
    "being",
    "below",
    "between",
    "both",
    "but",
    "by",
    "can",
    "did",
    "do",
    "does",
    "doing",
    "down",
    "during",
    "each",
    "few",
    "for",
    "from",
    "further",
    "had",
    "has",
    "have",
    "having",
    "he",
    "her",
    "here",
    "hers",
    "herself",
    "him",
    "himself",
    "his",
    "how",
    "i",
    "if",
    "in",
    "into",
    "is",
    "it",
    "its",
    "itself",
    "just",
    "me",
    "more",
    "most",
    "my",
    "myself",
    "no",
    "nor",
    "not",
    "now",
    "of",
    "off",
    "on",
    "once",
    "only",
    "or",
    "other",
    "our",
    "ours",
    "ourselves",
    "out",
    "over",
    "own",
    "same",
    "she",
    "should",
    "so",
    "some",
    "such",
    "than",
    "that",
    "the",
    "their",
    "theirs",
    "them",
    "themselves",
    "then",
    "there",
    "these",
    "they",
    "this",
    "those",
    "through",
    "to",
    "too",
    "under",
    "until",
    "up",
    "very",
    "was",
    "we",
    "were",
    "what",
    "when",
    "where",
    "which",
    "while",
    "who",
    "whom",
    "why",
    "will",
    "with",
    "you",
    "your",
    "yours",
    "yourself",
    "yourselves",
}


def clean_text(text: str) -> str:
    text = text.replace("\r", "\n")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def segment_sentences(text: str) -> list[str]:
    cleaned_text = clean_text(text)
    if not cleaned_text:
        return []

    sentences = SENTENCE_PATTERN.split(cleaned_text)
    return [sentence.strip() for sentence in sentences if sentence.strip()]


def tokenize(text: str) -> list[str]:
    return [token.lower() for token in TOKEN_PATTERN.findall(text)]


def remove_stopwords(tokens: list[str]) -> list[str]:
    return [
        token
        for token in tokens
        if token not in STOPWORDS and len(token) > 2 and not token.isnumeric()
    ]


def extract_keywords(cleaned_text: str, tokens: list[str], limit: int = 12) -> list[str]:
    if not cleaned_text or not tokens:
        return []

    counts = Counter(tokens)
    return [word for word, _ in counts.most_common(limit)]


def analyze_document(text: str) -> dict:
    cleaned_text = clean_text(text)
    sentences = segment_sentences(cleaned_text)
    raw_tokens = tokenize(cleaned_text)
    tokens = remove_stopwords(raw_tokens)
    keywords = extract_keywords(cleaned_text, tokens)
    classification = classify_document(cleaned_text, keywords)
    readability = calculate_readability(sentences, raw_tokens)

    return {
        "cleaned_text": cleaned_text,
        "tokens": tokens,
        "sentences": sentences,
        "keywords": keywords,
        "classification": classification,
        "readability": readability,
    }
