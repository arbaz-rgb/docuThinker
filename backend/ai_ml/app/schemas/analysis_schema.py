from pydantic import BaseModel, Field


class AnalysisRequest(BaseModel):
    text: str = Field(..., min_length=1)


class ReadabilityResult(BaseModel):
    score: float
    level: str
    total_words: int
    total_sentences: int
    average_sentence_length: float


class AnalysisResponse(BaseModel):
    cleaned_text: str
    tokens: list[str]
    sentences: list[str]
    keywords: list[str]
    classification: str
    readability: ReadabilityResult
