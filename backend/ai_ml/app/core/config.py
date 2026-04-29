import os
from dataclasses import dataclass, field


@dataclass
class Settings:
    app_name: str = "DocuThinker AI/ML Service"
    allowed_origins: list[str] = field(
        default_factory=lambda: os.getenv("ALLOWED_ORIGINS", "*").split(",")
    )


settings = Settings()
