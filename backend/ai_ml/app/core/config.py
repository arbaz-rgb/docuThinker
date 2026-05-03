import os
from dataclasses import dataclass, field


def parse_csv_env(name: str, default: str = "") -> list[str]:
    return [value.strip() for value in os.getenv(name, default).split(",") if value.strip()]


@dataclass
class Settings:
    app_name: str = "DocuThinker AI/ML Service"
    allowed_origins: list[str] = field(default_factory=lambda: parse_csv_env("ALLOWED_ORIGINS", "*"))


settings = Settings()
