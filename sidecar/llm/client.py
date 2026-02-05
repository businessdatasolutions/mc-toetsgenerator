import anthropic

from config.settings import settings
from llm.prompts.generation import build_generation_prompt
from llm.prompts.validation import build_validation_prompt
from llm.schemas import GenerationResult, ValidationResult


class LLMValidationError(Exception):
    """Raised when the LLM returns an unusable response."""

    pass


class LLMClient:
    """Client for Claude API calls with structured output."""

    MODEL_SONNET = "claude-sonnet-4-5-20241022"
    MODEL_OPUS = "claude-opus-4-5-20250514"

    def __init__(self, api_key: str | None = None):
        self.client = anthropic.Anthropic(
            api_key=api_key or settings.anthropic_api_key,
        )

    def validate_question(
        self,
        question: dict,
        deterministic_results: dict,
        model: str | None = None,
    ) -> ValidationResult:
        """Validate a single MC question using the LLM.

        Args:
            question: Dict with stem, options, correct answer, learning objective.
            deterministic_results: Dict with tech_kwant_* fields from deterministic analyzer.
            model: Model to use (defaults to Sonnet).

        Returns:
            ValidationResult with all three dimension scores and suggestions.

        Raises:
            LLMValidationError: If the LLM refuses or hits max tokens.
        """
        messages = build_validation_prompt(question, deterministic_results)
        system_msg = messages[0]["content"]
        user_msg = messages[1]["content"]

        response = self.client.messages.create(
            model=model or self.MODEL_SONNET,
            max_tokens=2048,
            temperature=0.0,
            system=system_msg,
            messages=[{"role": "user", "content": user_msg}],
            tools=[
                {
                    "name": "validation_result",
                    "description": "Output the validation result for the MC question.",
                    "input_schema": ValidationResult.model_json_schema(),
                }
            ],
            tool_choice={"type": "tool", "name": "validation_result"},
        )

        if response.stop_reason == "max_tokens":
            raise LLMValidationError(
                "LLM response was truncated (max_tokens reached). "
                "The question may be too complex for the current token limit."
            )

        # Extract tool use block
        for block in response.content:
            if block.type == "tool_use" and block.name == "validation_result":
                return ValidationResult.model_validate(block.input)

        raise LLMValidationError(
            f"Unexpected response structure from LLM. "
            f"Stop reason: {response.stop_reason}"
        )

    def generate_questions(
        self,
        specification: dict,
        chunks: list,
        model: str | None = None,
    ) -> GenerationResult:
        """Generate MC questions based on source material chunks.

        Args:
            specification: Dict with count, bloom_level, learning_goal, num_options.
            chunks: List of Chunk objects from retrieval.
            model: Model to use (defaults to Sonnet).

        Returns:
            GenerationResult with generated questions.

        Raises:
            LLMValidationError: If the LLM refuses or hits max tokens.
        """
        messages = build_generation_prompt(specification, chunks)
        system_msg = messages[0]["content"]
        user_msg = messages[1]["content"]

        response = self.client.messages.create(
            model=model or self.MODEL_SONNET,
            max_tokens=4096,
            temperature=0.5,
            system=system_msg,
            messages=[{"role": "user", "content": user_msg}],
            tools=[
                {
                    "name": "generation_result",
                    "description": "Output the generated MC questions.",
                    "input_schema": GenerationResult.model_json_schema(),
                }
            ],
            tool_choice={"type": "tool", "name": "generation_result"},
        )

        if response.stop_reason == "max_tokens":
            raise LLMValidationError(
                "LLM response was truncated (max_tokens reached). "
                "Try generating fewer questions or reducing source material."
            )

        for block in response.content:
            if block.type == "tool_use" and block.name == "generation_result":
                return GenerationResult.model_validate(block.input)

        raise LLMValidationError(
            f"Unexpected response structure from LLM. "
            f"Stop reason: {response.stop_reason}"
        )
