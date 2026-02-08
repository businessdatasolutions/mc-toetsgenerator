from pydantic import BaseModel


class ParsedOption(BaseModel):
    text: str
    position: int
    is_correct: bool


class ParsedQuestion(BaseModel):
    stem: str
    options: list[ParsedOption]
    question_id: str | None = None
    category: str | None = None
    bloom_level: str | None = None
    learning_goal: str | None = None
