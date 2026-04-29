from fastapi import APIRouter, HTTPException

from app.schemas.analysis_schema import AnalysisRequest, AnalysisResponse
from app.services.nlp_service import analyze_document

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.post("/analyze", response_model=AnalysisResponse)
def analyze_text(payload: AnalysisRequest):
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Document text is required")

    return analyze_document(payload.text)
