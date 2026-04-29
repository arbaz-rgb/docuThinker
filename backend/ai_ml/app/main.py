from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.analysis_routes import router as analysis_router
from app.core.config import settings

app = FastAPI(
    title="DocuThinker AI/ML Service",
    description="NLP preprocessing and document analysis service for DocuThinker.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "success": True,
        "message": "DocuThinker AI/ML service is running",
    }


@app.get("/health")
def health_check():
    return {
        "success": True,
        "service": "DocuThinker AI/ML Service",
        "status": "healthy",
    }


app.include_router(analysis_router, prefix="/api")
