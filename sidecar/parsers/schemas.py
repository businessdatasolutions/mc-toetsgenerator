from pydantic import BaseModel


class ParsedOption(BaseModel):
    text: str
    position: int
    is_correct: bool


class ParsedQuestion(BaseModel):
    stem: str
    options: list[ParsedOption]
