from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class DiscriminatieLevel(str, Enum):
    hoog = "hoog"
    gemiddeld = "gemiddeld"
    laag = "laag"
    geen = "geen"


class AmbiguiteitLevel(str, Enum):
    geen = "geen"
    licht = "licht"
    hoog = "hoog"


class BloomLevel(str, Enum):
    onthouden = "onthouden"
    begrijpen = "begrijpen"
    toepassen = "toepassen"
    analyseren = "analyseren"


class ImprovementSuggestion(BaseModel):
    dimensie: Literal["betrouwbaarheid", "technisch", "validiteit"]
    suggestie: str


class ValidationResult(BaseModel):
    """LLM validation output for a single MC question."""

    # Betrouwbaarheid (Reliability)
    bet_discriminatie: DiscriminatieLevel
    bet_ambiguiteit: AmbiguiteitLevel
    bet_score: int = Field(ge=1, le=5)
    bet_toelichting: str

    # Technisch Kwalitatief (Technical Quality - AI part)
    tech_kwal_stam_score: int = Field(ge=1, le=5)
    tech_kwal_afleiders_score: int = Field(ge=1, le=5)
    tech_kwal_score: int = Field(ge=1, le=5)
    tech_problemen: list[str]
    tech_toelichting: str

    # Validiteit (Validity)
    val_cognitief_niveau: BloomLevel
    val_score: int = Field(ge=1, le=5)
    val_toelichting: str

    # Verbetervoorstellen
    improvement_suggestions: list[ImprovementSuggestion]


class QuestionOption(BaseModel):
    text: str
    position: int
    is_correct: bool


class GeneratedQuestion(BaseModel):
    stem: str
    options: list[QuestionOption]
    bloom_level: BloomLevel
    chunk_ids: list[str]


class GenerationResult(BaseModel):
    questions: list[GeneratedQuestion]


class RepairProposal(BaseModel):
    """A single AI-proposed repair for a missing field."""

    question_index: int
    field: str
    current_value: str | None = None
    proposed_value: str
    explanation: str


class RepairPlan(BaseModel):
    """AI-generated repair plan for all questions with missing fields."""

    proposals: list[RepairProposal]
    summary: str
