from pydantic import BaseModel, Field


class QuestionInput(BaseModel):
    stem: str
    options: list[str]
    correct_index: int = Field(ge=0)


class DeterministicResult(BaseModel):
    tech_kwant_longest_bias: bool
    tech_kwant_homogeneity_score: float = Field(ge=0.0, le=1.0)
    tech_kwant_absolute_terms_correct: list[str]
    tech_kwant_absolute_terms_distractors: list[str]
    tech_kwant_negation_detected: bool
    tech_kwant_negation_emphasized: bool
    tech_kwant_flags: list[str]
