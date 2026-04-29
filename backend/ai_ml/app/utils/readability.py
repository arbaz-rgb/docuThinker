VOWELS = "aeiouy"


def count_syllables(word: str) -> int:
    word = word.lower().strip()
    if not word:
        return 0

    syllables = 0
    previous_was_vowel = False

    for char in word:
        is_vowel = char in VOWELS
        if is_vowel and not previous_was_vowel:
            syllables += 1
        previous_was_vowel = is_vowel

    if word.endswith("e") and syllables > 1:
        syllables -= 1

    return max(syllables, 1)


def get_readability_level(score: float) -> str:
    if score >= 80:
        return "Easy"
    if score >= 60:
        return "Moderate"
    if score >= 40:
        return "Difficult"
    return "Very Difficult"


def calculate_readability(sentences: list[str], tokens: list[str]) -> dict:
    total_sentences = max(len(sentences), 1)
    total_words = max(len(tokens), 1)
    total_syllables = sum(count_syllables(token) for token in tokens)

    average_sentence_length = total_words / total_sentences
    average_syllables_per_word = total_syllables / total_words

    score = (
        206.835
        - (1.015 * average_sentence_length)
        - (84.6 * average_syllables_per_word)
    )
    score = max(0, min(100, round(score, 2)))

    return {
        "score": score,
        "level": get_readability_level(score),
        "total_words": 0 if not tokens else total_words,
        "total_sentences": 0 if not sentences else total_sentences,
        "average_sentence_length": round(average_sentence_length, 2),
    }
